import HeroSection from "@/components/ui/hero-section-9";
import { DonationOptionsSection } from "@/components/ui/DonationOptionsSection";
import { BookOpen, GraduationCap, HandHeart } from "lucide-react";
import donationImageOne from "@/assets/images/donation/donation-1.webp";
import donationImageTwo from "@/assets/images/donation/donation-2.webp";
import donationImageThree from "@/assets/images/donation/donation-3.webp";

export function DonatePage() {
  const scrollToDonationOptions = () => {
    document.getElementById("donation-options")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <HeroSection
        label="DONATE"
        title={
          <>
            Help us turn support
            <br />
            <span className="bg-[image:var(--hero-highlight-gradient)] bg-clip-text text-transparent">
              into real opportunity.
            </span>
          </>
        }
        subtitle="Your donation helps The Themba Molefe Foundation provide learning support, mentorship, resources, and community programmes for young people who need a stronger bridge to their future."
        actions={[
          {
            text: "Donate now",
            onClick: scrollToDonationOptions,
            variant: "default",
          },
          {
            text: "Partner with us",
            onClick: () => {
              window.location.href = "mailto:info@themasemolafoundation.org?subject=Partnership%20with%20TMF";
            },
            variant: "outline",
          },
        ]}
        stats={[
          {
            value: "Learners",
            label: "supported through education",
            icon: <GraduationCap className="h-5 w-5 text-muted-foreground" />,
          },
          {
            value: "Resources",
            label: "for community growth",
            icon: <BookOpen className="h-5 w-5 text-muted-foreground" />,
          },
          {
            value: "Impact",
            label: "built with every gift",
            icon: <HandHeart className="h-5 w-5 text-muted-foreground" />,
          },
        ]}
        images={[donationImageOne, donationImageTwo, donationImageThree]}
      />

      <DonationOptionsSection />
    </>
  );
}
