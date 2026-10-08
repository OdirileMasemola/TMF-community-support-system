import type { FakeAccount, Row } from './fakeSupabase.js';
import { NOW } from './schema.js';

/*
 * Shared test users. Each token maps to an auth user; the role and account status come from the
 * seeded public.profiles rows (as in the real authenticate middleware), never from the token.
 */

export const USERS = {
  admin: { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.org', token: 'admin-token-abc123' },
  admin2: { id: '12121212-1212-4121-8121-121212121212', email: 'admin2@example.org', token: 'admin2-token-xyz789' },
  donor: { id: '22222222-2222-4222-8222-222222222222', email: 'donor@example.org', token: 'donor-token-def456' },
  donor2: { id: '23232323-2323-4232-8232-232323232323', email: 'donor2@example.org', token: 'donor2-token-ghi789' },
  beneficiary: { id: '33333333-3333-4333-8333-333333333333', email: 'ben@example.org', token: 'ben-token-jkl012' },
  beneficiary2: { id: '34343434-3434-4343-8343-343434343434', email: 'ben2@example.org', token: 'ben2-token-mno345' },
  volunteer: { id: '44444444-4444-4444-8444-444444444444', email: 'vol@example.org', token: 'vol-token-pqr678' },
  volunteer2: { id: '45454545-4545-4454-8454-454545454545', email: 'vol2@example.org', token: 'vol2-token-stu901' },
  sponsor: { id: '55555555-5555-4555-8555-555555555555', email: 'sponsor@example.org', token: 'sponsor-token-vwx234' },
  sponsor2: { id: '56565656-5656-4565-8565-565656565656', email: 'sponsor2@example.org', token: 'sponsor2-token-yza567' },
  suspended: { id: '66666666-6666-4666-8666-666666666666', email: 'suspended@example.org', token: 'suspended-token-bcd890' },
  noProfile: { id: '77777777-7777-4777-8777-777777777777', email: 'new@example.org', token: 'noprofile-token-efg123' },
  pendingDonor: { id: '88888888-8888-4888-8888-888888888888', email: 'pending@example.org', token: 'pending-token-hij456' },
} as const;

export type UserKey = keyof typeof USERS;

export const ACCOUNTS: Record<string, FakeAccount> = Object.fromEntries(
  Object.values(USERS).map((user) => [user.token, { id: user.id, email: user.email }]),
);

export function auth(user: UserKey): { authorization: string } {
  return { authorization: `Bearer ${USERS[user].token}` };
}

/** Role profile ids (different from the auth user ids, as on live). */
export const ROLE_IDS = {
  admin: 'a0a0a0a0-0000-4000-8000-000000000001',
  admin2: 'a0a0a0a0-0000-4000-8000-000000000002',
  donor: 'd0d0d0d0-0000-4000-8000-000000000001',
  donor2: 'd0d0d0d0-0000-4000-8000-000000000002',
  pendingDonor: 'd0d0d0d0-0000-4000-8000-000000000003',
  beneficiary: 'b0b0b0b0-0000-4000-8000-000000000001',
  beneficiary2: 'b0b0b0b0-0000-4000-8000-000000000002',
  volunteer: 'e0e0e0e0-0000-4000-8000-000000000001',
  volunteer2: 'e0e0e0e0-0000-4000-8000-000000000002',
  sponsor: '50505050-0000-4000-8000-000000000001',
  sponsor2: '50505050-0000-4000-8000-000000000002',
} as const;

function profile(user: UserKey, role: string, accountStatus: string, fullName: string): Row {
  return {
    id: USERS[user].id,
    role,
    full_name: fullName,
    email: USERS[user].email,
    account_status: accountStatus,
    created_at: NOW,
    updated_at: NOW,
  };
}

/** Profiles + role profiles for every test user (noProfile has neither). */
export function baseSeed(): Record<string, Row[]> {
  return {
    profiles: [
      profile('admin', 'administrator', 'active', 'Ada Admin'),
      profile('admin2', 'administrator', 'active', 'Abe Admin'),
      profile('donor', 'donor', 'active', 'Dineo Donor'),
      profile('donor2', 'donor', 'active', 'Dumi Donor'),
      profile('pendingDonor', 'donor', 'pending', 'Pam Pending'),
      profile('beneficiary', 'beneficiary', 'active', 'Bongi Beneficiary'),
      profile('beneficiary2', 'beneficiary', 'active', 'Bheki Beneficiary'),
      profile('volunteer', 'volunteer', 'active', 'Vusi Volunteer'),
      profile('volunteer2', 'volunteer', 'active', 'Vivi Volunteer'),
      profile('sponsor', 'sponsor', 'active', 'Sipho Sponsor'),
      profile('sponsor2', 'sponsor', 'active', 'Sara Sponsor'),
      profile('suspended', 'donor', 'suspended', 'Sam Suspended'),
    ],
    administrator_profiles: [
      { id: ROLE_IDS.admin, user_id: USERS.admin.id },
      { id: ROLE_IDS.admin2, user_id: USERS.admin2.id },
    ],
    donor_profiles: [
      { id: ROLE_IDS.donor, user_id: USERS.donor.id, member_since: '2026-01-01' },
      { id: ROLE_IDS.donor2, user_id: USERS.donor2.id, member_since: '2026-01-01' },
      { id: ROLE_IDS.pendingDonor, user_id: USERS.pendingDonor.id },
    ],
    beneficiary_profiles: [
      { id: ROLE_IDS.beneficiary, user_id: USERS.beneficiary.id },
      { id: ROLE_IDS.beneficiary2, user_id: USERS.beneficiary2.id },
    ],
    volunteer_profiles: [
      { id: ROLE_IDS.volunteer, user_id: USERS.volunteer.id },
      { id: ROLE_IDS.volunteer2, user_id: USERS.volunteer2.id },
    ],
    sponsor_profiles: [
      { id: ROLE_IDS.sponsor, user_id: USERS.sponsor.id, organisation_name: 'Sipho Holdings' },
      { id: ROLE_IDS.sponsor2, user_id: USERS.sponsor2.id, organisation_name: 'Sara Trust' },
    ],
  };
}

/** Merges extra rows into baseSeed(). */
export function seedWith(extra: Record<string, Row[]>): Record<string, Row[]> {
  const seed = baseSeed();
  for (const [table, rows] of Object.entries(extra)) seed[table] = [...(seed[table] ?? []), ...rows];
  return seed;
}
