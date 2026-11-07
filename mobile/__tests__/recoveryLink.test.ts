import { describeRecoveryFailure, describeRecoveryLinkError, parseRecoveryLink } from "@/auth/recoveryLink";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/validation";

describe("parseRecoveryLink", () => {
  it("reads the recovery tokens from the fragment of the deep link", () => {
    const link = parseRecoveryLink(
      "tmfdashboard://reset-password#access_token=at&expires_in=3600&refresh_token=rt&token_type=bearer&type=recovery",
    );
    expect(link).toEqual({ kind: "tokens", accessToken: "at", refreshToken: "rt", type: "recovery" });
  });

  it("also handles the Expo Go development URL", () => {
    const link = parseRecoveryLink("exp://192.168.0.12:8081/--/reset-password#access_token=at&refresh_token=rt&type=recovery");
    expect(link.kind).toBe("tokens");
  });

  it("reports an expired or reused link", () => {
    const link = parseRecoveryLink(
      "tmfdashboard://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(link).toEqual({ kind: "error", code: "otp_expired", description: "Email link is invalid or has expired" });
  });

  it("reads errors and codes from the query string too", () => {
    expect(parseRecoveryLink("tmfdashboard://reset-password?error_code=otp_expired").kind).toBe("error");
    expect(parseRecoveryLink("tmfdashboard://reset-password?code=abc")).toEqual({ kind: "code", code: "abc" });
  });

  it("returns none for a bare route or no URL", () => {
    expect(parseRecoveryLink("tmfdashboard://reset-password")).toEqual({ kind: "none" });
    expect(parseRecoveryLink(null)).toEqual({ kind: "none" });
    expect(parseRecoveryLink(undefined)).toEqual({ kind: "none" });
  });

  it("needs both tokens before treating a link as usable", () => {
    expect(parseRecoveryLink("tmfdashboard://reset-password#access_token=at").kind).toBe("none");
  });
});

describe("describeRecoveryLinkError", () => {
  it("explains expired and invalid links", () => {
    expect(describeRecoveryLinkError({ kind: "error", code: "otp_expired", description: "" })).toMatch(/expired/);
    expect(describeRecoveryLinkError({ kind: "error", code: "access_denied", description: "" })).toMatch(/invalid/);
    expect(describeRecoveryLinkError({ kind: "error", code: "server_error", description: "" })).toMatch(/could not verify/);
  });
});

describe("describeRecoveryFailure", () => {
  it("translates Supabase password errors", () => {
    expect(describeRecoveryFailure(new Error("New password should be different from the old password."), "x")).toMatch(
      /different from your current password/,
    );
    expect(describeRecoveryFailure(new Error("Password should be at least 6 characters."), "x")).toMatch(/too weak/);
    expect(describeRecoveryFailure(new Error("Auth session missing!"), "x")).toMatch(/expired/);
    expect(describeRecoveryFailure(new Error("Network request failed"), "x")).toMatch(/could not reach/);
  });

  it("falls back to the caller's message for anything unknown", () => {
    expect(describeRecoveryFailure(new Error("relation does not exist"), "Fallback.")).toBe("Fallback.");
    expect(describeRecoveryFailure("not an error", "Fallback.")).toBe("Fallback.");
  });
});

describe("validateNewPassword", () => {
  it("enforces the registration minimum and a matching confirmation", () => {
    expect(validateNewPassword("", "")).toBe("Enter a new password.");
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateNewPassword(short, short)).toBe(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    expect(validateNewPassword("community123", "")).toBe("Confirm your new password.");
    expect(validateNewPassword("community123", "community124")).toBe("The passwords do not match.");
    expect(validateNewPassword("community123", "community123")).toBeNull();
  });
});
