import backToSchoolImage from "@/assets/images/campaigns/Back to school.webp";
import communityHealthImage from "@/assets/images/campaigns/Community Health Awareness.webp";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import winterReliefImage from "@/assets/images/campaigns/Winter Relief.webp";
import youthEducationImage from "@/assets/images/campaigns/Youth Education Support.webp";

const fallbackByKeyword: { match: RegExp; image: string }[] = [
  { match: /food|parcel/i, image: foodSupportImage },
  { match: /youth|education|school|stationery|learner/i, image: youthEducationImage },
  { match: /winter|blanket|relief/i, image: winterReliefImage },
  { match: /family|care/i, image: familyCareImage },
  { match: /health|wellness/i, image: communityHealthImage },
  { match: /back\s*to\s*school/i, image: backToSchoolImage },
];

/** Prefer remote `image_url`; otherwise match local campaign artwork by title/category. */
export function resolveCampaignImage(
  imageUrl: string | null | undefined,
  title?: string | null,
  category?: string | null,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();

  const haystack = `${title ?? ""} ${category ?? ""}`;
  for (const entry of fallbackByKeyword) {
    if (entry.match.test(haystack)) return entry.image;
  }
  return foodSupportImage;
}
