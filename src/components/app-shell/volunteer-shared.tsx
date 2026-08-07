import {
  Bell,
  Briefcase,
  ClipboardList,
  Clock3,
  LayoutGrid,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import type { SidebarNavGroup } from "@/components/app-shell/app-shared";

export const volunteerNavGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/volunteer/dashboard",
        icon: <LayoutGrid className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Volunteering",
    items: [
      {
        title: "Browse Opportunities",
        path: "/volunteer/opportunities",
        icon: <Search className="size-4" aria-hidden="true" />,
      },
      {
        title: "My Applications",
        path: "/volunteer/applications",
        icon: <ClipboardList className="size-4" aria-hidden="true" />,
      },
      {
        title: "My Assignments",
        path: "/volunteer/assignments",
        icon: <Briefcase className="size-4" aria-hidden="true" />,
      },
      {
        title: "Volunteer Hours",
        path: "/volunteer/hours",
        icon: <Clock3 className="size-4" aria-hidden="true" />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        path: "/volunteer/profile",
        icon: <UserRound className="size-4" aria-hidden="true" />,
      },
      {
        title: "Notifications",
        path: "/volunteer/notifications",
        icon: <Bell className="size-4" aria-hidden="true" />,
      },
      {
        title: "Settings",
        path: "/volunteer/settings",
        icon: <Settings className="size-4" aria-hidden="true" />,
      },
    ],
  },
];
