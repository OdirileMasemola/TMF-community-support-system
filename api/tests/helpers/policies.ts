import type { Caller, FakeSupabase, PgErrorBody, Row } from './fakeSupabase.js';

/*
 * Emulation of the live RLS policies, triggers and relationships recorded in supabase/migrations
 * (baseline 20260930000000 + user_settings 20261008141000). Permissive policies of one command are
 * OR-ed; the RESTRICTIVE "Suspended accounts have no access" policies are applied for every table by
 * FakeSupabase (caller.allowed). Only what the API uses is modelled.
 */

type Check = (row: Row, caller: Caller, db: FakeSupabase) => boolean;

export interface TablePolicy {
  /** SELECT USING */
  select?: Check;
  /** INSERT WITH CHECK */
  insert?: Check;
  /** UPDATE USING (old row) and WITH CHECK (new row) */
  update?: Check;
}

const admin: Check = (_row, caller) => caller.isAdmin;

/** EXISTS (select 1 from <profileTable> p where p.id = <id> and p.user_id = auth.uid()) */
function ownsProfile(db: FakeSupabase, profileTable: string, profileId: unknown, caller: Caller): boolean {
  return db.rows(profileTable).some((p) => p.id === profileId && p.user_id === caller.userId);
}

/** Request belongs to a beneficiary profile of the caller (assistance_requests ar JOIN beneficiary_profiles bp). */
function ownsRequest(db: FakeSupabase, requestId: unknown, caller: Caller): boolean {
  const request = db.rows('assistance_requests').find((r) => r.id === requestId);
  return request !== undefined && ownsProfile(db, 'beneficiary_profiles', request.beneficiary_id, caller);
}

/** Donation belongs to a donor profile of the caller (donations d JOIN donor_profiles dp). */
function ownsDonation(db: FakeSupabase, donationId: unknown, caller: Caller): boolean {
  const donation = db.rows('donations').find((d) => d.id === donationId);
  return donation !== undefined && ownsProfile(db, 'donor_profiles', donation.donor_id, caller);
}

const ownRoleProfile: Check = (row, caller) => row.user_id === caller.userId || caller.isAdmin;

export const POLICIES: Record<string, TablePolicy> = {
  // "Admins manage admin profiles" (ALL)
  administrator_profiles: { select: admin, insert: admin, update: admin },
  // "Users manage own <role> profile" (ALL): user_id = auth.uid() OR is_admin()
  beneficiary_profiles: { select: ownRoleProfile, insert: ownRoleProfile, update: ownRoleProfile },
  donor_profiles: { select: ownRoleProfile, insert: ownRoleProfile, update: ownRoleProfile },
  volunteer_profiles: { select: ownRoleProfile, insert: ownRoleProfile, update: ownRoleProfile },
  sponsor_profiles: { select: ownRoleProfile, insert: ownRoleProfile, update: ownRoleProfile },
  profiles: {
    // "Users can read their own profile"
    select: (row, caller) => row.id === caller.userId || caller.isAdmin,
    // no INSERT policy on public.profiles
    insert: () => false,
    // "Users can update their own profile" OR "Admins can update profiles" (is_admin() AND id <> auth.uid())
    update: (row, caller) => row.id === caller.userId || (caller.isAdmin && row.id !== caller.userId),
  },
  user_settings: {
    select: (row, caller) => row.user_id === caller.userId,
    insert: (row, caller) => row.user_id === caller.userId,
    update: (row, caller) => row.user_id === caller.userId,
  },
  notifications: {
    select: (row, caller) => row.user_id === caller.userId || caller.isAdmin,
    insert: (row, caller) => row.user_id === caller.userId,
    update: (row, caller) => row.user_id === caller.userId,
  },
  campaigns: {
    // "Admins manage campaigns" OR "Anyone can view public active campaigns" OR "Authenticated users can view active campaigns"
    select: (row, caller) => caller.isAdmin || row.status === 'active',
    insert: admin,
    update: admin,
  },
  donations: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'donor_profiles', row.donor_id, caller),
    insert: (row, caller, db) => ownsProfile(db, 'donor_profiles', row.donor_id, caller),
    update: admin,
  },
  donation_proofs: {
    select: (row, caller, db) => caller.isAdmin || ownsDonation(db, row.donation_id, caller),
    insert: (row, caller, db) => caller.isAdmin || ownsDonation(db, row.donation_id, caller),
    update: admin,
  },
  assistance_requests: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'beneficiary_profiles', row.beneficiary_id, caller),
    insert: (row, caller, db) => ownsProfile(db, 'beneficiary_profiles', row.beneficiary_id, caller),
    update: admin,
  },
  supporting_documents: {
    select: (row, caller, db) => caller.isAdmin || ownsRequest(db, row.request_id, caller),
    insert: (row, caller, db) => ownsRequest(db, row.request_id, caller),
    update: admin,
  },
  collection_schedules: {
    select: (row, caller, db) => caller.isAdmin || ownsRequest(db, row.request_id, caller),
    insert: admin,
    update: admin,
  },
  campaign_applications: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'volunteer_profiles', row.volunteer_id, caller),
    insert: (row, caller, db) => ownsProfile(db, 'volunteer_profiles', row.volunteer_id, caller),
    update: admin,
  },
  volunteer_assignments: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'volunteer_profiles', row.volunteer_id, caller),
    insert: admin,
    update: admin,
  },
  volunteer_hours: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'volunteer_profiles', row.volunteer_id, caller),
    insert: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'volunteer_profiles', row.volunteer_id, caller),
    update: admin,
  },
  sponsorships: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'sponsor_profiles', row.sponsor_id, caller),
    insert: (row, caller, db) => ownsProfile(db, 'sponsor_profiles', row.sponsor_id, caller),
    update: admin,
  },
  sponsorship_requests: {
    select: (row, caller) => caller.isAdmin || (row.status === 'open' && caller.userId !== null),
    insert: admin,
    update: admin,
  },
  sponsorship_request_responses: {
    select: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'sponsor_profiles', row.sponsor_id, caller),
    insert: (row, caller, db) => caller.isAdmin || ownsProfile(db, 'sponsor_profiles', row.sponsor_id, caller),
    update: admin,
  },
  events: {
    select: (row, caller) => caller.isAdmin || row.status === 'scheduled',
    insert: admin,
    update: admin,
  },
};

export interface Relation {
  local: string;
  foreign: string;
  many?: boolean;
}

/** Foreign-key relationships PostgREST can embed (from the baseline foreign keys). */
export const RELATIONS: Record<string, Record<string, Relation>> = {
  donations: {
    campaigns: { local: 'campaign_id', foreign: 'id' },
    donor_profiles: { local: 'donor_id', foreign: 'id' },
    donation_proofs: { local: 'id', foreign: 'donation_id', many: true },
  },
  donation_proofs: { donations: { local: 'donation_id', foreign: 'id' } },
  assistance_requests: {
    beneficiary_profiles: { local: 'beneficiary_id', foreign: 'id' },
    supporting_documents: { local: 'id', foreign: 'request_id', many: true },
    collection_schedules: { local: 'id', foreign: 'request_id', many: true },
  },
  collection_schedules: { assistance_requests: { local: 'request_id', foreign: 'id' } },
  supporting_documents: { assistance_requests: { local: 'request_id', foreign: 'id' } },
  campaign_applications: {
    campaigns: { local: 'campaign_id', foreign: 'id' },
    volunteer_profiles: { local: 'volunteer_id', foreign: 'id' },
  },
  volunteer_assignments: {
    campaigns: { local: 'campaign_id', foreign: 'id' },
    campaign_applications: { local: 'application_id', foreign: 'id' },
  },
  volunteer_hours: {
    volunteer_assignments: { local: 'assignment_id', foreign: 'id' },
    volunteer_profiles: { local: 'volunteer_id', foreign: 'id' },
  },
  sponsorships: {
    campaigns: { local: 'campaign_id', foreign: 'id' },
    sponsor_profiles: { local: 'sponsor_id', foreign: 'id' },
  },
  sponsorship_requests: {
    campaigns: { local: 'campaign_id', foreign: 'id' },
    sponsorship_request_responses: { local: 'id', foreign: 'request_id', many: true },
  },
  sponsorship_request_responses: {
    sponsorship_requests: { local: 'request_id', foreign: 'id' },
    sponsorships: { local: 'sponsorship_id', foreign: 'id' },
  },
  beneficiary_profiles: { profiles: { local: 'user_id', foreign: 'id' } },
  donor_profiles: { profiles: { local: 'user_id', foreign: 'id' } },
  volunteer_profiles: { profiles: { local: 'user_id', foreign: 'id' } },
  sponsor_profiles: { profiles: { local: 'user_id', foreign: 'id' } },
};

export interface TableTriggers {
  /** Unique constraints besides the primary key `id`. */
  unique?: string[][];
  /** BEFORE UPDATE set_<table>_updated_at */
  touchUpdatedAt?: boolean;
  beforeUpdate?: (oldRow: Row, newRow: Row, caller: Caller) => { status: number; body: PgErrorBody } | null;
  afterUpdate?: (oldRow: Row, newRow: Row, db: FakeSupabase) => void;
}

function denied(message: string): { status: number; body: PgErrorBody } {
  return { status: 403, body: { code: '42501', message, details: null, hint: null } };
}

/** notify_*_status_change(): SECURITY DEFINER, inserts a notification for the owner on status change. */
function notifyOwner(profileTable: string, profileColumn: string, type: string, entityType: string) {
  return (oldRow: Row, newRow: Row, db: FakeSupabase): void => {
    if (oldRow.status === newRow.status) return;
    const owner = db.rows(profileTable).find((p) => p.id === newRow[profileColumn]);
    if (owner === undefined) return;
    db.seed('notifications', {
      user_id: owner.user_id,
      title: `Status ${String(newRow.status)}`,
      message: `Your ${entityType} is now ${String(newRow.status)}.`,
      notification_type: type,
      related_entity_type: entityType,
      related_entity_id: newRow.id,
    });
  };
}

export const TRIGGERS: Record<string, TableTriggers> = {
  administrator_profiles: { unique: [['user_id']] },
  beneficiary_profiles: { unique: [['user_id']] },
  donor_profiles: { unique: [['user_id']] },
  volunteer_profiles: { unique: [['user_id']] },
  sponsor_profiles: { unique: [['user_id']] },
  user_settings: { unique: [['user_id']], touchUpdatedAt: true },
  campaigns: { touchUpdatedAt: true },
  events: { touchUpdatedAt: true },
  campaign_applications: {
    unique: [['volunteer_id', 'campaign_id']],
    afterUpdate: notifyOwner('volunteer_profiles', 'volunteer_id', 'application', 'campaign_application'),
  },
  donations: {
    unique: [['receipt_number']],
    afterUpdate: notifyOwner('donor_profiles', 'donor_id', 'donation', 'donation'),
  },
  assistance_requests: {
    afterUpdate: notifyOwner('beneficiary_profiles', 'beneficiary_id', 'assistance', 'assistance_request'),
  },
  profiles: {
    unique: [['email']],
    touchUpdatedAt: true,
    // protect_profile_privileged_fields()
    beforeUpdate: (oldRow, newRow, caller) => {
      const privilegedChanged = oldRow.role !== newRow.role || oldRow.account_status !== newRow.account_status;
      if (oldRow.id === caller.userId) {
        return privilegedChanged ? denied('Not allowed to change your own role or account status') : null;
      }
      if (!caller.isAdmin) return privilegedChanged ? denied('Not allowed to change this profile field') : null;
      const ignored = new Set(['role', 'account_status', 'updated_at']);
      const otherChanged = Object.keys(newRow).some((key) => !ignored.has(key) && newRow[key] !== oldRow[key]);
      return otherChanged ? denied('Administrators may only change role or account_status of other users') : null;
    },
  },
};
