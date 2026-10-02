-- =============================================================================
-- Lock down update_campaign_amount_raised
--
-- Builds on 20261001223000_secure_direct_access_and_notifications.sql. Based on
-- the live schema (read-only audit: functions, grants, triggers).
--
-- Problem on the live project:
--   * public.update_campaign_amount_raised(uuid) is SECURITY DEFINER
--     (search_path=public) and EXECUTE is granted to PUBLIC, so anon and
--     authenticated can call it through /rpc/update_campaign_amount_raised.
--     It does not check who is calling. Running as the owner, it bypasses RLS
--     and UPDATEs public.campaigns (amount_raised, and updated_at through the
--     set_campaigns_updated_at trigger) for any campaign id.
--   * It only recalculates amount_raised from public.donations (money,
--     successful), so a caller cannot set an arbitrary total. But anonymous and
--     suspended callers can still force writes on campaigns that RLS would
--     never allow them, and nothing legitimate needs that.
--   * Its only caller is the trigger function refresh_campaign_amount()
--     (trigger refresh_campaign_amount_after_donation on public.donations),
--     which is SECURITY DEFINER. No web or mobile .rpc() call exists.
--
-- What this migration does (same approach as create_user_notification in the
-- previous migration):
--   EXECUTE on update_campaign_amount_raised(uuid) is revoked from PUBLIC, anon
--   and authenticated and granted to service_role. The function body,
--   SECURITY DEFINER and search_path are unchanged. refresh_campaign_amount()
--   still reaches it: it is SECURITY DEFINER and runs as its owner. A check at
--   the end aborts the migration if that owner could not execute it.
--
-- No tables, columns, policies, triggers or data are changed.
-- Safe to run more than once.
-- =============================================================================

revoke all on function public.update_campaign_amount_raised(uuid)
  from public, anon, authenticated;
grant execute on function public.update_campaign_amount_raised(uuid)
  to service_role;

-- Safety check: the donation trigger path must keep working.
do $$
declare
  caller_owner name;
begin
  select pg_get_userbyid(p.proowner) into caller_owner
  from pg_proc p
  where p.oid = 'public.refresh_campaign_amount()'::regprocedure and p.prosecdef;

  if caller_owner is null then
    raise exception 'refresh_campaign_amount() is missing or not SECURITY DEFINER; not locking down update_campaign_amount_raised';
  end if;

  if not has_function_privilege(caller_owner, 'public.update_campaign_amount_raised(uuid)', 'EXECUTE') then
    raise exception 'owner of refresh_campaign_amount() (%) cannot execute update_campaign_amount_raised(uuid)', caller_owner;
  end if;
end;
$$;
