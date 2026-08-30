import type { ComponentType } from "react";
import {
  CalendarCheck2,
  ClipboardList,
  Clock4,
  HandCoins,
  Handshake,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Search,
  SendHorizonal,
  Users,
} from "lucide-react-native";
import type { UserRole } from "@/types/app.types";

export type PortalTab = {
  label: string;
  /** Absolute expo-router path, e.g. "/donor/campaigns". */
  route: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

/**
 * Mobile carries only the major features of each web portal; the long tail
 * (reports, settings, admin events, impact breakdowns) stays on the web app.
 * Four tabs is the most that stays comfortably tappable, so notifications and
 * profile live in the portal top bar instead.
 */
export const portalTabs: Record<UserRole, PortalTab[]> = {
  administrator: [
    { label: "Overview", route: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Reviews", route: "/admin/reviews", icon: ClipboardList },
    { label: "Users", route: "/admin/users", icon: Users },
    { label: "Campaigns", route: "/admin/campaigns", icon: Megaphone },
  ],
  donor: [
    { label: "Overview", route: "/donor/dashboard", icon: LayoutDashboard },
    { label: "Donate", route: "/donor/donate", icon: HandCoins },
    { label: "Campaigns", route: "/donor/campaigns", icon: Megaphone },
    { label: "History", route: "/donor/donations", icon: Receipt },
  ],
  volunteer: [
    { label: "Overview", route: "/volunteer/dashboard", icon: LayoutDashboard },
    { label: "Find", route: "/volunteer/opportunities", icon: Search },
    { label: "Applied", route: "/volunteer/applications", icon: ClipboardList },
    { label: "Hours", route: "/volunteer/hours", icon: Clock4 },
  ],
  beneficiary: [
    { label: "Overview", route: "/beneficiary/dashboard", icon: LayoutDashboard },
    { label: "Ask", route: "/beneficiary/request", icon: SendHorizonal },
    { label: "Requests", route: "/beneficiary/requests", icon: Inbox },
    { label: "Collect", route: "/beneficiary/programmes", icon: CalendarCheck2 },
  ],
  sponsor: [
    { label: "Overview", route: "/sponsor/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", route: "/sponsor/campaigns", icon: Megaphone },
    { label: "Pledges", route: "/sponsor/sponsorships", icon: Handshake },
    { label: "Requests", route: "/sponsor/requests", icon: Inbox },
  ],
};

const portalNames: Record<UserRole, string> = {
  administrator: "Administrator portal",
  donor: "Donor portal",
  volunteer: "Volunteer portal",
  beneficiary: "Beneficiary portal",
  sponsor: "Sponsor portal",
};

export function portalNameFor(role: UserRole | string | null | undefined): string {
  return portalNames[role as UserRole] ?? "TMF portal";
}

/** The first path segment of a role's portal, e.g. "administrator" -> "admin". */
export function portalSegmentFor(role: UserRole | string | null | undefined): string | null {
  const tabs = portalTabs[role as UserRole];
  if (!tabs?.length) return null;
  return tabs[0].route.split("/")[1] ?? null;
}
