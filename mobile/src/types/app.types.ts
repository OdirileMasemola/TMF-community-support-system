export type UserRole = "administrator" | "volunteer" | "beneficiary" | "donor" | "sponsor";

export type NavItem = {
  label: string;
  path: string;
  roles?: UserRole[];
};
