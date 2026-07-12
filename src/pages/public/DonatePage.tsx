import HeroSection from "@/components/ui/hero-section-9";
import { BookOpen, GraduationCap, HandHeart, ShieldCheck } from "lucide-react";
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
        images={[
          donationImageOne,
          donationImageTwo,
          donationImageThree,
        ]}
      />

      <section id="donation-options" className="px-6 pb-16 pt-10 md:pt-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-xl md:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Ways to give</p>
            <h2 className="mt-3 text-3xl font-bold text-card-foreground">Choose how you want to support the mission.</h2>
            <p className="mt-4 text-muted-foreground">
              Secure payment options are coming soon. For now, reach out to the team and we will help you complete your
              donation or partnership pledge.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Sponsor a learner support programme",
              "Contribute learning materials",
              "Fund mentorship and community outreach",
            ].map((option) => (
              <div key={option} className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">{option}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will connect your contribution to high-impact needs in the TMF community.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
