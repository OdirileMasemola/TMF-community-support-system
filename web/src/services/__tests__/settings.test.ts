import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUserSettings, isThemePreference, updateUserSettings, type UserSettings } from "@/services/settings";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClientOrNull: vi.fn() }));

const mockedGetClient = vi.mocked(getSupabaseClientOrNull);

type Result = { data: unknown; error: unknown };

function fakeClient(results: { maybeSingle?: Result[]; upsert?: { error: unknown }; single?: Result }) {
  const reads = [...(results.maybeSingle ?? [])];
  const builder = {
    select: () => builder,
    eq: () => builder,
    update: () => builder,
    upsert: () => Promise.resolve(results.upsert ?? { error: null }),
    maybeSingle: () => Promise.resolve(reads.shift() ?? { data: null, error: null }),
    single: () => Promise.resolve(results.single ?? { data: null, error: null }),
  };
  mockedGetClient.mockReturnValue({ from: () => builder } as never);
  return builder;
}

const row: UserSettings = {
  user_id: "user-1",
  theme_preference: "dark",
  notify_campaign_updates: true,
  notify_request_updates: false,
  notify_donation_updates: true,
  created_at: "2026-10-08T10:00:00Z",
  updated_at: "2026-10-08T10:00:00Z",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockedGetClient.mockReset();
});

describe("fetchUserSettings", () => {
  it("reads the user's own row", async () => {
    fakeClient({ maybeSingle: [{ data: row, error: null }] });
    await expect(fetchUserSettings("user-1")).resolves.toEqual(row);
  });

  it("creates the default row when it is missing", async () => {
    fakeClient({ maybeSingle: [{ data: null, error: null }, { data: row, error: null }] });
    await expect(fetchUserSettings("user-1")).resolves.toEqual(row);
  });
});

describe("updateUserSettings", () => {
  it("only sends writable notification columns", async () => {
    const calls: unknown[] = [];
    const builder = {
      select: () => builder,
      eq: () => builder,
      update: (values: unknown) => {
        calls.push(["update", values]);
        return builder;
      },
      single: () => Promise.resolve({ data: { ...row, notify_request_updates: true }, error: null }),
    };
    mockedGetClient.mockReturnValue({ from: () => builder } as never);
    await updateUserSettings("user-1", { notify_request_updates: true, user_id: "someone-else" } as Parameters<
      typeof updateUserSettings
    >[1]);
    expect(calls).toContainEqual(["update", { notify_request_updates: true }]);
  });

  it("rejects empty patches", async () => {
    fakeClient({});
    await expect(updateUserSettings("user-1", {})).rejects.toThrow("Choose a setting to change.");
  });
});

describe("isThemePreference", () => {
  it("matches the database check constraint", () => {
    expect(["light", "dark", "system"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("blue")).toBe(false);
  });
});
