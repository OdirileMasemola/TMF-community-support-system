import {
  Bell,
  Building2,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  History,
  LayoutGrid,
  Settings,
  UserRound,
} from "lucide-react";
import type { SidebarNavGroup } from "@/components/app-shell/app-shared";

export const sponsorNavGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/sponsor/dashboard",
        icon: <LayoutGrid className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Sponsorship",
    items: [
      {
        title: "Sponsored campaigns",
        path: "/sponsor/dashboard#sponsored-campaigns",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsorship requests",
        path: "/sponsor/dashboard#sponsorship-requests",
        icon: <ClipboardList className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsorship history",
        path: "/sponsor/dashboard#sponsorship-history",
        icon: <History className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsor a campaign",
        path: "/sponsor/dashboard#sponsor-campaign",
        icon: <HandCoins className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Organisation profile",
        path: "/sponsor/dashboard#organisation-profile",
        icon: <Building2 className="size-4" aria-hidden="true" />,
      },
      {
        title: "Profile",
        path: "/sponsor/dashboard",
        icon: <UserRound className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/sponsor/dashboard#foundation-updates",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/sponsor/dashboard",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];
