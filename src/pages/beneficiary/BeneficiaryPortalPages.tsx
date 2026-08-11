import {
  CheckCircle2,
  Clock3,
  HandHeart,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Settings2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  assistanceRequests,
  beneficiaryNotifications,
  beneficiaryProfile,
  foundationAnnouncements,
  supportProgrammes,
  upcomingSchedules,
  type AssistancePriority,
  type AssistanceRequestStatus,
} from "@/data/beneficiaryDashboardData";
import { cn } from "@/lib/utils";

function AssistanceStatusBadge({ status }: { status: AssistanceRequestStatus }) {
  const tone =
    status === "Approved" || status === "Completed"
      ? "bg-primary/10 text-primary"
      : status === "Submitted" || status === "Under Review"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: AssistancePriority }) {
  const tone =
    priority === "High"
      ? "bg-destructive/10 text-destructive"
      : priority === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{priority}</span>;
}

function BeneficiaryTable({ children }: { children: ReactNode }) {
  return (
    <DashboardCard className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </DashboardCard>
  );
}

const tableHeadClass =
  "border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tableCellClass = "border-b border-border px-5 py-4 align-middle text-foreground last:border-b-0";

const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Email address", value: beneficiaryProfile.email, icon: Mail },
  { label: "Phone number", value: beneficiaryProfile.phone, icon: Phone },
  { label: "Member since", value: beneficiaryProfile.memberSince, icon: Clock3 },
  { label: "Residential area", value: beneficiaryProfile.residentialArea, icon: MapPin },
];

const faqItems = [
  {
    question: "How long does request review take?",
    answer: "Most assistance requests are reviewed within 3 to 7 working days, depending on the programme.",
  },
  {
    question: "What documents may be requested?",
    answer: "The foundation may request proof of residence, identity documents, or supporting household information.",
  },
  {
    question: "Where do I collect approved assistance?",
    answer: "Collection details appear in your upcoming schedule once a request is approved.",
  },
];

export function BeneficiaryRequestPage() {
  return (
    <AdminPageShell
      label="Assistance"
      title="Request assistance"
      description="Submit a new assistance request. This form is a visual placeholder until submissions are connected."
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>New assistance request</CardTitle>
          <CardDescription>Share the support you need and the TMF team will review your application.</CardDescription>
        </CardHeader>
        <CardContent className="form-grid">
          <Input label="Assistance type" defaultValue="Food Support" />
          <Input label="Priority" defaultValue="Medium" />
          <Input label="Preferred collection area" defaultValue={beneficiaryProfile.residentialArea} />
          <Input label="Additional notes" defaultValue="Household food support needed this month." />
          <Button type="button">
            <HandHeart className="mr-2 size-4" />
            Submit request
          </Button>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

export function BeneficiaryRequestsPage() {
  return (
    <AdminPageShell
      label="Assistance"
      title="My requests"
      description="Track every assistance request you have submitted to the foundation."
      actions={
        <Button to="/beneficiary/request">
          <HandHeart className="mr-2 size-4" />
          Request assistance
        </Button>
      }
    >
      <BeneficiaryTable>
        <thead>
          <tr>
            {["Request ID", "Assistance Type", "Date Submitted", "Status", "Priority", ""].map((label) => (
              <th key={label || "actions"} className={tableHeadClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assistanceRequests.map((request) => (
            <tr key={request.id}>
              <td className={tableCellClass}>
                <p className="font-medium">{request.requestId}</p>
              </td>
              <td className={tableCellClass}>{request.assistanceType}</td>
              <td className={tableCellClass}>{request.dateSubmitted}</td>
              <td className={tableCellClass}>
                <AssistanceStatusBadge status={request.status} />
              </td>
              <td className={tableCellClass}>
                <PriorityBadge priority={request.priority} />
              </td>
              <td className={tableCellClass}>
                <Button variant="ghost" size="sm">
                  View details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </BeneficiaryTable>
    </AdminPageShell>
  );
}

export function BeneficiaryProgrammesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProgrammes = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return supportProgrammes.filter((programme) => {
      const searchableContent = [programme.name, programme.description, programme.eligibility, programme.status]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(normalizedSearchQuery);
    });
  }, [searchQuery]);

  return (
    <AdminPageShell
      label="Assistance"
      title="Support programmes"
      description="Explore TMF support programmes and campaigns available to beneficiaries."
    >
      <div className="mb-6 flex justify-center">
        <AnimatedGlowingSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search programmes..."
        />
      </div>

      {filteredProgrammes.length > 0 ? (
        <div className="grid gap-px bg-border md:grid-cols-2">
          {filteredProgrammes.map((programme) => (
            <DashboardCard key={programme.id} className="overflow-hidden">
              <img src={programme.image} alt="" className="h-44 w-full object-cover" />
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge status={programme.status} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {programme.eligibility}
                  </span>
                </div>
                <CardTitle>{programme.name}</CardTitle>
                <CardDescription>{programme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button to="/beneficiary/request" className="w-full">
                  <HandHeart className="mr-2 size-4" />
                  Learn More
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      ) : (
        <DashboardCard>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">No programmes found</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Try a different search term to find support programmes.
            </p>
          </CardContent>
        </DashboardCard>
      )}
    </AdminPageShell>
  );
}

export function BeneficiaryHelpPage() {
  return (
    <AdminPageShell
      label="Assistance"
      title="Help & support"
      description="Contact the foundation or browse common questions about assistance requests."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Contact foundation</CardTitle>
            <CardDescription>
              Reach a TMF team member if you need help with an application or collection.
            </CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input label="Subject" defaultValue="Question about my assistance request" />
            <Input label="Message" defaultValue="I would like help understanding the next steps for my request." />
            <Button type="button">
              <MessageCircle className="mr-2 size-4" />
              Send message
            </Button>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
            <CardDescription>Quick answers for common beneficiary questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <p className="flex items-start gap-2 font-medium text-foreground">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item.question}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming collections</CardTitle>
            <CardDescription>Keep these schedule reminders handy while waiting for support.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {upcomingSchedules.map((schedule) => (
              <article key={schedule.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{schedule.programme}</p>
                  <AdminStatusBadge status={schedule.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{schedule.location}</p>
                <p className="mt-2 text-sm text-foreground">
                  {schedule.collectionDate} · {schedule.time}
                </p>
              </article>
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function BeneficiaryNotificationsPage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with request progress, collections, and foundation announcements."
      actions={<Button variant="outline">Mark all read</Button>}
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Request updates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {beneficiaryNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <li key={notification.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-medium text-foreground", notification.unread && "text-primary")}>
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                    {notification.unread && <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" />}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Foundation announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {foundationAnnouncements.map((announcement) => (
              <article key={announcement.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{announcement.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {announcement.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{announcement.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{announcement.date}</p>
              </article>
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function BeneficiaryProfilePage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Beneficiary profile"
      description="Your current beneficiary details and contact information."
      actions={
        <Button variant="outline">
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
        <DashboardCard>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              {beneficiaryProfile.initials}
            </span>
            <p className="mt-4 text-lg font-semibold text-foreground">{beneficiaryProfile.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{beneficiaryProfile.residentialArea}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Approved beneficiary
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              {beneficiaryProfile.totalRequests} assistance requests submitted
            </p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {profileDetails.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </p>
                <p className="mt-2 font-medium text-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function BeneficiarySettingsPage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Settings"
      description="Manage your account preferences. Changes are visual placeholders until account settings are connected."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input label="Email address" defaultValue={beneficiaryProfile.email} />
            <Input label="Phone number" defaultValue={beneficiaryProfile.phone} />
            <Input label="Residential area" defaultValue={beneficiaryProfile.residentialArea} />
            <Button type="button">Save changes</Button>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose the updates you would like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Request status updates", "Collection reminders", "Foundation announcements"].map((label) => (
              <label key={label} className="flex items-center justify-between gap-4 text-sm font-medium text-foreground">
                <span>{label}</span>
                <input type="checkbox" defaultChecked className="size-4 accent-primary" />
              </label>
            ))}
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Use the theme selector in the header to switch between light and dark themes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Settings2 className="size-5 text-primary" />
              Your selected theme is applied across the beneficiary portal.
            </div>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Password and account security options will be available when account management is connected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline">
              <LockKeyhole className="mr-2 size-4" />
              Manage account security
            </Button>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}
