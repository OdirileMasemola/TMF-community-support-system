import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  HandCoins,
  HeartHandshake,
  LayoutGrid,
  Megaphone,
  Settings,
  UserRoundCheck,
  Users,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/admin/dashboard",
        icon: <LayoutGrid className="size-4" aria-hidden="true" />,
        isActive: true,
      },
      {
        title: "Reports",
        path: "/reports",
        icon: <BarChart3 className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Campaigns",
        path: "/campaigns",
        icon: <Megaphone className="size-4" aria-hidden="true" />,
      },
      {
        title: "Donations",
        path: "/donations",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
      {
        title: "Volunteers",
        path: "/applications",
        icon: <HandCoins className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsors",
        path: "/sponsorships",
        icon: <UserRoundCheck className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        path: "/users",
        icon: <Users className="size-4" aria-hidden="true" />,
      },
      {
        title: "Events",
        path: "/events",
        icon: <CalendarDays className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];

export const navLinks: SidebarNavItem[] = navGroups.flatMap((group) => group.items);
