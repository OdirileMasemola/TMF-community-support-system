import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  Clock3,
  Flag,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  History,
  Package,
  Receipt,
  UserRound,
  Users,
} from "lucide-react";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";

export type DonationStatus = "Verified" | "Pending" | "Rejected";

export type DonorStatistic = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type DonationRecord = {
  id: string;
  type: string;
  campaign: string;
  amount: string;
  reference: string;
  date: string;
  status: DonationStatus;
};

export type ProofRecord = {
  id: string;
  fileName: string;
  submittedAt: string;
  amount: string;
  reference: string;
  status: DonationStatus;
  comment: string;
};

export type DonorImpact = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
};

export type RecommendedCampaign = {
  id: string;
  title: string;
  category: string;
  description: string;
  progress: number;
  raised: string;
  image: string;
};

export type FoundationUpdate = {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: "New" | "Milestone" | "Community";
};

export type DonorActivity = {
  id: string;
  title: string;
  timestamp: string;
  icon: LucideIcon;
};

export type DonorNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: "Update" | "Action needed" | "Campaign";
  unread: boolean;
  icon: LucideIcon;
};

export const donorProfile = {
  name: "Odirile Masemola",
  initials: "OM",
  memberSince: "March 2025",
  donorId: "DON-2025-084",
  email: "odirile@example.com",
  phone: "+27 71 234 5678",
  preferredDonationType: "Campaign support",
  totalAmount: "R12,850",
};

export const donorStatistics: DonorStatistic[] = [
  { id: "total", title: "Total Donations", value: "8", detail: "R12,850 contributed", icon: HandCoins },
  { id: "verified", title: "Verified Donations", value: "6", detail: "Confirmed by TMF", icon: BadgeCheck },
  { id: "pending", title: "Pending Verification", value: "2", detail: "Proofs under review", icon: Clock3 },
  { id: "campaigns", title: "Campaigns Supported", value: "4", detail: "Making a local impact", icon: HeartHandshake },
];

export const donationHistory: DonationRecord[] = [
  { id: "donation-1", type: "Campaign Donation", campaign: "Winter Relief Campaign", amount: "R2,500", reference: "TMF-WR-2084", date: "18 Jul 2026", status: "Pending" },
  { id: "donation-2", type: "General Donation", campaign: "Themba Molefe Foundation", amount: "R1,000", reference: "TMF-GD-1957", date: "03 Jul 2026", status: "Verified" },
  { id: "donation-3", type: "Campaign Donation", campaign: "Food Support Drive", amount: "R3,500", reference: "TMF-FS-1842", date: "14 Jun 2026", status: "Verified" },
  { id: "donation-4", type: "Campaign Donation", campaign: "Youth Education Support", amount: "R1,850", reference: "TMF-YES-1730", date: "29 May 2026", status: "Verified" },
  { id: "donation-5", type: "General Donation", campaign: "Themba Molefe Foundation", amount: "R750", reference: "TMF-GD-1654", date: "08 Apr 2026", status: "Verified" },
  { id: "donation-6", type: "Campaign Donation", campaign: "Family Care Programme", amount: "R1,250", reference: "TMF-FCP-1518", date: "21 Mar 2026", status: "Verified" },
  { id: "donation-7", type: "Campaign Donation", campaign: "Food Support Drive", amount: "R1,000", reference: "TMF-FS-1427", date: "17 Feb 2026", status: "Verified" },
  { id: "donation-8", type: "General Donation", campaign: "Themba Molefe Foundation", amount: "R1,000", reference: "TMF-GD-1305", date: "29 Jan 2026", status: "Rejected" },
];

export const proofHistory: ProofRecord[] = [
  { id: "proof-1", fileName: "winter-relief-eft.pdf", submittedAt: "18 Jul 2026", amount: "R2,500", reference: "TMF-WR-2084", status: "Pending", comment: "Your proof is being reviewed by our team." },
  { id: "proof-2", fileName: "general-donation-july.pdf", submittedAt: "03 Jul 2026", amount: "R1,000", reference: "TMF-GD-1957", status: "Verified", comment: "Verified — thank you for your contribution." },
  { id: "proof-3", fileName: "food-support-drive.pdf", submittedAt: "14 Jun 2026", amount: "R3,500", reference: "TMF-FS-1842", status: "Verified", comment: "Verified and allocated to the campaign." },
];

export const donorImpact: DonorImpact[] = [
  { id: "families", label: "Families Supported", value: "35", icon: Users },
  { id: "learners", label: "Learners Assisted", value: "18", icon: GraduationCap },
  { id: "parcels", label: "Food Parcels Distributed", value: "90", icon: Package },
  { id: "campaigns", label: "Campaigns Supported", value: "4", icon: Flag },
];

export const recommendedCampaigns: RecommendedCampaign[] = [
  { id: "food", title: "Food Support Drive", category: "Food security", description: "Help provide essential food parcels to families facing hardship.", progress: 78, raised: "R78,000 raised", image: foodSupportImage },
  { id: "winter", title: "Winter Relief Campaign", category: "Emergency relief", description: "Supply warm clothing and blankets to vulnerable households.", progress: 61, raised: "R61,000 raised", image: winterReliefImage },
  { id: "education", title: "Youth Education Support", category: "Education", description: "Equip young learners with the resources they need to thrive.", progress: 45, raised: "R45,000 raised", image: youthEducationImage },
  { id: "family", title: "Family Care Programme", category: "Family support", description: "Connect families with practical care and ongoing support.", progress: 69, raised: "R69,000 raised", image: familyCareImage },
];

export const foundationUpdates: FoundationUpdate[] = [
  { id: "update-1", title: "Winter Relief campaign has launched", description: "Your support can help households stay warm through the colder months.", date: "Today", priority: "New" },
  { id: "update-2", title: "Food Support reached its monthly goal", description: "Thank you to every donor who helped provide food parcels this July.", date: "2 days ago", priority: "Milestone" },
  { id: "update-3", title: "Volunteer registrations are open", description: "Community members can now join upcoming outreach programmes.", date: "5 days ago", priority: "Community" },
];

export const donorActivities: DonorActivity[] = [
  { id: "activity-1", title: "Submitted proof of payment for Winter Relief", timestamp: "18 Jul 2026 · 09:42", icon: Receipt },
  { id: "activity-2", title: "Donation to Food Support Drive verified", timestamp: "15 Jun 2026 · 14:20", icon: BadgeCheck },
  { id: "activity-3", title: "Supported Youth Education Support", timestamp: "29 May 2026 · 11:05", icon: HeartHandshake },
  { id: "activity-4", title: "Updated donor profile", timestamp: "12 May 2026 · 16:30", icon: History },
];

export const donorNotifications: DonorNotification[] = [
  { id: "notice-1", title: "Your donation has been verified", message: "Your R3,500 contribution to Food Support Drive has been confirmed.", timestamp: "15 Jun 2026 · 14:20", priority: "Update", unread: true, icon: BadgeCheck },
  { id: "notice-2", title: "Proof of payment under review", message: "We are reviewing your Winter Relief Campaign proof of payment.", timestamp: "18 Jul 2026 · 09:42", priority: "Action needed", unread: true, icon: Receipt },
  { id: "notice-3", title: "Winter Relief Campaign has started", message: "This campaign is now accepting support from the TMF community.", timestamp: "17 Jul 2026 · 08:00", priority: "Campaign", unread: false, icon: Bell },
  { id: "notice-4", title: "Your support is making a difference", message: "Your contributions helped provide food parcels to 35 families this month.", timestamp: "01 Jul 2026 · 10:15", priority: "Update", unread: false, icon: HeartHandshake },
];

export const donorQuickActions = [
  { id: "donate", title: "Make a donation", description: "Choose a campaign or make a general contribution.", icon: HandCoins, route: "/donor/dashboard/donate" },
  { id: "campaigns", title: "Browse campaigns", description: "Discover causes currently accepting support.", icon: HeartHandshake, route: "/donor/dashboard/campaigns" },
  { id: "history", title: "Donation history", description: "Review your contributions and their status.", icon: History, route: "/donor/dashboard/donations" },
  { id: "proof", title: "Proof of payment", description: "View submitted payment proof records.", icon: Receipt, route: "/donor/dashboard/proof-of-payment" },
  { id: "profile", title: "Profile", description: "Review your donor details and preferences.", icon: UserRound, route: "/donor/dashboard/profile" },
];

export const updateIcon = Bell;
