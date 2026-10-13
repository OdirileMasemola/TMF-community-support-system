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

/**
 * "5 minutes ago", "in 2 hours", "yesterday"…
 *
 * Built by hand on purpose: the Hermes engine that runs the release APK has no
 * Intl.RelativeTimeFormat, and calling it threw while rendering the
 * notifications screen, which closed the app.
 */
export function formatRelativeTime(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = date.getTime() - now;
  const future = diffMs > 0;
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);

  const phrase = (amount: number, unit: string) => {
    const text = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
    return future ? `in ${text}` : `${text} ago`;
  };

  if (minutes < 1) return "just now";
  if (minutes < 60) return phrase(minutes, "minute");
  if (hours < 24) return phrase(hours, "hour");
  if (days === 1) return future ? "tomorrow" : "yesterday";
  if (days < 30) return phrase(days, "day");
  return formatShortDate(value);
}

/** Full date and time for detail views, e.g. "13 Oct 2026, 14:05". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${formatShortDate(value)}, ${time}`;
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

export function notificationIsUnread(status: NotificationStatus | string | null | undefined): boolean {
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
