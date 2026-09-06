import { PageHero } from "@/components/ui/PageHero";

const sections = [
  {
    title: "Information we collect",
    body: "When you create an account, contact the foundation, donate, volunteer, request assistance, or upload documents, we collect the details you provide. This can include your name, email address, phone number, role, donation or request information, and files such as proof of payment or supporting documents.",
  },
  {
    title: "How we use it",
    body: "We use this information to operate the TMF Community Support System: to sign you in, route you to the correct dashboard, process donations and requests, review uploaded documents, and respond to messages sent through the contact form.",
  },
  {
    title: "Who can see it",
    body: "Foundation administrators can access information needed to run programmes. Other users can only see data that belongs to them, or public campaign information on the website. We do not sell personal information.",
  },
  {
    title: "Storage and security",
    body: "Account and programme data is stored with our database and file storage provider. Access is restricted by account role. Profile photos and campaign images may be shown publicly on the website. Private documents, such as proof of payment, are not published.",
  },
  {
    title: "Contact",
    body: "If you have a question about this policy or your information, contact the Themba Molefe Foundation at hope.molefe@icloud.com or +27 72 076 9116.",
  },
];

export function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        label="Legal"
        title="Privacy"
        highlightedTitle="policy"
        subtitle="How the Themba Molefe Foundation collects, uses, and looks after information on this platform."
        primaryCta={{ text: "Contact us", to: "/contact" }}
        compact
      />

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl space-y-8">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-card/70 p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
          <p className="text-xs text-muted-foreground">Last updated September 2026.</p>
        </div>
      </section>
    </>
  );
}
