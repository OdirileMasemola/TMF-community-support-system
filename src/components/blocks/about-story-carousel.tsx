import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { aboutStorySlides } from "@/data/aboutPageData";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5600;

const textVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction >= 0 ? 28 : -28,
    filter: "blur(10px)",
  }),
  center: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction >= 0 ? -24 : 24,
    filter: "blur(8px)",
  }),
};

function wrapOffset(index: number, active: number, length: number) {
  let offset = index - active;
  const half = length / 2;
  if (offset > half) offset -= length;
  if (offset < -half) offset += length;
  return offset;
}

export function AboutStoryCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const slideCount = aboutStorySlides.length;
  const activeSlide = aboutStorySlides[activeIndex];

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (nextIndex: number, nextDirection?: number) => {
      const wrapped = (nextIndex + slideCount) % slideCount;
      setDirection(nextDirection ?? (wrapped > activeIndex ? 1 : -1));
      setActiveIndex(wrapped);
    },
    [activeIndex, slideCount],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1, 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1, -1), [activeIndex, goTo]);

  useEffect(() => {
    if (paused || shouldReduceMotion) {
      return;
    }

    const timer = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, paused, shouldReduceMotion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  return (
    <section
      id="our-story"
      aria-roledescription="carousel"
      aria-label="Stories from the Themba Molefe Foundation"
      className="relative scroll-mt-28 overflow-x-clip px-6 pb-16 pt-4 md:pb-24 md:pt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[420px] bg-[radial-gradient(50%_60%_at_70%_40%,var(--hero-glow),transparent_72%)]"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-6">
        <div className="relative min-h-[240px] md:min-h-[280px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our story in motion</p>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeSlide.id}
              custom={direction}
              variants={shouldReduceMotion ? undefined : textVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative mt-6"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-3 -top-8 select-none text-[6.5rem] font-bold leading-none text-primary/10 md:text-[8rem]"
              >
                {String(activeIndex + 1).padStart(2, "0")}
              </span>

              <p className="relative text-sm font-medium uppercase tracking-[0.18em] text-secondary">
                {activeSlide.kicker}
              </p>
              <h2 className="relative mt-3 max-w-lg text-balance text-3xl font-bold text-foreground md:text-5xl">
                {activeSlide.title}
              </h2>
              <p className="relative mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                {activeSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="sr-only" aria-live="polite">
            {activeSlide.title}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <CarouselButton label="Previous story" onClick={goPrev}>
              <ChevronLeft className="h-5 w-5" />
            </CarouselButton>
            <CarouselButton label="Next story" onClick={goNext}>
              <ChevronRight className="h-5 w-5" />
            </CarouselButton>
            <p className="ml-2 text-sm font-medium tabular-nums text-muted-foreground">
              {String(activeIndex + 1).padStart(2, "0")}
              <span className="mx-1.5 text-border">/</span>
              {String(slideCount).padStart(2, "0")}
            </p>
          </div>
        </div>

        <motion.div
          className="relative h-[420px] w-full cursor-grab touch-pan-y [perspective:1400px] active:cursor-grabbing sm:h-[480px] md:h-[560px]"
          drag={shouldReduceMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) goNext();
            if (info.offset.x > 70) goPrev();
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[min(100%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

          {aboutStorySlides.map((slide, index) => {
            const offset = wrapOffset(index, activeIndex, slideCount);
            const isActive = offset === 0;
            const hidden = Math.abs(offset) > 2;

            return (
              <motion.button
                key={slide.id}
                type="button"
                aria-label={`Show story: ${slide.title}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => {
                  if (!isActive) goTo(index, offset > 0 ? 1 : -1);
                }}
                className={cn(
                  "absolute left-1/2 top-1/2 h-[320px] w-[min(78vw,250px)] origin-center overflow-hidden rounded-[1.75rem] border border-white/25 bg-card p-1.5 text-left shadow-2xl sm:h-[380px] sm:w-[280px] md:h-[460px] md:w-[340px]",
                  isActive ? "cursor-default" : "cursor-pointer",
                )}
                style={{
                  zIndex: 20 - Math.abs(offset),
                  transformStyle: "preserve-3d",
                }}
                initial={false}
                animate={{
                  x: `calc(-50% + ${offset * (isDesktop ? 210 : 168)}px)`,
                  y: "-50%",
                  rotateY: shouldReduceMotion || !isDesktop ? 0 : offset * -42,
                  scale: isActive ? 1 : 0.78,
                  opacity: hidden ? 0 : isActive ? 1 : 0.55,
                  filter: isActive ? "brightness(1)" : "brightness(0.62)",
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 160, damping: 22, mass: 0.9 }
                }
                tabIndex={hidden ? -1 : 0}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[1.35rem]">
                  <motion.div
                    className="h-full w-full"
                    animate={
                      shouldReduceMotion
                        ? { scale: 1 }
                        : { scale: isActive ? 1.12 : 1.04 }
                    }
                    transition={{
                      duration: isActive && !paused && !shouldReduceMotion ? AUTOPLAY_MS / 1000 : 0.7,
                      ease: "linear",
                    }}
                  >
                    <OptimizedImage
                      src={slide.image}
                      alt={slide.alt}
                      className="pointer-events-none h-full w-full object-cover"
                    />
                  </motion.div>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                      {slide.kicker}
                    </p>
                    <p className="mt-1 text-lg font-semibold leading-snug">{slide.title}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl">
        <div className="h-[2px] overflow-hidden rounded-full bg-border/70">
          <motion.div
            key={`${activeIndex}-${paused ? "paused" : "play"}`}
            className="h-full origin-left bg-gradient-to-r from-primary to-secondary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: paused || shouldReduceMotion ? 0 : 1 }}
            transition={{
              duration: shouldReduceMotion || paused ? 0 : AUTOPLAY_MS / 1000,
              ease: "linear",
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
          {aboutStorySlides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(index, index > activeIndex ? 1 : -1)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-300",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                    : "border-border bg-card/70 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {slide.kicker}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_28%,transparent)] active:scale-95"
    >
      {children}
    </button>
  );
}
