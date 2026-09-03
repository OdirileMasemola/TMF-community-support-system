import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium antialiased ring-offset-background transition-[box-shadow,transform,filter,background-color,border-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: cn(
          "border border-primary bg-primary text-primary-foreground",
          "hover:bg-primary/90 hover:text-primary-foreground hover:border-primary",
          "hover:shadow-[0_0_32px_10px_color-mix(in_srgb,var(--primary)_42%,transparent)]",
          "active:scale-[0.98] active:brightness-95",
        ),
        primary: cn(
          "border border-primary bg-primary text-primary-foreground",
          "hover:bg-primary hover:text-primary-foreground hover:border-primary",
          "hover:shadow-[0_0_32px_10px_color-mix(in_srgb,var(--primary)_42%,transparent)]",
          "active:scale-[0.98] active:brightness-95",
        ),
        destructive: "border border-foreground bg-foreground text-background hover:bg-foreground/90",
        danger: cn(
          "border border-foreground bg-foreground text-background shadow-sm",
          "hover:bg-transparent hover:text-foreground hover:border-foreground",
          "active:bg-foreground/10 active:scale-[0.98]",
        ),
        outline: cn(
          "border border-border bg-transparent text-foreground",
          "hover:border-[color:var(--outline-hover-border)] hover:bg-[var(--outline-hover-bg)]",
          "hover:shadow-[0_0_12px_var(--outline-hover-shadow)]",
          "active:scale-[0.98] active:bg-[var(--outline-hover-bg)]",
        ),
        secondary: cn(
          "border border-secondary bg-secondary text-secondary-foreground",
          "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary",
          "hover:shadow-[0_0_32px_10px_color-mix(in_srgb,var(--secondary)_42%,transparent)]",
          "active:scale-[0.98]",
        ),
        ghost: "border border-transparent hover:bg-accent hover:text-accent-foreground",
        link: "h-auto border border-transparent p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  to?: string;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, to, asChild = false, children, ...props }, ref) => {
    const classNames = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      const Comp = Slot;
      return (
        <Comp className={classNames} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    if (to?.startsWith("#")) {
      return (
        <a href={to} className={classNames}>
          {children}
        </a>
      );
    }

    if (to) {
      return (
        <Link to={to} className={classNames}>
          {children}
        </Link>
      );
    }

    return (
      <button className={classNames} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
