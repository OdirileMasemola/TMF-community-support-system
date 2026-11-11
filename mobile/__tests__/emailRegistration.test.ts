import { ApiError } from "@/lib/apiClient";
import {
  EMAIL_CHECK_PATH,
  EMAIL_CONFIRMATION_REDIRECT,
  REGISTRATION_COPY,
  checkRegistrationEmail,
  emailCheckMessage,
  isEmailVerified,
  isExpiredLinkError,
  registerWithEmail,
  resendSignupConfirmation,
} from "@/auth/registration";

// No Supabase project or API is contacted: the client and fetch are plain mocks.
function fakeClient(result: { data: unknown; error: unknown } = { data: { user: { id: "u1", identities: [{}] }, session: null }, error: null }) {
  return {
    auth: {
      signUp: jest.fn().mockResolvedValue(result),
      resend: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

const values = {
  fullName: " Thandi Mokoena ",
  email: " Thandi@Company.CO.ZA ",
  phoneNumber: "072 000 0000",
  password: "community123",
  role: "volunteer",
};

const okCheck = (attestation: string | null = "v1.1893456000.abc") =>
  jest.fn().mockResolvedValue({ email: "thandi@company.co.za", domain: "company.co.za", attestation, attestationExpiresAt: null });

describe("registerWithEmail (mobile)", () => {
  it("checks with the API first, then signs up with the normalised address, attestation and web callback", async () => {
    const client = fakeClient();
    const check = okCheck();
    const result = await registerWithEmail(client as never, values, { check });
    expect(check).toHaveBeenCalledWith(values.email);
    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "thandi@company.co.za",
      password: "community123",
      options: {
        emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT,
        data: { full_name: "Thandi Mokoena", phone_number: "072 000 0000", role: "volunteer", email_attestation: "v1.1893456000.abc" },
      },
    });
    expect(EMAIL_CONFIRMATION_REDIRECT.endsWith("/auth/callback")).toBe(true);
    expect(result).toEqual({ email: "thandi@company.co.za", needsEmailConfirmation: true, userId: null });
  });

  it("does not call Supabase when the API rejects the address", async () => {
    const client = fakeClient();
    const check = jest.fn().mockRejectedValue(new Error(REGISTRATION_COPY.undeliverable));
    await expect(registerWithEmail(client as never, values, { check })).rejects.toThrow(REGISTRATION_COPY.undeliverable);
    expect(client.auth.signUp).not.toHaveBeenCalled();
  });

  it("maps the Auth hook's rejection to the same safe copy", async () => {
    const client = fakeClient({ data: { user: null, session: null }, error: new Error("Registration using this email domain is currently restricted.") });
    await expect(registerWithEmail(client as never, values, { check: okCheck(null) })).rejects.toThrow(REGISTRATION_COPY.restricted);
  });

  it("maps Supabase's email rate limit", async () => {
    const client = fakeClient({ data: { user: null, session: null }, error: new Error("email rate limit exceeded") });
    await expect(registerWithEmail(client as never, values, { check: okCheck(null) })).rejects.toThrow(REGISTRATION_COPY.tooManyEmails);
  });

  it("reports an address that already has an account", async () => {
    const client = fakeClient({ data: { user: { id: "u1", identities: [] }, session: null }, error: null });
    await expect(registerWithEmail(client as never, values, { check: okCheck(null) })).rejects.toThrow(/already exists/);
  });
});

describe("checkRegistrationEmail (mobile)", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("posts to the public check without a token", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { email: "a@b.co.za", domain: "b.co.za", attestation: null, attestationExpiresAt: null } }),
    });
    global.fetch = fetchMock as never;
    await expect(checkRegistrationEmail("a@b.co.za")).resolves.toMatchObject({ email: "a@b.co.za" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url).endsWith(EMAIL_CHECK_PATH)).toBe(true);
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.co.za" });
  });

  it("maps an API rejection", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: { code: "EMAIL_DOMAIN_RESTRICTED" } }) }) as never;
    await expect(checkRegistrationEmail("a@b.co.za")).rejects.toThrow(REGISTRATION_COPY.restricted);
  });

  it("fails safe when offline", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as never;
    await expect(checkRegistrationEmail("a@b.co.za")).rejects.toThrow(REGISTRATION_COPY.unavailable);
  });
});

describe("helpers", () => {
  it("maps API error codes", () => {
    expect(emailCheckMessage(new ApiError(422, "INVALID_EMAIL", "x"))).toBe(REGISTRATION_COPY.invalidEmail);
    expect(emailCheckMessage(new ApiError(422, "EMAIL_DOMAIN_UNDELIVERABLE", "x"))).toBe(REGISTRATION_COPY.undeliverable);
    expect(emailCheckMessage(new ApiError(503, "EMAIL_DOMAIN_CHECK_UNAVAILABLE", "x"))).toBe(REGISTRATION_COPY.unavailable);
  });

  it("resends the sign-up confirmation", async () => {
    const client = fakeClient();
    await resendSignupConfirmation(client as never, " a@b.co.za ");
    expect(client.auth.resend).toHaveBeenCalledWith({ type: "signup", email: "a@b.co.za", options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT } });
  });

  it("only trusts email_confirmed_at", () => {
    expect(isEmailVerified({ email_confirmed_at: "2026-11-12T10:00:00Z" })).toBe(true);
    expect(isEmailVerified({ email_confirmed_at: null, user_metadata: { email_verified: true } } as never)).toBe(false);
  });

  it("detects expired links", () => {
    expect(isExpiredLinkError({ error_code: "otp_expired" })).toBe(true);
    expect(isExpiredLinkError({ error_description: "Email link is invalid or has expired" })).toBe(true);
    expect(isExpiredLinkError({ error: "access_denied" })).toBe(false);
  });
});
