-- =============================================================================
-- Account self-deletion (Google Play account deletion requirement)
--
-- Builds on 20261008150000_enforce_notification_preferences.sql.
--
-- What this migration does:
--   1. Keeps donation records when a donor deletes their account. donor_id
--      becomes nullable and the foreign key changes from ON DELETE CASCADE to
--      ON DELETE SET NULL, so the donation stays (for campaign totals and
--      financial records) but no longer points at a person.
--   2. public.delete_own_account() lets a signed-in user delete their own
--      account. It deletes the auth user, and the existing ON DELETE CASCADE
--      foreign keys remove the profile, role profiles, settings and
--      notifications.
--   3. Administrators cannot delete themselves here, because campaigns and
--      reports point at administrator_profiles without a cascade. Another
--      administrator has to hand over their records first.
--
-- RLS is not changed. The function only ever acts on auth.uid().
-- =============================================================================

-- 1. Keep donations, but detach them from the deleted donor
alter table public.donations alter column donor_id drop not null;

alter table public.donations drop constraint if exists donations_donor_id_fkey;
alter table public.donations
  add constraint donations_donor_id_fkey foreign key (donor_id)
  references public.donor_profiles(id) on delete set null;

-- 2. Self-service account deletion
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
begin
  if v_user_id is null then
    raise exception 'You need to be signed in to delete your account.';
  end if;

  select p.role::text into v_role
  from public.profiles p
  where p.id = v_user_id;

  -- 3. Administrators own campaigns and reports, so they are blocked here
  if v_role = 'administrator' then
    raise exception 'Administrator accounts must be removed by another administrator.';
  end if;

  -- Cascades to profiles and everything that belongs to the profile
  delete from auth.users u where u.id = v_user_id;
end;
$$;

comment on function public.delete_own_account() is
  'Deletes the calling user''s account and personal data. Donation records are kept without the donor link.';

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
