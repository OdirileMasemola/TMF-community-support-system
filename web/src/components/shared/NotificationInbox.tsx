import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Bell, BellRing, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DetailDrawer, DetailList } from "@/components/shared/DetailDrawer";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, formatShortDate, formatStatusLabel, notificationIsUnread } from "@/lib/display";
import { toUserMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/services/notifications";

type NotificationInboxProps = {
  notifications: NotificationRow[];
  markRead: UseMutationResult<void, Error, string>;
};

function formatFullDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Notification list shared by every portal. Clicking a row opens the full
 * notification in a drawer and marks it as read.
 */
export function NotificationInbox({ notifications, markRead }: NotificationInboxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notifications.find((item) => item.id === selectedId) ?? null;

  const open = (notification: NotificationRow) => {
    setSelectedId(notification.id);
    if (notificationIsUnread(notification.status)) {
      markRead.mutate(notification.id, {
        onError: () => toast.error(toUserMessage("Could not mark the notification as read.")),
      });
    }
  };

  const link = selected?.link_url?.trim();

  return (
    <>
      <ul className="divide-y divide-border">
        {notifications.map((notification) => {
          const unread = notificationIsUnread(notification.status);
          const Icon = unread ? BellRing : Bell;
          return (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => open(notification)}
                className={cn(
                  "group flex w-full items-start gap-4 rounded-lg px-3 py-4 text-left transition-colors",
                  "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-medium text-foreground", unread && "text-primary")}>
                      {notification.title?.trim() || formatStatusLabel(notification.notification_type)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {formatStatusLabel(notification.notification_type)}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{notification.message}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {formatRelativeTime(notification.notification_date)}
                  </span>
                </span>
                {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Notification"
        title={selected ? selected.title?.trim() || formatStatusLabel(selected.notification_type) : ""}
        description={selected ? formatFullDate(selected.notification_date) : null}
        footer={
          <>
            {link && link.startsWith("/") ? (
              <Button to={link} variant="outline">
                <ExternalLink className="mr-2 size-4" /> Open related page
              </Button>
            ) : null}
            {link && !link.startsWith("/") ? (
              <Button asChild variant="outline">
                <a href={link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" /> Open link
                </a>
              </Button>
            ) : null}
            <Button type="button" onClick={() => setSelectedId(null)}>
              Done
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-6">
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{selected.message}</p>
            <DetailList
              items={[
                { label: "Type", value: formatStatusLabel(selected.notification_type) },
                { label: "Status", value: notificationIsUnread(selected.status) ? "Unread" : "Read" },
                { label: "Received", value: formatShortDate(selected.notification_date) },
                ...(selected.related_entity_type
                  ? [{ label: "Related to", value: formatStatusLabel(selected.related_entity_type) }]
                  : []),
              ]}
            />
          </div>
        ) : null}
      </DetailDrawer>
    </>
  );
}
