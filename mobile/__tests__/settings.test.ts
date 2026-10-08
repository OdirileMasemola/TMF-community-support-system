import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { fetchUserSettings, isThemePreference, updateUserSettings, type UserSettings } from "@/services/settings";

jest.mock("@/lib/supabaseClient", () => ({ getSupabaseClientOrNull: jest.fn() }));

const mockedGetClient = getSupabaseClientOrNull as jest.Mock;

type Result = { data: unknown; error: unknown };

/** A tiny stand-in for the Supabase query builder that records what was asked of it. */
function fakeClient(results: { maybeSingle?: Result[]; upsert?: { error: unknown }; single?: Result }) {
  const calls: unknown[][] = [];
  const reads = [...(results.maybeSingle ?? [])];
  const builder = {
    select: (...args: unknown[]) => (calls.push(["select", ...args]), builder),
    eq: (...args: unknown[]) => (calls.push(["eq", ...args]), builder),
    update: (...args: unknown[]) => (calls.push(["update", ...args]), builder),
    upsert: (...args: unknown[]) => (calls.push(["upsert", ...args]), Promise.resolve(results.upsert ?? { error: null })),
    maybeSingle: () => Promise.resolve(reads.shift() ?? { data: null, error: null }),
    single: () => Promise.resolve(results.single ?? { data: null, error: null }),
  };
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
  };
  mockedGetClient.mockReturnValue(client);
  return calls;
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
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  mockedGetClient.mockReset();
});

describe("fetchUserSettings", () => {
  it("reads the user's own row", async () => {
    const calls = fakeClient({ maybeSingle: [{ data: row, error: null }] });
    await expect(fetchUserSettings("user-1")).resolves.toEqual(row);
    expect(calls).toContainEqual(["from", "user_settings"]);
    expect(calls).toContainEqual(["eq", "user_id", "user-1"]);
    expect(calls.some((call) => call[0] === "upsert")).toBe(false);
  });

  it("creates the default row when it is missing, without overwriting", async () => {
    const calls = fakeClient({ maybeSingle: [{ data: null, error: null }, { data: row, error: null }] });
    await expect(fetchUserSettings("user-1")).resolves.toEqual(row);
    expect(calls).toContainEqual(["upsert", { user_id: "user-1" }, { onConflict: "user_id", ignoreDuplicates: true }]);
  });

  it("passes database errors on", async () => {
    fakeClient({ maybeSingle: [{ data: null, error: { code: "42501", message: "denied" } }] });
    await expect(fetchUserSettings("user-1")).rejects.toEqual({ code: "42501", message: "denied" });
  });

  it("returns null when Supabase is not configured", async () => {
    mockedGetClient.mockReturnValue(null);
    await expect(fetchUserSettings("user-1")).resolves.toBeNull();
  });
});

describe("updateUserSettings", () => {
  it("only sends the columns a user may change", async () => {
    const calls = fakeClient({ single: { data: { ...row, theme_preference: "light" }, error: null } });
    const patch = { theme_preference: "light", user_id: "someone-else" } as unknown as Parameters<typeof updateUserSettings>[1];
    const saved = await updateUserSettings("user-1", patch);
    expect(saved.theme_preference).toBe("light");
    expect(calls).toContainEqual(["update", { theme_preference: "light" }]);
    expect(calls).toContainEqual(["eq", "user_id", "user-1"]);
  });

  it("saves a notification switch", async () => {
    const calls = fakeClient({ single: { data: { ...row, notify_request_updates: true }, error: null } });
    await updateUserSettings("user-1", { notify_request_updates: true });
    expect(calls).toContainEqual(["update", { notify_request_updates: true }]);
  });

  it("rejects a theme the database would refuse", async () => {
    fakeClient({});
    await expect(
      updateUserSettings("user-1", { theme_preference: "blue" } as unknown as Parameters<typeof updateUserSettings>[1]),
    ).rejects.toThrow("Choose light, dark or system.");
  });

  it("rejects an empty change", async () => {
    fakeClient({});
    await expect(updateUserSettings("user-1", {})).rejects.toThrow("Choose a setting to change.");
  });
});

describe("isThemePreference", () => {
  it("matches the user_settings_theme_preference_check values", () => {
    expect(["light", "dark", "system"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("auto")).toBe(false);
  });
});
