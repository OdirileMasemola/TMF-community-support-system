import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartHandshake,
  History,
  Search,
  UserRound,
} from "lucide-react";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";

export type ApplicationStatus = "Pending" | "Approved" | "Rejected" | "Completed";
export type AssignmentStatus = "Active" | "Upcoming" | "Completed";
export type UpdatePriority = "High" | "Medium" | "Normal";

export type VolunteerStatistic = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type VolunteerApplication = {
  id: string;
  campaign: string;
  category: string;
  preferredRole: string;
  appliedDate: string;
  status: ApplicationStatus;
};

export type VolunteerAssignment = {
  id: string;
  campaign: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  schedule: string;
  status: AssignmentStatus;
};

export type VolunteerHoursSummary = {
  totalHours: number;
  thisMonth: number;
  completedAssignments: number;
  averageHoursPerAssignment: number;
  monthlyProgress: number;
};

export type VolunteerOpportunity = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  roles: string[];
  image: string;
};

export type FoundationUpdate = {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: UpdatePriority;
  icon: LucideIcon;
};

export type VolunteerActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
};

export type VolunteerNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: UpdatePriority;
  unread: boolean;
  icon: LucideIcon;
};

export const volunteerProfile = {
  name: "Odirile Masemola",
  initials: "OM",
  volunteerId: "VOL-00124",
  email: "odirile@example.com",
  phone: "+27 72 000 0000",
  memberSince: "January 2026",
  status: "Active",
  preferredArea: "Community Outreach",
  totalHours: 48,
};

export const volunteerStatistics: VolunteerStatistic[] = [
  { id: "applications", title: "Applications", value: "6", detail: "Submitted this year", icon: ClipboardList },
  { id: "assignments", title: "Active Assignments", value: "2", detail: "Currently participating", icon: Briefcase },
  { id: "hours", title: "Hours Contributed", value: "48", detail: "Total volunteer time", icon: Clock3 },
  { id: "campaigns", title: "Campaigns Supported", value: "4", detail: "Helping local communities", icon: HeartHandshake },
];

export const volunteerApplications: VolunteerApplication[] = [
  {
    id: "app-1",
    campaign: "Food Support Drive",
    category: "Food Security",
    preferredRole: "Distribution Volunteer",
    appliedDate: "12 July 2026",
    status: "Approved",
  },
  {
    id: "app-2",
    campaign: "Youth Education Support",
    category: "Education",
    preferredRole: "Education Assistant",
    appliedDate: "18 July 2026",
    status: "Pending",
  },
  {
    id: "app-3",
    campaign: "Winter Relief Campaign",
    category: "Relief Support",
    preferredRole: "Community Support Volunteer",
    appliedDate: "20 July 2026",
    status: "Pending",
  },
  {
    id: "app-4",
    campaign: "Family Care Programme",
    category: "Social Welfare",
    preferredRole: "Family Support Volunteer",
    appliedDate: "05 June 2026",
    status: "Completed",
  },
  {
    id: "app-5",
    campaign: "Community Health Awareness",
    category: "Health Awareness",
    preferredRole: "Registration Support",
    appliedDate: "22 May 2026",
    status: "Approved",
  },
  {
    id: "app-6",
    campaign: "Back to School Drive",
    category: "Education",
    preferredRole: "Packing Volunteer",
    appliedDate: "10 April 2026",
    status: "Rejected",
  },
];

export const volunteerAssignments: VolunteerAssignment[] = [
  {
    id: "assign-1",
    campaign: "Food Support Drive",
    role: "Distribution Volunteer",
    location: "Katlehong Community Centre",
    startDate: "15 July 2026",
    endDate: "31 July 2026",
    schedule: "Saturday, 09:00 - 13:00",
    status: "Active",
  },
  {
    id: "assign-2",
    campaign: "Community Health Awareness",
    role: "Registration Support",
    location: "Katlehong Clinic Hall",
    startDate: "01 August 2026",
    endDate: "15 August 2026",
    schedule: "Wednesday, 10:00 - 14:00",
    status: "Upcoming",
  },
];

export const volunteerHoursSummary: VolunteerHoursSummary = {
  totalHours: 48,
  thisMonth: 16,
  completedAssignments: 3,
  averageHoursPerAssignment: 16,
  monthlyProgress: 67,
};

export const volunteerOpportunities: VolunteerOpportunity[] = [
  {
    id: "opp-1",
    title: "Winter Relief Campaign",
    category: "Relief Support",
    description: "Help distribute warm clothing and essentials to vulnerable households.",
    location: "Katlehong",
    date: "01 August 2026",
    roles: ["Distribution", "Packing", "Community Outreach"],
    image: winterReliefImage,
  },
  {
    id: "opp-2",
    title: "Youth Education Support",
    category: "Education",
    description: "Support learners with mentoring and classroom assistance programmes.",
    location: "Katlehong",
    date: "15 August 2026",
    roles: ["Mentoring", "Education Assistance"],
    image: youthEducationImage,
  },
  {
    id: "opp-3",
    title: "Community Health Awareness",
    category: "Health Awareness",
    description: "Assist with outreach and registration for community health sessions.",
    location: "Katlehong",
    date: "20 August 2026",
    roles: ["Community Outreach", "Registration Support"],
    image: communityHealthImage,
  },
  {
    id: "opp-4",
    title: "Food Support Drive",
    category: "Food Security",
    description: "Join packing and distribution teams for food parcel deliveries.",
    location: "Katlehong",
    date: "28 August 2026",
    roles: ["Packing", "Distribution"],
    image: foodSupportImage,
  },
];

export const foundationUpdates: FoundationUpdate[] = [
  {
    id: "update-1",
    title: "New volunteer opportunities are now available",
    description: "Browse open roles across winter relief, education, and health campaigns.",
    date: "Today",
    priority: "High",
    icon: Bell,
  },
  {
    id: "update-2",
    title: "Winter Relief Campaign begins next month",
    description: "Orientation sessions will be scheduled for approved volunteers.",
    date: "2 days ago",
    priority: "Medium",
    icon: Bell,
  },
  {
    id: "update-3",
    title: "Volunteer orientation session scheduled",
    description: "Join the upcoming briefing for new volunteer assignments.",
    date: "4 days ago",
    priority: "Normal",
    icon: Bell,
  },
  {
    id: "update-4",
    title: "Community outreach programme completed successfully",
    description: "Thank you to every volunteer who supported the latest outreach day.",
    date: "1 week ago",
    priority: "Normal",
    icon: HeartHandshake,
  },
];

export const volunteerActivities: VolunteerActivity[] = [
  {
    id: "activity-1",
    title: "Applied for Food Support Drive",
    description: "Application submitted for Distribution Volunteer role.",
    timestamp: "12 July 2026 · 10:30",
    icon: ClipboardList,
  },
  {
    id: "activity-2",
    title: "Application approved for Youth Education Support",
    description: "Your application was reviewed and approved by the TMF team.",
    timestamp: "15 July 2026 · 14:20",
    icon: BadgeCheck,
  },
  {
    id: "activity-3",
    title: "Completed volunteer assignment",
    description: "Family Care Programme session marked as complete.",
    timestamp: "20 July 2026 · 13:00",
    icon: CheckCircle2,
  },
  {
    id: "activity-4",
    title: "Updated volunteer profile",
    description: "Preferred volunteer area and contact details updated.",
    timestamp: "22 July 2026 · 09:15",
    icon: History,
  },
];

export const volunteerNotifications: VolunteerNotification[] = [
  {
    id: "notice-1",
    title: "Application approved",
    message: "Your Food Support Drive application has been approved.",
    timestamp: "15 July 2026 · 14:20",
    priority: "High",
    unread: true,
    icon: BadgeCheck,
  },
  {
    id: "notice-2",
    title: "Assignment reminder",
    message: "Your next Food Support Drive shift is Saturday at 09:00.",
    timestamp: "18 July 2026 · 08:00",
    priority: "Medium",
    unread: true,
    icon: Briefcase,
  },
  {
    id: "notice-3",
    title: "New opportunity available",
    message: "Winter Relief Campaign is now accepting volunteer applications.",
    timestamp: "17 July 2026 · 10:15",
    priority: "Normal",
    unread: false,
    icon: Bell,
  },
  {
    id: "notice-4",
    title: "Hours recorded",
    message: "16 volunteer hours were added for July assignments.",
    timestamp: "01 July 2026 · 11:40",
    priority: "Normal",
    unread: false,
    icon: Clock3,
  },
];

export const volunteerQuickActions = [
  {
    id: "opportunities",
    title: "Browse Opportunities",
    description: "Discover open volunteer roles across TMF campaigns.",
    icon: Search,
    route: "/volunteer/opportunities",
  },
  {
    id: "applications",
    title: "My Applications",
    description: "Track the status of your volunteer applications.",
    icon: ClipboardList,
    route: "/volunteer/applications",
  },
  {
    id: "assignments",
    title: "My Assignments",
    description: "View your active and upcoming volunteer work.",
    icon: Briefcase,
    route: "/volunteer/assignments",
  },
  {
    id: "hours",
    title: "Volunteer Hours",
    description: "Review your contribution hours and progress.",
    icon: Clock3,
    route: "/volunteer/hours",
  },
  {
    id: "profile",
    title: "Profile",
    description: "Review your volunteer details and preferences.",
    icon: UserRound,
    route: "/volunteer/profile",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay updated on applications and assignments.",
    icon: Bell,
    route: "/volunteer/notifications",
  },
];
