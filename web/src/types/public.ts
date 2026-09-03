import type { LucideIcon } from "lucide-react";

export type ImpactStat = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export type FeaturedCampaign = {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  gradientFrom: string;
  gradientTo: string;
  glowColor?: string;
  href: string;
};

export type CampaignStatus = "Active" | "Upcoming" | "Completed";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  goal: string;
  image: string;
}

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
  benefits: string[];
  icon: LucideIcon;
};

export type FounderQuote = {
  label: string;
  quote: string;
  cite: string;
};

export type StatsSectionContent = {
  label: string;
  heading: string;
  paragraph: string;
};
