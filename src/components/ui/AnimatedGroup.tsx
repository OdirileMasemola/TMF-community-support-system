import type { ReactNode } from "react";
import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
};
// the animation here is for the list of components that are going to be displayed
const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};
 // the animation here is for the list of components that are going to be displayed 
const defaultItemVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(12px)",
    y: 12,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 1.2,
    },
  },
};
// this function is used to animate a group of components, it takes in children, className and variants as props. It uses the useReducedMotion hook to check if the user has requested reduced motion. If so, it simply renders the children without any animation. Otherwise, it uses the motion.div component from framer-motion to animate the children based on the provided or default variants.
export function AnimatedGroup({ children, className, variants }: AnimatedGroupProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = variants?.container ?? defaultContainerVariants;
  const itemVariants = variants?.item ?? defaultItemVariants;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
