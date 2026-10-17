import { cn } from "@/lib/utils";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "size-3.5 border-2",
  sm: "size-4 border-2",
  md: "size-6 border-[3px]",
  lg: "size-10 border-4",
};

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  /** Screen-reader label. Leave empty when the spinner sits next to visible text. */
  label?: string;
};

/** Theme-aware circular spinner. Uses the current text colour so it works on any button or surface. */
export function Spinner({ size = "sm", className, label }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        className,
      )}
    />
  );
}

type LoadingStateProps = {
  message?: string;
  className?: string;
  /** `section` sits inside a card or panel; `page` fills most of the viewport. */
  variant?: "section" | "page";
  delay?: number;
};

/** Centered spinner with a short message, used whenever a page or section is loading data. */
export function LoadingState({ message = "Loading…", className, variant = "section", delay = 150 }: LoadingStateProps) {
  const visible = useDelayedFlag(true, delay);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        variant === "page" ? "min-h-[40vh] p-8" : "min-h-24 py-6",
        className,
      )}
    >
      <div className={cn("flex flex-col items-center gap-3 transition-opacity duration-200", visible ? "opacity-100" : "opacity-0")}>
        <Spinner size={variant === "page" ? "lg" : "md"} className="border-border border-t-primary border-r-border text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/** Simple pulsing placeholder block for skeleton layouts. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-muted", className)} />;
}

/** Thin indeterminate bar pinned to the top of the viewport. */
export function TopProgressBar({ active, delay = 150 }: { active: boolean; delay?: number }) {
  const visible = useDelayedFlag(active, delay);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {visible ? <div className="tmf-progress-bar h-full w-1/3 rounded-full bg-primary" /> : null}
    </div>
  );
}
