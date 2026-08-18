import {
  Bell,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  History,
  LayoutGrid,
  Settings,
  TrendingUp,
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
        path: "/sponsor/campaigns",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsor a campaign",
        path: "/sponsor/sponsorships",
        icon: <HandCoins className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsorship requests",
        path: "/sponsor/requests",
        icon: <ClipboardList className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsorship history",
        path: "/sponsor/history",
        icon: <History className="size-4" aria-hidden="true" />,
      },
      {
        title: "Community impact",
        path: "/sponsor/impact",
        icon: <TrendingUp className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        path: "/sponsor/profile",
        icon: <UserRound className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/sponsor/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/sponsor/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];
