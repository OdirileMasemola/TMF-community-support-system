import {
  HeartHandshake,
  Megaphone,
  Users,
  Home,
  UserPlus,
  Layers,
  ClipboardCheck,
} from "lucide-react";
import type {
  Campaign,
  FeaturedCampaign,
  FounderQuote,
  HowItWorksStep,
  ImpactStat,
  StatsSectionContent,
} from "@/types/public";
import backToSchoolImage from "@/assets/images/campaigns/Back to school.jpg";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.jpg";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.jpg";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.jpg";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.jpg";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.jpg";

export const impactStats: ImpactStat[] = [
  { label: "Active Campaigns", value: "12+", icon: Megaphone },
  { label: "Volunteers", value: "80+", icon: Users },
  { label: "Families Supported", value: "150+", icon: Home },
  { label: "Donations Tracked", value: "R25k+", icon: HeartHandshake },
];

export const statsSectionContent: StatsSectionContent = {
  label: "Foundation Impact",
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
    description:
      "Providing food parcels and basic support to families facing difficult living conditions.",
    status: "Active",
    gradientFrom: "#AF3800",
    gradientTo: "#FE621D",
    glowColor: "#FE621D",
    href: "/campaigns",
  },
  {
    id: "youth-education-support",
    title: "Youth Education Support",
    description:
      "Helping young learners with school resources, mentorship, and academic support.",
    status: "Active",
    gradientFrom: "#4ADE80",
    gradientTo: "#BBF7D0",
    glowColor: "#86EFAC",
    href: "/campaigns",
  },
  {
    id: "winter-relief-campaign",
    title: "Winter Relief Campaign",
    description:
      "Collecting warm clothing and essentials for vulnerable families during winter.",
    status: "Upcoming",
    gradientFrom: "#00CFC1",
    gradientTo: "#00FFE7",
    glowColor: "#00FFE7",
    href: "/campaigns",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "food-support-drive",
    title: "Food Support Drive",
    description:
      "Providing food parcels and basic support to families facing difficult living conditions.",
    category: "Food Support",
    status: "Active",
    startDate: "01 July 2026",
    endDate: "31 July 2026",
    goal: "Support 100 families",
    image: foodSupportImage,
  },
  {
    id: "youth-education-support",
    title: "Youth Education Support",
    description: "Helping learners with school resources, mentorship, and academic support.",
    category: "Education",
    status: "Active",
    startDate: "15 July 2026",
    endDate: "30 August 2026",
    goal: "Assist 80 learners",
    image: youthEducationImage,
  },
  {
    id: "winter-relief-campaign",
    title: "Winter Relief Campaign",
    description: "Collecting warm clothing and essentials for vulnerable families during winter.",
    category: "Relief Support",
    status: "Upcoming",
    startDate: "01 August 2026",
    endDate: "31 August 2026",
    goal: "Collect 300 clothing items",
    image: winterReliefImage,
  },
  {
    id: "community-health-awareness",
    title: "Community Health Awareness",
    description: "Promoting health awareness and basic wellness information within the community.",
    category: "Health Awareness",
    status: "Upcoming",
    startDate: "10 August 2026",
    endDate: "20 August 2026",
    goal: "Reach 200 community members",
    image: communityHealthImage,
  },
  {
    id: "back-to-school-drive",
    title: "Back To School Drive",
    description: "Supporting school learners with stationery, school bags, and learning materials.",
    category: "Education",
    status: "Completed",
    startDate: "01 January 2026",
    endDate: "31 January 2026",
    goal: "Support 120 learners",
    image: backToSchoolImage,
  },
  {
    id: "family-care-support",
    title: "Family Care Support",
    description: "Helping families with basic household support and community care resources.",
    category: "Family Support",
    status: "Completed",
    startDate: "01 May 2026",
    endDate: "31 May 2026",
    goal: "Support 60 families",
    image: familyCareImage,
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Register on the platform and choose the role that matches how you want to use the system.",
    benefits: [
      "Register as a volunteer, donor, sponsor, or beneficiary",
      "Secure account access",
      "Role-based system experience",
    ],
    icon: UserPlus,
  },
  {
    step: 2,
    title: "Access The Right Services",
    description: "Use the services linked to your role, such as campaigns, donations, sponsorships, or assistance requests.",
    benefits: [
      "Volunteers can apply for campaigns",
      "Beneficiaries can submit assistance requests",
      "Donors and sponsors can support active campaigns",
    ],
    icon: Layers,
  },
  {
    step: 3,
    title: "Track Progress",
    description: "Receive updates and monitor campaign applications, donations, sponsorships, and assistance request statuses.",
    benefits: [
      "Track request and application status",
      "Receive system notifications",
      "Support better reporting and transparency",
    ],
    icon: ClipboardCheck,
  },
];
