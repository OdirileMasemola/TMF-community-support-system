-- =============================================================================
-- Block suspended accounts, narrow admin profile updates, lock down
-- create_user_notification
--
-- Builds on 20261001221500_secure_profile_role_and_account_status.sql. Based on
-- the live schema (read-only audit: policies, functions, grants, triggers).
--
-- Problems on the live project:
--   * Account status is only checked by the API. Supabase clients talk to
--     PostgREST and Storage directly, and no RLS policy looks at
--     profiles.account_status. A suspended user keeps full access to their own
--     data, and a suspended administrator keeps admin access (is_admin() and
--     current_user_role() check only profiles.role).
--   * The policy "Admins can update profiles" (previous migration) lets an admin
--     change any column of any profile, including their own role and status.
--     The web and mobile admin screens only change other users' account_status.
--   * public.create_user_notification() is SECURITY DEFINER and EXECUTE is
--     granted to PUBLIC (so anon and authenticated can call it through
--     /rpc/create_user_notification). It inserts a notification for any
--     recipient with any content and does not check who is calling.
--     Its only callers are the notify_*_status_change trigger functions. Those
--     are SECURITY DEFINER too. No web or mobile code calls it.
--
-- What this migration does:
--   1. public.current_account_allowed(): new SECURITY DEFINER helper. It returns
--      true when the caller's profile has account_status 'active' or 'pending'
--      (the same set the API allows). It returns false for 'suspended', an
--      unknown status, no profile row, or no auth.uid().
--   2. public.is_admin() also requires current_account_allowed(), so suspended
--      administrators lose admin rights everywhere is_admin() is used.
--   3. RESTRICTIVE policies TO authenticated on all 22 public tables and on
--      storage.objects (app buckets only). Restrictive policies are AND-ed with
--      the existing permissive policies, which stay untouched. anon and
--      service_role are not affected.
--   4. "Admins can update profiles" now only applies to other users' rows.
--      protect_profile_privileged_fields() is redefined:
--        - nobody, admins included, can change their own role or account_status;
--        - an admin may change only role and account_status of another user;
--        - normal users still cannot change role or account_status;
--        - privileged database roles (service_role, postgres) are unrestricted.
--   5. EXECUTE on create_user_notification() is revoked from PUBLIC, anon and
--      authenticated and granted to service_role. The trigger functions still
--      reach it: they are SECURITY DEFINER and run as the owner.
--
-- No tables, columns, enums, data or permissive policies are dropped.
-- Safe to run more than once.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Helper: is the calling account allowed (not suspended)?
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER bypasses RLS on public.profiles. That means no policy
-- recursion when this runs inside a profiles policy, and it works even for a
-- user who cannot SELECT their own row. It takes no parameters, so it can only
-- tell the caller about themselves. search_path is empty and every name is
-- schema-qualified.
-- Allowed set = API PERMITTED_ACCOUNT_STATUSES ('active', 'pending').
-- No profile row => false (fail closed). handle_new_user() always creates the
-- row, so a missing row is an anomaly, and such a user owns nothing anyway.
-- (The API lets a user with no profile through with role = null. A user like
-- that can still read public campaigns as anon, but owns no rows to reach.)
create or replace function public.current_account_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.account_status in ('active', 'pending')
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

comment on function public.current_account_allowed() is
  'True when the calling user (auth.uid()) has a profile with account_status active or pending. Used by RLS to block suspended accounts.';

-- Revoke from anon explicitly as well, because Supabase default privileges grant
-- EXECUTE on new public functions to anon/authenticated/service_role.
-- authenticated needs EXECUTE: RLS policy expressions run as the calling role.
revoke all on function public.current_account_allowed() from public, anon;
grant execute on function public.current_account_allowed() to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 2. is_admin(): a suspended administrator is not an administrator
-- -----------------------------------------------------------------------------
-- Same signature, language, volatility, SECURITY DEFINER and search_path as the
-- live function. CREATE OR REPLACE keeps the owner and grants (EXECUTE to
-- PUBLIC, used by many policies, including ones evaluated for anon). It runs as
-- the owner, so it may call current_account_allowed() even when the caller is
-- anon. No recursion: both functions are SECURITY DEFINER and bypass RLS on
-- profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.current_account_allowed()
     and exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'administrator'
     );
$function$;

-- current_user_role() is left unchanged. It returns the stored role. Its only
-- uses in policies (contact_messages admin read/update and the campaign-images
-- storage admin write policies) are covered by the restrictive policies below.


-- -----------------------------------------------------------------------------
-- 3. RESTRICTIVE policies: suspended accounts get no direct data access
-- -----------------------------------------------------------------------------
-- All of them are TO authenticated. anon (public pages, contact form) and
-- service_role (BYPASSRLS) are unaffected. SECURITY DEFINER trigger functions
-- (notify_*, refresh_campaign_amount, update_campaign_amount_raised,
-- handle_new_user) run as the table owner and bypass RLS, so they keep working.
-- "(select ...)" lets Postgres evaluate the helper once per statement.
--
-- Each policy is created if missing. If it exists, ALTER POLICY resets its
-- roles/USING/WITH CHECK to the definition here, so re-runs converge.
do $$
declare
  t text;
  pol record;
begin
  for pol in
    -- 3a. 19 application tables: no access at all while suspended.
    select 'public' as sch, x.tbl, 'Suspended accounts have no access' as name, 'all' as cmd,
           '(select public.current_account_allowed())' as using_expr,
           '(select public.current_account_allowed())' as check_expr
    from unnest(array[
      'administrator_profiles', 'assistance_requests', 'beneficiary_profiles',
      'campaign_applications', 'collection_schedules', 'donation_proofs',
      'donations', 'donor_profiles', 'events', 'notifications', 'reports',
      'sponsor_profiles', 'sponsorship_request_responses', 'sponsorship_requests',
      'sponsorships', 'supporting_documents', 'volunteer_assignments',
      'volunteer_hours', 'volunteer_profiles'
    ]) as x(tbl)
    union all
    -- 3b. profiles: a suspended user may still SELECT their own row (existing
    --     policy), so the apps can show the account state, but cannot update it.
    --     A suspended admin sees only their own row, because is_admin() is false.
    select 'public', 'profiles', 'Suspended accounts cannot update profiles', 'update',
           '(select public.current_account_allowed())',
           '(select public.current_account_allowed())'
    union all
    -- 3c. campaigns: a suspended signed-in user sees the same campaigns as anon
    --     ("Anyone can view public active campaigns") and cannot write.
    select 'public', 'campaigns', 'Suspended accounts only see public campaigns', 'all',
           '((select public.current_account_allowed()) or ((status = ''active''::public.campaign_status) and (is_public = true)))',
           '(select public.current_account_allowed())'
    union all
    -- 3d. contact_messages: INSERT stays open (anyone, including anon, may use
    --     the contact form). Reading and updating messages (admin inbox) is
    --     blocked for suspended accounts.
    select 'public', 'contact_messages', 'Suspended accounts cannot read contact messages', 'select',
           '(select public.current_account_allowed())', null
    union all
    select 'public', 'contact_messages', 'Suspended accounts cannot update contact messages', 'update',
           '(select public.current_account_allowed())',
           '(select public.current_account_allowed())'
    union all
    -- 3e. storage.objects: only the app's four buckets. Other buckets are not
    --     affected. Public bucket files are still reachable through public URLs,
    --     which do not go through RLS.
    select 'storage', 'objects', 'Suspended accounts have no access to app buckets', 'all',
           '((bucket_id <> all (array[''campaign-images'', ''donation-proofs'', ''profile-images'', ''supporting-documents''])) or (select public.current_account_allowed()))',
           '((bucket_id <> all (array[''campaign-images'', ''donation-proofs'', ''profile-images'', ''supporting-documents''])) or (select public.current_account_allowed()))'
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = pol.sch and tablename = pol.tbl and policyname = pol.name
    ) then
      execute format('alter policy %I on %I.%I to authenticated using (%s)%s',
        pol.name, pol.sch, pol.tbl, pol.using_expr,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    else
      execute format('create policy %I on %I.%I as restrictive for %s to authenticated using (%s)%s',
        pol.name, pol.sch, pol.tbl, pol.cmd, pol.using_expr,
        case when pol.check_expr is null then '' else format(' with check (%s)', pol.check_expr) end);
    end if;
  end loop;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4. Narrow administrator profile updates
-- -----------------------------------------------------------------------------
-- 4a. Policy "Admins can update profiles" (from the previous migration) now only
--     covers OTHER users' rows. On purpose, the same name is kept and changed
--     with ALTER POLICY. Admins edit their own name/phone/avatar through the
--     existing "Users can update their own profile" policy. is_admin() now also
--     requires a non-suspended account.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Admins can update profiles'
  ) then
    alter policy "Admins can update profiles" on public.profiles
      to authenticated
      using (public.is_admin() and id <> auth.uid())
      with check (public.is_admin() and id <> auth.uid());
  else
    create policy "Admins can update profiles"
      on public.profiles
      as permissive
      for update
      to authenticated
      using (public.is_admin() and id <> auth.uid())
      with check (public.is_admin() and id <> auth.uid());
  end if;
end;
$$;

-- 4b. Column rules, enforced by the existing zz_protect_profile_privileged_fields
--     trigger (BEFORE UPDATE, fires after set_profiles_updated_at and
--     profiles_avatar_change_limit). Still SECURITY INVOKER so current_user is
--     the caller's role. The trigger itself is not changed.
--     The web and mobile admin screens only send { account_status }. role is
--     also allowed for admins, matching the previous migration. Nothing in
--     web/ or mobile/ writes invited_by/invited_at, so those are not allowed.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Trusted server-side/admin roles (service_role, postgres, dashboard) are
  -- allowed through. End users reach the database as 'anon' or 'authenticated'.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if old.id = auth.uid() then
    -- Own row: role and account_status cannot be changed, not even by an admin.
    -- This stops self-promotion, self-activation and admins locking themselves out.
    if (new.role is distinct from old.role)
       or (new.account_status is distinct from old.account_status) then
      raise exception 'Not allowed to change your own role or account status'
        using errcode = '42501',
              hint = 'Another administrator must change role or account_status.';
    end if;
    return new;
  end if;

  -- Someone else's row (RLS only allows this for administrators).
  if not public.is_admin() then
    if (new.role is distinct from old.role)
       or (new.account_status is distinct from old.account_status) then
      raise exception 'Not allowed to change this profile field'
        using errcode = '42501',
              hint = 'Only administrators can change role or account_status.';
    end if;
    return new;
  end if;

  -- Admin editing another user: only role and account_status may change.
  -- updated_at is set by set_profiles_updated_at. Comparing whole rows means
  -- any column added later is protected by default.
  if (to_jsonb(new) - array['role', 'account_status', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['role', 'account_status', 'updated_at']) then
    raise exception 'Administrators may only change role or account_status of other users'
      using errcode = '42501',
            hint = 'Other profile fields can only be changed by the account owner.';
  end if;

  return new;
end;
$$;

comment on function public.protect_profile_privileged_fields() is
  'BEFORE UPDATE trigger on public.profiles: users cannot change their own role/account_status; administrators may change only role/account_status of other users; privileged database roles are unrestricted.';


-- -----------------------------------------------------------------------------
-- 5. create_user_notification(): internal use only
-- -----------------------------------------------------------------------------
-- Callers: notify_application_status_change, notify_assistance_status_change and
-- notify_donation_status_change. All are SECURITY DEFINER owned by the function
-- owner, so they run with the owner's EXECUTE rights. No web or mobile .rpc()
-- call exists. notify_admins_of_contact_message inserts directly.
-- The function body, SECURITY DEFINER and search_path (public, all names
-- qualified) are unchanged. service_role keeps EXECUTE for server-side use.
revoke all on function public.create_user_notification(uuid, text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_user_notification(uuid, text, text, text, text, text, uuid)
  to service_role;
