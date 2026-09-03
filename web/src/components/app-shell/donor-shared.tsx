import {
  Bell,
  HandCoins,
  HeartHandshake,
  History,
  LayoutGrid,
  Receipt,
  Settings,
  UserRound,
} from "lucide-react";
import type { SidebarNavGroup } from "@/components/app-shell/app-shared";

export const donorNavGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/donor/dashboard",
        icon: <LayoutGrid className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        title: "Make a donation",
        path: "/donor/dashboard/donate",
        icon: <HandCoins className="size-4" aria-hidden="true" />,
      },
      {
        title: "Browse campaigns",
        path: "/donor/dashboard/campaigns",
        icon: <HeartHandshake className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Donations",
    items: [
      {
        title: "Donation history",
        path: "/donor/dashboard/donations",
        icon: <History className="size-4" aria-hidden="true" />,
      },
      {
        title: "Proof of payment",
        path: "/donor/dashboard/proof-of-payment",
        icon: <Receipt className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        path: "/donor/dashboard/profile",
        icon: <UserRound className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/donor/dashboard/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/donor/dashboard/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];
