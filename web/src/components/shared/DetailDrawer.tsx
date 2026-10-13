import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Right-hand slide-over used to open a single record (notification, message,
 * event, sponsorship…) without leaving the list it was picked from.
 */
export function DetailDrawer({ open, onClose, title, eyebrow, description, children, footer }: DetailDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-card text-card-foreground shadow-2xl outline-none"
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
                ) : null}
                <h2 id={titleId} className="mt-1 text-lg font-semibold leading-snug text-foreground">
                  {title}
                </h2>
                {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** Label / value rows for the body of a DetailDrawer. */
export function DetailList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[8.5rem_1fr] gap-3 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 break-words font-medium text-foreground">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
