import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionRevealDirection = "up" | "left" | "right";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: SectionRevealDirection;
};

const directionOffsets: Record<
  SectionRevealDirection,
  { x: number; y: number; rotate: number; scale: number }
> = {
  // Keep horizontal offsets modest so animated sections do not widen the page
  // and clip sticky sidebars in app shells.
  up: { x: 0, y: 36, rotate: 0, scale: 0.98 },
  left: { x: -28, y: 20, rotate: -1, scale: 0.98 },
  right: { x: 28, y: 20, rotate: 1, scale: 0.98 },
};

export function SectionReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: SectionRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const offset = directionOffsets[direction];

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("overflow-x-clip", className)}>
      <motion.div
        initial={{
          opacity: 0,
          x: offset.x,
          y: offset.y,
          rotate: offset.rotate,
          scale: offset.scale,
          filter: "blur(6px)",
        }}
        whileInView={{
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{
          type: "spring",
          stiffness: 130,
          damping: 22,
          mass: 0.85,
          delay,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
