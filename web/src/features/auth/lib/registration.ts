import type { SupabaseClient } from "@supabase/supabase-js";
import { isApiError, publicApiData } from "@/lib/apiClient";

/*
 * Email registration, shared by the register page and the auth provider.
 *
 *   1. The TMF API checks the address: format, mail DNS (MX, or A/AAAA) and the domain policy that
 *      administrators manage. Nothing is checked only in the browser.
 *   2. Only then is Supabase signUp called, with the address the API normalised and, when the API
 *      issues one, its attestation (the Supabase Auth hook rejects sign-ups without it).
 *   3. Supabase emails a confirmation link. The account counts as verified only once Supabase has
 *      set email_confirmed_at; nothing here marks anyone as verified.
 *
 * The mobile app follows exactly the same steps against the same API endpoint.
 */

export const EMAIL_CHECK_PATH = "/api/v1/auth/registration/email-check";
/** Supabase allows one confirmation email per address per 60 seconds by default. */
export const RESEND_COOLDOWN_SECONDS = 60;

export const REGISTRATION_COPY = {
  invalidEmail: "Please enter a valid email address.",
  undeliverable: "This email domain is not configured to receive email.",
  restricted: "Registration using this email domain is currently restricted.",
  checkInbox: "Please check your inbox to verify your email address.",
  expired: "Your verification link has expired. Please request another one.",
  unavailable: "We could not check your email address right now. Please try again in a moment.",
  resent: "We sent you a new verification email.",
} as const;

export type EmailCheck = {
  email: string;
  domain: string;
  attestation: string | null;
  attestationExpiresAt: string | null;
};

/** User-facing copy for a failed email check; never the raw server or DNS error. */
export function emailCheckMessage(error: unknown): string {
  if (!isApiError(error)) return REGISTRATION_COPY.unavailable;
  switch (error.code) {
    case "INVALID_EMAIL":
    case "VALIDATION_ERROR":
      return REGISTRATION_COPY.invalidEmail;
    case "EMAIL_DOMAIN_UNDELIVERABLE":
      return REGISTRATION_COPY.undeliverable;
    case "EMAIL_DOMAIN_RESTRICTED":
      return REGISTRATION_COPY.restricted;
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return REGISTRATION_COPY.unavailable;
  }
}

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationError";
  }
}

export async function checkRegistrationEmail(email: string): Promise<EmailCheck> {
  try {
    return await publicApiData<EmailCheck>(EMAIL_CHECK_PATH, { email });
  } catch (error) {
    throw new RegistrationError(emailCheckMessage(error));
  }
}

export type RegistrationValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  organisationName?: string;
};

export type RegistrationResult = {
  /** The normalised address the confirmation email went to. */
  email: string;
  /** True when Supabase wants the address confirmed before the first sign-in. */
  needsEmailConfirmation: boolean;
  /** Set when Supabase signed the user straight in (confirmation turned off). */
  userId: string | null;
};

export async function registerWithEmail(
  client: Pick<SupabaseClient, "auth">,
  values: RegistrationValues,
  options: { emailRedirectTo: string; check?: (email: string) => Promise<EmailCheck> },
): Promise<RegistrationResult> {
  const check = await (options.check ?? checkRegistrationEmail)(values.email);
  const organisationName = values.organisationName?.trim();

  const { data, error } = await client.auth.signUp({
    email: check.email,
    password: values.password,
    options: {
      emailRedirectTo: options.emailRedirectTo,
      data: {
        full_name: values.fullName.trim(),
        phone_number: values.phoneNumber.trim() || null,
        role: values.role,
        ...(values.role === "sponsor" && organisationName ? { organisation_name: organisationName } : {}),
        ...(check.attestation ? { email_attestation: check.attestation } : {}),
      },
    },
  });
  if (error) throw error;

  // With confirmation on, Supabase does not reveal that an address is taken: it returns a user
  // with no identities and sends no email.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new RegistrationError("An account with this email already exists. Try signing in.");
  }

  return {
    email: check.email,
    needsEmailConfirmation: !data.session,
    userId: data.session ? (data.user?.id ?? null) : null,
  };
}

/** Sends the sign-up confirmation email again. Supabase rate-limits this per address. */
export async function resendSignupConfirmation(
  client: Pick<SupabaseClient, "auth">,
  email: string,
  emailRedirectTo: string,
): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) throw new RegistrationError(REGISTRATION_COPY.invalidEmail);
  const { error } = await client.auth.resend({ type: "signup", email: trimmed, options: { emailRedirectTo } });
  if (error) throw error;
}

/**
 * Only Supabase Auth's email_confirmed_at counts. user_metadata.email_verified is ignored on
 * purpose: a signed-in user can write their own user_metadata.
 */
export function isEmailVerified(user: { email_confirmed_at?: string | null } | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export type AuthLinkError = { kind: "expired" | "invalid"; message: string };

/**
 * Reads the error Supabase puts on the redirect after a failed email link, from the query string
 * (PKCE) or the fragment (implicit flow), e.g. #error=access_denied&error_code=otp_expired.
 */
export function readAuthLinkError(search: string, hash: string): AuthLinkError | null {
  const params = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const get = (key: string) => params.get(key) ?? fragment.get(key);
  const error = get("error");
  const code = get("error_code");
  const description = get("error_description") ?? "";
  if (!error && !code) return null;
  if (code === "otp_expired" || /expired/i.test(description)) {
    return { kind: "expired", message: REGISTRATION_COPY.expired };
  }
  return { kind: "invalid", message: "This link is invalid or has already been used. Please request a new one." };
}
