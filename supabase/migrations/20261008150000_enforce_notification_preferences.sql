-- =============================================================================
-- Enforce user_settings notification preferences at insert time
--
-- Builds on 20261008141000_create_user_settings.sql.
--
-- In-app notifications are rows in public.notifications. They are created by
-- public.create_user_notification() (status-change triggers) and by
-- notify_admins_of_contact_message() (contact form). Until now those paths
-- ignored user_settings.notify_* columns.
--
-- What this migration does:
--   1. public.user_notification_delivery_enabled(user_id, notification_type)
--      maps each notification_type to one of the three user-facing toggles.
--   2. public.create_user_notification() returns without inserting when the
--      recipient has disabled that category. Missing settings rows default to
--      enabled (same as the table defaults).
--   3. notify_admins_of_contact_message() calls create_user_notification per
--      administrator so contact alerts respect notify_request_updates too.
--
-- Mapping (matches the mobile Settings screen copy):
--   donation     -> notify_donation_updates
--   application  -> notify_request_updates
--   assistance   -> notify_request_updates
--   campaign     -> notify_campaign_updates
--   contact      -> notify_request_updates
--   anything else -> deliver (no matching toggle exists)
--
-- Delivery is in-app only; there is no email or push channel in this schema.
-- =============================================================================

create or replace function public.user_notification_delivery_enabled(
  p_user_id uuid,
  p_notification_type text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_campaign boolean;
  v_request boolean;
  v_donation boolean;
  v_type text := lower(coalesce(p_notification_type, ''));
begin
  select
    us.notify_campaign_updates,
    us.notify_request_updates,
    us.notify_donation_updates
  into v_campaign, v_request, v_donation
  from public.user_settings us
  where us.user_id = p_user_id;

  if not found then
    -- Same as the column defaults when the provisioning trigger has not run yet.
    return true;
  end if;

  case v_type
    when 'donation' then return v_donation;
    when 'application' then return v_request;
    when 'assistance' then return v_request;
    when 'campaign' then return v_campaign;
    when 'contact' then return v_request;
    else return true;
  end case;
end;
$$;

comment on function public.user_notification_delivery_enabled(uuid, text) is
  'Returns false when the user has opted out of in-app notifications for the given notification_type. Used by create_user_notification().';

revoke all on function public.user_notification_delivery_enabled(uuid, text) from public, anon, authenticated;
grant execute on function public.user_notification_delivery_enabled(uuid, text) to service_role;

create or replace function public.create_user_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text,
  target_link_url text default null::text,
  target_entity_type text default null::text,
  target_entity_id uuid default null::uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.user_notification_delivery_enabled(target_user_id, notification_type) then
    return;
  end if;

  insert into public.notifications (
    user_id,
    title,
    message,
    notification_type,
    link_url,
    related_entity_type,
    related_entity_id
  )
  values (
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    target_link_url,
    target_entity_type,
    target_entity_id
  );
end;
$function$
;

create or replace function public.notify_admins_of_contact_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  admin_id uuid;
  alert_message text;
begin
  alert_message := left(new.subject || ' — ' || new.first_name || ' ' || new.last_name, 280);

  for admin_id in
    select p.id
    from public.profiles p
    where p.role = 'administrator'
  loop
    perform public.create_user_notification(
      admin_id,
      'New contact message',
      alert_message,
      'contact',
      '/admin/messages',
      'contact_messages',
      new.id
    );
  end loop;

  return new;
end;
$function$
;

-- Safety check: preference helper and guarded insert are in place.
do $$
declare
  def text;
begin
  select pg_get_functiondef('public.create_user_notification(uuid,text,text,text,text,text,uuid)'::regprocedure)
    into def;
  def := replace(def, E'\r', '');

  if def not ilike '%user_notification_delivery_enabled%' then
    raise exception 'create_user_notification() does not call user_notification_delivery_enabled';
  end if;

  select pg_get_functiondef('public.notify_admins_of_contact_message()'::regprocedure) into def;
  def := replace(def, E'\r', '');

  if def ilike '%insert into public.notifications%' and def not ilike '%create_user_notification%' then
    raise exception 'notify_admins_of_contact_message() still inserts notifications directly';
  end if;
end;
$$;
