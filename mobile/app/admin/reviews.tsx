import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileCheck2, Inbox } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ButtonRow,
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
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatCurrency, formatShortDate, formatStatusLabel } from "@/lib/display";
import { fetchAllAssistanceRequests, updateAssistanceRequest } from "@/services/assistance";
import { fetchPendingProofs, updateDonationProof } from "@/services/donations";
import { fetchAllApplications, updateCampaignApplication } from "@/services/volunteers";

type Queue = "volunteers" | "assistance" | "proofs";

export default function AdminReviewsScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<Queue>("volunteers");
  const [error, setError] = useState<string | null>(null);

  const applications = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => fetchAllApplications(100),
  });

  const assistance = useQuery({
    queryKey: ["admin", "assistance"],
    queryFn: () => fetchAllAssistanceRequests(100),
  });

  const proofs = useQuery({
    queryKey: ["admin", "proofs"],
    queryFn: () => fetchPendingProofs(100),
  });

  const refreshAll = async () => {
    setError(null);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const onError = (mutationError: unknown) =>
    setError(mutationError instanceof Error ? mutationError.message : "Could not save that decision.");

  const reviewApplication = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      updateCampaignApplication(id, { status }),
    onSuccess: refreshAll,
    onError,
  });

  const reviewRequest = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      updateAssistanceRequest(id, {
        status,
        reviewed_by: roleProfileId,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: refreshAll,
    onError,
  });

  const reviewProof = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      updateDonationProof(id, {
        verification_status: status,
        reviewed_by: roleProfileId,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: refreshAll,
    onError,
  });

  if (profileLoading) return <LoadingState label="Loading the review queues…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your administrator profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const pendingApplications = (applications.data ?? []).filter((row) => row.status === "pending");
  const pendingRequests = (assistance.data ?? []).filter(
    (row) => row.status === "pending" || row.status === "under_review",
  );
  const pendingProofs = proofs.data ?? [];

  const busy = reviewApplication.isPending || reviewRequest.isPending || reviewProof.isPending;

  return (
    <Screen
      onRefresh={() => {
        applications.refetch();
        assistance.refetch();
        proofs.refetch();
      }}
      refreshing={applications.isFetching || assistance.isFetching || proofs.isFetching}
    >
      <PageHeading
        eyebrow="Administration"
        title="Awaiting your decision"
        subtitle="Approve or reject the items queued up for review."
      />

      {applications.isError || assistance.isError || proofs.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}

      <StatGrid>
        <StatCard label="Volunteers" value={pendingApplications.length} icon={ClipboardList} />
        <StatCard label="Assistance" value={pendingRequests.length} icon={Inbox} tone="secondary" />
        <StatCard label="Payment proofs" value={pendingProofs.length} icon={FileCheck2} wide />
      </StatGrid>

      <ChipSelect<Queue>
        options={[
          { label: `Volunteers (${pendingApplications.length})`, value: "volunteers" },
          { label: `Assistance (${pendingRequests.length})`, value: "assistance" },
          { label: `Proofs (${pendingProofs.length})`, value: "proofs" },
        ]}
        value={queue}
        onChange={setQueue}
      />

      {queue === "volunteers" ? (
        <SectionCard title="Volunteer applications">
          {applications.isLoading ? (
            <LoadingState />
          ) : pendingApplications.length ? (
            pendingApplications.map((application, index) => (
              <ListRow
                key={application.id}
                icon={ClipboardList}
                label={application.volunteer_profiles?.profiles?.full_name ?? "Volunteer"}
                value={[
                  application.campaigns?.title,
                  application.participation_role,
                  `applied ${formatShortDate(application.application_date)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                last={index === pendingApplications.length - 1}
                footer={
                  <ButtonRow>
                    <AppButton
                      label="Approve"
                      onPress={() => reviewApplication.mutate({ id: application.id, status: "approved" })}
                      disabled={busy}
                    />
                    <AppButton
                      label="Reject"
                      variant="outline"
                      onPress={() => reviewApplication.mutate({ id: application.id, status: "rejected" })}
                      disabled={busy}
                    />
                  </ButtonRow>
                }
              />
            ))
          ) : (
            <EmptyRow label="No volunteer applications waiting." />
          )}
        </SectionCard>
      ) : null}

      {queue === "assistance" ? (
        <SectionCard title="Assistance requests">
          {assistance.isLoading ? (
            <LoadingState />
          ) : pendingRequests.length ? (
            pendingRequests.map((request, index) => (
              <ListRow
                key={request.id}
                icon={Inbox}
                label={request.beneficiary_profiles?.profiles?.full_name ?? "Beneficiary"}
                value={[
                  request.request_type,
                  request.description,
                  request.priority ? `${formatStatusLabel(request.priority)} priority` : null,
                  `submitted ${formatShortDate(request.request_date)}`,
                ]
                  .filter(Boolean)
                  .join("\n")}
                right={<Badge label={formatStatusLabel(request.status)} status={request.status} />}
                last={index === pendingRequests.length - 1}
                footer={
                  <ButtonRow>
                    <AppButton
                      label="Approve"
                      onPress={() => reviewRequest.mutate({ id: request.id, status: "approved" })}
                      disabled={busy}
                    />
                    <AppButton
                      label="Reject"
                      variant="outline"
                      onPress={() => reviewRequest.mutate({ id: request.id, status: "rejected" })}
                      disabled={busy}
                    />
                  </ButtonRow>
                }
              />
            ))
          ) : (
            <EmptyRow label="No assistance requests waiting." />
          )}
        </SectionCard>
      ) : null}

      {queue === "proofs" ? (
        <SectionCard title="Payment proofs">
          {proofs.isLoading ? (
            <LoadingState />
          ) : pendingProofs.length ? (
            pendingProofs.map((proof, index) => (
              <ListRow
                key={proof.id}
                icon={FileCheck2}
                label={proof.donations?.campaigns?.title ?? "General fund"}
                value={[
                  formatCurrency(proof.donations?.amount),
                  proof.payment_reference ?? proof.donations?.payment_reference,
                  `uploaded ${formatShortDate(proof.uploaded_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                last={index === pendingProofs.length - 1}
                footer={
                  <ButtonRow>
                    <AppButton
                      label="Verify"
                      onPress={() => reviewProof.mutate({ id: proof.id, status: "approved" })}
                      disabled={busy}
                    />
                    <AppButton
                      label="Reject"
                      variant="outline"
                      onPress={() => reviewProof.mutate({ id: proof.id, status: "rejected" })}
                      disabled={busy}
                    />
                  </ButtonRow>
                }
              />
            ))
          ) : (
            <EmptyRow label="No payment proofs waiting." />
          )}
        </SectionCard>
      ) : null}
    </Screen>
  );
}
