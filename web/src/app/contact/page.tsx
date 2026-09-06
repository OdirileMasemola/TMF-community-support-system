import { ContactHero } from "@/components/blocks/contact-hero";
import { ContactSection } from "@/components/blocks/contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <ContactHero />
      <ContactSection
        title="Contact the Themba Molefe Foundation"
        description="Reach the foundation directly for campaign questions, donations, volunteering, or community support."
        phone="+27 72 076 9116"
        email="hope.molefe@icloud.com"
      />
    </div>
  );
}
