import { PageHero } from "@/components/ui/PageHero";

export function ContactHero() {
  return (
    <PageHero
      label="Contact Us"
      title="Let’s build lasting support"
      highlightedTitle="together"
      subtitle="We welcome questions, partnership opportunities, and community support requests from people and organisations who want to make a real impact."
      primaryCta={{ text: "Start a conversation", to: "#contact-form" }}
    />
  );
}

export default ContactHero;
