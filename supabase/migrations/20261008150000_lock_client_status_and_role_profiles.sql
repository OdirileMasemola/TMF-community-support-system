-- =============================================================================
-- Stop clients setting statuses and admin-type role-profile fields
--
-- Builds on 20261002232000_secure_campaign_amount_function.sql and on
-- 20261008140000 / 20261008141000. Based on the schema as applied locally
-- (baseline + the 5 migrations) and on a read of every insert/update to these
-- tables in web/, mobile/ and api/.
--
-- Problems:
--   * The INSERT policies on donations, donation_proofs, assistance_requests,
--     supporting_documents, campaign_applications, sponsorships and
--     sponsorship_request_responses only check ownership. A non-admin calling
--     PostgREST directly can insert a row with a final status (donation
--     'successful', application 'approved', proof 'approved', ...).
--   * "Users manage own <role> profile" (ALL) on donor_profiles,
--     beneficiary_profiles, volunteer_profiles and sponsor_profiles lets the
--     owner write admin-type columns (beneficiary eligibility_status, volunteer
--     status, sponsor sponsor_level) and create a role profile for a role other
--     than their own profiles.role.
--
-- What this migration does:
--   1. Tightens the WITH CHECK of the six non-admin INSERT policies that have a
--      status-like column with a fixed initial value, so a non-admin insert must
--      use that initial value. Review columns on the same tables (reviewed_by,
--      reviewed_at, admin_comment, admin_notes, donations.receipt_number) must
--      be left unset. The existing ownership check is kept unchanged, and
--      is_admin() skips the new conditions so administrators keep exactly the
--      insert rights they have today. Admin policies are not touched.
--   2. sponsorship_request_responses ("Sponsors create own responses"): status
--      is free text with default 'interested' and no CHECK. The sponsor's own
--      answer is the status here: web and the API send 'interested', and
--      mobile/app/sponsor/requests.tsx:81 sends 'accepted' or 'declined'. So a
--      non-admin insert may use exactly those three values; anything else is
--      rejected. Same pattern: ownership AND (is_admin() OR allowed values).
--      (It has no review columns.)
--   3. The owner UPDATE policies were checked. None of the seven tables has one:
--      donations, assistance_requests, campaign_applications, sponsorships and
--      supporting_documents are updated only by "Admins ..." policies, and
--      donation_proofs / sponsorship_request_responses only by their admin ALL
--      policies. So a non-admin owner cannot UPDATE anything on those tables,
--      and nothing was changed there.
--   4. BEFORE INSERT OR UPDATE triggers on the four role-profile tables, same
--      pattern as protect_profile_privileged_fields(): privileged database roles
--      (service_role, postgres, dashboard, SECURITY DEFINER functions) pass
--      through; anon/authenticated cannot set or change the admin-type columns
--      (on insert they must keep the column default; on update they must be
--      unchanged) and cannot create a role profile unless profiles.role
--      matches that table. Administrators (is_admin()) are unrestricted.
--
-- Out of scope (not touched): the profiles INSERT policy / POST /me/profile.
-- No tables, columns, enums or data are dropped. Safe to run more than once.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Non-admin inserts may only use the initial status (responses: the
--    sponsor's own three answers)
-- -----------------------------------------------------------------------------
-- Each policy keeps its current name, command and roles, and its existing
-- ownership expression (as shown by pg_policies, with schema-qualified table
-- names so it does not depend on search_path). Only one AND
-- condition is added to WITH CHECK: is_admin() OR (initial values). ALTER
-- POLICY when the policy exists, CREATE POLICY otherwise, so re-runs converge.
--
-- Initial values are the column defaults from the schema:
--   donations.status                    payment_status       'pending'
--   donations.receipt_number            text                 (no default; admin-issued)
--   donation_proofs.verification_status verification_status  'pending'
--   donation_proofs.reviewed_by         uuid                 (no default)
--   donation_proofs.reviewed_at         timestamptz          (no default)
--   donation_proofs.admin_comment       text                 (no default)
--   assistance_requests.status          request_status       'pending'
--   assistance_requests.reviewed_by     uuid                 (no default)
--   assistance_requests.reviewed_at     timestamptz          (no default)
--   assistance_requests.admin_notes     text                 (no default)
--   supporting_documents.verification_status verification_status 'pending'
--   campaign_applications.status        application_status   'pending'
--   sponsorships.status                 payment_status       'pending'
--   sponsorship_request_responses.status text  default 'interested'; allowed
--                                        'interested', 'accepted', 'declined'
--
-- assistance_requests.priority is NOT restricted: it is free text, default
-- 'normal', and both web (defaults the form to "medium") and mobile send it.
do $$
declare
  pol record;
begin
  for pol in
    select *
    from (values
      ('donations', 'Donors create own donations',
       $e$(EXISTS ( SELECT 1
   FROM public.donor_profiles dp
  WHERE ((dp.id = donations.donor_id) AND (dp.user_id = auth.uid()))))
  AND (public.is_admin() OR (status = 'pending'::public.payment_status
       AND receipt_number IS NULL))$e$),
      ('donation_proofs', 'Donors create own donation proofs',
       $e$(EXISTS ( SELECT 1
   FROM (public.donations d
     JOIN public.donor_profiles dp ON ((dp.id = d.donor_id)))
  WHERE ((d.id = donation_proofs.donation_id) AND (dp.user_id = auth.uid()))))
  AND (public.is_admin() OR (verification_status = 'pending'::public.verification_status
       AND reviewed_by IS NULL
       AND reviewed_at IS NULL
       AND admin_comment IS NULL))$e$),
      ('assistance_requests', 'Beneficiaries create own assistance requests',
       $e$(EXISTS ( SELECT 1
   FROM public.beneficiary_profiles bp
  WHERE ((bp.id = assistance_requests.beneficiary_id) AND (bp.user_id = auth.uid()))))
  AND (public.is_admin() OR (status = 'pending'::public.request_status
       AND reviewed_by IS NULL
       AND reviewed_at IS NULL
       AND admin_notes IS NULL))$e$),
      ('supporting_documents', 'Beneficiaries upload linked documents',
       $e$(EXISTS ( SELECT 1
   FROM (public.assistance_requests ar
     JOIN public.beneficiary_profiles bp ON ((bp.id = ar.beneficiary_id)))
  WHERE ((ar.id = supporting_documents.request_id) AND (bp.user_id = auth.uid()))))
  AND (public.is_admin() OR (verification_status = 'pending'::public.verification_status))$e$),
      ('campaign_applications', 'Volunteers create own applications',
       $e$(EXISTS ( SELECT 1
   FROM public.volunteer_profiles vp
  WHERE ((vp.id = campaign_applications.volunteer_id) AND (vp.user_id = auth.uid()))))
  AND (public.is_admin() OR (status = 'pending'::public.application_status))$e$),
      ('sponsorships', 'Sponsors create own sponsorships',
       $e$(EXISTS ( SELECT 1
   FROM public.sponsor_profiles sp
  WHERE ((sp.id = sponsorships.sponsor_id) AND (sp.user_id = auth.uid()))))
  AND (public.is_admin() OR (status = 'pending'::public.payment_status))$e$),
      ('sponsorship_request_responses', 'Sponsors create own responses',
       $e$(EXISTS ( SELECT 1
   FROM public.sponsor_profiles sp
  WHERE ((sp.id = sponsorship_request_responses.sponsor_id) AND (sp.user_id = auth.uid()))))
  AND (public.is_admin() OR (status = ANY (ARRAY['interested'::text, 'accepted'::text, 'declined'::text])))$e$)
    ) as v(tbl, name, check_expr)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = pol.tbl and policyname = pol.name
    ) then
      execute format('alter policy %I on public.%I with check (%s)', pol.name, pol.tbl, pol.check_expr);
    else
      execute format('create policy %I on public.%I as permissive for insert to public with check (%s)',
                     pol.name, pol.tbl, pol.check_expr);
    end if;
  end loop;
end;
$$;


-- -----------------------------------------------------------------------------
-- 2. Role profiles: admin-type columns and the matching role
-- -----------------------------------------------------------------------------
-- Admin-type columns (the ones the foundation decides, not the account owner):
--   * beneficiary_profiles.eligibility_status  -- no default; whether the
--     foundation will assist this person. The API already refuses it
--     (ROLE_PROFILE_WRITABLE_FIELDS). Nothing in web/ or mobile/ writes it.
--   * volunteer_profiles.status  -- default 'active'; an admin moderation flag,
--     distinct from availability_status which the volunteer sets themselves
--     (web and mobile settings screens send availability_status).
--   * sponsor_profiles.sponsor_level  -- no default; the sponsor tier. The web
--     sponsor page only DISPLAYS it ("Partner" when null) and never sends it;
--     the API refuses it.
--
-- NOT treated as admin-type, because existing owner flows write them:
--   * donor_profiles.member_since and volunteer_profiles.member_since --
--     web/mobile ensureRoleProfile() and api POST /me/profile set them on
--     insert (current date). No default, so forcing the default would store
--     NULL and break those flows.
--   * volunteer_profiles.availability_status -- the volunteer's own setting
--     (default 'available'); web and mobile settings screens update it.
--   * donor_profiles has NO admin-type column. It still gets the role check.
--
-- On insert a protected column must keep its schema default (leave it out:
-- volunteer status becomes 'active', the others NULL). On update it must be
-- unchanged. Sending the same value again is allowed, so an update that
-- repeats the stored value still works. A violation raises 42501, like
-- protect_profile_privileged_fields(); nothing is silently rewritten.
--
-- The role check uses current_user_role() (SECURITY DEFINER, same as is_admin),
-- so it is not blocked by RLS on profiles and there is no policy recursion.
-- It applies to INSERT only: an existing row keeps its link to the user, and a
-- profile's role cannot be changed by its owner anyway.
--
-- SECURITY INVOKER, so current_user is the caller's role. Privileged database
-- roles are unrestricted, exactly like protect_profile_privileged_fields(),
-- which keeps handle_new_user() (SECURITY DEFINER, runs as the owner) working.
create or replace function public.protect_role_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  col text;
  default_expr text;
  default_value jsonb;
begin
  -- Trusted server-side/admin roles (service_role, postgres, dashboard) and
  -- SECURITY DEFINER functions (they run as the owner) are allowed through.
  -- End users reach the database as 'anon' or 'authenticated'.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- Administrators keep their current rights on every role profile.
  if public.is_admin() then
    return new;
  end if;

  -- tg_argv[0] = the role this table belongs to.
  if tg_op = 'INSERT'
     and public.current_user_role() is distinct from tg_argv[0]::public.user_role then
    raise exception 'You can only create the % profile if your role is %', tg_table_name, tg_argv[0]
      using errcode = '42501',
            hint = 'A role profile must match profiles.role.';
  end if;

  -- tg_argv[1..] = admin-type columns of this table.
  foreach col in array coalesce(tg_argv[1:], '{}'::text[]) loop
    if tg_op = 'INSERT' then
      -- In a BEFORE INSERT trigger NEW already holds the column default for an
      -- omitted column, so the value must equal the schema default (NULL when
      -- the column has none). The default is read from the catalog, so it can
      -- never drift from the table definition.
      select pg_get_expr(d.adbin, d.adrelid) into default_expr
        from pg_catalog.pg_attrdef d
        join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
       where d.adrelid = tg_relid and a.attname = col;
      if default_expr is null then
        default_value := 'null'::jsonb;
      else
        execute format('select pg_catalog.to_jsonb(%s)', default_expr) into default_value;
      end if;
      -- A misspelt column name gives SQL NULL here and is rejected (fail closed).
      if (pg_catalog.to_jsonb(new) -> col) is distinct from default_value then
        raise exception 'Not allowed to set % on %', col, tg_table_name
          using errcode = '42501',
                hint = 'This field is set by the foundation; leave it out.';
      end if;
    elsif (pg_catalog.to_jsonb(new) -> col) is distinct from (pg_catalog.to_jsonb(old) -> col) then
      raise exception 'Not allowed to change % on %', col, tg_table_name
        using errcode = '42501',
              hint = 'This field is set by the foundation.';
    end if;
  end loop;

  return new;
end;
$$;

comment on function public.protect_role_profile_fields() is
  'BEFORE INSERT OR UPDATE trigger on the role-profile tables: anon/authenticated cannot set or change the admin-type columns (trigger arguments after the first) and can only insert the role profile matching their own profiles.role (first trigger argument). Privileged database roles are unrestricted.';

-- A trigger function cannot be called through /rpc, and EXECUTE is not checked
-- when a trigger fires, so anon/authenticated do not need it. Set explicitly so
-- the ACL is the same locally and on live (Supabase default privileges would
-- otherwise grant it to anon/authenticated).
revoke all on function public.protect_role_profile_fields() from public, anon, authenticated;
grant execute on function public.protect_role_profile_fields() to service_role;

-- One trigger per table. Arguments: the required profiles.role, then the
-- admin-type columns of that table (none for donor_profiles). CREATE OR
-- REPLACE TRIGGER (Postgres 14+) so a re-run keeps the definition current.
create or replace trigger zz_protect_role_profile_fields
  before insert or update on public.donor_profiles
  for each row execute function public.protect_role_profile_fields('donor');

create or replace trigger zz_protect_role_profile_fields
  before insert or update on public.beneficiary_profiles
  for each row execute function public.protect_role_profile_fields('beneficiary', 'eligibility_status');

create or replace trigger zz_protect_role_profile_fields
  before insert or update on public.volunteer_profiles
  for each row execute function public.protect_role_profile_fields('volunteer', 'status');

create or replace trigger zz_protect_role_profile_fields
  before insert or update on public.sponsor_profiles
  for each row execute function public.protect_role_profile_fields('sponsor', 'sponsor_level');
