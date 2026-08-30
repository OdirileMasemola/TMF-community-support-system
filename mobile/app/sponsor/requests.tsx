import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ButtonRow,
  EmptyRow,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import {
  createSponsorship,
  createSponsorshipResponse,
  fetchOpenSponsorshipRequests,
  fetchSponsorResponses,
} from "@/services/sponsorships";

const today = () => new Date().toISOString().slice(0, 10);

export default function SponsorRequestsScreen() {
  const { roleProfile, roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();

  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [responded, setResponded] = useState(false);

  const requests = useQuery({
    queryKey: ["sponsor", "open-requests"],
    queryFn: fetchOpenSponsorshipRequests,
  });

  const responses = useQuery({
    queryKey: ["sponsor", "responses", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchSponsorResponses(roleProfileId!),
  });

  const respondedRequestIds = useMemo(
    () => new Set((responses.data ?? []).map((response) => response.request_id)),
    [responses.data],
  );

  const respond = useMutation({
    mutationFn: async ({ requestId, campaignId, accept }: { requestId: string; campaignId: string | null; accept: boolean }) => {
      if (!roleProfileId) throw new Error("Sponsor profile was not found.");

      let sponsorshipId: string | null = null;

      if (accept) {
        const parsed = Number(amount.replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Enter the amount you want to commit.");

        const sponsorship = await createSponsorship({
          sponsor_id: roleProfileId,
          campaign_id: campaignId,
          amount: parsed,
          sponsorship_date: today(),
          sponsorship_type: (roleProfile as { sponsorship_type?: string | null } | null)?.sponsorship_type ?? null,
          status: "pending",
        });
        sponsorshipId = sponsorship.id;
      }

      return createSponsorshipResponse({
        request_id: requestId,
        sponsor_id: roleProfileId,
        sponsorship_id: sponsorshipId,
        status: accept ? "accepted" : "declined",
        notes: notes.trim() || null,
      });
    },
    onSuccess: async () => {
      setError(null);
      setOpenRequestId(null);
      setAmount("");
      setNotes("");
      setResponded(true);
      await queryClient.invalidateQueries({ queryKey: ["sponsor"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not send your response."),
  });

  if (profileLoading || requests.isLoading) return <LoadingState label="Loading sponsorship requests…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your sponsor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const rows = requests.data ?? [];

  return (
    <Screen
      onRefresh={() => {
        requests.refetch();
        responses.refetch();
      }}
      refreshing={requests.isFetching}
    >
      <PageHeading
        eyebrow="Requests"
        title="Needs looking for a sponsor"
        subtitle="Specific gaps the foundation has asked sponsors to close."
      />

      {requests.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}
      {responded ? <SuccessBanner label="Thank you. Your response has been sent to the team." /> : null}

      <SectionCard title={`${rows.length} open ${rows.length === 1 ? "request" : "requests"}`}>
        {rows.length ? (
          rows.map((request, index) => {
            const alreadyResponded = respondedRequestIds.has(request.id);
            const expanded = openRequestId === request.id;

            return (
              <ListRow
                key={request.id}
                icon={Inbox}
                label={request.title}
                value={[
                  request.requested_support,
                  request.campaigns?.title ? `Campaign: ${request.campaigns.title}` : null,
                  request.estimated_impact ? `Impact: ${request.estimated_impact}` : null,
                  request.deadline ? `Needed by ${formatShortDate(request.deadline)}` : null,
                ]
                  .filter(Boolean)
                  .join("\n")}
                right={
                  alreadyResponded ? (
                    <Badge label="Responded" status="approved" />
                  ) : request.priority ? (
                    <Badge label={formatStatusLabel(request.priority)} status={request.priority} />
                  ) : undefined
                }
                last={index === rows.length - 1}
                footer={
                  alreadyResponded ? undefined : expanded ? (
                    <>
                      <TextField
                        label="Amount to commit (ZAR)"
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="25000"
                        keyboardType="decimal-pad"
                        hint="Leave this if you are declining."
                      />
                      <TextField
                        label="Message (optional)"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Anything the team should know"
                        multiline
                      />
                      <ButtonRow>
                        <AppButton
                          label="Accept"
                          onPress={() =>
                            respond.mutate({ requestId: request.id, campaignId: request.campaign_id, accept: true })
                          }
                          loading={respond.isPending}
                        />
                        <AppButton
                          label="Decline"
                          variant="outline"
                          onPress={() =>
                            respond.mutate({ requestId: request.id, campaignId: request.campaign_id, accept: false })
                          }
                        />
                      </ButtonRow>
                      <AppButton label="Cancel" variant="ghost" onPress={() => setOpenRequestId(null)} />
                    </>
                  ) : (
                    <AppButton
                      label="Respond"
                      variant="outline"
                      onPress={() => {
                        setResponded(false);
                        setOpenRequestId(request.id);
                      }}
                    />
                  )
                }
              />
            );
          })
        ) : (
          <EmptyRow label="No open sponsorship requests right now." />
        )}
      </SectionCard>
    </Screen>
  );
}
