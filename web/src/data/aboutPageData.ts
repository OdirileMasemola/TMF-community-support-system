import aboutCommunityImage from "@/assets/images/about/DSC_0632.webp";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.webp";

export type AboutStorySlide = {
  id: string;
  image: string;
  alt: string;
  kicker: string;
  title: string;
  description: string;
};

export const aboutHeroContent = {
  label: "About TMF",
  words: ["Born", "in", "Nhlapo.", "Built", "for"] as const,
  highlightedWord: "Katlehong.",
  subtitle:
    "A community foundation from Nhlapo section, walking with families, learners, and volunteers who still believe tomorrow is one dream away.",
};

export const aboutStorySlides: AboutStorySlide[] = [
  {
    id: "nhlapo-beginning",
    image: aboutCommunityImage,
    alt: "Themba Molefe Foundation community gathering in Katlehong",
    kicker: "Where it began",
    title: "A promise made in Nhlapo.",
    description:
      "The foundation started as neighbours showing up for neighbours, with practical care for vulnerable families and child-headed households in Katlehong.",
  },
  {
    id: "family-care",
    image: familyCareImage,
    alt: "Family care support in the community",
    kicker: "Family care",
    title: "Homes held together.",
    description:
      "Household support, presence, and dignity for families carrying more than they should have to carry alone.",
  },
  {
    id: "food-support",
    image: foodSupportImage,
    alt: "Food support drive with volunteers",
    kicker: "Food support",
    title: "A table within reach.",
    description:
      "Food parcels and essential relief, organised by volunteers who know the streets, the names, and the need.",
  },
  {
    id: "youth-education",
    image: youthEducationImage,
    alt: "Youth education support for learners",
    kicker: "Youth education",
    title: "Learners who still dream.",
    description:
      "Stationery, mentorship, and school support so young people in our community can keep reaching for tomorrow.",
  },
  {
    id: "winter-relief",
    image: winterReliefImage,
    alt: "Winter relief clothing and essentials drive",
    kicker: "Winter relief",
    title: "Warmth when the season turns.",
    description:
      "Blankets, clothing, and care through the cold months, because winter should not decide who gets to feel safe.",
  },
  {
    id: "community-health",
    image: communityHealthImage,
    alt: "Community health awareness outreach",
    kicker: "Community health",
    title: "Care that finds people.",
    description:
      "Wellness conversations and outreach that meet families where they are, with information and a human presence.",
  },
];

export const aboutOriginContent = {
  label: "Our origin",
  heading: "It started with showing up.",
  paragraphs: [
    "In February 2015, the Themba Molefe Foundation began as a community organisation in Nhlapo section, Katlehong. The work was close, local, and practical: food, care, school support, and a hand on the shoulder when a household had no one else to call.",
    "That first Christmas programme set the tone. A day of joy for underprivileged children and child-headed households became a way of working: stay close to the community, organise the help, and keep going after the cameras leave.",
  ],
  quote: "Tomorrow is one dream away.",
  cite: "Themba Molefe Foundation",
  image: aboutCommunityImage,
  imageAlt: "Community members gathered with the Themba Molefe Foundation",
};

export const aboutManifesto = [
  {
    number: "01",
    title: "We show up.",
    body: "For families, learners, and neighbours who have been left to manage alone.",
  },
  {
    number: "02",
    title: "We organise care.",
    body: "Programmes, mentorship, food, schooling, and people, organised into one clear path of support.",
  },
  {
    number: "03",
    title: "We stay.",
    body: "Until the next generation can stand a little taller than the one before it.",
  },
];
