import React from "react";
import GetInvolvedHero from "@/components/blocks/get-involved-hero";
import ConnectWithUs from "@/components/ui/connect-with-us";

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen">
      <GetInvolvedHero />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ConnectWithUs />
      </section>
    </main>
  );
}
