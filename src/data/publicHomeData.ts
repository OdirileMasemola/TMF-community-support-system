import {
  HeartHandshake,
  Megaphone,
  HandHeart,
  ClipboardList,
  Users,
  Home,
} from "lucide-react";
import type {
  FeaturedCampaign,
  FounderQuote,
  HeroSummaryItem,
  HowItWorksStep,
  ImpactStat,
  StatsSectionContent,
} from "@/types/public";

export const heroSummaryItems: HeroSummaryItem[] = [
  { label: "Active Campaigns", value: "12+", icon: Megaphone },
  { label: "Volunteers", value: "80+", icon: Users },
  { label: "Assistance Requests", value: "150+", icon: ClipboardList },
  { label: "Donations Tracked", value: "R25k+", icon: HandHeart },
];

export const impactStats: ImpactStat[] = [
  { label: "Active Campaigns", value: "12+", icon: Megaphone },
  { label: "Volunteers", value: "80+", icon: Users },
  { label: "Families Supported", value: "150+", icon: Home },
  { label: "Donations Tracked", value: "R25k+", icon: HeartHandshake },
];

export const statsSectionContent: StatsSectionContent = {
  label: "FOUNDATION IMPACT",
  heading: "Building hope through organised community support.",
  paragraph:
    "The Themba Molefe Foundation supports vulnerable communities through outreach programmes, donations, sponsorships, volunteer participation, and beneficiary assistance. This platform helps organise that support in one central system.",
};

export const founderQuote: FounderQuote = {
  label: "Founder's Message",
  quote: "Tomorrow is one dream away.",
  cite: "Themba Molefe Foundation Motto",
};

export const featuredCampaigns: FeaturedCampaign[] = [
  {
    id: "food-support-drive",
    title: "Food Support Drive",
    description: "Providing food parcels to families in need.",
    status: "Active",
  },
  {
    id: "youth-education-support",
    title: "Youth Education Support",
    description: "Helping learners with school resources and academic support.",
    status: "Active",
  },
  {
    id: "winter-relief-campaign",
    title: "Winter Relief Campaign",
    description: "Collecting warm clothing and essentials for vulnerable families.",
    status: "Upcoming",
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Register",
    description: "Create an account based on your role.",
  },
  {
    step: 2,
    title: "Choose Your Role",
    description: "Join as a volunteer, donor, sponsor, or beneficiary.",
  },
  {
    step: 3,
    title: "Access Services",
    description: "Apply for campaigns, make donations, request assistance, or sponsor campaigns.",
  },
  {
    step: 4,
    title: "Track Progress",
    description: "Receive updates and monitor requests, applications, donations, and support activities.",
  },
];
