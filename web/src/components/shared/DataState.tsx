import type { ReactNode } from "react";

type DataStateProps = {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  children: ReactNode;
};

/** Lightweight loading / error / empty wrapper that fits existing dashboard styling. */
export function DataState({
  isLoading,
  isError,
  errorMessage = "We could not load this information right now. Please try again shortly.",
  isEmpty,
  emptyMessage = "Nothing to show yet.",
  loadingMessage = "Loading...",
  children,
}: DataStateProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{loadingMessage}</p>;
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">{errorMessage}</p>;
  }

  if (isEmpty) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return <>{children}</>;
}

/** Lightweight route-level fallback used with React.lazy. */
export function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
