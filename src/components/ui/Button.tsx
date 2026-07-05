import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  to?: string;
};

const baseClassName = cn(
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold antialiased",
  "transition-[box-shadow,transform,filter,background-color,border-color,color] duration-300 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:pointer-events-none disabled:opacity-50",
);

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "border border-primary bg-primary text-primary-foreground",
    "shadow-[0_0_0px_0px_transparent]",
    "hover:bg-primary hover:text-primary-foreground hover:border-primary",
    "hover:shadow-[0_0_32px_10px_color-mix(in_srgb,var(--primary)_42%,transparent)]",
    "active:scale-[0.98] active:brightness-95",
  ),
  secondary: cn(
    "border border-secondary bg-secondary text-secondary-foreground",
    "shadow-[0_0_0px_0px_transparent]",
    "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary",
    "hover:shadow-[0_0_32px_10px_color-mix(in_srgb,var(--secondary)_42%,transparent)]",
    "active:scale-[0.98] active:brightness-95",
  ),
  outline: cn(
    "border border-border bg-transparent text-foreground",
    "shadow-[0_0_0px_0px_transparent]",
    "hover:border-[color:var(--outline-hover-border)] hover:bg-[var(--outline-hover-bg)]",
    "hover:shadow-[0_0_12px_var(--outline-hover-shadow)]",
    "active:scale-[0.98] active:bg-[var(--outline-hover-bg)]",
  ),
  danger: cn(
    "border border-foreground bg-foreground text-background shadow-sm",
    "hover:bg-transparent hover:text-foreground hover:border-foreground",
    "active:bg-foreground/10 active:scale-[0.98]",
  ),
};

function buttonClassName(variant: ButtonVariant, className?: string) {
  return cn(baseClassName, variantClasses[variant], className);
}

export function Button({ className, variant = "primary", to, children, ...props }: ButtonProps) {
  if (to) {
    return (
      <Link to={to} className={buttonClassName(variant, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClassName(variant, className)} {...props}>
      {children}
    </button>
  );
}
