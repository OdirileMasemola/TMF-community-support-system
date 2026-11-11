import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, getApiBaseUrl, isApiError } from "@/lib/apiClient";
import { WEB_APP_URL } from "@/lib/links";

/*
 * Email registration, the same steps as the web app (web/src/features/auth/lib/registration.ts):
 *
 *   1. The TMF API checks the address: format, mail DNS (MX, or A/AAAA) and the domain policy that
 *      administrators manage.
 *   2. Only then is Supabase signUp called, with the address the API normalised and, when issued,
 *      the API's attestation (the Supabase Auth hook rejects sign-ups without it).
 *   3. Supabase emails a confirmation link. Verified means Supabase set email_confirmed_at.
 */

export const EMAIL_CHECK_PATH = "/api/v1/auth/registration/email-check";
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Confirmation links open the website's callback page, which works on any device and handles
 * expired links (with a resend form). After confirming, the user signs in here.
 */
export const EMAIL_CONFIRMATION_REDIRECT = `${WEB_APP_URL}/auth/callback`;

export const REGISTRATION_COPY = {
  invalidEmail: "Please enter a valid email address.",
  undeliverable: "This email domain is not configured to receive email.",
  restricted: "Registration using this email domain is currently restricted.",
  checkInbox: "Please check your inbox to verify your email address.",
  expired: "Your verification link has expired. Please request another one.",
  unavailable: "We could not check your email address right now. Please try again in a moment.",
  resent: "We sent you a new verification email.",
  tooManyEmails: "We have sent too many emails to this address. Please wait a while before requesting another one.",
} as const;

export type EmailCheck = {
  email: string;
  domain: string;
  attestation: string | null;
  attestationExpiresAt: string | null;
};

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

/** Maps Supabase Auth errors about registration and confirmation emails to safe copy. */
export function registrationAuthMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/not configured to receive email|could not verify this email domain/.test(message)) return REGISTRATION_COPY.undeliverable;
  if (/email domain is currently restricted/.test(message)) return REGISTRATION_COPY.restricted;
  if (/please enter a valid email address|unable to validate email/.test(message)) return REGISTRATION_COPY.invalidEmail;
  if (/email rate limit|email limit|over_email_send_rate_limit|for security purposes/.test(message)) return REGISTRATION_COPY.tooManyEmails;
  return null;
}

export async function checkRegistrationEmail(email: string): Promise<EmailCheck> {
  try {
    // Public route: no access token (the person has no account yet).
    const response = await fetch(`${getApiBaseUrl()}${EMAIL_CHECK_PATH}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      let code = "REQUEST_FAILED";
      try {
        const body = (await response.json()) as { error?: { code?: string } };
        if (typeof body.error?.code === "string") code = body.error.code;
      } catch {
        // Not JSON; the status is enough.
      }
      throw new ApiError(response.status, code, "Email check failed");
    }
    return ((await response.json()) as { data: EmailCheck }).data;
  } catch (error) {
    throw new Error(emailCheckMessage(error));
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
  email: string;
  needsEmailConfirmation: boolean;
  userId: string | null;
};

export async function registerWithEmail(
  client: Pick<SupabaseClient, "auth">,
  values: RegistrationValues,
  options: { emailRedirectTo?: string; check?: (email: string) => Promise<EmailCheck> } = {},
): Promise<RegistrationResult> {
  const check = await (options.check ?? checkRegistrationEmail)(values.email);
  const organisationName = values.organisationName?.trim();

  const { data, error } = await client.auth.signUp({
    email: check.email,
    password: values.password,
    options: {
      emailRedirectTo: options.emailRedirectTo ?? EMAIL_CONFIRMATION_REDIRECT,
      data: {
        full_name: values.fullName.trim(),
        phone_number: values.phoneNumber.trim() || null,
        role: values.role,
        ...(values.role === "sponsor" && organisationName ? { organisation_name: organisationName } : {}),
        ...(check.attestation ? { email_attestation: check.attestation } : {}),
      },
    },
  });
  if (error) {
    const safe = registrationAuthMessage(error);
    throw safe ? new Error(safe) : error;
  }

  // With confirmation on, Supabase does not reveal that an address is taken: it returns a user
  // with no identities and sends no email.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("An account with this email address already exists. Sign in instead.");
  }

  return {
    email: check.email,
    needsEmailConfirmation: !data.session,
    userId: data.session ? (data.user?.id ?? null) : null,
  };
}

export async function resendSignupConfirmation(client: Pick<SupabaseClient, "auth">, email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) throw new Error(REGISTRATION_COPY.invalidEmail);
  const { error } = await client.auth.resend({
    type: "signup",
    email: trimmed,
    options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT },
  });
  if (error) {
    const safe = registrationAuthMessage(error);
    throw safe ? new Error(safe) : error;
  }
}

/** Only Supabase Auth's email_confirmed_at counts; user_metadata is user-editable. */
export function isEmailVerified(user: { email_confirmed_at?: string | null } | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function isExpiredLinkError(params: { error?: string; error_code?: string; error_description?: string }): boolean {
  return params.error_code === "otp_expired" || /expired/i.test(params.error_description ?? "");
}
