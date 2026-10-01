-- =============================================================================
-- Secure profiles.role and profiles.account_status
--
-- Problem (live project, read-only audit):
--   * RLS policy "Users can update their own profile" lets any signed-in user
--     UPDATE every column of their own row, and `authenticated` has column-level
--     UPDATE on role and account_status. A user can therefore make themselves
--     'administrator' (is_admin() trusts profiles.role) or activate their own account.
--   * handle_new_user() copies raw_user_meta_data->>'role' (client-controlled at
--     sign-up) into profiles.role, so anyone can sign up as 'administrator'.
--   * The web and mobile admin screens update other users' account_status
--     (profiles.update({ account_status }).eq('id', otherUser)), but no UPDATE policy
--     allows administrators to update other rows, so those updates match 0 rows.
--
-- This migration is additive: no tables, columns, enums, data, grants or existing
-- policies are dropped or changed. It is safe to run more than once.
--   1. Trigger function + trigger: only administrators (is_admin()) or privileged
--      database roles (service_role, postgres, dashboard/SQL editor) may change
--      profiles.role or profiles.account_status.
--   2. Policy "Admins can update profiles": administrators may update any profile
--      (needed for the existing admin "Activate"/"Suspend" account screens).
--   3. handle_new_user(): identical to the live definition except that a requested
--      'administrator' role falls back to 'beneficiary'.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Block non-admin changes to profiles.role / profiles.account_status
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER on purpose: current_user must be the caller's database role
-- (PostgREST switches to 'anon' / 'authenticated' / 'service_role' per request).
-- is_admin() is SECURITY DEFINER and checks the caller's *current* stored role
-- (the row as it was before this UPDATE), so a user cannot promote themselves first.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (new.role is distinct from old.role)
     or (new.account_status is distinct from old.account_status) then

    -- End users reach the database as 'anon' or 'authenticated' (via PostgREST).
    -- Any other role (service_role, postgres, supabase_admin, ...) is trusted
    -- server-side/admin tooling and is allowed through.
    if current_user in ('anon', 'authenticated') and not public.is_admin() then
      raise exception 'Not allowed to change this profile field'
        using errcode = '42501',  -- insufficient_privilege (PostgREST returns 403)
              hint = 'Only administrators can change role or account_status.';
    end if;

  end if;

  return new;
end;
$$;

comment on function public.protect_profile_privileged_fields() is
  'BEFORE UPDATE trigger on public.profiles: only administrators (is_admin()) or privileged database roles may change role or account_status.';

-- BEFORE UPDATE triggers fire in alphabetical order. The "zz_" prefix makes this
-- run after profiles_avatar_change_limit and set_profiles_updated_at, so it checks
-- the final values that would be written. (No other trigger changes these columns,
-- and a BEFORE trigger that returned NULL would cancel the update altogether.)
-- CREATE OR REPLACE TRIGGER (PostgreSQL 14+) keeps this idempotent without a DROP.
create or replace trigger zz_protect_profile_privileged_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_fields();


-- -----------------------------------------------------------------------------
-- 2. Let administrators update other users' profiles
-- -----------------------------------------------------------------------------
-- Matches the existing "Admins manage ..." pattern used on the other tables.
-- The existing policies are left untouched; permissive policies are OR-ed, so
-- normal users still only update their own row. Created only if missing.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Admins can update profiles'
  ) then
    create policy "Admins can update profiles"
      on public.profiles
      as permissive
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Sign-up must not grant 'administrator'
-- -----------------------------------------------------------------------------
-- Verbatim copy of the live public.handle_new_user() (pg_get_functiondef) with one
-- added block, marked [secure_profile_role_and_account_status]. CREATE OR REPLACE
-- keeps the owner, SECURITY DEFINER, search_path, grants and the
-- on_auth_user_created trigger. The 'administrator' branch below is now
-- unreachable but is kept to stay identical to the live function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    selected_role public.user_role;
    profile_name text;
    profile_email text;
    profile_phone text;
begin

    -- Get basic information from Supabase Auth.
    profile_name :=
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            'New User'
        );

    profile_email := new.email;

    profile_phone :=
        new.raw_user_meta_data ->> 'phone_number';

    -- Safely determine the user's role.
    begin
        selected_role :=
            coalesce(
                (new.raw_user_meta_data ->> 'role')::public.user_role,
                'beneficiary'
            );
    exception
        when invalid_text_representation then
            selected_role := 'beneficiary';
    end;

    -- [secure_profile_role_and_account_status] Administrator cannot be self-assigned
    -- through sign-up metadata (raw_user_meta_data is fully client-controlled).
    -- Fall back to the default role; administrators are granted by an existing
    -- administrator or a privileged database role instead.
    if selected_role = 'administrator' then
        selected_role := 'beneficiary';
    end if;


    -- Create the main profile.
    insert into public.profiles (
        id,
        full_name,
        email,
        phone_number,
        role,
        account_status
    )
    values (
        new.id,
        profile_name,
        profile_email,
        profile_phone,
        selected_role,
        'pending'
    )
    on conflict (id) do nothing;


    -- Create the correct role-specific profile.
    if selected_role = 'administrator' then

        insert into public.administrator_profiles (
            user_id
        )
        values (
            new.id
        )
        on conflict (user_id) do nothing;


    elsif selected_role = 'volunteer' then

        insert into public.volunteer_profiles (
            user_id,
            member_since
        )
        values (
            new.id,
            current_date
        )
        on conflict (user_id) do nothing;


    elsif selected_role = 'beneficiary' then

        insert into public.beneficiary_profiles (
            user_id
        )
        values (
            new.id
        )
        on conflict (user_id) do nothing;


    elsif selected_role = 'donor' then

        insert into public.donor_profiles (
            user_id,
            member_since
        )
        values (
            new.id,
            current_date
        )
        on conflict (user_id) do nothing;


    elsif selected_role = 'sponsor' then

        insert into public.sponsor_profiles (
            user_id,
            organisation_name
        )
        values (
            new.id,
            coalesce(
                new.raw_user_meta_data ->> 'organisation_name',
                profile_name
            )
        )
        on conflict (user_id) do nothing;

    end if;


    return new;
end;
$function$;
