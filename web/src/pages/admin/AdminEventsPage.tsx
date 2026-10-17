import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { Textarea } from "@/components/ui/textarea";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createEvent, fetchEvents, updateEvent, type EventRow } from "@/services/admin";
import type { EventStatus } from "@/types/database.types";

const eventStatuses: EventStatus[] = ["draft", "scheduled", "completed", "cancelled"];

export function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["admin-events"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchEvents,
  });

  const [editing, setEditing] = useState<EventRow | null>(null);
  const [draft, setDraft] = useState({ title: "", location: "", event_date: "", description: "", status: "scheduled" as EventStatus });

  const openEvent = (event: EventRow) => {
    setEditing(event);
    setDraft({
      title: event.title,
      location: event.location,
      event_date: event.event_date.slice(0, 10),
      description: event.description ?? "",
      status: event.status,
    });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (!draft.title.trim() || !draft.location.trim() || !draft.event_date) {
        throw new Error("Title, location, and event date are required.");
      }
      await updateEvent(editing.id, {
        title: draft.title.trim(),
        location: draft.location.trim(),
        event_date: draft.event_date,
        description: draft.description.trim() || null,
        status: draft.status,
      });
    },
    onSuccess: async () => {
      toast.success("Event updated");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update event"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Administrator profile is required to create an event.");
      if (!title.trim() || !location.trim() || !eventDate) {
        throw new Error("Title, location, and event date are required.");
      }
      return createEvent({
        admin_id: roleProfileId,
        title: title.trim(),
        location: location.trim(),
        event_date: eventDate,
        description: description.trim() || null,
        status: "scheduled",
      });
    },
    onSuccess: async () => {
      toast.success("Event created");
      setShowCreate(false);
      setTitle("");
      setLocation("");
      setEventDate("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not create event"),
  });

  return (
    <AdminPageShell
      label="Administration"
      title="Event Management"
      description="Schedule, update, and monitor foundation community events and volunteer assignments."
      actions={
        <Button type="button" onClick={() => setShowCreate((current) => !current)}>
          {showCreate ? "Cancel" : "Create event"}
        </Button>
      }
    >
      {showCreate ? (
        <DashboardCard>
          <CardHeader>
            <CardTitle>Create event</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} required />
            <Input
              label="Event date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="sm:col-span-2">
              <Button type="button" disabled={createMutation.isPending} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? "Saving..." : "Save event"}
              </Button>
            </div>
          </CardContent>
        </DashboardCard>
      ) : null}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={events.length === 0}
        emptyMessage="No events found."
        loadingMessage="Loading events..."
      >
        <div className="grid gap-px bg-border lg:grid-cols-3">
          {events.map((event) => (
            <DashboardCard key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{event.title}</CardTitle>
                  <AdminStatusBadge status={formatStatusLabel(event.status)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{formatShortDate(event.event_date)}</p>
                <p>{event.location}</p>
                <p>{event.description?.trim() || "No description provided."}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => openEvent(event)}>
                  Manage event
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      </DataState>

      <DetailDrawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        eyebrow="Manage event"
        title={editing?.title ?? ""}
        description={editing ? `${formatShortDate(editing.event_date)} · ${editing.location}` : null}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={updateMutation.isPending} loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <Input
            label="Location"
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
          />
          <Input
            label="Event date"
            type="date"
            value={draft.event_date}
            onChange={(event) => setDraft({ ...draft, event_date: event.target.value })}
          />
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Status</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as EventStatus })}
            >
              {eventStatuses.map((value) => (
                <option key={value} value={value}>
                  {formatStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Description</span>
            <Textarea
              rows={4}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
        </div>
      </DetailDrawer>
    </AdminPageShell>
  );
}
