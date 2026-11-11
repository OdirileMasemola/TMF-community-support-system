-- =============================================================================
-- Centralised email domain management and sign-up enforcement
--
-- Builds on 20261108120000_account_self_deletion.sql. Based on the live schema
-- recorded in 20260930000000_remote_schema_baseline.sql.
--
-- What this migration does:
--   1. public.email_domain_policy: one row (id = 1) holding the registration
--      mode, 'open' (default, the current behaviour) or 'restricted'.
--   2. public.email_domain_settings: the managed domain list. Each domain is
--      'approved' or 'blocked' and 'active' or 'inactive', with the last DNS
--      check result the API recorded. Domains are stored lower-case ASCII
--      (IDNs in punycode) and are unique.
--   3. public.email_domain_audit_log: who changed what, written only by
--      triggers. Nobody can insert, edit or delete audit rows through the API.
--   4. Stamping triggers: created_by / updated_by / updated_at come from
--      auth.uid() and now(), never from the client. A domain name cannot be
--      changed after it is added (remove it and add the new one instead).
--   5. Shared rules used by BOTH the API pre-check and the Auth hook, so they
--      cannot drift apart:
--        public.normalize_signup_email(text)        format + normalisation
--        public.email_domain_is_valid(text)          domain syntax
--        public.email_domain_registration_check(text) policy decision
--   6. public.hook_before_user_created(jsonb): a Supabase "Before User
--      Created" Auth hook. Once it is switched on in the dashboard (Auth >
--      Hooks), Supabase Auth calls it for EVERY new user (web, mobile, a
--      direct call to /auth/v1/signup with the public key, OAuth, invites), so
--      the policy cannot be bypassed by skipping the API.
--   7. Optional DNS attestation. DNS lookups cannot run inside Postgres, so the
--      API (which does the MX/A/AAAA checks) signs the normalised address with
--      an HMAC secret. When the secret named 'email_signup_attestation_secret'
--      exists in Supabase Vault, the hook rejects password/OTP sign-ups that
--      do not carry a valid, unexpired signature in user_metadata, i.e. sign-
--      ups that did not pass the API's DNS check. Without the secret this check
--      is off and only steps 5-6 apply.
--   8. RLS: administrators (public.is_admin()) only. Ordinary users and anon
--      have no access to the tables. The RESTRICTIVE "Suspended accounts have
--      no access" policy is added like on every other table.
--
-- Existing users are not affected: the rules only run when an account is
-- created. Sign-in, password recovery and email confirmation status of
-- existing accounts are unchanged.
--
-- No existing tables, columns, policies, grants or data are changed.
-- Safe to run more than once.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Private schema (not exposed through PostgREST)
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 1. Shared validation helpers
-- -----------------------------------------------------------------------------

-- Domain syntax: 2+ labels of letters/digits/hyphens (no leading or trailing
-- hyphen, max 63 chars each), at most 253 chars, ending in an alphabetic TLD or
-- a punycode (xn--) TLD. Lower-case ASCII only: the API converts IDNs first.
create or replace function public.email_domain_is_valid(p_domain text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_domain is not null
     and char_length(p_domain) between 4 and 253
     and p_domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$';
$$;

comment on function public.email_domain_is_valid(text) is
  'True when the value is a syntactically valid, lower-case ASCII email domain (IDNs must be punycode).';

-- Returns the normalised address (trimmed, lower-case) or NULL when it is not a
-- usable address. Dot-atom local parts only (no quoted strings, comments or
-- IP-literal domains); local part <= 64, whole address <= 254 characters.
create or replace function public.normalize_signup_email(p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_email text;
  v_local text;
  v_domain text;
begin
  if p_email is null then
    return null;
  end if;

  v_email := lower(btrim(p_email, E' \t\r\n'));

  -- Anything that is not printable ASCII (control characters, inner spaces,
  -- non-ASCII) is rejected rather than stripped.
  if v_email = '' or v_email !~ '^[!-~]+$' or char_length(v_email) > 254 then
    return null;
  end if;

  if (char_length(v_email) - char_length(replace(v_email, '@', ''))) <> 1 then
    return null;
  end if;

  v_local := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  if char_length(v_local) not between 1 and 64
     or v_local !~ '^[a-z0-9!#$%&''*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&''*+/=?^_`{|}~-]+)*$' then
    return null;
  end if;

  if not public.email_domain_is_valid(v_domain) then
    return null;
  end if;

  return v_email;
end;
$$;

comment on function public.normalize_signup_email(text) is
  'Normalises an email address for sign-up (trim, lower-case) and returns NULL when the format is not accepted. Same rules as the API.';

revoke all on function public.email_domain_is_valid(text) from public;
revoke all on function public.normalize_signup_email(text) from public;
grant execute on function public.email_domain_is_valid(text) to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function public.normalize_signup_email(text) to anon, authenticated, service_role, supabase_auth_admin;


-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------
create table if not exists public.email_domain_policy (
  id smallint not null default 1,
  registration_mode text not null default 'open',
  updated_at timestamp with time zone not null default now(),
  updated_by uuid,
  constraint email_domain_policy_pkey primary key (id),
  constraint email_domain_policy_singleton check (id = 1),
  constraint email_domain_policy_registration_mode_check
    check (registration_mode in ('open', 'restricted')),
  constraint email_domain_policy_updated_by_fkey foreign key (updated_by)
    references public.profiles(id) on delete set null
);

comment on table public.email_domain_policy is
  'Single row (id = 1). registration_mode open: any domain with valid mail DNS except blocked ones; restricted: only active approved domains.';

-- Default row: OPEN keeps the current behaviour.
insert into public.email_domain_policy (id, registration_mode)
values (1, 'open')
on conflict (id) do nothing;

create table if not exists public.email_domain_settings (
  id uuid not null default gen_random_uuid(),
  domain text not null,
  policy_type text not null,
  status text not null default 'active',
  notes text,
  dns_status text not null default 'unchecked',
  dns_checked_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint email_domain_settings_pkey primary key (id),
  constraint email_domain_settings_domain_key unique (domain),
  constraint email_domain_settings_domain_check check (public.email_domain_is_valid(domain)),
  constraint email_domain_settings_policy_type_check check (policy_type in ('approved', 'blocked')),
  constraint email_domain_settings_status_check check (status in ('active', 'inactive')),
  constraint email_domain_settings_dns_status_check
    check (dns_status in ('unchecked', 'valid', 'invalid', 'error')),
  constraint email_domain_settings_notes_check check (notes is null or char_length(notes) <= 500),
  constraint email_domain_settings_created_by_fkey foreign key (created_by)
    references public.profiles(id) on delete set null,
  constraint email_domain_settings_updated_by_fkey foreign key (updated_by)
    references public.profiles(id) on delete set null
);

comment on table public.email_domain_settings is
  'Administrator-managed email domains. approved: allowed in restricted mode. blocked: never allowed. Rules also cover subdomains; the most specific active rule wins.';

create index if not exists idx_email_domain_settings_policy_status
  on public.email_domain_settings using btree (policy_type, status);

create table if not exists public.email_domain_audit_log (
  id bigint generated always as identity,
  entity text not null,
  action text not null,
  domain text,
  old_values jsonb,
  new_values jsonb,
  actor_id uuid,
  created_at timestamp with time zone not null default now(),
  constraint email_domain_audit_log_pkey primary key (id),
  constraint email_domain_audit_log_entity_check check (entity in ('domain', 'policy')),
  constraint email_domain_audit_log_action_check check (action in ('insert', 'update', 'delete'))
);

comment on table public.email_domain_audit_log is
  'Append-only history of email domain and registration policy changes. Written by triggers only.';

create index if not exists idx_email_domain_audit_log_created_at
  on public.email_domain_audit_log using btree (created_at desc);


-- -----------------------------------------------------------------------------
-- 3. Stamping and audit triggers
-- -----------------------------------------------------------------------------
create or replace function public.stamp_email_domain_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.domain := lower(btrim(new.domain));
    new.created_at := now();
    new.created_by := auth.uid();
  else
    if new.domain is distinct from old.domain then
      raise exception 'The domain name cannot be changed. Remove it and add the new domain instead.'
        using errcode = '22023';
    end if;
    new.id := old.id;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.stamp_email_domain_policy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- SECURITY DEFINER so the audit row is written even though callers have no
-- INSERT privilege on the audit table.
create or replace function public.audit_email_domain_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity text := case when tg_table_name = 'email_domain_policy' then 'policy' else 'domain' end;
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  if tg_op = 'UPDATE' and v_old = v_new then
    return new;
  end if;

  insert into public.email_domain_audit_log (entity, action, domain, old_values, new_values, actor_id)
  values (
    v_entity,
    lower(tg_op),
    case when v_entity = 'domain' then coalesce(v_new ->> 'domain', v_old ->> 'domain') end,
    v_old,
    v_new,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.stamp_email_domain_settings() from public, anon, authenticated;
revoke all on function public.stamp_email_domain_policy() from public, anon, authenticated;
revoke all on function public.audit_email_domain_change() from public, anon, authenticated;
grant execute on function public.stamp_email_domain_settings() to service_role;
grant execute on function public.stamp_email_domain_policy() to service_role;
grant execute on function public.audit_email_domain_change() to service_role;

create or replace trigger stamp_email_domain_settings_before_write
  before insert or update on public.email_domain_settings
  for each row execute function public.stamp_email_domain_settings();

create or replace trigger stamp_email_domain_policy_before_update
  before update on public.email_domain_policy
  for each row execute function public.stamp_email_domain_policy();

create or replace trigger audit_email_domain_settings_after_write
  after insert or update or delete on public.email_domain_settings
  for each row execute function public.audit_email_domain_change();

create or replace trigger audit_email_domain_policy_after_update
  after update on public.email_domain_policy
  for each row execute function public.audit_email_domain_change();


-- -----------------------------------------------------------------------------
-- 4. Policy decision (shared by the API pre-check and the Auth hook)
-- -----------------------------------------------------------------------------
-- Returns NULL when the domain may register, otherwise the reason:
--   'invalid'      the domain is not syntactically valid
--   'blocked'      the most specific active rule for it is 'blocked'
--   'not_approved' restricted mode and no active 'approved' rule covers it
-- A rule for example.org also covers mail.example.org. Inactive rules are
-- ignored. DNS is NOT checked here (Postgres cannot do lookups); the API does
-- that before sign-up.
create or replace function public.email_domain_registration_check(p_domain text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_rule text;
  v_mode text;
begin
  if not public.email_domain_is_valid(v_domain) then
    return 'invalid';
  end if;

  select s.policy_type into v_rule
  from public.email_domain_settings s
  where s.status = 'active'
    and (v_domain = s.domain or right(v_domain, char_length(s.domain) + 1) = '.' || s.domain)
  order by char_length(s.domain) desc
  limit 1;

  if v_rule = 'blocked' then
    return 'blocked';
  end if;

  select p.registration_mode into v_mode from public.email_domain_policy p where p.id = 1;

  if coalesce(v_mode, 'open') = 'restricted' and v_rule is distinct from 'approved' then
    return 'not_approved';
  end if;

  return null;
end;
$$;

comment on function public.email_domain_registration_check(text) is
  'Registration policy decision for an email domain: NULL = allowed, else invalid | blocked | not_approved. Reveals nothing beyond what the registration form shows.';

-- The API calls this with the publishable (anon) key before sign-up.
revoke all on function public.email_domain_registration_check(text) from public;
grant execute on function public.email_domain_registration_check(text)
  to anon, authenticated, service_role, supabase_auth_admin;


-- -----------------------------------------------------------------------------
-- 5. DNS attestation (API -> Auth hook), private
-- -----------------------------------------------------------------------------
-- The secret lives in Supabase Vault as 'email_signup_attestation_secret'
-- (the same value as the API's EMAIL_SIGNUP_ATTESTATION_SECRET). NULL when
-- Vault or the secret is missing, which switches the check off.
create or replace function private.email_signup_attestation_secret()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if to_regclass('vault.decrypted_secrets') is null then
    return null;
  end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
    into v_secret
    using 'email_signup_attestation_secret';
  return nullif(v_secret, '');
end;
$$;

-- Token format (issued by the API): v1.<expiry unix seconds>.<hex HMAC-SHA256
-- of "<normalised email>|<expiry>">. Valid only until the expiry, and never
-- for more than an hour ahead.
create or replace function private.verify_email_signup_attestation(p_email text, p_token text, p_secret text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_parts text[];
  v_expiry bigint;
  v_now bigint := floor(extract(epoch from now()))::bigint;
  v_expected text;
begin
  if p_email is null or p_token is null or p_secret is null then
    return false;
  end if;
  if p_token !~ '^v1\.[0-9]{1,12}\.[0-9a-f]{64}$' then
    return false;
  end if;

  v_parts := string_to_array(p_token, '.');
  v_expiry := v_parts[2]::bigint;
  if v_expiry < v_now or v_expiry > v_now + 3600 then
    return false;
  end if;

  v_expected := encode(extensions.hmac(p_email || '|' || v_parts[2], p_secret, 'sha256'), 'hex');
  return v_expected = v_parts[3];
end;
$$;

revoke all on function private.email_signup_attestation_secret() from public, anon, authenticated;
revoke all on function private.verify_email_signup_attestation(text, text, text) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. Before User Created Auth hook
-- -----------------------------------------------------------------------------
-- Enable in the Supabase dashboard: Authentication > Hooks > Before User
-- Created > Postgres > public.hook_before_user_created. The messages are shown
-- to the person registering, so they never contain internal details.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_raw text := event -> 'user' ->> 'email';
  v_provider text := coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', 'email');
  v_email text;
  v_domain text;
  v_reason text;
  v_secret text;
  v_approved boolean;
begin
  -- Phone or anonymous users have no email address: nothing to check.
  if v_raw is null or btrim(v_raw) = '' then
    return '{}'::jsonb;
  end if;

  v_email := public.normalize_signup_email(v_raw);
  if v_email is null then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Please enter a valid email address.'));
  end if;

  v_domain := split_part(v_email, '@', 2);
  v_reason := public.email_domain_registration_check(v_domain);
  if v_reason is not null then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Registration using this email domain is currently restricted.'));
  end if;

  -- DNS attestation: only for addresses Supabase will email a confirmation
  -- link to (password / OTP sign-ups). OAuth providers have already verified
  -- the mailbox. A domain an administrator explicitly approved (and whose DNS
  -- the API checked when it was approved) does not need a per-sign-up token,
  -- so dashboard invites to approved domains keep working.
  v_secret := private.email_signup_attestation_secret();
  if v_secret is not null and v_provider = 'email' then
    select exists (
      select 1 from public.email_domain_settings s
      where s.status = 'active' and s.policy_type = 'approved' and s.dns_status = 'valid'
        and (v_domain = s.domain or right(v_domain, char_length(s.domain) + 1) = '.' || s.domain)
    ) into v_approved;

    if not v_approved and not private.verify_email_signup_attestation(
      v_email, event -> 'user' -> 'user_metadata' ->> 'email_attestation', v_secret
    ) then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403,
        'message', 'We could not verify this email domain. Please register through the TMF website or app.'));
    end if;
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_before_user_created(jsonb) is
  'Supabase Before User Created Auth hook: email format, domain policy and (when the Vault secret is set) the API DNS attestation.';

-- Only Supabase Auth may call the hook.
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;


-- -----------------------------------------------------------------------------
-- 7. Row level security and policies (administrators only)
-- -----------------------------------------------------------------------------
alter table public.email_domain_policy enable row level security;
alter table public.email_domain_settings enable row level security;
alter table public.email_domain_audit_log enable row level security;

-- Created if missing; if present, ALTER POLICY resets roles/USING/WITH CHECK
-- (same approach as 20261008141000_create_user_settings.sql), so re-runs converge.
do $$
declare
  pol record;
begin
  for pol in
    select * from (values
      ('email_domain_policy', 'Admins view email domain policy', 'permissive', 'select',
       '(select public.is_admin())', null),
      ('email_domain_policy', 'Admins update email domain policy', 'permissive', 'update',
       '(select public.is_admin())', '(select public.is_admin())'),
      ('email_domain_policy', 'Suspended accounts have no access', 'restrictive', 'all',
       '(select public.current_account_allowed())', '(select public.current_account_allowed())'),
      ('email_domain_settings', 'Admins view email domains', 'permissive', 'select',
       '(select public.is_admin())', null),
      ('email_domain_settings', 'Admins add email domains', 'permissive', 'insert',
       null, '(select public.is_admin())'),
      ('email_domain_settings', 'Admins update email domains', 'permissive', 'update',
       '(select public.is_admin())', '(select public.is_admin())'),
      ('email_domain_settings', 'Admins remove email domains', 'permissive', 'delete',
       '(select public.is_admin())', null),
      ('email_domain_settings', 'Suspended accounts have no access', 'restrictive', 'all',
       '(select public.current_account_allowed())', '(select public.current_account_allowed())'),
      ('email_domain_audit_log', 'Admins view email domain audit log', 'permissive', 'select',
       '(select public.is_admin())', null),
      ('email_domain_audit_log', 'Suspended accounts have no access', 'restrictive', 'all',
       '(select public.current_account_allowed())', '(select public.current_account_allowed())')
    ) as p(tbl, name, kind, cmd, using_expr, check_expr)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = pol.tbl and policyname = pol.name
    ) then
      execute format('alter policy %I on public.%I to authenticated%s%s',
        pol.name, pol.tbl,
        case when pol.using_expr is null then '' else format(' using (%s)', pol.using_expr) end,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    else
      execute format('create policy %I on public.%I as %s for %s to authenticated%s%s',
        pol.name, pol.tbl, pol.kind, pol.cmd,
        case when pol.using_expr is null then '' else format(' using (%s)', pol.using_expr) end,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    end if;
  end loop;
end;
$$;


-- -----------------------------------------------------------------------------
-- 8. Grants (explicit). anon: nothing. authenticated: what RLS then narrows to
-- administrators. service_role: same extras as every other live table.
-- -----------------------------------------------------------------------------
revoke all on table public.email_domain_policy from public, anon, authenticated, service_role;
revoke all on table public.email_domain_settings from public, anon, authenticated, service_role;
revoke all on table public.email_domain_audit_log from public, anon, authenticated, service_role;

grant select, update (registration_mode) on table public.email_domain_policy to authenticated;
grant select, insert, update, delete on table public.email_domain_settings to authenticated;
grant select on table public.email_domain_audit_log to authenticated;

grant truncate, references, trigger, maintain on table public.email_domain_policy to service_role;
grant truncate, references, trigger, maintain on table public.email_domain_settings to service_role;
grant truncate, references, trigger, maintain on table public.email_domain_audit_log to service_role;


-- -----------------------------------------------------------------------------
-- Safety check: abort (and roll back) if anything above is not as intended.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['email_domain_policy', 'email_domain_settings', 'email_domain_audit_log'] loop
    if not (select relrowsecurity from pg_class where oid = format('public.%I', t)::regclass) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
    if has_table_privilege('anon', format('public.%I', t), 'select,insert,update,delete,truncate,references,trigger') then
      raise exception 'anon has privileges on public.%', t;
    end if;
  end loop;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'email_domain_settings') <> 5 then
    raise exception 'public.email_domain_settings should have exactly 5 policies';
  end if;
  if has_table_privilege('authenticated', 'public.email_domain_audit_log', 'insert,update,delete,truncate') then
    raise exception 'authenticated can write public.email_domain_audit_log';
  end if;
  if has_function_privilege('anon', 'public.hook_before_user_created(jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.hook_before_user_created(jsonb)', 'execute') then
    raise exception 'anon/authenticated can execute the auth hook';
  end if;
  if (select registration_mode from public.email_domain_policy where id = 1) is null then
    raise exception 'default email_domain_policy row is missing';
  end if;
end;
$$;
