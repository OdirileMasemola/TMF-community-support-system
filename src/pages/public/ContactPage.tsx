import { ContactHero } from "@/components/blocks/contact-hero";
import { ContactSection } from "@/components/blocks/contact-form";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <ContactHero />
      <ContactSection
        title="Contact the Themba Molefe Foundation"
        description="Replace these placeholder details with your foundation's real contact information whenever you're ready."
        phone="(placeholder) +27 00 000 0000"
        email="(placeholder) hello@themba-molefe-foundation.org"
        website={{ label: "(placeholder) themba-molefe-foundation.org", url: "https://example.com" }}
      />
    </div>
  );
}
