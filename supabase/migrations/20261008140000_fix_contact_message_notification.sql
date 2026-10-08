-- =============================================================================
-- Fix the contact-form notification trigger
--
-- Builds on 20261002232000_secure_campaign_amount_function.sql. Based on the
-- live schema as recorded in 20260930000000_remote_schema_baseline.sql.
--
-- Problem on the live project:
--   * public.notify_admins_of_contact_message() (AFTER INSERT trigger
--     contact_messages_notify_admins on public.contact_messages) inserts
--     new.id::text into public.notifications.related_entity_id, which is uuid.
--     There is no assignment cast from text to uuid, so EVERY insert into
--     public.contact_messages fails with
--       column "related_entity_id" is of type uuid but expression is of type text
--     and is rolled back, whether or not any administrator exists. A read-only
--     check on live found 0 rows in public.contact_messages.
--
-- What this migration does:
--   CREATE OR REPLACE with the exact live definition (pg_get_functiondef), with
--   ONE change: new.id::text -> new.id. Nothing else in the function changes:
--   SECURITY DEFINER, search_path, owner, EXECUTE grants (default PUBLIC) and
--   comment (none) are kept, because CREATE OR REPLACE keeps them. The trigger
--   is not touched.
--   A check at the end aborts the migration (rolling it back) if the stored
--   definition still casts new.id to text or lost SECURITY DEFINER/search_path.
--
-- Unchanged behaviour, on purpose: every profile with role 'administrator' is
-- notified, whatever its account_status (pending and suspended included).
-- Suspended administrators cannot read the row anyway: the RESTRICTIVE policy
-- "Suspended accounts have no access" on public.notifications blocks them.
--
-- No tables, columns, policies, grants or data are changed.
-- Safe to run more than once.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_admins_of_contact_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.notifications (
    user_id,
    title,
    message,
    notification_type,
    link_url,
    related_entity_type,
    related_entity_id
  )
  select
    p.id,
    'New contact message',
    left(new.subject || ' — ' || new.first_name || ' ' || new.last_name, 280),
    'contact',
    '/admin/messages',
    'contact_messages',
    new.id
  from public.profiles p
  where p.role = 'administrator';

  return new;
end;
$function$;


-- Safety check: the fixed definition is in place and nothing else changed.
do $$
declare
  def text;
  fn record;
begin
  select p.prosecdef, p.proconfig, pg_get_functiondef(p.oid) as d
    into fn
  from pg_proc p
  where p.oid = 'public.notify_admins_of_contact_message()'::regprocedure;

  def := replace(fn.d, E'\r', '');

  if def like '%new.id::text%' then
    raise exception 'notify_admins_of_contact_message() still inserts new.id::text into related_entity_id';
  end if;

  if def not like E'%''contact_messages'',\n    new.id\n  from public.profiles p%' then
    raise exception 'notify_admins_of_contact_message() does not insert new.id (uuid) as related_entity_id';
  end if;

  if not fn.prosecdef or fn.proconfig is distinct from array['search_path=public'] then
    raise exception 'notify_admins_of_contact_message() lost SECURITY DEFINER or search_path=public (got %, %)',
      fn.prosecdef, fn.proconfig;
  end if;
end;
$$;
