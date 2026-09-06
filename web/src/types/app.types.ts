export type UserRole = "administrator" | "volunteer" | "beneficiary" | "donor" | "sponsor";

/** Roles a person may choose during public registration. Administrator is invite-only. */
export const PUBLIC_SIGNUP_ROLES = ["volunteer", "beneficiary", "donor", "sponsor"] as const;

export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export function isPublicSignupRole(role: string): role is PublicSignupRole {
  return (PUBLIC_SIGNUP_ROLES as readonly string[]).includes(role);
}

export type NavItem = {
  label: string;
  path: string;
  roles?: UserRole[];
};
