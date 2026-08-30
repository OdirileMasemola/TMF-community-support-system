import { useQuery } from "@tanstack/react-query";
import { CalendarDays, HandCoins, Megaphone, ShieldAlert, Users } from "lucide-react-native";
import {
  Badge,
  EmptyRow,
  ErrorState,
  LoadingState,
  PageHeading,
  ListRow,
  Screen,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ui";
import { formatCurrency, formatShortDate, formatStatusLabel } from "@/lib/display";
import { fetchAdminDashboardStats, fetchEvents } from "@/services/admin";
import { fetchAllDonations } from "@/services/donations";

export default function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: fetchAdminDashboardStats,
  });

  const donations = useQuery({
    queryKey: ["admin", "donations", { limit: 5 }],
    queryFn: () => fetchAllDonations(5),
  });

  const events = useQuery({
    queryKey: ["admin", "events"],
    queryFn: fetchEvents,
  });

  function refresh() {
    stats.refetch();
    donations.refetch();
    events.refetch();
  }

  if (stats.isLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  return (
    <Screen onRefresh={refresh} refreshing={stats.isFetching || donations.isFetching || events.isFetching}>
      <PageHeading
        eyebrow="Administrator"
        title="Platform overview"
        subtitle="Activity across all programmes, donations and volunteers."
      />

      {stats.isError ? <ErrorState /> : null}

      {stats.data ? (
        <StatGrid>
          <StatCard
            label="Donations received"
            value={formatCurrency(stats.data.totalDonationAmount)}
            hint={`${stats.data.donationCount} donations recorded`}
            icon={HandCoins}
            wide
          />
          <StatCard label="Total users" value={stats.data.totalUsers} hint={`${stats.data.pendingUsers} pending`} icon={Users} />
          <StatCard
            label="Active campaigns"
            value={stats.data.activeCampaigns}
            icon={Megaphone}
            tone="secondary"
          />
        </StatGrid>
      ) : null}

      {stats.data ? (
        <SectionCard title="Awaiting your attention">
          <ListRow
            label="Volunteer applications"
            icon={ShieldAlert}
            right={<Badge label={String(stats.data.pendingVolunteerApplications)} status="pending" />}
          />
          <ListRow
            label="Assistance requests"
            icon={ShieldAlert}
            right={<Badge label={String(stats.data.pendingAssistanceRequests)} status="pending" />}
          />
          <ListRow
            label="Payment proofs"
            icon={ShieldAlert}
            right={<Badge label={String(stats.data.pendingDonationProofs)} status="pending" />}
          />
          <ListRow
            label="Sponsorship requests"
            icon={ShieldAlert}
            right={<Badge label={String(stats.data.openSponsorshipRequests)} status="open" />}
            last
          />
        </SectionCard>
      ) : null}

      <SectionCard title="Recent donations">
        {donations.isLoading ? (
          <LoadingState />
        ) : donations.data?.length ? (
          donations.data.map((donation, index) => (
            <ListRow
              key={donation.id}
              icon={HandCoins}
              label={donation.donor_profiles?.profiles?.full_name ?? "Anonymous donor"}
              value={`${formatCurrency(donation.amount)} · ${donation.campaigns?.title ?? "General fund"}`}
              right={<Badge label={formatStatusLabel(donation.status)} status={donation.status} />}
              last={index === donations.data.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No donations recorded yet." />
        )}
      </SectionCard>

      <SectionCard title="Upcoming events">
        {events.isLoading ? (
          <LoadingState />
        ) : events.data?.length ? (
          events.data.slice(0, 5).map((event, index, shown) => (
            <ListRow
              key={event.id}
              icon={CalendarDays}
              label={event.title}
              value={`${formatShortDate(event.event_date)}${event.location ? ` · ${event.location}` : ""}`}
              right={<Badge label={formatStatusLabel(event.status)} status={event.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No events scheduled." />
        )}
      </SectionCard>
    </Screen>
  );
}
