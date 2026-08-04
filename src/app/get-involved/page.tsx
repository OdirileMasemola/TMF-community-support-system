import { ConnectWithUs } from "@/components/blocks/connect-with-us";
import { GetInvolvedHero } from "@/components/blocks/get-involved-hero";

export default function GetInvolvedPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <GetInvolvedHero />
      <ConnectWithUs />
    </div>
  );
}
