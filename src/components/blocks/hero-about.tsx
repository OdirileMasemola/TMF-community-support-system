import type { ReactElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { AboutStoryCarousel } from "@/components/blocks/about-story-carousel";
import { aboutHeroContent, aboutManifesto, aboutOriginContent } from "@/data/aboutPageData";

export function AboutHero(): ReactElement {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-8 pt-32 md:pb-10 md:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--hero-glow),transparent_70%)]"
        />

        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {aboutHeroContent.label}
          </p>

          <h1 className="mx-auto mt-6 flex max-w-4xl flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-balance text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
            {aboutHeroContent.words.map((word, index) => (
              <motion.span
                key={word}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={
                shouldReduceMotion
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }
              }
              transition={{
                opacity: { duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] },
                backgroundPosition: { duration: 7, repeat: Infinity, ease: "linear" },
              }}
              className="bg-[image:var(--hero-highlight-gradient)] bg-[length:200%_100%] bg-clip-text text-transparent"
            >
              {aboutHeroContent.highlightedWord}
            </motion.span>
          </h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {aboutHeroContent.subtitle}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.78 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          >
            <div className="rounded-xl border border-border bg-foreground/5 p-0.5">
              <Button to="#our-story" className="rounded-lg px-3.5 py-1.5 text-sm">
                See our story
              </Button>
            </div>
            <Button to="#our-journey" variant="outline" className="rounded-lg px-3.5 py-1.5 text-sm">
              Our journey
            </Button>
          </motion.div>
        </div>
      </section>

      <AboutStoryCarousel />
      <AboutOriginSection />
      <AboutManifestoSection />
    </>
  );
}

function AboutOriginSection(): ReactElement {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {aboutOriginContent.label}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">
            {aboutOriginContent.heading}
          </h2>
          {aboutOriginContent.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        <motion.figure
          initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative pb-16"
        >
          <div className="overflow-hidden rounded-[2rem] border border-border/70 shadow-[0_30px_80px_-28px_rgba(28,93,153,0.45)]">
            <OptimizedImage
              src={aboutOriginContent.image}
              alt={aboutOriginContent.imageAlt}
              className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
            />
          </div>
          <figcaption className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-xl backdrop-blur-md md:left-10 md:right-auto md:max-w-sm">
            <blockquote className="text-lg font-medium text-foreground md:text-xl">
              “{aboutOriginContent.quote}”
            </blockquote>
            <p className="mt-2 text-sm text-muted-foreground">{aboutOriginContent.cite}</p>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

function AboutManifestoSection(): ReactElement {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How we work
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold text-foreground md:text-4xl">
          A simple way of standing with our community.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {aboutManifesto.map((item, index) => (
            <motion.article
              key={item.number}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-border/70 bg-card/60 p-7 shadow-sm backdrop-blur-sm"
            >
              <p className="text-sm font-semibold tracking-[0.2em] text-primary">{item.number}</p>
              <h3 className="mt-4 text-2xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutHero;
