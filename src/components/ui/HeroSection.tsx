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
const DESKTOP_CLIP_LG = "polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)";
const HIDDEN_CLIP = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";

function getClipPathForWidth(width: number) {
  if (width >= 1024) return DESKTOP_CLIP_LG;
  if (width >= 768) return DESKTOP_CLIP;
  return MOBILE_CLIP;
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
        "relative min-h-[calc(100vh-80px)] overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="relative flex min-h-[calc(100vh-80px)] flex-col md:flex-row">
        <motion.div
          className="relative z-10 flex w-full flex-col justify-between px-4 py-10 sm:px-6 md:w-[56%] md:px-8 lg:w-[58%] lg:px-12 lg:py-16"
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
              className="mt-6 max-w-xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
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
              className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={contentVariants} className="mt-8 flex flex-wrap gap-3">
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
            className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-3 lg:mt-12"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Website</p>
                <p className="mt-1 text-sm font-medium text-foreground">{contactInfo.website}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm font-medium text-foreground">{contactInfo.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</p>
                <p className="mt-1 text-sm font-medium text-foreground">{contactInfo.address}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className={cn(
            "relative h-[360px] w-full shrink-0 overflow-hidden",
            "mx-4 mb-10 rounded-2xl border border-border shadow-sm",
            "md:absolute md:inset-y-0 md:right-0 md:mx-0 md:mb-0 md:h-auto md:min-h-full",
            "md:w-[44%] md:rounded-none md:border-0 md:shadow-none lg:w-[42%]",
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
