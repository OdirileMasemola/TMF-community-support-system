import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  History,
  Mail,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.webp";
import backToSchoolImage from "@/assets/images/campaigns/Back to school.webp";

export type CampaignStatus = "Active" | "Upcoming" | "Completed";
export type RequestPriority = "High" | "Medium" | "Normal";
export type SponsorshipHistoryStatus = "Completed" | "Active" | "Closed";
export type UpdatePriority = "High" | "Medium" | "Normal";
export type SponsorLevel = "Bronze" | "Silver" | "Gold";

export type SponsorStatistic = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type SponsoredCampaign = {
  id: string;
  title: string;
  category: string;
  status: CampaignStatus;
  supportAmount: string;
  progress: number;
  startDate: string;
  endDate: string;
  image: string;
};

export type CampaignToSponsor = {
  id: string;
  title: string;
  category: string;
  description: string;
  fundingGoal: string;
  image: string;
};

export type SponsorshipRequest = {
  id: string;
  campaign: string;
  requestedSupport: string;
  category: string;
  priority: RequestPriority;
  deadline: string;
  estimatedImpact: string;
  icon: LucideIcon;
};

export type SponsorshipHistoryItem = {
  id: string;
  campaign: string;
  contribution: string;
  date: string;
  status: SponsorshipHistoryStatus;
  impactSummary: string;
};

export type CommunityImpactMetric = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
};

export type SponsorActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
};

export type FoundationUpdate = {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: UpdatePriority;
  icon: LucideIcon;
};

export type SponsorQuickAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
};

export const sponsorProfile = {
  organisationName: "ABC Holdings",
  initials: "AH",
  representative: "Thandi Molefe",
  email: "partnerships@abcholdings.co.za",
  phone: "+27 11 555 0182",
  sponsorLevel: "Gold" as SponsorLevel,
  memberSince: "January 2024",
  businessAddress: "12 Commissioner Street, Johannesburg, Gauteng",
  greetingName: "ABC Holdings",
};

export const sponsorStatistics: SponsorStatistic[] = [
  {
    id: "sponsored-campaigns",
    title: "Sponsored Campaigns",
    value: "8",
    detail: "Across education, food, and relief",
    icon: HeartHandshake,
  },
  {
    id: "active-sponsorships",
    title: "Active Sponsorships",
    value: "3",
    detail: "Currently supporting communities",
    icon: HandCoins,
  },
  {
    id: "resources-donated",
    title: "Resources Donated",
    value: "R125,000",
    detail: "Financial and in-kind support",
    icon: Package,
  },
  {
    id: "community-impact",
    title: "Community Impact",
    value: "650",
    detail: "People supported to date",
    icon: TrendingUp,
  },
];

export const sponsoredCampaigns: SponsoredCampaign[] = [
  {
    id: "campaign-1",
    title: "Food Support Drive",
    category: "Food Security",
    status: "Active",
    supportAmount: "R35,000",
    progress: 72,
    startDate: "01 Jun 2026",
    endDate: "31 Aug 2026",
    image: foodSupportImage,
  },
  {
    id: "campaign-2",
    title: "Youth Education Support",
    category: "Education",
    status: "Active",
    supportAmount: "R28,500",
    progress: 58,
    startDate: "15 May 2026",
    endDate: "30 Sep 2026",
    image: youthEducationImage,
  },
  {
    id: "campaign-3",
    title: "Winter Relief Campaign",
    category: "Relief",
    status: "Upcoming",
    supportAmount: "R42,000",
    progress: 20,
    startDate: "01 Aug 2026",
    endDate: "31 Oct 2026",
    image: winterReliefImage,
  },
  {
    id: "campaign-4",
    title: "Family Care Programme",
    category: "Family Support",
    status: "Completed",
    supportAmount: "R19,500",
    progress: 100,
    startDate: "01 Feb 2026",
    endDate: "30 Apr 2026",
    image: familyCareImage,
  },
];

export const campaignsToSponsor: CampaignToSponsor[] = [
  {
    id: "open-1",
    title: "Back to School Drive",
    category: "Education",
    description: "Help equip learners with stationery, uniforms, and school bags for the new term.",
    fundingGoal: "R45,000",
    image: backToSchoolImage,
  },
  {
    id: "open-2",
    title: "Community Health Awareness",
    category: "Health",
    description: "Sponsor wellness packs and screening support for an upcoming community health day.",
    fundingGoal: "R30,000",
    image: communityHealthImage,
  },
  {
    id: "open-3",
    title: "Winter Relief Campaign",
    category: "Relief",
    description: "Provide blankets and warm clothing for households ahead of the colder months.",
    fundingGoal: "R55,000",
    image: winterReliefImage,
  },
];

export const sponsorshipRequests: SponsorshipRequest[] = [
  {
    id: "request-1",
    campaign: "Sponsor School Stationery",
    requestedSupport: "R15,000 in learning materials",
    category: "Education",
    priority: "High",
    deadline: "20 Aug 2026",
    estimatedImpact: "120 learners",
    icon: ClipboardList,
  },
  {
    id: "request-2",
    campaign: "Sponsor Winter Blankets",
    requestedSupport: "400 blankets for households",
    category: "Relief",
    priority: "High",
    deadline: "28 Aug 2026",
    estimatedImpact: "400 families",
    icon: ClipboardList,
  },
  {
    id: "request-3",
    campaign: "Sponsor Food Parcels",
    requestedSupport: "R22,000 for monthly parcels",
    category: "Food Security",
    priority: "Medium",
    deadline: "05 Sep 2026",
    estimatedImpact: "180 households",
    icon: ClipboardList,
  },
  {
    id: "request-4",
    campaign: "Sponsor Community Health Event",
    requestedSupport: "Venue and wellness packs",
    category: "Health",
    priority: "Normal",
    deadline: "15 Sep 2026",
    estimatedImpact: "250 attendees",
    icon: ClipboardList,
  },
];

export const sponsorshipHistory: SponsorshipHistoryItem[] = [
  {
    id: "history-1",
    campaign: "Family Care Programme",
    contribution: "R19,500 funding",
    date: "30 Apr 2026",
    status: "Completed",
    impactSummary: "Supported 95 families with care packages and counselling referrals.",
  },
  {
    id: "history-2",
    campaign: "Back to School Drive",
    contribution: "Stationery kits + R12,000",
    date: "28 Feb 2026",
    status: "Closed",
    impactSummary: "Equipped 140 learners with school essentials for the new term.",
  },
  {
    id: "history-3",
    campaign: "Community Health Awareness",
    contribution: "Event sponsorship R8,500",
    date: "12 Dec 2025",
    status: "Completed",
    impactSummary: "Enabled free screenings for 210 community members.",
  },
  {
    id: "history-4",
    campaign: "Food Support Drive",
    contribution: "R35,000 ongoing",
    date: "01 Jun 2026",
    status: "Active",
    impactSummary: "Helping distribute monthly food parcels across Katlehong.",
  },
];

export const communityImpactMetrics: CommunityImpactMetric[] = [
  {
    id: "families",
    label: "Families Supported",
    value: "420 Families",
    icon: Users,
  },
  {
    id: "learners",
    label: "Learners Assisted",
    value: "185 Learners",
    icon: GraduationCap,
  },
  {
    id: "parcels",
    label: "Food Parcels Distributed",
    value: "780 Food Parcels",
    icon: Package,
  },
  {
    id: "events",
    label: "Community Events Sponsored",
    value: "15 Events",
    icon: Building2,
  },
];

export const sponsorActivities: SponsorActivity[] = [
  {
    id: "activity-1",
    title: "Sponsored Winter Relief Campaign",
    description: "Confirmed Gold-level support for the upcoming winter programme.",
    timestamp: "04 Aug 2026 · 10:15",
    icon: HandCoins,
  },
  {
    id: "activity-2",
    title: "Submitted sponsorship enquiry",
    description: "Enquired about sponsoring school stationery for Q3 outreach.",
    timestamp: "01 Aug 2026 · 14:40",
    icon: ClipboardList,
  },
  {
    id: "activity-3",
    title: "Campaign marked as completed",
    description: "Family Care Programme closed with impact summary available.",
    timestamp: "30 Apr 2026 · 16:05",
    icon: HeartHandshake,
  },
  {
    id: "activity-4",
    title: "Viewed campaign report",
    description: "Opened the Youth Education Support progress report.",
    timestamp: "22 Jul 2026 · 09:28",
    icon: Activity,
  },
  {
    id: "activity-5",
    title: "Updated organisation details",
    description: "Representative contact and business address refreshed.",
    timestamp: "10 Jul 2026 · 11:50",
    icon: Building2,
  },
];

export const foundationUpdates: FoundationUpdate[] = [
  {
    id: "update-1",
    title: "New campaign available for sponsorship",
    description: "School Stationery Drive is open for organisational partners this term.",
    date: "Today",
    priority: "High",
    icon: Bell,
  },
  {
    id: "update-2",
    title: "Winter Relief campaign reached 80% funding",
    description: "Your continued support is helping households prepare for colder months.",
    date: "2 days ago",
    priority: "Medium",
    icon: TrendingUp,
  },
  {
    id: "update-3",
    title: "Volunteer registrations are now open",
    description: "Community members can join upcoming outreach programmes across Gauteng.",
    date: "5 days ago",
    priority: "Normal",
    icon: Users,
  },
  {
    id: "update-4",
    title: "Community outreach report published",
    description: "Read the latest impact findings from sponsored programmes in Katlehong.",
    date: "1 week ago",
    priority: "Normal",
    icon: HeartHandshake,
  },
];

export const sponsorQuickActions: SponsorQuickAction[] = [
  {
    id: "sponsor-campaign",
    title: "Sponsor Campaign",
    description: "Explore open campaigns looking for organisational partners.",
    icon: HandCoins,
    route: "/sponsor/dashboard#sponsor-campaign",
  },
  {
    id: "view-campaigns",
    title: "View Campaigns",
    description: "Review the campaigns your organisation currently supports.",
    icon: HeartHandshake,
    route: "/sponsor/dashboard#sponsored-campaigns",
  },
  {
    id: "view-history",
    title: "View Sponsorship History",
    description: "Look back at past contributions and impact summaries.",
    icon: History,
    route: "/sponsor/dashboard#sponsorship-history",
  },
  {
    id: "contact-foundation",
    title: "Contact Foundation",
    description: "Reach the TMF partnerships team with questions or offers.",
    icon: Mail,
    route: "/contact",
  },
  {
    id: "organisation-profile",
    title: "Organisation Profile",
    description: "Update your organisation details and representative contacts.",
    icon: Building2,
    route: "/sponsor/dashboard",
  },
];
