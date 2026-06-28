import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type HeroContactInfo = {
  website: string;
  phone: string;
  address: string;
};

export type HeroCta = {
  text: string;
  to: string;
};

export type HeroSectionProps = {
  logoText?: string;
  slogan?: string;
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  backgroundImage: string;
  contactInfo: HeroContactInfo;
  className?: string;
};

const MOBILE_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
const DESKTOP_CLIP = "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%)";
const HIDDEN_CLIP = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";

function getClipPathForWidth(width: number) {
  return width >= 768 ? DESKTOP_CLIP : MOBILE_CLIP;
}

const contentVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function HeroSection({
  logoText,
  slogan,
  title,
  highlightedTitle,
  subtitle,
  primaryCta,
  secondaryCta,
  backgroundImage,
  contactInfo,
  className,
}: HeroSectionProps) {
  const [clipPath, setClipPath] = useState(MOBILE_CLIP);

  useEffect(() => {
    const updateClipPath = () => setClipPath(getClipPathForWidth(window.innerWidth));
    updateClipPath();
    window.addEventListener("resize", updateClipPath);
    return () => window.removeEventListener("resize", updateClipPath);
  }, []);

  return (
    <section
      className={cn(
        "relative box-border w-full overflow-hidden bg-background bg-[image:var(--page-gradient)] text-foreground md:h-[100svh]",
        className,
      )}
    >
      <div className="relative flex w-full flex-col md:h-full md:flex-row md:overflow-hidden">
        <motion.div
          className="relative z-10 flex w-full flex-col justify-center px-6 pb-8 pt-28 md:h-full md:w-[58%] md:justify-between md:px-12 md:pb-8 md:pt-24 lg:w-[60%] lg:px-16"
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.12 },
            },
          }}
        >
          <div>
            {logoText ? (
              <motion.p
                variants={contentVariants}
                className="text-lg font-bold text-foreground lg:text-xl"
              >
                {logoText}
              </motion.p>
            ) : null}

            {slogan ? (
              <motion.p
                variants={contentVariants}
                className={cn(
                  "text-xs font-semibold tracking-[0.2em] text-primary sm:text-sm",
                  logoText ? "mt-2" : "",
                )}
              >
                {slogan}
              </motion.p>
            ) : null}

            <motion.h1
              variants={contentVariants}
              className="mt-4 max-w-xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              {title}
              {highlightedTitle ? (
                <>
                  <br />
                  <span className="text-primary">{highlightedTitle}</span>
                </>
              ) : null}
            </motion.h1>

            <motion.p
              variants={contentVariants}
              className="mt-4 max-w-xl text-base leading-normal text-muted-foreground sm:text-lg"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={contentVariants} className="mt-6 flex flex-wrap gap-3">
              <Button to={primaryCta.to}>{primaryCta.text}</Button>
              {secondaryCta ? (
                <Button to={secondaryCta.to} variant="outline">
                  {secondaryCta.text}
                </Button>
              ) : null}
            </motion.div>
          </div>

          <motion.div
            variants={contentVariants}
            className="mt-10 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Website
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{contactInfo.website}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{contactInfo.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Address
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{contactInfo.address}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className={cn(
            "relative h-[320px] w-full shrink-0 overflow-hidden",
            "mx-4 mb-8 rounded-2xl border border-border shadow-sm",
            "md:mx-0 md:mb-0 md:h-full md:w-[42%] md:rounded-none md:border-0 md:shadow-none lg:w-[40%]",
          )}
          initial={{ clipPath: HIDDEN_CLIP }}
          animate={{ clipPath }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        >
          <img
            src={backgroundImage}
            alt="Community support outreach by the Themba Molefe Foundation"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-primary/10" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
