import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { formatRelativeTime, formatStatusLabel } from "@/lib/display";
import { toUserMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchContactMessages, updateContactMessageStatus } from "@/services/contact";

export function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery({
    queryKey: ["admin-contact-messages"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchContactMessages,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => updateContactMessageStatus(id, "read"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: () => toast.error(toUserMessage("Could not update that message.")),
  });

  const messages = messagesQuery.data ?? [];
  const unreadCount = messages.filter((message) => message.status === "unread").length;

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
              {messages.map((message) => (
                <li key={message.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{message.subject}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {message.first_name} {message.last_name} ·{" "}
                        <a className="text-primary hover:underline" href={`mailto:${message.email}`}>
                          {message.email}
                        </a>{" "}
                        · {formatRelativeTime(message.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatusBadge status={formatStatusLabel(message.status)} />
                      {message.status === "unread" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={markRead.isPending}
                          onClick={() => markRead.mutate(message.id)}
                        >
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{message.message}</p>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
