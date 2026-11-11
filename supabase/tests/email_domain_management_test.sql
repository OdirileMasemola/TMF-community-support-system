-- =============================================================================
-- SQL tests for 20261112120000_email_domain_management.sql.
-- LOCAL TEST DATABASE ONLY (see run_local_tests.sh). Needs local_supabase_stub.sql.
-- Every check raises an exception on failure, which aborts the run.
-- =============================================================================

create function pg_temp.expect(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is distinct from true then
    raise exception 'FAILED: %', what;
  end if;
end;
$$;

-- Users: handle_new_user() creates their profiles; roles/status set as superuser.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'admin@tmf.example', '{"full_name":"Admin"}'),
  ('d2222222-2222-4222-8222-222222222222', 'donor@tmf.example', '{"full_name":"Donor","role":"donor"}'),
  ('a3333333-3333-4333-8333-333333333333', 'suspended.admin@tmf.example', '{"full_name":"Old admin"}');
update public.profiles set role = 'administrator', account_status = 'active'
  where id in ('a1111111-1111-4111-8111-111111111111', 'a3333333-3333-4333-8333-333333333333');
update public.profiles set account_status = 'suspended' where id = 'a3333333-3333-4333-8333-333333333333';
update public.profiles set account_status = 'active' where id = 'd2222222-2222-4222-8222-222222222222';


-- 1. Format and normalisation ---------------------------------------------------
select pg_temp.expect(public.normalize_signup_email('  Thandi.M@Company.CO.ZA ') = 'thandi.m@company.co.za', 'trim + lower-case');
select pg_temp.expect(public.normalize_signup_email('user+tag@foundation.org') = 'user+tag@foundation.org', 'plus addressing');
select pg_temp.expect(public.normalize_signup_email('a@xn--bcher-kva.example') = 'a@xn--bcher-kva.example', 'punycode domain');
select pg_temp.expect(public.normalize_signup_email('a@xn--p1ai.xn--p1ai') = 'a@xn--p1ai.xn--p1ai', 'punycode TLD');
select pg_temp.expect(public.normalize_signup_email(e) is null, 'rejects ' || coalesce(e, 'NULL'))
from unnest(array[
  null, '', '   ', 'plainaddress', 'no-domain@', '@no-local.org', 'two@@at.org', 'a@b@c.org',
  'sp ace@example.org', 'tab@exa' || chr(9) || 'mple.org', 'a@localhost', 'a@-bad.org', 'a@bad-.org',
  'a@exa_mple.org', 'a@example.c', 'a@example.123', 'a@[127.0.0.1]', '"quoted"@example.org',
  '.dot@example.org', 'dot.@example.org', 'do..t@example.org', 'a@example..org', 'a@example.org.',
  'üser@example.org', 'a@bücher.example', repeat('a', 65) || '@example.org'
]) as e;
select pg_temp.expect(public.email_domain_is_valid('company.co.za'), 'custom domain syntax');
select pg_temp.expect(not public.email_domain_is_valid('Company.co.za'), 'stored domains must be lower-case');


-- 2. Policy decision: OPEN (default) --------------------------------------------
select pg_temp.expect((select registration_mode from public.email_domain_policy where id = 1) = 'open', 'default mode is open');
select pg_temp.expect(public.email_domain_registration_check('gmail.com') is null, 'open: unlisted provider allowed');
select pg_temp.expect(public.email_domain_registration_check('company.co.za') is null, 'open: unlisted custom domain allowed');
select pg_temp.expect(public.email_domain_registration_check('not a domain') = 'invalid', 'invalid domain');

insert into public.email_domain_settings (domain, policy_type, status) values
  ('blocked.example', 'blocked', 'active'),
  ('paused-block.example', 'blocked', 'inactive'),
  ('foundation.org', 'approved', 'active'),
  ('ok.blocked.example', 'approved', 'active'),
  ('paused.example', 'approved', 'inactive');

select pg_temp.expect(public.email_domain_registration_check('blocked.example') = 'blocked', 'open: blocked domain rejected');
select pg_temp.expect(public.email_domain_registration_check('BLOCKED.example ') = 'blocked', 'open: blocked check normalises input');
select pg_temp.expect(public.email_domain_registration_check('mail.blocked.example') = 'blocked', 'open: subdomain of blocked rejected');
select pg_temp.expect(public.email_domain_registration_check('ok.blocked.example') is null, 'more specific approved rule wins');
select pg_temp.expect(public.email_domain_registration_check('notblocked.example') is null, 'suffix without a dot is not a subdomain');
select pg_temp.expect(public.email_domain_registration_check('paused-block.example') is null, 'inactive block ignored');


-- 3. Policy decision: RESTRICTED ------------------------------------------------
update public.email_domain_policy set registration_mode = 'restricted' where id = 1;
select pg_temp.expect(public.email_domain_registration_check('foundation.org') is null, 'restricted: approved accepted');
select pg_temp.expect(public.email_domain_registration_check('hr.foundation.org') is null, 'restricted: approved subdomain accepted');
select pg_temp.expect(public.email_domain_registration_check('gmail.com') = 'not_approved', 'restricted: unapproved rejected');
select pg_temp.expect(public.email_domain_registration_check('paused.example') = 'not_approved', 'restricted: inactive approval rejected');
select pg_temp.expect(public.email_domain_registration_check('blocked.example') = 'blocked', 'restricted: blocked still blocked');
update public.email_domain_policy set registration_mode = 'open' where id = 1;
select pg_temp.expect(public.email_domain_registration_check('gmail.com') is null, 'switching back to open affects new checks');


-- 4. Constraints and triggers ---------------------------------------------------
do $$
begin
  insert into public.email_domain_settings (domain, policy_type) values ('foundation.org', 'blocked');
  raise exception 'FAILED: duplicate domain accepted';
exception when unique_violation then null;
end;
$$;
do $$
begin
  insert into public.email_domain_settings (domain, policy_type) values (' FOUNDATION.org', 'approved');
  raise exception 'FAILED: duplicate (different case) accepted';
exception when unique_violation then null;
end;
$$;
do $$
begin
  insert into public.email_domain_settings (domain, policy_type) values ('bad domain', 'approved');
  raise exception 'FAILED: invalid domain accepted';
exception when check_violation then null;
end;
$$;
do $$
begin
  insert into public.email_domain_settings (domain, policy_type) values ('x.example', 'allow');
  raise exception 'FAILED: invalid policy type accepted';
exception when check_violation then null;
end;
$$;
do $$
begin
  update public.email_domain_settings set domain = 'renamed.org' where domain = 'foundation.org';
  raise exception 'FAILED: domain rename accepted';
exception when invalid_parameter_value then null;
end;
$$;
do $$
begin
  insert into public.email_domain_policy (id, registration_mode) values (2, 'open');
  raise exception 'FAILED: second policy row accepted';
exception when check_violation then null;
end;
$$;
do $$
begin
  update public.email_domain_policy set registration_mode = 'closed' where id = 1;
  raise exception 'FAILED: unknown registration mode accepted';
exception when check_violation then null;
end;
$$;


-- 5. RLS: administrator --------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', false);

select pg_temp.expect((select count(*) from public.email_domain_settings) = 5, 'admin can list domains');
insert into public.email_domain_settings (domain, policy_type, created_by, updated_by)
  values ('company.co.za', 'approved', 'd2222222-2222-4222-8222-222222222222', 'd2222222-2222-4222-8222-222222222222');
select pg_temp.expect(
  (select created_by = 'a1111111-1111-4111-8111-111111111111' and updated_by = created_by
   from public.email_domain_settings where domain = 'company.co.za'),
  'created_by/updated_by come from auth.uid(), not the client');
update public.email_domain_settings set status = 'inactive', notes = 'Paused' where domain = 'company.co.za';
select pg_temp.expect((select status from public.email_domain_settings where domain = 'company.co.za') = 'inactive', 'admin can deactivate');
update public.email_domain_settings set policy_type = 'blocked', status = 'active' where domain = 'company.co.za';
select pg_temp.expect(public.email_domain_registration_check('company.co.za') = 'blocked', 'admin block takes effect');
delete from public.email_domain_settings where domain = 'company.co.za';
select pg_temp.expect(not exists (select 1 from public.email_domain_settings where domain = 'company.co.za'), 'admin can remove');
do $$
begin
  update public.email_domain_policy set registration_mode = 'restricted', updated_by = 'd2222222-2222-4222-8222-222222222222';
  raise exception 'FAILED: client chose updated_by';
exception when insufficient_privilege then null;
end;
$$;
update public.email_domain_policy set registration_mode = 'restricted';
select pg_temp.expect(
  (select registration_mode = 'restricted' and updated_by = 'a1111111-1111-4111-8111-111111111111' from public.email_domain_policy),
  'admin can change mode; updated_by is the caller');
update public.email_domain_policy set registration_mode = 'open';
select pg_temp.expect(
  (select count(*) from public.email_domain_audit_log where actor_id = 'a1111111-1111-4111-8111-111111111111') = 6,
  'audit log records each admin change with the actor');
select pg_temp.expect(
  exists (select 1 from public.email_domain_audit_log where action = 'delete' and domain = 'company.co.za' and old_values ->> 'policy_type' = 'blocked'),
  'audit log keeps the deleted row');
do $$
begin
  insert into public.email_domain_audit_log (entity, action) values ('domain', 'insert');
  raise exception 'FAILED: admin wrote to the audit log directly';
exception when insufficient_privilege then null;
end;
$$;
do $$
begin
  delete from public.email_domain_audit_log;
  raise exception 'FAILED: admin deleted audit rows';
exception when insufficient_privilege then null;
end;
$$;
do $$
begin
  update public.email_domain_policy set id = 1, updated_at = now();
  raise exception 'FAILED: policy columns other than registration_mode are writable';
exception when insufficient_privilege then null;
end;
$$;


-- 6. RLS: ordinary signed-in user (donor) --------------------------------------
select set_config('request.jwt.claim.sub', 'd2222222-2222-4222-8222-222222222222', false);
select pg_temp.expect((select count(*) from public.email_domain_settings) = 0, 'donor sees no domains');
select pg_temp.expect((select count(*) from public.email_domain_policy) = 0, 'donor cannot read the policy row');
select pg_temp.expect((select count(*) from public.email_domain_audit_log) = 0, 'donor sees no audit rows');
do $$
begin
  insert into public.email_domain_settings (domain, policy_type) values ('evil.example', 'approved');
  raise exception 'FAILED: donor added a domain';
exception when insufficient_privilege then null;
end;
$$;
update public.email_domain_settings set policy_type = 'approved' where domain = 'blocked.example';
delete from public.email_domain_settings where domain = 'foundation.org';
update public.email_domain_policy set registration_mode = 'restricted';
-- The donor may still run the policy check (it only reveals the outcome).
select pg_temp.expect(public.email_domain_registration_check('blocked.example') = 'blocked', 'donor can call the check');

-- 7. RLS: suspended administrator -----------------------------------------------
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', false);
select pg_temp.expect((select count(*) from public.email_domain_settings) = 0, 'suspended admin sees no domains');
update public.email_domain_policy set registration_mode = 'restricted';

-- 8. anon -----------------------------------------------------------------------
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$
begin
  perform 1 from public.email_domain_settings;
  raise exception 'FAILED: anon read domains';
exception when insufficient_privilege then null;
end;
$$;
do $$
begin
  perform public.hook_before_user_created('{}'::jsonb);
  raise exception 'FAILED: anon executed the auth hook';
exception when insufficient_privilege then null;
end;
$$;
select pg_temp.expect(public.email_domain_registration_check('gmail.com') is null, 'anon (API publishable key) can call the check');
reset role;

-- None of the forbidden writes above changed anything.
select pg_temp.expect((select policy_type from public.email_domain_settings where domain = 'blocked.example') = 'blocked', 'donor update had no effect');
select pg_temp.expect(exists (select 1 from public.email_domain_settings where domain = 'foundation.org'), 'donor delete had no effect');
select pg_temp.expect((select registration_mode from public.email_domain_policy) = 'open', 'non-admin mode changes had no effect');


-- 9. Auth hook (run as supabase_auth_admin, like Supabase Auth) -----------------
create function pg_temp.event(p_email text, p_provider text default 'email', p_meta jsonb default '{}'::jsonb)
returns jsonb language sql as $$
  select jsonb_build_object(
    'metadata', jsonb_build_object('name', 'before-user-created', 'ip_address', '127.0.0.1'),
    'user', jsonb_build_object(
      'email', p_email,
      'app_metadata', jsonb_build_object('provider', p_provider, 'providers', jsonb_build_array(p_provider)),
      'user_metadata', p_meta));
$$;
create function pg_temp.token(p_email text, p_expiry bigint, p_secret text) returns text language sql as $$
  select 'v1.' || p_expiry || '.' || encode(extensions.hmac(p_email || '|' || p_expiry, p_secret, 'sha256'), 'hex');
$$;
grant execute on all functions in schema pg_temp to supabase_auth_admin;
-- As on Supabase, where every API role can use the extensions schema.
grant usage on schema extensions to supabase_auth_admin;

set role supabase_auth_admin;
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('new.user@company.co.za')) = '{}'::jsonb, 'hook: open mode allows a custom domain');
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('')) = '{}'::jsonb, 'hook: no email (phone/anonymous) passes');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('not-an-email')) -> 'error' ->> 'http_code') = '400', 'hook: malformed email rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('x@blocked.example')) -> 'error' ->> 'http_code') = '403', 'hook: blocked domain rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('x@sub.blocked.example', 'google')) -> 'error' ->> 'message') = 'Registration using this email domain is currently restricted.', 'hook: blocked applies to OAuth too');
reset role;
update public.email_domain_policy set registration_mode = 'restricted';
set role supabase_auth_admin;
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('x@gmail.com')) -> 'error' ->> 'http_code') = '403', 'hook: restricted rejects unapproved');
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('x@foundation.org')) = '{}'::jsonb, 'hook: restricted accepts approved');
reset role;
update public.email_domain_policy set registration_mode = 'open';

-- Cross-language check: the API's Node HMAC for these inputs is the literal below
-- (api/tests/emailDomains.attestation.test.ts asserts the same value).
select pg_temp.expect(
  encode(extensions.hmac('thandi@company.co.za|1893456000', 'local-test-secret-0123456789abcdef', 'sha256'), 'hex')
    = 'e6317a68073cf2b38dbe6d7fd2346b59d9a11a6eda6532006b0ada0424a8c224',
  'pgcrypto HMAC matches Node createHmac');

-- Attestation switched on by putting the secret in (stub) Vault.
insert into vault.secrets_store (name, secret) values ('email_signup_attestation_secret', 'local-test-secret-0123456789abcdef');
update public.email_domain_settings set dns_status = 'valid' where domain = 'foundation.org';
set role supabase_auth_admin;
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('new.user@company.co.za')) -> 'error' ->> 'http_code') = '403',
  'hook: direct sign-up without the API DNS attestation rejected');
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('New.User@Company.co.za',
  'email', jsonb_build_object('email_attestation',
    pg_temp.token('new.user@company.co.za', floor(extract(epoch from now()))::bigint + 600, 'local-test-secret-0123456789abcdef')))) = '{}'::jsonb,
  'hook: valid attestation accepted (address normalised first)');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('new.user@company.co.za',
  'email', jsonb_build_object('email_attestation',
    pg_temp.token('new.user@company.co.za', floor(extract(epoch from now()))::bigint - 1, 'local-test-secret-0123456789abcdef')))) -> 'error' ->> 'http_code') = '403',
  'hook: expired attestation rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('new.user@company.co.za',
  'email', jsonb_build_object('email_attestation',
    pg_temp.token('new.user@company.co.za', floor(extract(epoch from now()))::bigint + 7200, 'local-test-secret-0123456789abcdef')))) -> 'error' ->> 'http_code') = '403',
  'hook: attestation valid for more than an hour rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('someone.else@company.co.za',
  'email', jsonb_build_object('email_attestation',
    pg_temp.token('new.user@company.co.za', floor(extract(epoch from now()))::bigint + 600, 'local-test-secret-0123456789abcdef')))) -> 'error' ->> 'http_code') = '403',
  'hook: attestation for another address rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('new.user@company.co.za',
  'email', jsonb_build_object('email_attestation',
    pg_temp.token('new.user@company.co.za', floor(extract(epoch from now()))::bigint + 600, 'wrong-secret')))) -> 'error' ->> 'http_code') = '403',
  'hook: attestation signed with another secret rejected');
select pg_temp.expect((public.hook_before_user_created(pg_temp.event('new.user@company.co.za',
  'email', '{"email_attestation":"v1.abc.def"}'::jsonb)) -> 'error' ->> 'http_code') = '403',
  'hook: garbage attestation rejected');
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('new.user@company.co.za', 'google')) = '{}'::jsonb,
  'hook: OAuth sign-up does not need an attestation');
select pg_temp.expect(public.hook_before_user_created(pg_temp.event('invitee@hr.foundation.org')) = '{}'::jsonb,
  'hook: approved domain with valid DNS does not need an attestation');
reset role;

-- 10. Existing users are not touched by policy changes ------------------------
update public.email_domain_policy set registration_mode = 'restricted';
select pg_temp.expect((select count(*) from auth.users) = 3, 'existing auth users unchanged');
select pg_temp.expect((select count(*) from public.profiles where account_status = 'active') = 2, 'existing profiles unchanged');

select 'email_domain_management_test: all checks passed' as result;
