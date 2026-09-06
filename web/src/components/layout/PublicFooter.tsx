import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Camera, Share2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import logo from "@/assets/images/logo.jpeg";

const platformLinks = [
  { to: "/campaigns", label: "Campaigns" },
  { to: "/donate", label: "Donate" },
  { to: "/get-involved", label: "Get Involved" },
  { to: "/register", label: "Register" },
];

const foundationLinks = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/login", label: "Login" },
];

const supportLinks = [
  { to: "/register", label: "Request Assistance" },
  { to: "/get-involved", label: "Volunteer" },
  { to: "/campaigns", label: "Sponsor a Campaign" },
  { to: "/donate", label: "Make a Donation" },
];

const socialLinks = [
  { href: "https://www.facebook.com/share/1DQh9hjv8o/", label: "Facebook", icon: Share2 },
  { href: "https://www.instagram.com/thembamolefefoundation", label: "Instagram", icon: Camera },
];

type AnimatedContainerProps = {
  delay?: number;
  className?: string;
  children: ReactNode;
};

function AnimatedContainer({ delay = 0, className, children }: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function FooterLinkList({ links }: { links: Array<{ to: string; label: string }> }) {
  return (
    <ul className="mt-4 space-y-3 text-sm">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors duration-300 hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative mx-auto w-full max-w-6xl rounded-t-[2rem] border-t border-border bg-card/70 px-6 py-12 text-card-foreground backdrop-blur-xl md:rounded-t-[3rem] lg:py-16"
      style={{
        backgroundImage: "radial-gradient(35% 128px at 50% 0%, rgba(255,255,255,0.04), transparent)",
      }}
    >
      <div className="absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-foreground/20 blur" />

      <div className="grid w-full gap-10 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-5 xl:max-w-sm" delay={0.05}>
          <Link to="/" className="inline-flex items-center gap-2 text-foreground">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm ring-1 ring-border dark:shadow-[0_0_18px_rgba(255,255,255,0.25)]">
              <img src={logo} alt="TMF Support logo" className="h-full w-full scale-150 object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TMF Support</span>
          </Link>

          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            A community support platform for managing campaigns, donations, volunteers, sponsors, and assistance requests.
          </p>

          <p className="text-xs text-muted-foreground">© {currentYear} TMF Support. All rights reserved.</p>
        </AnimatedContainer>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2">
          <AnimatedContainer delay={0.1}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Platform</h3>
            <FooterLinkList links={platformLinks} />
          </AnimatedContainer>

          <AnimatedContainer delay={0.16}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Foundation</h3>
            <FooterLinkList links={foundationLinks} />
          </AnimatedContainer>

          <AnimatedContainer delay={0.22}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Support</h3>
            <FooterLinkList links={supportLinks} />
          </AnimatedContainer>

          <AnimatedContainer delay={0.28}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Social Links</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="inline-flex items-center gap-2 text-muted-foreground transition-colors duration-300 hover:text-primary"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </AnimatedContainer>
        </div>
      </div>
    </footer>
  );
}
