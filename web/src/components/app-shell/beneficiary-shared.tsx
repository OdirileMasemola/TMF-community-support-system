import {
  Bell,
  ClipboardList,
  HandHeart,
  HeartHandshake,
  HelpCircle,
  LayoutGrid,
  Settings,
  UserRound,
} from "lucide-react";
import type { SidebarNavGroup } from "@/components/app-shell/app-shared";

export const beneficiaryNavGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/beneficiary/dashboard",
        icon: <LayoutGrid className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Assistance",
    items: [
      {
        title: "Request Assistance",
        path: "/beneficiary/request",
        icon: <HandHeart className="size-4" aria-hidden="true" />,
      },
      {
        title: "My Requests",
        path: "/beneficiary/requests",
        icon: <ClipboardList className="size-4" aria-hidden="true" />,
      },
      {
        title: "Support Programmes",
        path: "/beneficiary/programmes",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
      {
        title: "Help & Support",
        path: "/beneficiary/help",
        icon: <HelpCircle className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        path: "/beneficiary/profile",
        icon: <UserRound className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/beneficiary/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/beneficiary/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];
