import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  HandCoins,
  HandHelping,
  HeartHandshake,
  Megaphone,
  Shirt,
  ShoppingBasket,
  BookOpen,
  Users,
  Target,
  Sparkles,
  Heart,
} from "lucide-react";

export type InvolvementOption = {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  buttonTo: string;
};

export type VolunteerArea = {
  title: string;
  description: string;
};

export type ResourceExample = {
  label: string;
  icon: LucideIcon;
};

export type ImpactPoint = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const involvementOptions: InvolvementOption[] = [
  {
    title: "Volunteer Your Time",
    description:
      "Give your time and skills to help the foundation run campaigns, community programmes, outreach activities, and support initiatives.",
    icon: HandHelping,
    buttonText: "Become a Volunteer",
    buttonTo: "/register",
  },
  {
    title: "Support a Campaign",
    description:
      "Take part in campaigns that provide practical support to vulnerable individuals, families, and communities.",
    icon: Megaphone,
    buttonText: "View Campaigns",
    buttonTo: "/campaigns",
  },
  {
    title: "Make a Donation",
    description:
      "Provide financial support that helps the foundation run community programmes, provide assistance, and respond to community needs.",
    icon: HandCoins,
    buttonText: "Donate",
    buttonTo: "/donate",
  },
  {
    title: "Provide Resources",
    description:
      "Support the foundation with useful resources such as blankets, clothing, school uniforms, groceries, educational supplies, or other community support items.",
    icon: Boxes,
    buttonText: "Contact Foundation",
    buttonTo: "/contact",
  },
];

export const volunteerAreas: VolunteerArea[] = [
  {
    title: "Community Outreach",
    description:
      "Help with activities that connect the foundation with communities and people who need support.",
  },
  {
    title: "Campaign Support",
    description: "Assist with the planning and execution of foundation campaigns.",
  },
  {
    title: "Skills & Expertise",
    description:
      "Contribute your professional, technical, organisational, creative, or practical skills.",
  },
];

export const resourceExamples: ResourceExample[] = [
  { label: "Blankets", icon: Heart },
  { label: "Clothing", icon: Shirt },
  { label: "School Uniforms", icon: Users },
  { label: "Groceries", icon: ShoppingBasket },
  { label: "School Supplies", icon: BookOpen },
  { label: "Community Support Items", icon: Boxes },
];

export const impactPoints: ImpactPoint[] = [
  {
    title: "Community Impact",
    description:
      "Your support helps the foundation reach people and families who need assistance.",
    icon: HeartHandshake,
  },
  {
    title: "Stronger Campaigns",
    description:
      "Volunteers, donors and resource contributors help campaigns reach more people.",
    icon: Megaphone,
  },
  {
    title: "Practical Support",
    description:
      "Contributions can help provide essentials such as food, clothing, blankets and educational resources.",
    icon: Target,
  },
  {
    title: "Community Participation",
    description:
      "Getting involved helps build stronger connections between the foundation and the communities it serves.",
    icon: Sparkles,
  },
];
