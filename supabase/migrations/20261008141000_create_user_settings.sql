-- =============================================================================
-- user_settings: per-user preferences (plan US2.3.1)
--
-- Builds on 20261008140000_fix_contact_message_notification.sql. Based on the
-- live schema as recorded in 20260930000000_remote_schema_baseline.sql.
--
-- What this migration does:
--   1. Table public.user_settings, one row per profile (user_id = profiles.id,
--      which is the auth user id: handle_new_user() inserts profiles.id = new.id
--      from auth.users). Deleting a profile deletes its settings.
--   2. updated_at: the existing trigger function public.set_updated_at(), with
--      the same BEFORE UPDATE trigger pattern as profiles/campaigns/events
--      (set_<table>_updated_at).
--   3. Auto-provisioning: AFTER INSERT trigger on public.profiles inserts the
--      default row (ON CONFLICT DO NOTHING). The function is SECURITY DEFINER so
--      it works whoever inserts the profile; search_path is empty and every
--      name is schema-qualified; EXECUTE is revoked from PUBLIC, anon and
--      authenticated and granted to service_role (same as migrations 2 and 3).
--   4. RLS: signed-in users may SELECT, INSERT and UPDATE only their own row
--      (INSERT lets the API lazily create a missing row). No DELETE policy.
--      Administrators get no access to other users' settings. The RESTRICTIVE
--      "Suspended accounts have no access" policy from migration 2 is added too.
--   5. Grants (explicit; live default privileges would otherwise give anon
--      TRUNCATE/REFERENCES/TRIGGER/MAINTAIN and authenticated also TRUNCATE/
--      REFERENCES/TRIGGER/MAINTAIN). Final table ACL:
--        postgres      arwdDxtm (owner)
--        authenticated arw      (SELECT, INSERT, UPDATE)
--        service_role  Dxtm     (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN: the
--                                same as on every other live table)
--        anon          none
--   6. BACKFILL (last section, separate): default rows for profiles that
--      already exist. It WRITES DATA on live; remove that section to skip it.
--
-- No existing tables, columns, policies, grants or data are changed (apart from
-- the optional backfill, which only inserts into the new table).
-- Safe to run more than once.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Table
-- -----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid not null,
  theme_preference text not null default 'system',
  notify_campaign_updates boolean not null default true,
  notify_request_updates boolean not null default true,
  notify_donation_updates boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_settings_pkey primary key (user_id),
  constraint user_settings_user_id_fkey foreign key (user_id)
    references public.profiles(id) on delete cascade,
  constraint user_settings_theme_preference_check
    check (theme_preference in ('light', 'dark', 'system'))
);

comment on table public.user_settings is
  'Per-user app preferences (theme and notification opt-ins). One row per profile, created automatically when the profile is created.';


-- -----------------------------------------------------------------------------
-- 2. updated_at (existing public.set_updated_at(), same pattern as other tables)
-- -----------------------------------------------------------------------------
create or replace trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3. Auto-provision a default row for every new profile
-- -----------------------------------------------------------------------------
create or replace function public.create_default_user_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.create_default_user_settings() is
  'AFTER INSERT trigger on public.profiles: creates the default public.user_settings row for the new profile.';

-- Trigger function only; nobody needs to call it directly. The trigger still
-- fires for every inserter (EXECUTE is checked when the trigger is created).
revoke all on function public.create_default_user_settings() from public, anon, authenticated;
grant execute on function public.create_default_user_settings() to service_role;

create or replace trigger create_user_settings_after_profile_insert
  after insert on public.profiles
  for each row
  execute function public.create_default_user_settings();


-- -----------------------------------------------------------------------------
-- 4. Row level security and policies
-- -----------------------------------------------------------------------------
alter table public.user_settings enable row level security;

-- Created if missing; if present, ALTER POLICY resets roles/USING/WITH CHECK
-- to the definition here (same approach as migration 2), so re-runs converge.
do $$
declare
  pol record;
begin
  for pol in
    select * from (values
      ('Users view own settings', 'permissive', 'select',
       '(user_id = auth.uid())', null),
      ('Users create own settings', 'permissive', 'insert',
       null, '(user_id = auth.uid())'),
      ('Users update own settings', 'permissive', 'update',
       '(user_id = auth.uid())', '(user_id = auth.uid())'),
      ('Suspended accounts have no access', 'restrictive', 'all',
       '(select public.current_account_allowed())', '(select public.current_account_allowed())')
    ) as p(name, kind, cmd, using_expr, check_expr)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_settings' and policyname = pol.name
    ) then
      execute format('alter policy %I on public.user_settings to authenticated%s%s',
        pol.name,
        case when pol.using_expr is null then '' else format(' using (%s)', pol.using_expr) end,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    else
      execute format('create policy %I on public.user_settings as %s for %s to authenticated%s%s',
        pol.name, pol.kind, pol.cmd,
        case when pol.using_expr is null then '' else format(' using (%s)', pol.using_expr) end,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    end if;
  end loop;
end;
$$;


-- -----------------------------------------------------------------------------
-- 5. Grants (explicit; see the ACL in the header)
-- -----------------------------------------------------------------------------
revoke all on table public.user_settings from public, anon, authenticated, service_role;
grant select, insert, update on table public.user_settings to authenticated;
grant truncate, references, trigger, maintain on table public.user_settings to service_role;


-- -----------------------------------------------------------------------------
-- Safety check: abort (and roll back) if anything above is not as intended.
-- -----------------------------------------------------------------------------
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.user_settings'::regclass) then
    raise exception 'RLS is not enabled on public.user_settings';
  end if;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'user_settings') <> 4 then
    raise exception 'public.user_settings should have exactly 4 policies';
  end if;
  if has_table_privilege('anon', 'public.user_settings', 'select,insert,update,delete,truncate,references,trigger') then
    raise exception 'anon has privileges on public.user_settings';
  end if;
  if has_table_privilege('authenticated', 'public.user_settings', 'delete,truncate,references,trigger') then
    raise exception 'authenticated has more than select/insert/update on public.user_settings';
  end if;
  if has_function_privilege('anon', 'public.create_default_user_settings()', 'execute')
     or has_function_privilege('authenticated', 'public.create_default_user_settings()', 'execute') then
    raise exception 'anon/authenticated can execute public.create_default_user_settings()';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'create_user_settings_after_profile_insert' and not tgisinternal
  ) then
    raise exception 'auto-provisioning trigger on public.profiles is missing';
  end if;
end;
$$;


-- =============================================================================
-- BACKFILL: default rows for profiles that already exist.
-- THIS WRITES DATA ON LIVE (one default row per existing profile; nothing else
-- is changed). Remove this section if the backfill should not run.
-- Re-running inserts nothing new.
-- =============================================================================
insert into public.user_settings (user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;
