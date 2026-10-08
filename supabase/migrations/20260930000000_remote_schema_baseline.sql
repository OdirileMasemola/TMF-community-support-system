-- =============================================================================
-- Remote schema baseline: TMF Community Support System (Supabase project
-- sdxtkixijpcmttmutuao)
--
-- Exported READ-ONLY from the live production database on 2026-10-08 (catalog
-- query, Supabase SQL editor), then assembled into one ordered script. Nothing
-- here was written by hand: every object comes from that export. Only the
-- statement order, IF NOT EXISTS (where Postgres supports it), LF line endings,
-- the REVOKE/GRANT EXECUTE form of the exported function ACLs and a privilege
-- guard around the event trigger were added.
--
-- It records the CURRENT live state of:
--   * the public schema: extensions, enums, tables, constraints, foreign keys,
--     indexes, functions, triggers, RLS, policies, table grants and function
--     EXECUTE grants for anon / authenticated / service_role, comments, the
--     ensure_rls event trigger and the default privileges of role postgres;
--   * the auth.users trigger (on_auth_user_created);
--   * the storage buckets and storage.objects policies.
--
-- Because it is a snapshot of live, it ALREADY CONTAINS the effects of the three
-- later migrations:
--   20261001221500_secure_profile_role_and_account_status.sql
--   20261001223000_secure_direct_access_and_notifications.sql
--   20261002232000_secure_campaign_amount_function.sql
-- Those migrations are idempotent (CREATE OR REPLACE, create-if-missing / ALTER
-- POLICY, REVOKE/GRANT) and re-apply safely on top of this baseline.
--
-- This file is for building a NEW database (local dev, CI, a fresh project).
-- It must NOT be run against the live project, which already has all of this:
-- mark it as applied there instead (supabase migration repair --status applied
-- 20260930000000). Run against live by mistake it fails at the first CREATE TYPE
-- ("already exists"); every statement before that is an IF NOT EXISTS no-op, so
-- nothing is changed.
--
-- A second read-only catalog check on live (same day) added the 9 COMMENT ON
-- statements, the ensure_rls event trigger and the default privileges of role
-- postgres in schema public. That check also found no views, sequences or other
-- relations in public, no column-level grants, no publications on public
-- tables, and no comments on types, policies, triggers or constraints.
-- Supabase platform objects (the other event triggers, default privileges of
-- supabase_admin / supabase_auth_admin, auth/storage internals) are not included.
-- No secrets or data rows (other than the four storage bucket definitions) are
-- included.
--
-- Migration history: live has NO supabase_migrations.schema_migrations table.
-- The Supabase CLI migration history has never been used on this project; the
-- migrations so far were applied by hand in the SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Extensions (live: pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp)
-- =============================================================================
-- live: EXTENSION pg_stat_statements 1.11 schema=extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
-- live: EXTENSION pgcrypto 1.3 schema=extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- live: EXTENSION plpgsql 1.0 schema=pg_catalog
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
-- live: EXTENSION supabase_vault 0.3.1 schema=vault
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'supabase_vault') THEN
    CREATE SCHEMA IF NOT EXISTS vault;
    CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
  ELSE
    RAISE NOTICE 'supabase_vault is not available on this server (Supabase-only); skipped';
  END IF;
END
$$;
-- live: EXTENSION uuid-ossp 1.1 schema=extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================================================
-- 2. Enum types (9)
-- =============================================================================
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'closed', 'cancelled');
CREATE TYPE public.donation_kind AS ENUM ('money', 'in_kind');
CREATE TYPE public.notification_status AS ENUM ('unread', 'read');
CREATE TYPE public.payment_status AS ENUM ('pending', 'successful', 'failed', 'cancelled');
CREATE TYPE public.report_status AS ENUM ('generated', 'archived');
CREATE TYPE public.request_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed');
CREATE TYPE public.user_role AS ENUM ('administrator', 'volunteer', 'beneficiary', 'donor', 'sponsor');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================================================
-- 3. Tables (22)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.administrator_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  beneficiary_id uuid NOT NULL,
  request_date timestamp with time zone DEFAULT now() NOT NULL,
  request_type text NOT NULL,
  description text NOT NULL,
  status request_status DEFAULT 'pending'::request_status NOT NULL,
  priority text DEFAULT 'normal'::text,
  preferred_collection_area text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.beneficiary_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  residential_address text,
  assistance_type text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  avatar_url text,
  eligibility_status text
);

CREATE TABLE IF NOT EXISTS public.campaign_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  volunteer_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  application_date timestamp with time zone DEFAULT now() NOT NULL,
  status application_status DEFAULT 'pending'::application_status NOT NULL,
  participation_role text
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status campaign_status DEFAULT 'draft'::campaign_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  category text,
  image_url text,
  funding_goal numeric(12,2),
  amount_raised numeric(12,2) DEFAULT 0 NOT NULL,
  is_public boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collection_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid,
  programme_name text,
  location text NOT NULL,
  collection_date date NOT NULL,
  collection_time text,
  status text DEFAULT 'upcoming'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_proofs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  donation_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text,
  payment_reference text,
  payment_date date,
  admin_comment text,
  verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  donor_id uuid NOT NULL,
  campaign_id uuid,
  amount numeric(12,2),
  donation_date timestamp with time zone DEFAULT now() NOT NULL,
  payment_method text NOT NULL,
  status payment_status DEFAULT 'pending'::payment_status NOT NULL,
  receipt_number text,
  donation_kind donation_kind DEFAULT 'money'::donation_kind NOT NULL,
  item_description text,
  item_quantity integer,
  payment_reference text,
  notes text
);

CREATE TABLE IF NOT EXISTS public.donor_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  donation_preference text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  avatar_url text,
  member_since date
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid NOT NULL,
  campaign_id uuid,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  notification_date timestamp with time zone DEFAULT now() NOT NULL,
  notification_type text NOT NULL,
  status notification_status DEFAULT 'unread'::notification_status NOT NULL,
  title text,
  link_url text,
  related_entity_type text,
  related_entity_id uuid
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  role user_role DEFAULT 'beneficiary'::user_role NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  account_status text DEFAULT 'pending'::text NOT NULL,
  invited_by uuid,
  invited_at timestamp with time zone,
  avatar_url text,
  avatar_change_count integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid NOT NULL,
  report_name text NOT NULL,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  report_type text NOT NULL,
  status report_status DEFAULT 'generated'::report_status NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  file_path text
);

CREATE TABLE IF NOT EXISTS public.sponsor_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  organisation_name text NOT NULL,
  sponsorship_type text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  representative_name text,
  business_address text,
  sponsor_level text,
  logo_url text
);

CREATE TABLE IF NOT EXISTS public.sponsorship_request_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  sponsor_id uuid NOT NULL,
  sponsorship_id uuid,
  status text DEFAULT 'interested'::text NOT NULL,
  notes text,
  responded_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sponsorship_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid,
  title text NOT NULL,
  requested_support text NOT NULL,
  category text,
  priority text DEFAULT 'normal'::text,
  deadline date,
  estimated_impact text,
  status text DEFAULT 'open'::text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sponsorships (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sponsor_id uuid NOT NULL,
  campaign_id uuid,
  amount numeric(12,2) NOT NULL,
  sponsorship_date timestamp with time zone DEFAULT now() NOT NULL,
  sponsorship_type text,
  status payment_status DEFAULT 'pending'::payment_status NOT NULL
);

CREATE TABLE IF NOT EXISTS public.supporting_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  document_name text NOT NULL,
  document_type text,
  file_path text NOT NULL,
  upload_date timestamp with time zone DEFAULT now() NOT NULL,
  verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_id uuid,
  volunteer_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  role text NOT NULL,
  location text,
  schedule text,
  start_date date,
  end_date date,
  status text DEFAULT 'upcoming'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_hours (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  assignment_id uuid,
  volunteer_id uuid NOT NULL,
  hours numeric(6,2) NOT NULL,
  work_date date NOT NULL,
  notes text,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  residential_address text,
  availability_status text DEFAULT 'available'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  preferred_area text,
  member_since date,
  status text DEFAULT 'active'::text,
  avatar_url text
);


-- =============================================================================
-- 4. Primary key, unique and check constraints (47)
-- =============================================================================
ALTER TABLE ONLY public.administrator_profiles ADD CONSTRAINT administrator_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.administrator_profiles ADD CONSTRAINT administrator_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.assistance_requests ADD CONSTRAINT assistance_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.beneficiary_profiles ADD CONSTRAINT beneficiary_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.beneficiary_profiles ADD CONSTRAINT beneficiary_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.campaign_applications ADD CONSTRAINT campaign_applications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_applications ADD CONSTRAINT campaign_applications_volunteer_id_campaign_id_key UNIQUE (volunteer_id, campaign_id);
ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_amount_raised_non_negative CHECK ((amount_raised >= (0)::numeric));
ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_funding_goal_non_negative CHECK (((funding_goal IS NULL) OR (funding_goal >= (0)::numeric)));
ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.collection_schedules ADD CONSTRAINT collection_schedule_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'confirmed'::text, 'completed'::text, 'missed'::text])));
ALTER TABLE ONLY public.collection_schedules ADD CONSTRAINT collection_schedules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_email_len CHECK (((char_length(email) >= 5) AND (char_length(email) <= 160)));
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_first_name_len CHECK (((char_length(first_name) >= 1) AND (char_length(first_name) <= 80)));
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_last_name_len CHECK (((char_length(last_name) >= 1) AND (char_length(last_name) <= 80)));
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_message_len CHECK (((char_length(message) >= 1) AND (char_length(message) <= 4000)));
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'archived'::text])));
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_subject_len CHECK (((char_length(subject) >= 1) AND (char_length(subject) <= 160)));
ALTER TABLE ONLY public.donation_proofs ADD CONSTRAINT donation_proofs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_item_quantity_check CHECK (((item_quantity IS NULL) OR (item_quantity > 0)));
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_kind_amount_check CHECK ((((donation_kind = 'money'::donation_kind) AND (amount IS NOT NULL) AND (amount > (0)::numeric)) OR ((donation_kind = 'in_kind'::donation_kind) AND (amount IS NULL))));
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_receipt_number_key UNIQUE (receipt_number);
ALTER TABLE ONLY public.donor_profiles ADD CONSTRAINT donor_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.donor_profiles ADD CONSTRAINT donor_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text])));
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_account_status_check CHECK ((account_status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text])));
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reports ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sponsor_profiles ADD CONSTRAINT sponsor_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sponsor_profiles ADD CONSTRAINT sponsor_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.sponsorship_request_responses ADD CONSTRAINT sponsorship_request_responses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sponsorship_requests ADD CONSTRAINT sponsorship_request_status_check CHECK ((status = ANY (ARRAY['open'::text, 'accepted'::text, 'declined'::text, 'closed'::text])));
ALTER TABLE ONLY public.sponsorship_requests ADD CONSTRAINT sponsorship_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sponsorships ADD CONSTRAINT sponsorships_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE ONLY public.sponsorships ADD CONSTRAINT sponsorships_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.supporting_documents ADD CONSTRAINT supporting_documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.volunteer_assignments ADD CONSTRAINT volunteer_assignment_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text])));
ALTER TABLE ONLY public.volunteer_assignments ADD CONSTRAINT volunteer_assignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.volunteer_hours ADD CONSTRAINT volunteer_hours_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.volunteer_hours ADD CONSTRAINT volunteer_hours_positive_check CHECK ((hours > (0)::numeric));
ALTER TABLE ONLY public.volunteer_profiles ADD CONSTRAINT volunteer_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.volunteer_profiles ADD CONSTRAINT volunteer_profiles_user_id_key UNIQUE (user_id);

-- =============================================================================
-- 5. Foreign keys (34)
-- =============================================================================
ALTER TABLE ONLY public.administrator_profiles ADD CONSTRAINT administrator_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assistance_requests ADD CONSTRAINT assistance_requests_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES beneficiary_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assistance_requests ADD CONSTRAINT assistance_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES administrator_profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.beneficiary_profiles ADD CONSTRAINT beneficiary_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_applications ADD CONSTRAINT campaign_applications_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_applications ADD CONSTRAINT campaign_applications_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteer_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES administrator_profiles(id);
ALTER TABLE ONLY public.collection_schedules ADD CONSTRAINT collection_schedules_request_id_fkey FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.donation_proofs ADD CONSTRAINT donation_proofs_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.donation_proofs ADD CONSTRAINT donation_proofs_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES administrator_profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.donations ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES donor_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.donor_profiles ADD CONSTRAINT donor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events ADD CONSTRAINT events_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES administrator_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events ADD CONSTRAINT events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.reports ADD CONSTRAINT reports_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES administrator_profiles(id);
ALTER TABLE ONLY public.sponsor_profiles ADD CONSTRAINT sponsor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sponsorship_request_responses ADD CONSTRAINT sponsorship_request_responses_request_id_fkey FOREIGN KEY (request_id) REFERENCES sponsorship_requests(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sponsorship_request_responses ADD CONSTRAINT sponsorship_request_responses_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES sponsor_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sponsorship_request_responses ADD CONSTRAINT sponsorship_request_responses_sponsorship_id_fkey FOREIGN KEY (sponsorship_id) REFERENCES sponsorships(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sponsorship_requests ADD CONSTRAINT sponsorship_requests_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sponsorship_requests ADD CONSTRAINT sponsorship_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES administrator_profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sponsorships ADD CONSTRAINT sponsorships_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sponsorships ADD CONSTRAINT sponsorships_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES sponsor_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.supporting_documents ADD CONSTRAINT supporting_documents_request_id_fkey FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.volunteer_assignments ADD CONSTRAINT volunteer_assignments_application_id_fkey FOREIGN KEY (application_id) REFERENCES campaign_applications(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.volunteer_assignments ADD CONSTRAINT volunteer_assignments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.volunteer_assignments ADD CONSTRAINT volunteer_assignments_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteer_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.volunteer_hours ADD CONSTRAINT volunteer_hours_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES volunteer_assignments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.volunteer_hours ADD CONSTRAINT volunteer_hours_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteer_profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.volunteer_profiles ADD CONSTRAINT volunteer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- 6. Indexes not backing a constraint (37)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_assistance_requests_beneficiary ON public.assistance_requests USING btree (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_priority ON public.assistance_requests USING btree (priority);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON public.assistance_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns USING btree (category);
CREATE INDEX IF NOT EXISTS idx_campaigns_public ON public.campaigns USING btree (is_public);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns USING btree (status);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_date ON public.collection_schedules USING btree (collection_date);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_request ON public.collection_schedules USING btree (request_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_status ON public.collection_schedules USING btree (status);
CREATE INDEX IF NOT EXISTS idx_donation_proofs_donation_id ON public.donation_proofs USING btree (donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_proofs_reviewed_by ON public.donation_proofs USING btree (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_donation_proofs_status ON public.donation_proofs USING btree (verification_status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON public.donations USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations USING btree (donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_events_admin ON public.events USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON public.events USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events USING btree (event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events USING btree (status);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON public.notifications USING btree (notification_date);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles USING btree (account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_campaign ON public.sponsorship_requests USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_status ON public.sponsorship_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_responses_request ON public.sponsorship_request_responses USING btree (request_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_responses_sponsor ON public.sponsorship_request_responses USING btree (sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_campaign ON public.sponsorships USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON public.sponsorships USING btree (sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON public.sponsorships USING btree (status);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_campaign ON public.volunteer_assignments USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_status ON public.volunteer_assignments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_volunteer ON public.volunteer_assignments USING btree (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_assignment ON public.volunteer_hours USING btree (assignment_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_volunteer ON public.volunteer_hours USING btree (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_work_date ON public.volunteer_hours USING btree (work_date);

-- =============================================================================
-- 7. Functions (15), verbatim pg_get_functiondef (CRLF -> LF)
-- =============================================================================
-- Alphabetical order (as exported) is dependency-safe: current_account_allowed()
-- is created before is_admin(), which calls it.

-- create_user_notification(uuid,text,text,text,text,text,uuid)
CREATE OR REPLACE FUNCTION public.create_user_notification(target_user_id uuid, notification_title text, notification_message text, notification_type text, target_link_url text DEFAULT NULL::text, target_entity_type text DEFAULT NULL::text, target_entity_id uuid DEFAULT NULL::uuid)
 RETURNS void
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

-- current_account_allowed()
CREATE OR REPLACE FUNCTION public.current_account_allowed()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(
    (
      select p.account_status in ('active', 'pending')
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$function$
;

-- current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = auth.uid();
$function$
;

-- enforce_avatar_change_limit()
CREATE OR REPLACE FUNCTION public.enforce_avatar_change_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'UPDATE' and new.avatar_url is not distinct from old.avatar_url then
    new.avatar_change_count := old.avatar_change_count;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.avatar_url is distinct from old.avatar_url then
    if coalesce(old.avatar_change_count, 0) >= 3 then
      raise exception 'You have already changed your profile picture 3 times.';
    end if;
    new.avatar_change_count := coalesce(old.avatar_change_count, 0) + 1;
  end if;

  return new;
end;
$function$
;

-- handle_new_user()
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
$function$
;

-- is_admin()
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
$function$
;

-- notify_admins_of_contact_message()
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
    new.id::text
  from public.profiles p
  where p.role = 'administrator';

  return new;
end;
$function$
;

-- notify_application_status_change()
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    target_user_id uuid;
    notification_title text;
    notification_message text;
begin

    if old.status is distinct from new.status then

        select vp.user_id
        into target_user_id
        from public.volunteer_profiles vp
        where vp.id = new.volunteer_id;


        if new.status = 'approved' then

            notification_title := 'Campaign Application Approved';

            notification_message :=
                'Your campaign application has been approved.';

        elsif new.status = 'rejected' then

            notification_title := 'Campaign Application Rejected';

            notification_message :=
                'Your campaign application has been rejected.';

        else

            notification_title := 'Application Status Updated';

            notification_message :=
                'The status of your campaign application has been updated.';

        end if;


        if target_user_id is not null then

            perform public.create_user_notification(
                target_user_id,
                notification_title,
                notification_message,
                'application',
                '/volunteer/dashboard',
                'campaign_application',
                new.id
            );

        end if;

    end if;

    return new;
end;
$function$
;

-- notify_assistance_status_change()
CREATE OR REPLACE FUNCTION public.notify_assistance_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    target_user_id uuid;
    notification_title text;
    notification_message text;
begin

    if old.status is distinct from new.status then

        select bp.user_id
        into target_user_id
        from public.beneficiary_profiles bp
        where bp.id = new.beneficiary_id;


        if new.status = 'approved' then

            notification_title := 'Assistance Request Approved';

            notification_message :=
                'Your assistance request has been approved.';

        elsif new.status = 'rejected' then

            notification_title := 'Assistance Request Rejected';

            notification_message :=
                'Your assistance request has been rejected.';

        elsif new.status = 'under_review' then

            notification_title := 'Assistance Request Under Review';

            notification_message :=
                'Your assistance request is currently being reviewed.';

        elsif new.status = 'completed' then

            notification_title := 'Assistance Completed';

            notification_message :=
                'Your assistance request has been marked as completed.';

        else

            notification_title := 'Assistance Request Updated';

            notification_message :=
                'The status of your assistance request has been updated.';

        end if;


        if target_user_id is not null then

            perform public.create_user_notification(
                target_user_id,
                notification_title,
                notification_message,
                'assistance',
                '/dashboard/beneficiary',
                'assistance_request',
                new.id
            );

        end if;

    end if;

    return new;
end;
$function$
;

-- notify_donation_status_change()
CREATE OR REPLACE FUNCTION public.notify_donation_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    target_user_id uuid;
    notification_title text;
    notification_message text;
begin

    if old.status is distinct from new.status then

        select dp.user_id
        into target_user_id
        from public.donor_profiles dp
        where dp.id = new.donor_id;


        if new.status = 'successful' then

            notification_title := 'Donation Verified';

            notification_message :=
                'Your donation has been successfully verified.';

        elsif new.status = 'failed' then

            notification_title := 'Donation Requires Attention';

            notification_message :=
                'Your donation could not be verified. Please review your donation information.';

        elsif new.status = 'cancelled' then

            notification_title := 'Donation Cancelled';

            notification_message :=
                'Your donation has been marked as cancelled.';

        else

            notification_title := 'Donation Status Updated';

            notification_message :=
                'The status of your donation has been updated.';

        end if;


        if target_user_id is not null then

            perform public.create_user_notification(
                target_user_id,
                notification_title,
                notification_message,
                'donation',
                '/donor/dashboard/donation-history',
                'donation',
                new.id
            );

        end if;

    end if;

    return new;
end;
$function$
;

-- protect_profile_privileged_fields()
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- refresh_campaign_amount()
CREATE OR REPLACE FUNCTION public.refresh_campaign_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin

    if old.campaign_id is not null then

        perform public.update_campaign_amount_raised(
            old.campaign_id
        );

    end if;


    if new.campaign_id is not null then

        perform public.update_campaign_amount_raised(
            new.campaign_id
        );

    end if;


    return new;
end;
$function$
;

-- rls_auto_enable()
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

-- set_updated_at()
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

-- update_campaign_amount_raised(uuid)
CREATE OR REPLACE FUNCTION public.update_campaign_amount_raised(target_campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin

    update public.campaigns
    set amount_raised = coalesce(
        (
            select sum(d.amount)
            from public.donations d
            where d.campaign_id = target_campaign_id
            and d.donation_kind = 'money'
            and d.status = 'successful'
        ),
        0
    )
    where id = target_campaign_id;

end;
$function$
;

-- =============================================================================
-- 8. Function EXECUTE privileges (15 exported ACLs)
-- =============================================================================
-- Exported as FUNCTION_ACL lines. "default(PUBLIC)" means proacl is NULL on
-- live (owner + PUBLIC EXECUTE, the Postgres default), so nothing is emitted for
-- those. For explicit ACLs, EXECUTE is revoked from PUBLIC and the API roles that
-- are not in the live ACL (this also neutralises Supabase default privileges)
-- and granted to the roles that are. The owner (postgres) keeps EXECUTE.
-- live ACL: postgres=X/postgres service_role=X/postgres
REVOKE EXECUTE ON FUNCTION public.create_user_notification(uuid,text,text,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_notification(uuid,text,text,text,text,text,uuid) TO service_role;
-- live ACL: postgres=X/postgres authenticated=X/postgres service_role=X/postgres
REVOKE EXECUTE ON FUNCTION public.current_account_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_account_allowed() TO authenticated, service_role;
-- live ACL: =X/postgres postgres=X/postgres authenticated=X/postgres
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
-- public.enforce_avatar_change_limit(): default(PUBLIC) on live, no statement needed
-- public.handle_new_user(): default(PUBLIC) on live, no statement needed
-- public.is_admin(): default(PUBLIC) on live, no statement needed
-- public.notify_admins_of_contact_message(): default(PUBLIC) on live, no statement needed
-- public.notify_application_status_change(): default(PUBLIC) on live, no statement needed
-- public.notify_assistance_status_change(): default(PUBLIC) on live, no statement needed
-- public.notify_donation_status_change(): default(PUBLIC) on live, no statement needed
-- public.protect_profile_privileged_fields(): default(PUBLIC) on live, no statement needed
-- public.refresh_campaign_amount(): default(PUBLIC) on live, no statement needed
-- public.rls_auto_enable(): default(PUBLIC) on live, no statement needed
-- public.set_updated_at(): default(PUBLIC) on live, no statement needed
-- live ACL: postgres=X/postgres service_role=X/postgres
REVOKE EXECUTE ON FUNCTION public.update_campaign_amount_raised(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_campaign_amount_raised(uuid) TO service_role;

-- =============================================================================
-- 9. Triggers on public tables (10)
-- =============================================================================
CREATE TRIGGER assistance_status_notification AFTER UPDATE OF status ON public.assistance_requests FOR EACH ROW EXECUTE FUNCTION notify_assistance_status_change();
CREATE TRIGGER application_status_notification AFTER UPDATE OF status ON public.campaign_applications FOR EACH ROW EXECUTE FUNCTION notify_application_status_change();
CREATE TRIGGER set_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER contact_messages_notify_admins AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION notify_admins_of_contact_message();
CREATE TRIGGER donation_status_notification AFTER UPDATE OF status ON public.donations FOR EACH ROW EXECUTE FUNCTION notify_donation_status_change();
CREATE TRIGGER refresh_campaign_amount_after_donation AFTER INSERT OR UPDATE OF amount, campaign_id, status, donation_kind ON public.donations FOR EACH ROW EXECUTE FUNCTION refresh_campaign_amount();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_avatar_change_limit BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION enforce_avatar_change_limit();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER zz_protect_profile_privileged_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_fields();

-- =============================================================================
-- 10. Trigger on auth.users (1)
-- =============================================================================
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 10b. Event trigger ensure_rls (live: event=ddl_command_end fn=rls_auto_enable enabled=O tags=CREATE TABLE,CREATE TABLE AS,SELECT INTO)
-- =============================================================================
-- Live auto-enables RLS on every new public table through this event trigger.
-- CREATE EVENT TRIGGER needs superuser rights in plain Postgres. Migrations run as
-- the non-superuser postgres role, so if the server refuses it
-- (insufficient_privilege) this only raises a NOTICE instead of failing the
-- whole baseline; then create it as a superuser or in the Supabase dashboard.
-- Only ensure_rls is project-specific; the other live event triggers
-- (issue_pg_*, issue_graphql_placeholder, pgrst_*) belong to the Supabase
-- platform and are not part of this baseline.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'ensure_rls') THEN
    BEGIN
      CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
        WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
        EXECUTE FUNCTION public.rls_auto_enable();
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'ensure_rls event trigger not created: % (needs superuser; create it manually)', SQLERRM;
    END;
  END IF;
END
$$;

-- =============================================================================
-- 10c. Comments (9)
-- =============================================================================
COMMENT ON FUNCTION public.current_account_allowed() IS 'True when the calling user (auth.uid()) has a profile with account_status active or pending. Used by RLS to block suspended accounts.';
COMMENT ON FUNCTION public.protect_profile_privileged_fields() IS 'BEFORE UPDATE trigger on public.profiles: users cannot change their own role/account_status; administrators may change only role/account_status of other users; privileged database roles are unrestricted.';
COMMENT ON TABLE public.collection_schedules IS 'Beneficiary assistance collection and appointment schedules.';
COMMENT ON TABLE public.donation_proofs IS 'Stores donor proof-of-payment files and manual administrator verification.';
COMMENT ON TABLE public.events IS 'Foundation events managed by administrators.';
COMMENT ON TABLE public.sponsorship_request_responses IS 'Sponsor responses to foundation sponsorship requests.';
COMMENT ON TABLE public.sponsorship_requests IS 'Outbound sponsorship requests created by the foundation for sponsors.';
COMMENT ON TABLE public.volunteer_assignments IS 'Stores approved volunteer campaign assignments.';
COMMENT ON TABLE public.volunteer_hours IS 'Stores volunteer hours recorded against assignments.';

-- =============================================================================
-- 11. Row level security (22 tables, none FORCE)
-- =============================================================================
ALTER TABLE public.administrator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporting_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. Policies on public tables (73)
-- =============================================================================
CREATE POLICY "Admins manage admin profiles" ON public.administrator_profiles AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Suspended accounts have no access" ON public.administrator_profiles AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins update assistance requests" ON public.assistance_requests AS PERMISSIVE FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Beneficiaries and admins view assistance requests" ON public.assistance_requests AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM beneficiary_profiles bp
  WHERE ((bp.id = assistance_requests.beneficiary_id) AND (bp.user_id = auth.uid()))))));
CREATE POLICY "Beneficiaries create own assistance requests" ON public.assistance_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM beneficiary_profiles bp
  WHERE ((bp.id = assistance_requests.beneficiary_id) AND (bp.user_id = auth.uid())))));
CREATE POLICY "Suspended accounts have no access" ON public.assistance_requests AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Suspended accounts have no access" ON public.beneficiary_profiles AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users manage own beneficiary profile" ON public.beneficiary_profiles AS PERMISSIVE FOR ALL TO public USING (((user_id = auth.uid()) OR is_admin())) WITH CHECK (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Admins update applications" ON public.campaign_applications AS PERMISSIVE FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Suspended accounts have no access" ON public.campaign_applications AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Volunteers and admins can view applications" ON public.campaign_applications AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM volunteer_profiles vp
  WHERE ((vp.id = campaign_applications.volunteer_id) AND (vp.user_id = auth.uid()))))));
CREATE POLICY "Volunteers create own applications" ON public.campaign_applications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM volunteer_profiles vp
  WHERE ((vp.id = campaign_applications.volunteer_id) AND (vp.user_id = auth.uid())))));
CREATE POLICY "Admins manage campaigns" ON public.campaigns AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view public active campaigns" ON public.campaigns AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::campaign_status) AND (is_public = true)));
CREATE POLICY "Authenticated users can view active campaigns" ON public.campaigns AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::campaign_status) OR is_admin()));
CREATE POLICY "Suspended accounts only see public campaigns" ON public.campaigns AS RESTRICTIVE FOR ALL TO authenticated USING ((( SELECT current_account_allowed() AS current_account_allowed) OR ((status = 'active'::campaign_status) AND (is_public = true)))) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins manage collection schedules" ON public.collection_schedules AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Beneficiaries view own collection schedules" ON public.collection_schedules AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM (assistance_requests ar
     JOIN beneficiary_profiles bp ON ((bp.id = ar.beneficiary_id)))
  WHERE ((ar.id = collection_schedules.request_id) AND (bp.user_id = auth.uid()))))));
CREATE POLICY "Suspended accounts have no access" ON public.collection_schedules AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Administrators can read contact messages" ON public.contact_messages AS PERMISSIVE FOR SELECT TO authenticated USING (((current_user_role())::text = 'administrator'::text));
CREATE POLICY "Administrators can update contact messages" ON public.contact_messages AS PERMISSIVE FOR UPDATE TO authenticated USING (((current_user_role())::text = 'administrator'::text)) WITH CHECK (((current_user_role())::text = 'administrator'::text));
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Suspended accounts cannot read contact messages" ON public.contact_messages AS RESTRICTIVE FOR SELECT TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Suspended accounts cannot update contact messages" ON public.contact_messages AS RESTRICTIVE FOR UPDATE TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins manage donation proofs" ON public.donation_proofs AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Donors create own donation proofs" ON public.donation_proofs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM (donations d
     JOIN donor_profiles dp ON ((dp.id = d.donor_id)))
  WHERE ((d.id = donation_proofs.donation_id) AND (dp.user_id = auth.uid())))));
CREATE POLICY "Donors view own donation proofs" ON public.donation_proofs AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM (donations d
     JOIN donor_profiles dp ON ((dp.id = d.donor_id)))
  WHERE ((d.id = donation_proofs.donation_id) AND (dp.user_id = auth.uid()))))));
CREATE POLICY "Suspended accounts have no access" ON public.donation_proofs AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins update donations" ON public.donations AS PERMISSIVE FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Donors and admins view donations" ON public.donations AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM donor_profiles dp
  WHERE ((dp.id = donations.donor_id) AND (dp.user_id = auth.uid()))))));
CREATE POLICY "Donors create own donations" ON public.donations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM donor_profiles dp
  WHERE ((dp.id = donations.donor_id) AND (dp.user_id = auth.uid())))));
CREATE POLICY "Suspended accounts have no access" ON public.donations AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Suspended accounts have no access" ON public.donor_profiles AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users manage own donor profile" ON public.donor_profiles AS PERMISSIVE FOR ALL TO public USING (((user_id = auth.uid()) OR is_admin())) WITH CHECK (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Admins manage events" ON public.events AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users view scheduled events" ON public.events AS PERMISSIVE FOR SELECT TO public USING (((status = 'scheduled'::text) OR is_admin()));
CREATE POLICY "Suspended accounts have no access" ON public.events AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Suspended accounts have no access" ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users can create own notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Admins can update profiles" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin() AND (id <> auth.uid()))) WITH CHECK ((is_admin() AND (id <> auth.uid())));
CREATE POLICY "Suspended accounts cannot update profiles" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users can read their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (((id = auth.uid()) OR is_admin()));
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "Admins manage reports" ON public.reports AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Suspended accounts have no access" ON public.reports AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Suspended accounts have no access" ON public.sponsor_profiles AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users manage own sponsor profile" ON public.sponsor_profiles AS PERMISSIVE FOR ALL TO public USING (((user_id = auth.uid()) OR is_admin())) WITH CHECK (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Admins manage sponsorship responses" ON public.sponsorship_request_responses AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Sponsors create own responses" ON public.sponsorship_request_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM sponsor_profiles sp
  WHERE ((sp.id = sponsorship_request_responses.sponsor_id) AND (sp.user_id = auth.uid())))));
CREATE POLICY "Sponsors view own sponsorship responses" ON public.sponsorship_request_responses AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM sponsor_profiles sp
  WHERE ((sp.id = sponsorship_request_responses.sponsor_id) AND (sp.user_id = auth.uid()))))));
CREATE POLICY "Suspended accounts have no access" ON public.sponsorship_request_responses AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins manage sponsorship requests" ON public.sponsorship_requests AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Sponsors view open sponsorship requests" ON public.sponsorship_requests AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR ((status = 'open'::text) AND (auth.uid() IS NOT NULL))));
CREATE POLICY "Suspended accounts have no access" ON public.sponsorship_requests AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins update sponsorships" ON public.sponsorships AS PERMISSIVE FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Sponsors and admins view sponsorships" ON public.sponsorships AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM sponsor_profiles sp
  WHERE ((sp.id = sponsorships.sponsor_id) AND (sp.user_id = auth.uid()))))));
CREATE POLICY "Sponsors create own sponsorships" ON public.sponsorships AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM sponsor_profiles sp
  WHERE ((sp.id = sponsorships.sponsor_id) AND (sp.user_id = auth.uid())))));
CREATE POLICY "Suspended accounts have no access" ON public.sponsorships AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Admins verify documents" ON public.supporting_documents AS PERMISSIVE FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Beneficiaries upload linked documents" ON public.supporting_documents AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM (assistance_requests ar
     JOIN beneficiary_profiles bp ON ((bp.id = ar.beneficiary_id)))
  WHERE ((ar.id = supporting_documents.request_id) AND (bp.user_id = auth.uid())))));
CREATE POLICY "Suspended accounts have no access" ON public.supporting_documents AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users and admins view linked documents" ON public.supporting_documents AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM (assistance_requests ar
     JOIN beneficiary_profiles bp ON ((bp.id = ar.beneficiary_id)))
  WHERE ((ar.id = supporting_documents.request_id) AND (bp.user_id = auth.uid()))))));
CREATE POLICY "Admins manage volunteer assignments" ON public.volunteer_assignments AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Suspended accounts have no access" ON public.volunteer_assignments AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Volunteers view own assignments" ON public.volunteer_assignments AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM volunteer_profiles vp
  WHERE ((vp.id = volunteer_assignments.volunteer_id) AND (vp.user_id = auth.uid()))))));
CREATE POLICY "Admins manage volunteer hours" ON public.volunteer_hours AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Suspended accounts have no access" ON public.volunteer_hours AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Volunteers record own hours" ON public.volunteer_hours AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM volunteer_profiles vp
  WHERE ((vp.id = volunteer_hours.volunteer_id) AND (vp.user_id = auth.uid())))));
CREATE POLICY "Volunteers view own hours" ON public.volunteer_hours AS PERMISSIVE FOR SELECT TO public USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM volunteer_profiles vp
  WHERE ((vp.id = volunteer_hours.volunteer_id) AND (vp.user_id = auth.uid()))))));
CREATE POLICY "Suspended accounts have no access" ON public.volunteer_profiles AS RESTRICTIVE FOR ALL TO authenticated USING (( SELECT current_account_allowed() AS current_account_allowed)) WITH CHECK (( SELECT current_account_allowed() AS current_account_allowed));
CREATE POLICY "Users manage own volunteer profile" ON public.volunteer_profiles AS PERMISSIVE FOR ALL TO public USING (((user_id = auth.uid()) OR is_admin())) WITH CHECK (((user_id = auth.uid()) OR is_admin()));

-- =============================================================================
-- 13. Table privileges for anon / authenticated / service_role (66 grants)
-- =============================================================================
-- The export lists the complete table privileges of these three roles. REVOKE
-- ALL first so that Supabase default privileges (GRANT ALL on new tables) do not
-- leave extra rights; then grant exactly what live has.
REVOKE ALL ON TABLE public.administrator_profiles FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.assistance_requests FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.beneficiary_profiles FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.campaign_applications FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.campaigns FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.collection_schedules FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.contact_messages FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.donation_proofs FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.donations FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.donor_profiles FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.events FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.reports FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sponsor_profiles FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sponsorship_request_responses FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sponsorship_requests FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sponsorships FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.supporting_documents FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.volunteer_assignments FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.volunteer_hours FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE public.volunteer_profiles FROM anon, authenticated, service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.administrator_profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.administrator_profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.administrator_profiles TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.assistance_requests TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.assistance_requests TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.assistance_requests TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.beneficiary_profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.beneficiary_profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.beneficiary_profiles TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.campaign_applications TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.campaign_applications TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.campaign_applications TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.campaigns TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.campaigns TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.campaigns TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.collection_schedules TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.collection_schedules TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.collection_schedules TO service_role;
GRANT INSERT, REFERENCES, TRIGGER, TRUNCATE ON TABLE public.contact_messages TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.contact_messages TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.contact_messages TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donation_proofs TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.donation_proofs TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donation_proofs TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donations TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.donations TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donations TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donor_profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.donor_profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.donor_profiles TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.events TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.events TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.events TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.notifications TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notifications TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.notifications TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.profiles TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.reports TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.reports TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.reports TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsor_profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sponsor_profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsor_profiles TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorship_request_responses TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sponsorship_request_responses TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorship_request_responses TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorship_requests TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sponsorship_requests TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorship_requests TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorships TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sponsorships TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.sponsorships TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.supporting_documents TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supporting_documents TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.supporting_documents TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_assignments TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.volunteer_assignments TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_assignments TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_hours TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.volunteer_hours TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_hours TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_profiles TO anon;
GRANT INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.volunteer_profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.volunteer_profiles TO service_role;

-- =============================================================================
-- 14. Storage buckets (4)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('campaign-images', 'campaign-images', true, 5242880, '{image/jpeg,image/png,image/webp}'::text[]) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('donation-proofs', 'donation-proofs', false, 10485760, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('profile-images', 'profile-images', true, 2097152, '{image/jpeg,image/png,image/webp}'::text[]) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('supporting-documents', 'supporting-documents', false, 10485760, NULL) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 15. Policies on storage.objects (15)
-- =============================================================================
CREATE POLICY "Administrators delete campaign images" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'campaign-images'::text) AND ((current_user_role())::text = 'administrator'::text)));
CREATE POLICY "Administrators update campaign images" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'campaign-images'::text) AND ((current_user_role())::text = 'administrator'::text)));
CREATE POLICY "Administrators upload campaign images" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'campaign-images'::text) AND ((current_user_role())::text = 'administrator'::text)));
CREATE POLICY "Admins manage donation proof files" ON storage.objects AS PERMISSIVE FOR ALL TO authenticated USING (((bucket_id = 'donation-proofs'::text) AND is_admin())) WITH CHECK (((bucket_id = 'donation-proofs'::text) AND is_admin()));
CREATE POLICY "Admins manage supporting documents" ON storage.objects AS PERMISSIVE FOR ALL TO authenticated USING (((bucket_id = 'supporting-documents'::text) AND is_admin())) WITH CHECK (((bucket_id = 'supporting-documents'::text) AND is_admin()));
CREATE POLICY "Donors upload their own donation proofs" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'donation-proofs'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_admin())));
CREATE POLICY "Public read campaign images" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'campaign-images'::text));
CREATE POLICY "Public read profile images" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'profile-images'::text));
CREATE POLICY "Suspended accounts have no access to app buckets" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated USING (((bucket_id <> ALL (ARRAY['campaign-images'::text, 'donation-proofs'::text, 'profile-images'::text, 'supporting-documents'::text])) OR ( SELECT current_account_allowed() AS current_account_allowed))) WITH CHECK (((bucket_id <> ALL (ARRAY['campaign-images'::text, 'donation-proofs'::text, 'profile-images'::text, 'supporting-documents'::text])) OR ( SELECT current_account_allowed() AS current_account_allowed)));
CREATE POLICY "Users delete own profile images" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'profile-images'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));
CREATE POLICY "Users read their own donation proofs" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'donation-proofs'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_admin())));
CREATE POLICY "Users read their own supporting documents" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'supporting-documents'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_admin())));
CREATE POLICY "Users update own profile images" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'profile-images'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));
CREATE POLICY "Users upload own profile images" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'profile-images'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));
CREATE POLICY "Users upload their own supporting documents" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'supporting-documents'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_admin())));

-- =============================================================================
-- 16. Default privileges of role postgres in schema public (keep LAST)
-- =============================================================================
-- Reproduces the live pg_default_acl rows for role postgres / schema public:
--   tables    {postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=arwDxtm/postgres,service_role=Dxtm/postgres}
--   functions {postgres=X/postgres}
--   sequences {postgres=rwU/postgres}
-- They only affect objects created AFTER this point, so they are at the end and
-- do not change the grants set above. The REVOKEs clear any per-schema defaults
-- the target already has (e.g. Supabase's GRANT ALL to the API roles) so the
-- result is exactly the live ACL. Per-schema defaults start empty and cannot
-- remove the built-in PUBLIC EXECUTE on functions, so new functions still get
-- PUBLIC EXECUTE, as on live (default(PUBLIC)). MAINTAIN needs PostgreSQL 17+.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
