import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import authImage from "@/assets/images/auth/Auth.webp";
import logoImage from "@/assets/images/logo.jpeg";

type AuthPageShellProps = {
  label: string;
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "md" | "lg";
  scrollable?: boolean;
};

function AuthImagePanel() {
  return (
    <aside className="relative h-full overflow-hidden bg-black">
      <img
        src={authImage}
        alt="TMF community outreach"
        className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center brightness-75 blur-[2px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Themba Molefe Foundation
        </p>
        <p className="mt-3 max-w-md text-2xl font-bold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
          Community support starts with connection.
        </p>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Join a community creating practical support and opportunity for people who need it most.
        </p>
      </div>
    </aside>
  );
}

function AuthFormContent({
  widthClass,
  label,
  title,
  highlightedTitle,
  subtitle,
  children,
  footer,
}: {
  widthClass: string;
  label: string;
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={`w-full ${widthClass} [&_.my-6]:my-3 [&_form]:gap-2.5 [&_input]:h-9 [&_input]:py-1.5 [&_select]:h-9 [&_select]:py-1.5 [&_button]:h-9`}>
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex min-w-0 items-center gap-2.5 text-foreground">
          <img src={logoImage} alt="Themba Molefe Foundation" className="size-9 shrink-0 rounded-lg object-cover" />
          <span className="min-w-0 truncate whitespace-nowrap text-base font-bold leading-none tracking-tight text-foreground">
            <span className="text-primary">TMF</span>
            {" "}
            Community Support
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Home
        </Link>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {title}
          {highlightedTitle ? (
            <>
              {" "}
              <span className="text-primary">{highlightedTitle}</span>
            </>
          ) : null}
        </h1>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-5">
        {children}
        {footer ? <div className="mt-5 border-t border-border pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthPageShell({
  label,
  title,
  highlightedTitle,
  subtitle,
  children,
  footer,
  maxWidth = "md",
  scrollable = false,
}: AuthPageShellProps) {
  const widthClass = maxWidth === "lg" ? "max-w-[360px]" : "max-w-[340px]";

  if (scrollable) {
    return (
      <section className="relative min-h-[100dvh] bg-background">
        <aside className="fixed inset-y-0 right-0 z-0 hidden w-1/2 lg:block">
          <AuthImagePanel />
        </aside>

        <div className="relative z-10 lg:w-1/2">
          <div className="flex min-h-[100dvh] items-start justify-center px-6 py-10 lg:px-10">
            <AuthFormContent
              widthClass={widthClass}
              label={label}
              title={title}
              highlightedTitle={highlightedTitle}
              subtitle={subtitle}
              footer={footer}
            >
              {children}
            </AuthFormContent>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-[100dvh] overflow-hidden bg-background">
      <div className="grid h-full lg:grid-cols-2">
        <div className="flex h-full items-center justify-center overflow-hidden px-6 py-8 lg:px-10">
          <AuthFormContent
            widthClass={widthClass}
            label={label}
            title={title}
            highlightedTitle={highlightedTitle}
            subtitle={subtitle}
            footer={footer}
          >
            {children}
          </AuthFormContent>
        </div>

        <div className={cn("hidden h-full lg:block")}>
          <AuthImagePanel />
        </div>
      </div>
    </section>
  );
}
