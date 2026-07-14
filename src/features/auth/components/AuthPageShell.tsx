import type { ReactNode } from "react";
import { AnimatedGroup } from "@/components/ui/AnimatedGroup";
import { Card } from "@/components/ui/Card";

// so this is the shell component for the auth pages and used to wrap pages that are related to the auth process
type AuthPageShellProps = {
  label: string;
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "md" | "lg";
};

export function AuthPageShell({
  label,
  title,
  highlightedTitle,
  subtitle,
  children,
  footer,
  maxWidth = "md",
}: AuthPageShellProps) {
  const widthClass = maxWidth === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 md:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--hero-glow),transparent_70%)]"
      />

      <div className={`mx-auto ${widthClass}`}>
        <AnimatedGroup>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {label}
          </p>

          <h1 className="mt-4 text-center text-balance text-3xl font-bold text-foreground md:text-4xl">
            {title}
            {highlightedTitle ? (
              <>
                {" "}
                <span className="bg-[image:var(--hero-highlight-gradient)] bg-clip-text text-transparent">
                  {highlightedTitle}
                </span>
              </>
            ) : null}
          </h1>

          <p className="mt-3 text-center text-pretty text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </AnimatedGroup>

        <Card className="mt-8 border-border/80 p-6 shadow-md backdrop-blur-sm">
          {children}
          {footer ? <div className="mt-6 border-t border-border pt-5">{footer}</div> : null}
        </Card>
      </div>
    </section>
  );
}
