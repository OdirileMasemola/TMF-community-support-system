import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/apiClient";
import {
  EMAIL_CHECK_PATH,
  REGISTRATION_COPY,
  RegistrationError,
  checkRegistrationEmail,
  emailCheckMessage,
  isEmailVerified,
  readAuthLinkError,
  registerWithEmail,
  resendSignupConfirmation,
} from "@/features/auth/lib/registration";

// No Supabase project and no API are contacted: the client and fetch are plain mocks.
function fakeClient(result: { data: unknown; error: unknown } = { data: { user: { id: "u1", identities: [{}] }, session: null }, error: null }) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(result),
      resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

const values = {
  fullName: " Thandi Mokoena ",
  email: " Thandi@Company.CO.ZA ",
  phoneNumber: "",
  password: "a-long-password",
  role: "beneficiary",
};

const redirect = "https://tmf.example/auth/callback";

describe("registerWithEmail", () => {
  it("checks the address with the API first, then signs up with the normalised address and attestation", async () => {
    const client = fakeClient();
    const check = vi.fn().mockResolvedValue({
      email: "thandi@company.co.za",
      domain: "company.co.za",
      attestation: "v1.1893456000.abc",
      attestationExpiresAt: "2030-01-01T00:00:00.000Z",
    });

    const result = await registerWithEmail(client as never, values, { emailRedirectTo: redirect, check });

    expect(check).toHaveBeenCalledWith(values.email);
    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "thandi@company.co.za",
      password: "a-long-password",
      options: {
        emailRedirectTo: redirect,
        data: { full_name: "Thandi Mokoena", phone_number: null, role: "beneficiary", email_attestation: "v1.1893456000.abc" },
      },
    });
    expect(result).toEqual({ email: "thandi@company.co.za", needsEmailConfirmation: true, userId: null });
  });

  it("never calls Supabase when the API rejects the address", async () => {
    const client = fakeClient();
    const check = vi.fn().mockRejectedValue(new RegistrationError(REGISTRATION_COPY.restricted));
    await expect(registerWithEmail(client as never, values, { emailRedirectTo: redirect, check })).rejects.toThrow(
      REGISTRATION_COPY.restricted,
    );
    expect(client.auth.signUp).not.toHaveBeenCalled();
  });

  it("omits the attestation when the API does not issue one and never sends email_verified", async () => {
    const client = fakeClient();
    const check = vi.fn().mockResolvedValue({ email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null });
    await registerWithEmail(client as never, values, { emailRedirectTo: redirect, check });
    const data = client.auth.signUp.mock.calls[0][0].options.data;
    expect(data).not.toHaveProperty("email_attestation");
    expect(data).not.toHaveProperty("email_verified");
  });

  it("reports an address that already has an account (no identities returned)", async () => {
    const client = fakeClient({ data: { user: { id: "u1", identities: [] }, session: null }, error: null });
    const check = vi.fn().mockResolvedValue({ email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null });
    await expect(registerWithEmail(client as never, values, { emailRedirectTo: redirect, check })).rejects.toThrow(/already exists/);
  });

  it("passes Supabase errors (e.g. the Auth hook rejecting a direct sign-up) through", async () => {
    const hookError = new Error("Registration using this email domain is currently restricted.");
    const client = fakeClient({ data: { user: null, session: null }, error: hookError });
    const check = vi.fn().mockResolvedValue({ email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null });
    await expect(registerWithEmail(client as never, values, { emailRedirectTo: redirect, check })).rejects.toBe(hookError);
  });

  it("returns the user id when Supabase signs the user straight in", async () => {
    const client = fakeClient({ data: { user: { id: "u9", identities: [{}] }, session: { access_token: "t" } }, error: null });
    const check = vi.fn().mockResolvedValue({ email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null });
    const result = await registerWithEmail(client as never, values, { emailRedirectTo: redirect, check });
    expect(result).toEqual({ email: "a@b.co.za", needsEmailConfirmation: false, userId: "u9" });
  });
});

describe("checkRegistrationEmail", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("posts the address to the public email check without an access token", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await checkRegistrationEmail("a@b.co.za");
    expect(result.email).toBe("a@b.co.za");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url).endsWith(EMAIL_CHECK_PATH)).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.co.za" });
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("turns an API rejection into the matching safe message", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "EMAIL_DOMAIN_UNDELIVERABLE", message: "x" } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(checkRegistrationEmail("a@nomail.example")).rejects.toThrow(REGISTRATION_COPY.undeliverable);
  });

  it("fails safe when the API cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(checkRegistrationEmail("a@b.co.za")).rejects.toThrow(REGISTRATION_COPY.unavailable);
  });
});

describe("emailCheckMessage", () => {
  it.each([
    ["INVALID_EMAIL", REGISTRATION_COPY.invalidEmail],
    ["VALIDATION_ERROR", REGISTRATION_COPY.invalidEmail],
    ["EMAIL_DOMAIN_UNDELIVERABLE", REGISTRATION_COPY.undeliverable],
    ["EMAIL_DOMAIN_RESTRICTED", REGISTRATION_COPY.restricted],
    ["EMAIL_DOMAIN_CHECK_UNAVAILABLE", REGISTRATION_COPY.unavailable],
    ["INTERNAL_ERROR", REGISTRATION_COPY.unavailable],
  ])("maps %s", (code, message) => {
    expect(emailCheckMessage(new ApiError(422, code, "raw server detail"))).toBe(message);
  });

  it("maps rate limiting", () => {
    expect(emailCheckMessage(new ApiError(429, "RATE_LIMITED", "x"))).toMatch(/too many attempts/i);
  });
});

describe("resendSignupConfirmation", () => {
  it("asks Supabase to resend the sign-up confirmation to the same callback", async () => {
    const client = fakeClient();
    await resendSignupConfirmation(client as never, " a@b.co.za ", redirect);
    expect(client.auth.resend).toHaveBeenCalledWith({ type: "signup", email: "a@b.co.za", options: { emailRedirectTo: redirect } });
  });

  it("requires an address", async () => {
    const client = fakeClient();
    await expect(resendSignupConfirmation(client as never, "  ", redirect)).rejects.toThrow(REGISTRATION_COPY.invalidEmail);
    expect(client.auth.resend).not.toHaveBeenCalled();
  });
});

describe("isEmailVerified", () => {
  it("trusts only Supabase's email_confirmed_at, never user_metadata", () => {
    expect(isEmailVerified({ email_confirmed_at: "2026-11-12T10:00:00Z" })).toBe(true);
    expect(isEmailVerified({ email_confirmed_at: null, user_metadata: { email_verified: true } } as never)).toBe(false);
    expect(isEmailVerified(null)).toBe(false);
  });
});

describe("readAuthLinkError", () => {
  it("recognises an expired link in the fragment", () => {
    expect(readAuthLinkError("", "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired")).toEqual({
      kind: "expired",
      message: REGISTRATION_COPY.expired,
    });
  });

  it("recognises an expired link in the query string", () => {
    expect(readAuthLinkError("?error=access_denied&error_code=otp_expired", "")?.kind).toBe("expired");
  });

  it("reports other link errors as invalid", () => {
    expect(readAuthLinkError("?error=server_error&error_description=boom", "")?.kind).toBe("invalid");
  });

  it("returns null for a normal callback", () => {
    expect(readAuthLinkError("?code=abc", "")).toBeNull();
  });
});
