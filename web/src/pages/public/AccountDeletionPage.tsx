import { PageHero } from "@/components/ui/PageHero";

// Public page that explains how to delete an account (linked from Google Play and the app)
const steps = [
  "Open the TMF Dashboard app and sign in.",
  "Go to Settings.",
  "Under Privacy, tap Delete account and confirm.",
];

const sections = [
  {
    title: "What is deleted",
    body: "Your sign-in account, your profile and role details, your app settings and your notifications are deleted straight away. Assistance requests, volunteer applications and sponsorship records linked to your profile are deleted with it.",
  },
  {
    title: "What is kept",
    body: "Donation records are kept for the foundation's financial records and campaign totals, but they are no longer linked to your name or account. Administrator accounts cannot be deleted from the app, and another administrator has to remove them.",
  },
  {
    title: "Can't use the app?",
    body: "Email hope.molefe@icloud.com from the email address on your account and ask for your account to be deleted. We will delete it within 30 days and confirm by email.",
  },
];

export function AccountDeletionPage() {
  return (
    <>
      <PageHero
        label="Legal"
        title="Delete your"
        highlightedTitle="account"
        subtitle="How to delete your TMF Community Support System account and what happens to your data."
        primaryCta={{ text: "Contact us", to: "/contact" }}
        compact
      />

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <article className="rounded-2xl border border-border bg-card/70 p-6">
            <h2 className="text-lg font-semibold text-foreground">Delete it in the app</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-card/70 p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
