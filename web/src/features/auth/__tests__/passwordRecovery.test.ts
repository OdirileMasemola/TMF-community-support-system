import { describe, expect, it } from "vitest";
import {
  describeRecoveryLinkError,
  MIN_PASSWORD_LENGTH,
  parseRecoveryLink,
  validateEmail,
  validateNewPassword,
} from "@/features/auth/lib/passwordRecovery";
import { toAuthUserMessage } from "@/lib/errors";

describe("validateEmail", () => {
  it("requires an address", () => {
    expect(validateEmail("")).toBe("Enter your email address.");
    expect(validateEmail("   ")).toBe("Enter your email address.");
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("thandi@")).toBe("Enter a valid email address.");
    expect(validateEmail("thandi@tmf")).toBe("Enter a valid email address.");
    expect(validateEmail("not an email")).toBe("Enter a valid email address.");
  });

  it("accepts a real address, ignoring surrounding spaces", () => {
    expect(validateEmail(" thandi@example.com ")).toBeNull();
  });
});

describe("validateNewPassword", () => {
  it("requires a password", () => {
    expect(validateNewPassword("", "")).toBe("Enter a new password.");
  });

  it("enforces the registration minimum length", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateNewPassword(short, short)).toBe(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  });

  it("requires the confirmation", () => {
    expect(validateNewPassword("community123", "")).toBe("Confirm your new password.");
  });

  it("rejects a mismatch", () => {
    expect(validateNewPassword("community123", "community124")).toBe("The passwords do not match.");
  });

  it("accepts a matching pair", () => {
    expect(validateNewPassword("community123", "community123")).toBeNull();
  });
});

describe("parseRecoveryLink", () => {
  it("reads the PKCE code from the query string", () => {
    const result = parseRecoveryLink("https://tmf.example/reset-password?code=abc-123");
    expect(result.code).toBe("abc-123");
    expect(result.error).toBeNull();
    expect(result.accessToken).toBeNull();
  });

  it("reads implicit-flow tokens from the fragment", () => {
    const result = parseRecoveryLink(
      "https://tmf.example/reset-password#access_token=at&refresh_token=rt&type=recovery&expires_in=3600",
    );
    expect(result.accessToken).toBe("at");
    expect(result.refreshToken).toBe("rt");
    expect(result.type).toBe("recovery");
    expect(result.error).toBeNull();
  });

  it("reads a verification failure from the fragment", () => {
    const result = parseRecoveryLink(
      "https://tmf.example/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(result.error).toEqual({ code: "otp_expired", description: "Email link is invalid or has expired" });
  });

  it("reads a verification failure from the query string", () => {
    const result = parseRecoveryLink("https://tmf.example/reset-password?error=access_denied&error_code=otp_expired");
    expect(result.error?.code).toBe("otp_expired");
  });

  it("returns an empty result for a plain visit or an unparsable URL", () => {
    expect(parseRecoveryLink("https://tmf.example/reset-password")).toEqual({
      code: null,
      accessToken: null,
      refreshToken: null,
      type: null,
      error: null,
    });
    expect(parseRecoveryLink("not a url").error).toBeNull();
  });
});

describe("describeRecoveryLinkError", () => {
  it("explains an expired or reused link", () => {
    expect(describeRecoveryLinkError({ code: "otp_expired", description: "" })).toMatch(/expired or has already been used/);
    expect(describeRecoveryLinkError({ code: null, description: "Email link is invalid or has expired" })).toMatch(
      /expired/,
    );
  });

  it("explains an invalid link", () => {
    expect(describeRecoveryLinkError({ code: "access_denied", description: "" })).toMatch(/invalid/);
  });

  it("falls back to a generic sentence", () => {
    expect(describeRecoveryLinkError({ code: "server_error", description: "" })).toMatch(/could not verify/);
  });
});

describe("toAuthUserMessage for recovery errors", () => {
  it("maps Supabase password errors to plain language", () => {
    expect(toAuthUserMessage(new Error("New password should be different from the old password."))).toMatch(
      /different from your current password/,
    );
    expect(toAuthUserMessage(new Error("Password should be at least 6 characters."))).toMatch(/too weak/);
  });

  it("explains a PKCE link opened in another browser", () => {
    expect(
      toAuthUserMessage(new Error("invalid request: both auth code and code verifier should be non-empty")),
    ).toMatch(/same browser/);
  });

  it("explains an expired token and a network failure", () => {
    expect(toAuthUserMessage(new Error("Email link is invalid or has expired"))).toMatch(/invalid or has expired/);
    expect(toAuthUserMessage(new TypeError("Failed to fetch"))).toMatch(/could not reach the server/);
  });

  it("never leaks unknown technical text", () => {
    expect(toAuthUserMessage(new Error("relation auth.users does not exist"))).toBe(
      "We could not complete that request. Please try again.",
    );
  });
});
