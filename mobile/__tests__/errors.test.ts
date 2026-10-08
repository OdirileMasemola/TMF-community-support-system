import { logSupabaseError, toUserMessage } from "@/lib/errors";

describe("toUserMessage", () => {
  it("returns a friendly default", () => {
    expect(toUserMessage()).toBe("Something went wrong while loading data. Please try again.");
  });

  it("returns the given fallback", () => {
    expect(toUserMessage("Could not save.")).toBe("Could not save.");
  });
});

describe("logSupabaseError", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  it("logs details in development", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    logSupabaseError("fetchProfile", { code: "42501" });
    expect(spy).toHaveBeenCalledWith("[Supabase] fetchProfile", { code: "42501" });
  });

  it("stays quiet in production builds", () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    logSupabaseError("fetchProfile", { code: "42501" });
    expect(spy).not.toHaveBeenCalled();
  });
});
