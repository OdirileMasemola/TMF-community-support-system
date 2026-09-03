import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HandHeart,
  HeartHandshake,
  HelpCircle,
  History,
  MessageCircle,
  PackageCheck,
  UserRound,
} from "lucide-react";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.webp";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";

export type AssistanceRequestStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Completed";

export type AssistancePriority = "High" | "Medium" | "Low";
export type EligibilityStatus = "Eligible" | "Pending Review" | "Not Eligible";
export type ProgrammeStatus = "Open" | "Closing Soon" | "Closed";
export type ScheduleStatus = "Upcoming" | "Confirmed" | "Completed";
export type TimelineState = "completed" | "current" | "upcoming";
export type AnnouncementCategory = "Programme" | "Collection" | "Deadline" | "General";

export type BeneficiaryStatistic = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type StatusOverviewItem = {
  id: string;
  status: AssistanceRequestStatus;
  count: number;
};

export type AssistanceRequest = {
  id: string;
  requestId: string;
  assistanceType: string;
  dateSubmitted: string;
  status: AssistanceRequestStatus;
  priority: AssistancePriority;
};

export type SupportProgramme = {
  id: string;
  name: string;
  description: string;
  eligibility: EligibilityStatus;
  status: ProgrammeStatus;
  image: string;
};

export type BeneficiaryUpdate = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: AssistanceRequestStatus | "Info";
  icon: LucideIcon;
};

export type AssistanceSchedule = {
  id: string;
  programme: string;
  collectionDate: string;
  location: string;
  time: string;
  status: ScheduleStatus;
};

export type TimelineStage = {
  id: string;
  title: string;
  description: string;
  date: string;
  state: TimelineState;
  icon: LucideIcon;
};

export type FoundationAnnouncement = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: AnnouncementCategory;
};

export type BeneficiaryNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  icon: LucideIcon;
};

export const beneficiaryProfile = {
  name: "Odirile Masemola",
  initials: "OM",
  email: "odirile@example.com",
  phone: "+27 72 000 0000",
  residentialArea: "Katlehong",
  memberSince: "March 2026",
  totalRequests: 8,
};

export const beneficiaryStatistics: BeneficiaryStatistic[] = [
  {
    id: "total-requests",
    title: "Total Requests",
    value: "8",
    detail: "Assistance requests submitted",
    icon: FileText,
  },
  {
    id: "approved-requests",
    title: "Approved Requests",
    value: "5",
    detail: "Approved by the foundation",
    icon: BadgeCheck,
  },
  {
    id: "pending-requests",
    title: "Pending Requests",
    value: "2",
    detail: "Awaiting review or approval",
    icon: Clock3,
  },
  {
    id: "support-received",
    title: "Support Received",
    value: "6",
    detail: "Assistance packages collected",
    icon: PackageCheck,
  },
];

export const assistanceStatusOverview: StatusOverviewItem[] = [
  { id: "submitted", status: "Submitted", count: 1 },
  { id: "under-review", status: "Under Review", count: 2 },
  { id: "approved", status: "Approved", count: 3 },
  { id: "rejected", status: "Rejected", count: 1 },
  { id: "completed", status: "Completed", count: 1 },
];

export const assistanceRequests: AssistanceRequest[] = [
  {
    id: "req-1",
    requestId: "REQ-001",
    assistanceType: "Food Support",
    dateSubmitted: "12 July 2026",
    status: "Approved",
    priority: "High",
  },
  {
    id: "req-2",
    requestId: "REQ-002",
    assistanceType: "Winter Relief",
    dateSubmitted: "18 July 2026",
    status: "Under Review",
    priority: "High",
  },
  {
    id: "req-3",
    requestId: "REQ-003",
    assistanceType: "Youth Education Support",
    dateSubmitted: "20 July 2026",
    status: "Submitted",
    priority: "Medium",
  },
  {
    id: "req-4",
    requestId: "REQ-004",
    assistanceType: "Family Care",
    dateSubmitted: "05 June 2026",
    status: "Completed",
    priority: "Medium",
  },
  {
    id: "req-5",
    requestId: "REQ-005",
    assistanceType: "Community Health Support",
    dateSubmitted: "22 May 2026",
    status: "Approved",
    priority: "Low",
  },
  {
    id: "req-6",
    requestId: "REQ-006",
    assistanceType: "Back to School Support",
    dateSubmitted: "10 April 2026",
    status: "Rejected",
    priority: "Low",
  },
];

export const supportProgrammes: SupportProgramme[] = [
  {
    id: "prog-1",
    name: "Food Support Drive",
    description: "Monthly food parcels for households facing food insecurity.",
    eligibility: "Eligible",
    status: "Open",
    image: foodSupportImage,
  },
  {
    id: "prog-2",
    name: "Winter Relief",
    description: "Warm clothing and essentials for vulnerable families this winter.",
    eligibility: "Eligible",
    status: "Open",
    image: winterReliefImage,
  },
  {
    id: "prog-3",
    name: "Youth Education Support",
    description: "School supplies and learning support for learners in need.",
    eligibility: "Pending Review",
    status: "Closing Soon",
    image: youthEducationImage,
  },
  {
    id: "prog-4",
    name: "Family Care Programme",
    description: "Household care packs and family welfare support.",
    eligibility: "Eligible",
    status: "Open",
    image: familyCareImage,
  },
  {
    id: "prog-5",
    name: "Community Health Awareness",
    description: "Health outreach sessions and wellness support in Katlehong.",
    eligibility: "Not Eligible",
    status: "Closed",
    image: communityHealthImage,
  },
];

export const recentUpdates: BeneficiaryUpdate[] = [
  {
    id: "update-1",
    title: "Food Support request approved",
    description: "Your Food Support request has been approved. Collection details will follow shortly.",
    timestamp: "15 July 2026 · 14:20",
    status: "Approved",
    icon: BadgeCheck,
  },
  {
    id: "update-2",
    title: "Winter Relief under review",
    description: "Your Winter Relief application is currently under review by the TMF team.",
    timestamp: "18 July 2026 · 10:05",
    status: "Under Review",
    icon: Clock3,
  },
  {
    id: "update-3",
    title: "Supporting documents requested",
    description: "Additional supporting documents have been requested for your Youth Education application.",
    timestamp: "20 July 2026 · 09:40",
    status: "Info",
    icon: FileText,
  },
  {
    id: "update-4",
    title: "Family Care assistance collected",
    description: "Your Family Care assistance was marked as collected successfully.",
    timestamp: "05 June 2026 · 13:00",
    status: "Completed",
    icon: CheckCircle2,
  },
];

export const upcomingSchedules: AssistanceSchedule[] = [
  {
    id: "schedule-1",
    programme: "Food Support Drive",
    collectionDate: "26 July 2026",
    location: "Katlehong Community Centre",
    time: "09:00 - 12:00",
    status: "Confirmed",
  },
  {
    id: "schedule-2",
    programme: "Winter Relief",
    collectionDate: "02 August 2026",
    location: "TMF Distribution Point, Katlehong",
    time: "10:00 - 14:00",
    status: "Upcoming",
  },
  {
    id: "schedule-3",
    programme: "Youth Education Support",
    collectionDate: "15 August 2026",
    location: "Katlehong Library Hall",
    time: "11:00 - 13:00",
    status: "Upcoming",
  },
];

export const assistanceTimeline: TimelineStage[] = [
  {
    id: "stage-1",
    title: "Application Submitted",
    description: "Your assistance request was received by the foundation.",
    date: "12 July 2026",
    state: "completed",
    icon: ClipboardList,
  },
  {
    id: "stage-2",
    title: "Application Under Review",
    description: "The TMF team reviewed your application details.",
    date: "13 July 2026",
    state: "completed",
    icon: Clock3,
  },
  {
    id: "stage-3",
    title: "Documents Verified",
    description: "Supporting documents were verified successfully.",
    date: "14 July 2026",
    state: "completed",
    icon: FileText,
  },
  {
    id: "stage-4",
    title: "Application Approved",
    description: "Your Food Support request was approved.",
    date: "15 July 2026",
    state: "current",
    icon: BadgeCheck,
  },
  {
    id: "stage-5",
    title: "Assistance Collected",
    description: "Collect your approved assistance at the scheduled location.",
    date: "26 July 2026",
    state: "upcoming",
    icon: PackageCheck,
  },
];

export const foundationAnnouncements: FoundationAnnouncement[] = [
  {
    id: "announcement-1",
    title: "Winter Relief registrations are now open",
    description: "Eligible households can request winter clothing and essentials support.",
    date: "Today",
    category: "Programme",
  },
  {
    id: "announcement-2",
    title: "Food parcel collection dates have changed",
    description: "Please check your upcoming schedule for the updated collection window.",
    date: "2 days ago",
    category: "Collection",
  },
  {
    id: "announcement-3",
    title: "Youth Education applications close this Friday",
    description: "Submit any outstanding documents before the deadline.",
    date: "3 days ago",
    category: "Deadline",
  },
  {
    id: "announcement-4",
    title: "Community support briefing this week",
    description: "Join the foundation briefing for beneficiaries with approved requests.",
    date: "1 week ago",
    category: "General",
  },
];

export const beneficiaryNotifications: BeneficiaryNotification[] = [
  {
    id: "notice-1",
    title: "Request approved",
    message: "Your Food Support request has been approved.",
    timestamp: "15 July 2026 · 14:20",
    unread: true,
    icon: BadgeCheck,
  },
  {
    id: "notice-2",
    title: "Documents requested",
    message: "Additional supporting documents are needed for Youth Education Support.",
    timestamp: "20 July 2026 · 09:40",
    unread: true,
    icon: FileText,
  },
  {
    id: "notice-3",
    title: "Collection reminder",
    message: "Your Food Support collection is scheduled for 26 July 2026.",
    timestamp: "22 July 2026 · 08:00",
    unread: false,
    icon: PackageCheck,
  },
  {
    id: "notice-4",
    title: "Programme update",
    message: "Winter Relief registrations are now open for eligible beneficiaries.",
    timestamp: "17 July 2026 · 10:15",
    unread: false,
    icon: Bell,
  },
];

export const beneficiaryQuickActions = [
  {
    id: "request-assistance",
    title: "Request Assistance",
    description: "Submit a new assistance request to the foundation.",
    icon: HandHeart,
    route: "/beneficiary/request",
  },
  {
    id: "view-requests",
    title: "View My Requests",
    description: "Track the status of your assistance applications.",
    icon: ClipboardList,
    route: "/beneficiary/requests",
  },
  {
    id: "browse-programmes",
    title: "Browse Campaigns",
    description: "Explore support programmes you may qualify for.",
    icon: HeartHandshake,
    route: "/beneficiary/programmes",
  },
  {
    id: "contact-foundation",
    title: "Contact Foundation",
    description: "Reach the TMF team for help with your application.",
    icon: MessageCircle,
    route: "/beneficiary/help",
  },
  {
    id: "update-profile",
    title: "Update Profile",
    description: "Review and update your beneficiary details.",
    icon: UserRound,
    route: "/beneficiary/profile",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay updated on request progress and announcements.",
    icon: Bell,
    route: "/beneficiary/notifications",
  },
  {
    id: "help-faq",
    title: "View FAQ",
    description: "Find answers about assistance requests and collections.",
    icon: HelpCircle,
    route: "/beneficiary/help",
  },
  {
    id: "request-history",
    title: "Request History",
    description: "Review previous assistance activity and outcomes.",
    icon: History,
    route: "/beneficiary/requests",
  },
];
