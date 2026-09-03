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
  path: string;
  icon?: ReactNode;
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
      },
      {
        title: "Reports",
        path: "/admin/reports",
        icon: <BarChart3 className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Campaigns",
        path: "/admin/campaigns",
        icon: <Megaphone className="size-4" aria-hidden="true" />,
      },
      {
        title: "Donations",
        path: "/admin/donations",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
      {
        title: "Volunteers",
        path: "/admin/volunteers",
        icon: <HandCoins className="size-4" aria-hidden="true" />,
      },
      {
        title: "Sponsors",
        path: "/admin/sponsors",
        icon: <UserRoundCheck className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        path: "/admin/users",
        icon: <Users className="size-4" aria-hidden="true" />,
      },
      {
        title: "Events",
        path: "/admin/events",
        icon: <CalendarDays className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/admin/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/admin/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];

export const navLinks: SidebarNavItem[] = navGroups.flatMap((group) => group.items);

export function getActiveNavItem(pathname: string) {
  return navLinks.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}
