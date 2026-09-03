import React from "react";
import { motion, type Variants } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

interface StatProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface ActionProps {
  text: string;
  onClick: () => void;
  variant?: ButtonProps["variant"];
  className?: string;
}

interface HeroSectionProps {
  label?: string;
  title: React.ReactNode;
  subtitle: string;
  actions: ActionProps[];
  stats: StatProps[];
  images: string[];
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const floatingVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const HeroSection = ({ label, title, subtitle, actions, stats, images, className }: HeroSectionProps) => {
  return (
    <section
      className={cn(
        "relative box-border w-full overflow-hidden bg-transparent text-foreground md:h-[100svh]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--hero-glow),transparent_70%)]"
      />

      <div className="relative flex w-full flex-col md:h-full md:flex-row md:overflow-hidden">
        <motion.div
          className="relative z-10 flex w-full flex-col justify-center px-6 pb-8 pt-32 md:h-full md:w-[58%] md:justify-between md:px-12 md:pb-8 md:pt-32 lg:w-[60%] lg:px-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mt-8 md:ml-4 md:mt-14 lg:ml-6">
            {label ? (
              <motion.p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm"
                variants={itemVariants}
              >
                {label}
              </motion.p>
            ) : null}

            <motion.h1
              className="mt-4 max-w-xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
              variants={itemVariants}
            >
              {title}
            </motion.h1>
            <motion.p className="mt-4 max-w-xl text-base leading-normal text-muted-foreground sm:text-lg" variants={itemVariants}>
              {subtitle}
            </motion.p>
            <motion.div className="mt-6 flex flex-wrap gap-3" variants={itemVariants}>
              {actions.map((action) => (
                <Button
                  key={action.text}
                  onClick={action.onClick}
                  variant={action.variant}
                  className={cn(action.className)}
                >
                  {action.text}
                </Button>
              ))}
            </motion.div>
          </div>

          <motion.div className="mt-10 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3" variants={itemVariants}>
            {stats.map((stat) => (
              <div
                key={`${stat.value}-${stat.label}`}
                className="flex items-start gap-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">{stat.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className={cn(
            "relative h-[360px] w-full shrink-0 overflow-hidden",
            "mx-4 mb-8 rounded-2xl border border-border shadow-sm",
            "md:mx-0 md:mb-0 md:h-full md:w-[42%] md:rounded-none md:border-0 md:shadow-none lg:w-[40%]",
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="absolute left-[18%] top-24 h-16 w-16 rounded-full bg-blue-200/50 dark:bg-blue-800/30 md:top-36"
            variants={floatingVariants}
            animate="animate"
          />
          <motion.div
            className="absolute bottom-0 right-1/3 h-12 w-12 rounded-lg bg-purple-200/50 dark:bg-purple-800/30"
            variants={floatingVariants}
            animate="animate"
            style={{ transitionDelay: "0.5s" }}
          />
          <motion.div
            className="absolute bottom-1/4 left-4 h-6 w-6 rounded-full bg-green-200/50 dark:bg-green-800/30"
            variants={floatingVariants}
            animate="animate"
            style={{ transitionDelay: "1s" }}
          />

          <motion.div
            className="absolute left-[42%] top-28 h-52 w-52 -translate-x-1/2 rounded-3xl border border-border bg-transparent p-2 shadow-2xl backdrop-blur-sm sm:h-72 sm:w-72 md:top-44"
            style={{ transformOrigin: "bottom center" }}
            variants={imageVariants}
          >
            <div className="h-full w-full overflow-hidden rounded-xl">
              <OptimizedImage
                src={images[0]}
                alt="Community learners studying together"
                width={900}
                height={900}
                className="h-full w-full scale-110 object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute right-10 top-[46%] h-44 w-44 rounded-3xl border border-border bg-transparent p-2 shadow-2xl backdrop-blur-sm sm:h-60 sm:w-60 md:right-14 md:top-[40%]"
            style={{ transformOrigin: "left center" }}
            variants={imageVariants}
          >
            <div className="h-full w-full overflow-hidden rounded-xl">
              <OptimizedImage
                src={images[1]}
                alt="Mentor supporting a student"
                width={900}
                height={900}
                className="h-full w-full scale-110 object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute left-6 top-[62%] h-36 w-36 rounded-3xl border border-border bg-transparent p-2 shadow-2xl backdrop-blur-sm sm:h-52 sm:w-52 md:left-10 md:top-[58%]"
            style={{ transformOrigin: "top right" }}
            variants={imageVariants}
          >
            <div className="h-full w-full overflow-hidden rounded-xl">
              <OptimizedImage
                src={images[2]}
                alt="Young people collaborating"
                width={900}
                height={900}
                className="h-full w-full scale-110 object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
