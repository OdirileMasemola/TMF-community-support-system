/** Event types. Field names are the public.events column names. */

/** Values allowed by events_status_check. */
export const EVENT_STATUSES = ['draft', 'scheduled', 'completed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_COLUMNS =
  'id, admin_id, campaign_id, title, description, location, event_date, status, created_at, updated_at';

export interface Event {
  id: string;
  admin_id: string;
  campaign_id: string | null;
  title: string;
  description: string | null;
  location: string;
  event_date: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateEventBody {
  title: string;
  location: string;
  event_date: string;
  description?: string | null;
  campaign_id?: string | null;
  status?: EventStatus;
}

export type UpdateEventBody = Partial<CreateEventBody>;

export interface ListEventsQuery {
  status?: EventStatus;
  page?: number;
  pageSize?: number;
}

export interface EventIdParams {
  id: string;
}
