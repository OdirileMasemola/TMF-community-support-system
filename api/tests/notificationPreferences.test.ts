import { describe, expect, it } from 'vitest';
import { FakeSupabase, type Row } from './helpers/fakeSupabase.js';
import { TRIGGERS, userNotificationDeliveryEnabled } from './helpers/policies.js';
import { ACCOUNTS, ROLE_IDS, USERS, baseSeed } from './helpers/fixtures.js';
import { NOW } from './helpers/schema.js';

const settingsRow = (userId: string, overrides: Row = {}): Row => ({
  user_id: userId,
  theme_preference: 'system',
  notify_campaign_updates: true,
  notify_request_updates: true,
  notify_donation_updates: true,
  created_at: NOW,
  updated_at: NOW,
  ...overrides,
});

describe('userNotificationDeliveryEnabled', () => {
  const rows = [settingsRow(USERS.donor.id, { notify_donation_updates: false })];

  it('delivers when the preference is enabled', () => {
    expect(userNotificationDeliveryEnabled(USERS.volunteer.id, 'application', [settingsRow(USERS.volunteer.id)])).toBe(true);
  });

  it('blocks donation updates when notify_donation_updates is false', () => {
    expect(userNotificationDeliveryEnabled(USERS.donor.id, 'donation', rows)).toBe(false);
  });

  it('blocks assistance and application updates through notify_request_updates', () => {
    const requestOffFor = (userId: string) => [settingsRow(userId, { notify_request_updates: false })];
    expect(userNotificationDeliveryEnabled(USERS.beneficiary.id, 'assistance', requestOffFor(USERS.beneficiary.id))).toBe(
      false,
    );
    expect(userNotificationDeliveryEnabled(USERS.volunteer.id, 'application', requestOffFor(USERS.volunteer.id))).toBe(
      false,
    );
    expect(userNotificationDeliveryEnabled(USERS.admin.id, 'contact', requestOffFor(USERS.admin.id))).toBe(false);
  });

  it('blocks campaign updates through notify_campaign_updates', () => {
    expect(
      userNotificationDeliveryEnabled(
        USERS.donor.id,
        'campaign',
        [settingsRow(USERS.donor.id, { notify_campaign_updates: false })],
      ),
    ).toBe(false);
  });

  it('defaults to enabled when the settings row is missing', () => {
    expect(userNotificationDeliveryEnabled(USERS.donor.id, 'donation', [])).toBe(true);
  });

  it('still delivers unknown notification types', () => {
    expect(userNotificationDeliveryEnabled(USERS.donor.id, 'announcement', rows)).toBe(true);
  });
});

const D = (n: number) => `d1000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

function donationRow(status: string): Row {
  return {
    id: D(1),
    donor_id: ROLE_IDS.donor,
    campaign_id: null,
    amount: 100,
    donation_date: NOW,
    payment_method: 'EFT',
    status,
    donation_kind: 'money',
    payment_reference: 'REF-1',
  };
}

describe('trigger-side notification delivery', () => {
  it('creates a donation notification when the preference is on', () => {
    const db = new FakeSupabase(ACCOUNTS);
    db.reset({
      ...baseSeed(),
      donations: [donationRow('pending')],
      user_settings: [settingsRow(USERS.donor.id)],
    });

    const before = db.find('donations', (row) => row.id === D(1))!;
    const after = { ...before, status: 'successful' };
    TRIGGERS.donations.afterUpdate?.(before, after, db);

    expect(db.rows('notifications').filter((row) => row.user_id === USERS.donor.id)).toHaveLength(1);
  });

  it('skips the donation notification when notify_donation_updates is false', () => {
    const db = new FakeSupabase(ACCOUNTS);
    db.reset({
      ...baseSeed(),
      donations: [donationRow('pending')],
      user_settings: [settingsRow(USERS.donor.id, { notify_donation_updates: false })],
    });

    const before = db.find('donations', (row) => row.id === D(1))!;
    const after = { ...before, status: 'successful' };
    TRIGGERS.donations.afterUpdate?.(before, after, db);

    expect(db.rows('notifications')).toHaveLength(0);
  });

  it('does nothing when the status did not change', () => {
    const db = new FakeSupabase(ACCOUNTS);
    db.reset({
      ...baseSeed(),
      donations: [donationRow('pending')],
      user_settings: [settingsRow(USERS.donor.id)],
    });

    const row = db.find('donations', (row) => row.id === D(1))!;
    TRIGGERS.donations.afterUpdate?.(row, { ...row }, db);
    expect(db.rows('notifications')).toHaveLength(0);
  });
});
