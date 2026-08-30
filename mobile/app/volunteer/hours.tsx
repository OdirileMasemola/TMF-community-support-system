import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock4, TrendingUp } from "lucide-react-native";
import {
  AppButton,
  ChipSelect,
  EmptyRow,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  StatCard,
  StatGrid,
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate } from "@/lib/display";
import { createVolunteerHours, fetchVolunteerAssignments, fetchVolunteerHours } from "@/services/volunteers";

const today = () => new Date().toISOString().slice(0, 10);

export default function VolunteerHoursScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();

  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [workDate, setWorkDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hoursQuery = useQuery({
    queryKey: ["volunteer", "hours", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerHours(roleProfileId!),
  });

  const assignments = useQuery({
    queryKey: ["volunteer", "assignments", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });

  const rows = hoursQuery.data ?? [];

  const totals = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    const thisMonth = rows
      .filter((row) => new Date(row.work_date) >= monthStart)
      .reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
    return { total, thisMonth };
  }, [rows]);

  const log = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Volunteer profile was not found.");
      const parsed = Number(hours.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Enter how many hours you worked.");
      if (!workDate.trim()) throw new Error("Enter the date you worked.");

      return createVolunteerHours({
        volunteer_id: roleProfileId,
        assignment_id: assignmentId,
        hours: parsed,
        work_date: workDate,
        notes: notes.trim() || null,
      });
    },
    onSuccess: async () => {
      setError(null);
      setSaved(true);
      setHours("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["volunteer"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not log your hours."),
  });

  if (profileLoading || hoursQuery.isLoading) return <LoadingState label="Loading your hours…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your volunteer profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const assignmentOptions = (assignments.data ?? []).map((assignment) => ({
    label: assignment.campaigns?.title ?? assignment.role ?? "Assignment",
    value: assignment.id,
  }));

  return (
    <Screen onRefresh={() => hoursQuery.refetch()} refreshing={hoursQuery.isFetching}>
      <PageHeading eyebrow="Hours" title="Log your time" subtitle="Record the hours you gave so we can credit them." />

      {hoursQuery.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}
      {saved ? <SuccessBanner label="Hours logged. Thank you for your time." /> : null}

      <StatGrid>
        <StatCard label="Total hours" value={totals.total} icon={Clock4} />
        <StatCard label="This month" value={totals.thisMonth} icon={TrendingUp} tone="secondary" />
      </StatGrid>

      <SectionCard title="Log hours">
        {assignmentOptions.length ? (
          <ChipSelect
            label="Assignment (optional)"
            options={assignmentOptions}
            value={assignmentId}
            onChange={(value) => {
              setSaved(false);
              setAssignmentId(value);
            }}
          />
        ) : null}

        <TextField
          label="Hours worked"
          value={hours}
          onChangeText={(text) => {
            setSaved(false);
            setHours(text);
          }}
          placeholder="e.g. 4.5"
          keyboardType="decimal-pad"
        />
        <TextField label="Date" value={workDate} onChangeText={setWorkDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <TextField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="What did you work on?"
          multiline
        />

        <AppButton label="Log hours" onPress={() => log.mutate()} loading={log.isPending} />
      </SectionCard>

      <SectionCard title="Recent entries">
        {rows.length ? (
          rows.slice(0, 20).map((row, index, shown) => (
            <ListRow
              key={row.id}
              icon={Clock4}
              label={`${row.hours} ${Number(row.hours) === 1 ? "hour" : "hours"}`}
              value={[formatShortDate(row.work_date), row.notes ?? undefined].filter(Boolean).join(" · ")}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No hours logged yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
