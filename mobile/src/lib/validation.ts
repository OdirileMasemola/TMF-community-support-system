import type { UserRole } from "@/types/app.types";

/** Roles a person can pick for themselves. Administrators are only ever granted by another administrator. */
export const PUBLIC_SIGNUP_ROLES = ["donor", "volunteer", "beneficiary", "sponsor"] as const;
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

/** Same minimum as the web registration form. */
export const MIN_PASSWORD_LENGTH = 8;

export type RegistrationValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: PublicSignupRole | null;
  organisationName: string;
};

export function isPublicSignupRole(role: UserRole | string | null | undefined): role is PublicSignupRole {
  return PUBLIC_SIGNUP_ROLES.includes(role as PublicSignupRole);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Optional field: blank is fine, otherwise 9 to 15 digits with the usual separators. */
export function isValidPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

/** Returns the first problem as a sentence the user can act on, or null when the email is usable. */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Enter your email address.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  return null;
}

/** Returns the first problem with the registration form, or null when it can be submitted. */
export function validateRegistration(values: RegistrationValues): string | null {
  if (!values.fullName.trim()) return "Enter your full name.";

  const emailProblem = validateEmail(values.email);
  if (emailProblem) return emailProblem;

  if (!isValidPhoneNumber(values.phoneNumber)) return "Enter a valid phone number, or leave it blank.";

  if (!values.role || !isPublicSignupRole(values.role)) return "Choose how you are joining TMF.";

  if (values.role === "sponsor" && !values.organisationName.trim()) {
    return "Enter your organisation's name.";
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (values.password !== values.confirmPassword) return "The passwords do not match.";

  return null;
}
