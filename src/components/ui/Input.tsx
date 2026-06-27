import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label && <span>{label}</span>}
      <input
        id={id}
        className={cn(
          "rounded-lg border border-border bg-card px-3 py-2 text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30",
          error && "border-primary focus:border-primary focus:ring-primary/30",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-primary">{error}</span>}
    </label>
  );
}
