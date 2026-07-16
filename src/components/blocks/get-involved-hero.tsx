import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";

export function GetInvolvedHero() {
  return (
    <PageHero
      label="Get Involved"
      title="Volunteer, donate, or join the"
      highlightedTitle="community"
      subtitle="Support local programmes, share your skills, and help create lasting opportunities for the people and families we serve."
      primaryCta={{ text: "Join the movement", to: "#connect-with-us" }}
      secondaryCta={{ text: "Explore initiatives", to: "/campaigns" }}
    />
  );
}

export default GetInvolvedHero;
