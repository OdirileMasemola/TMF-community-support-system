import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Mail, MailOpen, Reply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { DetailDrawer, DetailList } from "@/components/shared/DetailDrawer";
import { formatRelativeTime, formatShortDate, formatStatusLabel } from "@/lib/display";
import { toUserMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchContactMessages, updateContactMessageStatus, type ContactMessageRow } from "@/services/contact";

export function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery({
    queryKey: ["admin-contact-messages"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchContactMessages,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactMessageRow["status"] }) =>
      updateContactMessageStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: () => toast.error(toUserMessage("Could not update that message.")),
  });

  const messages = messagesQuery.data ?? [];
  const unreadCount = messages.filter((message) => message.status === "unread").length;
  const selected = messages.find((message) => message.id === selectedId) ?? null;

  const openMessage = (message: ContactMessageRow) => {
    setSelectedId(message.id);
    if (message.status === "unread") setStatus.mutate({ id: message.id, status: "read" });
  };

  return (
    <AdminPageShell
      label="Administration"
      title="Contact messages"
      description="Messages submitted from the public contact form. These are also emailed to hope.molefe@icloud.com."
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>
            Inbox {unreadCount > 0 ? <span className="text-sm font-normal text-muted-foreground">· {unreadCount} unread</span> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={messagesQuery.isLoading}
            isError={messagesQuery.isError}
            isEmpty={messages.length === 0}
            emptyMessage="No contact messages yet."
            errorMessage="We could not load contact messages right now. Please try again shortly."
            loadingMessage="Loading messages..."
          >
            <ul className="divide-y divide-border">
              {messages.map((message) => {
                const unread = message.status === "unread";
                const Icon = unread ? Mail : MailOpen;
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className="flex w-full items-start gap-4 rounded-lg px-3 py-4 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cn("font-medium text-foreground", unread && "text-primary")}>
                            {message.subject}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(message.created_at)}</span>
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {message.first_name} {message.last_name} · {message.email}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm text-foreground/80">{message.message}</span>
                      </span>
                      <AdminStatusBadge status={formatStatusLabel(message.status)} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Contact message"
        title={selected?.subject ?? ""}
        description={selected ? `${selected.first_name} ${selected.last_name} · ${formatRelativeTime(selected.created_at)}` : null}
        footer={
          selected ? (
            <>
              {selected.status !== "archived" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate(
                      { id: selected.id, status: "archived" },
                      { onSuccess: () => toast.success("Message archived") },
                    )
                  }
                >
                  <Archive className="mr-2 size-4" /> Archive
                </Button>
              ) : null}
              {selected.status !== "unread" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => {
                    setStatus.mutate({ id: selected.id, status: "unread" });
                    setSelectedId(null);
                  }}
                >
                  <Mail className="mr-2 size-4" /> Mark unread
                </Button>
              ) : null}
              <Button asChild>
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}>
                  <Reply className="mr-2 size-4" /> Reply by email
                </a>
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-6">
            <DetailList
              items={[
                { label: "From", value: `${selected.first_name} ${selected.last_name}` },
                {
                  label: "Email",
                  value: (
                    <a className="text-primary hover:underline" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  ),
                },
                { label: "Received", value: formatShortDate(selected.created_at) },
                { label: "Status", value: <AdminStatusBadge status={formatStatusLabel(selected.status)} /> },
              ]}
            />
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{selected.message}</p>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </AdminPageShell>
  );
}
