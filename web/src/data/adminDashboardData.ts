import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  FileCheck,
  HandCoins,
  HeartHandshake,
  HelpCircle,
  Megaphone,
  PlusCircle,
  Settings,
  UserPlus,
  UserRoundCheck,
  Users,
} from "lucide-react";

export type Priority = "Low" | "Medium" | "High";

export type PerformanceTrend = "up" | "down" | "neutral";

export interface DashboardStatistic {
  id: string;
  title: string;
  value: number | string;
  trend: string;
  icon: LucideIcon;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
}

export interface SystemSummaryMetric {
  id: string;
  label: string;
  progress: number;
}

export interface PendingAction {
  id: string;
  title: string;
  count: number;
  priority: Priority;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
}

export interface PerformanceMetric {
  id: string;
  title: string;
  percentage: number;
  description: string;
  trend: PerformanceTrend;
  trendLabel: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  timestamp: string;
  unread: boolean;
  icon: LucideIcon;
}

export interface WelcomeSummary {
  greeting: string;
  operationalSummary: string[];
}

export const welcomeSummary: WelcomeSummary = {
  greeting: "Welcome back, Administrator.",
  operationalSummary: [
    "Everything is running smoothly today.",
    "2 campaigns require attention.",
    "5 new volunteer applications are waiting for review.",
  ],
};

export const dashboardStatistics: DashboardStatistic[] = [
  {
    id: "total-users",
    title: "Total Users",
    value: 248,
    trend: "+12 this month",
    icon: Users,
  },
  {
    id: "active-campaigns",
    title: "Active Campaigns",
    value: 14,
    trend: "+3 this month",
    icon: Megaphone,
  },
  {
    id: "total-donations",
    title: "Total Donations",
    value: "R185,420",
    trend: "+18% this month",
    icon: HeartHandshake,
  },
  {
    id: "volunteer-applications",
    title: "Volunteer Applications",
    value: 37,
    trend: "+5 this week",
    icon: HandCoins,
  },
  {
    id: "sponsors",
    title: "Sponsors",
    value: 22,
    trend: "+2 this month",
    icon: UserRoundCheck,
  },
  {
    id: "beneficiary-requests",
    title: "Beneficiary Requests",
    value: 19,
    trend: "+4 this week",
    icon: ClipboardList,
  },
  {
    id: "events",
    title: "Events",
    value: 8,
    trend: "+1 upcoming",
    icon: CalendarDays,
  },
  {
    id: "pending-reviews",
    title: "Pending Reviews",
    value: 11,
    trend: "Requires attention",
    icon: CircleAlert,
  },
];

export const recentActivities: ActivityItem[] = [
  {
    id: "activity-1",
    title: "Volunteer application received",
    description: "Thabo M. submitted a new volunteer application for community outreach.",
    timestamp: "5 minutes ago",
    icon: UserPlus,
  },
  {
    id: "activity-2",
    title: "Donation proof submitted",
    description: "A donor uploaded proof of payment for the Winter Relief campaign.",
    timestamp: "22 minutes ago",
    icon: FileCheck,
  },
  {
    id: "activity-3",
    title: "Campaign created",
    description: "Youth Education Support campaign was published by an administrator.",
    timestamp: "1 hour ago",
    icon: PlusCircle,
  },
  {
    id: "activity-4",
    title: "Sponsor registered",
    description: "GreenFuture Holdings completed sponsor registration.",
    timestamp: "2 hours ago",
    icon: Building2,
  },
  {
    id: "activity-5",
    title: "Beneficiary request submitted",
    description: "A new assistance request was submitted for family care support.",
    timestamp: "3 hours ago",
    icon: HelpCircle,
  },
  {
    id: "activity-6",
    title: "Event updated",
    description: "Community Health Awareness event schedule was updated.",
    timestamp: "5 hours ago",
    icon: Calendar,
  },
];

export const systemSummaryMetrics: SystemSummaryMetric[] = [
  { id: "campaign-completion", label: "Campaign Completion", progress: 72 },
  { id: "volunteer-capacity", label: "Volunteer Capacity", progress: 64 },
  { id: "donation-goal", label: "Donation Goal", progress: 81 },
  { id: "community-reach", label: "Community Reach", progress: 58 },
];

export const pendingActions: PendingAction[] = [
  {
    id: "pending-volunteers",
    title: "Pending Volunteer Applications",
    count: 5,
    priority: "High",
  },
  {
    id: "pending-donations",
    title: "Pending Donation Verifications",
    count: 3,
    priority: "High",
  },
  {
    id: "pending-sponsors",
    title: "Pending Sponsor Requests",
    count: 2,
    priority: "Medium",
  },
  {
    id: "pending-assistance",
    title: "Pending Assistance Requests",
    count: 4,
    priority: "High",
  },
  {
    id: "campaign-deadlines",
    title: "Upcoming Campaign Deadlines",
    count: 2,
    priority: "Medium",
  },
];

export const quickActions: QuickAction[] = [
  {
    id: "manage-users",
    title: "Manage Users",
    description: "View and manage registered platform users.",
    icon: Users,
    route: "/admin/users",
  },
  {
    id: "manage-campaigns",
    title: "Manage Campaigns",
    description: "Create, update, and monitor foundation campaigns.",
    icon: Megaphone,
    route: "/admin/campaigns",
  },
  {
    id: "review-donations",
    title: "Review Donations",
    description: "Verify donation proofs and track contributions.",
    icon: HeartHandshake,
    route: "/admin/donations",
  },
  {
    id: "manage-sponsors",
    title: "Manage Sponsors",
    description: "Review sponsor applications and partnerships.",
    icon: UserRoundCheck,
    route: "/admin/sponsors",
  },
  {
    id: "manage-volunteers",
    title: "Manage Volunteers",
    description: "Process volunteer applications and assignments.",
    icon: HandCoins,
    route: "/admin/volunteers",
  },
  {
    id: "view-reports",
    title: "View Reports",
    description: "Access operational and financial reports.",
    icon: BarChart3,
    route: "/admin/reports",
  },
  {
    id: "manage-events",
    title: "Manage Events",
    description: "Schedule and update community events.",
    icon: CalendarDays,
    route: "/admin/events",
  },
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure platform preferences and access controls.",
    icon: Settings,
    route: "/admin/settings",
  },
];

export const performanceMetrics: PerformanceMetric[] = [
  {
    id: "campaign-success",
    title: "Campaign Success Rate",
    percentage: 87,
    description: "Campaigns reaching their stated goals on schedule.",
    trend: "up",
    trendLabel: "+4% vs last quarter",
  },
  {
    id: "volunteer-participation",
    title: "Volunteer Participation",
    percentage: 76,
    description: "Active volunteers contributing to ongoing programmes.",
    trend: "up",
    trendLabel: "+6% vs last month",
  },
  {
    id: "donation-growth",
    title: "Donation Growth",
    percentage: 92,
    description: "Year-over-year increase in verified donations.",
    trend: "up",
    trendLabel: "+12% vs last year",
  },
  {
    id: "community-assistance",
    title: "Community Assistance",
    percentage: 83,
    description: "Beneficiary requests resolved within target timelines.",
    trend: "neutral",
    trendLabel: "Stable this month",
  },
];

export const dashboardNotifications: DashboardNotification[] = [
  {
    id: "notification-1",
    title: "New campaign submitted",
    timestamp: "10 minutes ago",
    unread: true,
    icon: Megaphone,
  },
  {
    id: "notification-2",
    title: "Donation awaiting verification",
    timestamp: "35 minutes ago",
    unread: true,
    icon: HeartHandshake,
  },
  {
    id: "notification-3",
    title: "Volunteer approved",
    timestamp: "2 hours ago",
    unread: false,
    icon: UserPlus,
  },
  {
    id: "notification-4",
    title: "Sponsor application received",
    timestamp: "4 hours ago",
    unread: true,
    icon: Building2,
  },
  {
    id: "notification-5",
    title: "Community event updated",
    timestamp: "Yesterday",
    unread: false,
    icon: Bell,
  },
];
