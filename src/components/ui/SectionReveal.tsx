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
  up: { x: 0, y: 52, rotate: 0, scale: 0.94 },
  left: { x: -88, y: 32, rotate: -3, scale: 0.96 },
  right: { x: 88, y: 32, rotate: 3, scale: 0.96 },
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
    <motion.div
      className={cn(className)}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        rotate: offset.rotate,
        scale: offset.scale,
        filter: "blur(10px)",
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
  );
}
