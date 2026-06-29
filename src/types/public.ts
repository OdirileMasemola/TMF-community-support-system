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
  status: "Active" | "Upcoming" | "Completed";
};

export type HeroSummaryItem = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
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
