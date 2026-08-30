import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ButtonRow,
  ChipSelect,
  EmptyRow,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  StatCard,
  StatGrid,
  TextField,
} from "@/components/ui";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { fetchProfiles, updateProfileAccountStatus } from "@/services/admin";

type RoleFilter = "all" | "donor" | "volunteer" | "beneficiary" | "sponsor" | "administrator";

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const profiles = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: fetchProfiles,
  });

  const setStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: "active" | "suspended" }) =>
      updateProfileAccountStatus(userId, status),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not update that account."),
  });

  const rows = profiles.data ?? [];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (!term) return true;
      return `${row.full_name ?? ""} ${row.email ?? ""}`.toLowerCase().includes(term);
    });
  }, [roleFilter, rows, search]);

  if (profiles.isLoading) return <LoadingState label="Loading users…" />;

  return (
    <Screen onRefresh={() => profiles.refetch()} refreshing={profiles.isFetching}>
      <PageHeading
        eyebrow="Administration"
        title="Users"
        subtitle="Activate or suspend accounts across every portal."
      />

      {profiles.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}

      <StatGrid>
        <StatCard label="Total users" value={rows.length} icon={UserRound} />
        <StatCard
          label="Pending"
          value={rows.filter((row) => row.account_status === "pending").length}
          icon={UserRound}
          tone="secondary"
        />
      </StatGrid>

      <TextField label="Search" value={search} onChangeText={setSearch} placeholder="Name or email" autoCapitalize="none" />

      <ChipSelect<RoleFilter>
        options={[
          { label: "All", value: "all" },
          { label: "Donors", value: "donor" },
          { label: "Volunteers", value: "volunteer" },
          { label: "Beneficiaries", value: "beneficiary" },
          { label: "Sponsors", value: "sponsor" },
          { label: "Admins", value: "administrator" },
        ]}
        value={roleFilter}
        onChange={setRoleFilter}
      />

      <SectionCard title={`${visible.length} ${visible.length === 1 ? "user" : "users"}`}>
        {visible.length ? (
          visible.slice(0, 60).map((row, index, shown) => (
            <ListRow
              key={row.id}
              icon={UserRound}
              label={row.full_name ?? row.email ?? "Unnamed user"}
              value={[row.email, formatStatusLabel(row.role), `joined ${formatShortDate(row.created_at)}`]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={formatStatusLabel(row.account_status)} status={row.account_status} />}
              last={index === shown.length - 1}
              footer={
                <ButtonRow>
                  <AppButton
                    label="Activate"
                    onPress={() => setStatus.mutate({ userId: row.id, status: "active" })}
                    disabled={setStatus.isPending || row.account_status === "active"}
                  />
                  <AppButton
                    label="Suspend"
                    variant="outline"
                    onPress={() => setStatus.mutate({ userId: row.id, status: "suspended" })}
                    disabled={setStatus.isPending || row.account_status === "suspended"}
                  />
                </ButtonRow>
              }
            />
          ))
        ) : (
          <EmptyRow label="No users match this filter." />
        )}
      </SectionCard>
    </Screen>
  );
}
