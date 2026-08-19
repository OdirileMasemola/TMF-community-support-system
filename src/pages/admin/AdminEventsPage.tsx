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
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createEvent, fetchEvents } from "@/services/admin";

export function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const { data: events = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-events"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchEvents,
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
              <Button type="button" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
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
                <Button type="button" variant="outline" size="sm" className="mt-3">
                  Manage event
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}
