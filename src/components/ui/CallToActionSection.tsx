import { motion, useReducedMotion } from "framer-motion";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CallToActionSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-transparent py-16 md:py-24" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="relative mx-auto flex max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card/70 px-6 py-14 text-center text-card-foreground shadow-lg backdrop-blur-xl md:px-10 md:py-16"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--cta-gradient-start), var(--cta-gradient-end))",
          }}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 24, filter: "blur(6px)" }
          }
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--cta-glow),transparent_45%)] opacity-60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,159,171,0.12),transparent_50%)] opacity-70"
          />

          <span className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur">
            <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
            Join the TMF support community
          </span>

          <h2
            id="cta-heading"
            className="relative z-10 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Ready to make a difference?
          </h2>

          <p className="relative z-10 mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Create an account and help the Themba Molefe Foundation manage campaigns, donations,
            sponsorships, volunteers, and assistance requests in one organised platform.
          </p>

          <div className="relative z-10 mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button to="/register">Create Account</Button>
            <Button to="/donate" variant="outline">
              Make a Donation
            </Button>
          </div>

          <p className="relative z-10 mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Whether you want to volunteer, donate, sponsor, or request support, the platform guides
            you to the right place.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
