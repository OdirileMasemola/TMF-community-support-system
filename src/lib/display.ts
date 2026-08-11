import type {
  ApplicationStatus,
  AssignmentStatus,
  CampaignStatus,
  NotificationStatus,
  PaymentStatus,
  RequestStatus,
  VerificationStatus,
} from "@/types/database.types";

/** Convert snake_case / enum values into readable labels without mutating stored values. */
export function formatStatusLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatCurrency(amount: number | null | undefined, currency = "ZAR"): string {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(date);
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (minutes < 60) return rtf.format(Math.sign(diffMs) * minutes, "minute");
  if (hours < 24) return rtf.format(Math.sign(diffMs) * hours, "hour");
  if (days < 30) return rtf.format(Math.sign(diffMs) * days, "day");
  return formatShortDate(value);
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "TM";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "TM";
}

export function campaignProgress(amountRaised: number | null | undefined, fundingGoal: number | null | undefined): number {
  const raised = Number(amountRaised ?? 0);
  const goal = Number(fundingGoal ?? 0);
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function paymentStatusLabel(status: PaymentStatus | string): string {
  if (status === "successful") return "Verified";
  return formatStatusLabel(status);
}

export function verificationStatusLabel(status: VerificationStatus | string): string {
  if (status === "approved") return "Verified";
  return formatStatusLabel(status);
}

export function requestStatusLabel(status: RequestStatus | string): string {
  if (status === "pending") return "Submitted";
  return formatStatusLabel(status);
}

export function applicationStatusLabel(status: ApplicationStatus | string): string {
  return formatStatusLabel(status);
}

export function assignmentStatusLabel(status: AssignmentStatus | string): string {
  return formatStatusLabel(status);
}

export function campaignStatusLabel(status: CampaignStatus | string): string {
  return formatStatusLabel(status);
}

export function notificationIsUnread(status: NotificationStatus | string): boolean {
  return status === "unread";
}

export function roleHomePath(role: string | null | undefined): string {
  switch (role) {
    case "administrator":
      return "/admin/dashboard";
    case "donor":
      return "/donor/dashboard";
    case "volunteer":
      return "/volunteer/dashboard";
    case "beneficiary":
      return "/beneficiary/dashboard";
    case "sponsor":
      return "/sponsor/dashboard";
    default:
      return "/dashboard";
  }
}
