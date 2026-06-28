import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  to?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-primary-foreground hover:bg-transparent hover:text-primary hover:border-primary active:bg-primary/10 active:scale-[0.98]",
  secondary:
    "border-secondary bg-secondary text-secondary-foreground hover:bg-transparent hover:text-secondary hover:border-secondary active:bg-secondary/10 active:scale-[0.98]",
  outline:
    "border-border bg-transparent text-primary hover:border-primary hover:text-primary hover:bg-primary/10",
  danger:
    "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground hover:border-foreground active:bg-foreground/10 active:scale-[0.98]",
};

function buttonClassName(variant: ButtonVariant, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    className,
  );
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
