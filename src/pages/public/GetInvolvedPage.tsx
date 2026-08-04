import { PageHero } from "@/components/ui/PageHero";
import ConnectWithUs from "@/components/ui/connect-with-us";

export function GetInvolvedPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        label="Get Involved"
        title="Make an Impact with Us"
        highlightedTitle="Join the Community"
        subtitle="Volunteer, donate, or connect — your involvement helps us reach more people and create lasting change."
        primaryCta={{ text: "Volunteer", to: "#volunteer" }}
        secondaryCta={{ text: "Donate", to: "#donate" }}
        tertiaryCta={{ text: "Sponsor", to: "#sponsor" }}
      />

      <section className="max-w-4xl mx-auto px-4 py-12">
        <ConnectWithUs />
      </section>
    </main>
  );
}
