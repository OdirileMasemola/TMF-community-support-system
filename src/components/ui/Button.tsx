import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  to?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  outline: "border border-border bg-transparent text-primary hover:bg-accent",
  danger: "bg-foreground text-background hover:opacity-90",
};

function buttonClassName(variant: ButtonVariant, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
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
