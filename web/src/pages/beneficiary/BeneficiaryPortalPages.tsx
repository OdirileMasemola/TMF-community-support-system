import {
  Bell,
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
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { ProfilePictureEditor } from "@/components/shared/ProfilePictureEditor";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useNotifications } from "@/hooks/useNotifications";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import {
  campaignStatusLabel,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  formatStatusLabel,
  notificationIsUnread,
  requestStatusLabel,
} from "@/lib/display";
import { cn } from "@/lib/utils";
import {
  createAssistanceRequest,
  createSupportingDocument,
  fetchBeneficiaryRequests,
  fetchCollectionSchedulesForRequests,
} from "@/services/assistance";
import { fetchCampaigns } from "@/services/campaigns";
import {
  updateBeneficiaryProfile,
  updateProfile,
  type BeneficiaryProfile,
} from "@/services/profiles";
import { uploadUserFile } from "@/services/storage";

function AssistanceStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved" || status === "Completed"
      ? "bg-primary/10 text-primary"
      : status === "Submitted" || status === "Under Review"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const label = formatStatusLabel(priority);
  const tone =
    label === "High"
      ? "bg-destructive/10 text-destructive"
      : label === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{label}</span>;
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
  const queryClient = useQueryClient();
  const { profile, roleProfile, roleProfileId, session, isLoading } = useRoleProfile();
  const beneficiaryRole = roleProfile as BeneficiaryProfile | null;

  const [requestType, setRequestType] = useState("Food Support");
  const [priority, setPriority] = useState("medium");
  const [collectionArea, setCollectionArea] = useState("");
  const [description, setDescription] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    setCollectionArea(beneficiaryRole?.residential_address ?? "");
  }, [beneficiaryRole?.residential_address]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Beneficiary profile not found.");
      if (!description.trim()) throw new Error("Please describe the assistance you need.");

      const request = await createAssistanceRequest({
        beneficiary_id: roleProfileId,
        request_type: requestType.trim(),
        description: description.trim(),
        priority: priority.trim() || "medium",
        preferred_collection_area: collectionArea.trim() || null,
      });

      if (documentFile) {
        const userId = session?.user.id ?? profile?.id;
        if (!userId) throw new Error("You must be signed in to upload documents.");
        const uploaded = await uploadUserFile({
          bucket: "supporting-documents",
          userId,
          file: documentFile,
          folder: request.id,
        });
        await createSupportingDocument({
          request_id: request.id,
          document_name: uploaded.fileName,
          document_type: documentFile.type || null,
          file_path: uploaded.path,
        });
      }

      return request;
    },
    onSuccess: async () => {
      toast.success("Assistance request submitted");
      setDescription("");
      setDocumentFile(null);
      await queryClient.invalidateQueries({ queryKey: ["beneficiary-requests", roleProfileId] });
    },
    onError: () => {
      toast.error(toUserMessage("Could not submit request"));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitMutation.mutate();
  }

  return (
    <AdminPageShell
      label="Assistance"
      title="Request assistance"
      description="Submit a new assistance request for review by the Themba Molefe Foundation team."
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>New assistance request</CardTitle>
          <CardDescription>Share the support you need and the TMF team will review your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataState isLoading={isLoading} isEmpty={!roleProfileId} emptyMessage="Beneficiary profile not found.">
            <form className="form-grid" onSubmit={handleSubmit}>
              <Input
                label="Assistance type"
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                required
              />
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Priority
                <select
                  className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <Input
                label="Preferred collection area"
                value={collectionArea}
                onChange={(event) => setCollectionArea(event.target.value)}
              />
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Additional notes
                <textarea
                  className="min-h-28 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Supporting document (optional)
                <input
                  type="file"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <Button type="submit" disabled={submitMutation.isPending}>
                <HandHeart className="mr-2 size-4" />
                Submit request
              </Button>
            </form>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

export function BeneficiaryRequestsPage() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const requestsQuery = useQuery({
    queryKey: ["beneficiary-requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });
  const requests = requestsQuery.data ?? [];

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
      <DataState
        isLoading={profileLoading || requestsQuery.isLoading}
        isError={requestsQuery.isError}
        isEmpty={requests.length === 0}
        emptyMessage="You have not submitted any assistance requests yet."
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
            {requests.map((request) => (
              <tr key={request.id}>
                <td className={tableCellClass}>
                  <p className="font-medium">REQ-{request.id.slice(0, 8).toUpperCase()}</p>
                </td>
                <td className={tableCellClass}>{request.request_type}</td>
                <td className={tableCellClass}>{formatShortDate(request.request_date)}</td>
                <td className={tableCellClass}>
                  <AssistanceStatusBadge status={requestStatusLabel(request.status)} />
                </td>
                <td className={tableCellClass}>
                  <PriorityBadge priority={request.priority ?? "medium"} />
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
      </DataState>
    </AdminPageShell>
  );
}

export function BeneficiaryProgrammesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public-active"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const filteredProgrammes = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return (campaignsQuery.data ?? []).filter((programme) => {
      const searchableContent = [programme.title, programme.description, programme.category, programme.location, programme.status]
        .join(" ")
        .toLowerCase();
      return searchableContent.includes(normalizedSearchQuery);
    });
  }, [campaignsQuery.data, searchQuery]);

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

      <DataState
        isLoading={campaignsQuery.isLoading}
        isError={campaignsQuery.isError}
        isEmpty={filteredProgrammes.length === 0}
        emptyMessage={
          searchQuery.trim()
            ? "Try a different search term to find support programmes."
            : "No active programmes are available right now."
        }
      >
        <div className="grid gap-px bg-border md:grid-cols-2">
          {filteredProgrammes.map((programme) => (
            <DashboardCard key={programme.id} className="overflow-hidden">
              <img src={programme.image_url || foodSupportImage} alt="" className="h-44 w-full object-cover" />
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge status={campaignStatusLabel(programme.status)} />
                  {programme.category ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {programme.category}
                    </span>
                  ) : null}
                </div>
                <CardTitle>{programme.title}</CardTitle>
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
      </DataState>
    </AdminPageShell>
  );
}

export function BeneficiaryHelpPage() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const requestsQuery = useQuery({
    queryKey: ["beneficiary-requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });
  const requestIds = (requestsQuery.data ?? []).map((item) => item.id);
  const schedulesQuery = useQuery({
    queryKey: ["beneficiary-schedules", roleProfileId, requestIds.join(",")],
    enabled: Boolean(roleProfileId) && requestIds.length > 0,
    queryFn: () => fetchCollectionSchedulesForRequests(requestIds),
  });
  const schedules = schedulesQuery.data ?? [];

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
            <Button
              type="button"
              onClick={() =>
                toast.message("Message saved locally", {
                  description: "Foundation contact messaging will be connected in a later update.",
                })
              }
            >
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
          <CardContent>
            <DataState
              isLoading={profileLoading || requestsQuery.isLoading || schedulesQuery.isLoading}
              isError={requestsQuery.isError || schedulesQuery.isError}
              isEmpty={schedules.length === 0}
              emptyMessage="No collection schedules linked to your requests yet."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {schedules.map((schedule) => (
                  <article key={schedule.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-foreground">{schedule.programme_name ?? "Assistance collection"}</p>
                      <AdminStatusBadge status={formatStatusLabel(schedule.status)} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{schedule.location}</p>
                    <p className="mt-2 text-sm text-foreground">
                      {formatShortDate(schedule.collection_date)} · {schedule.collection_time ?? "—"}
                    </p>
                  </article>
                ))}
              </div>
            </DataState>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function BeneficiaryNotificationsPage() {
  const { notifications, isLoading, isError, markAllRead, markRead } = useNotifications();

  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with request progress, collections, and foundation announcements."
      actions={
        <Button
          type="button"
          variant="outline"
          disabled={markAllRead.isPending || notifications.every((item) => !notificationIsUnread(item.status))}
          onClick={() =>
            markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("All notifications marked as read"),
              onError: () => toast.error(toUserMessage("Could not update notifications.")),
            })
          }
        >
          Mark all read
        </Button>
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Request updates</CardTitle>
          </CardHeader>
          <CardContent>
            <DataState
              isLoading={isLoading}
              isError={isError}
              isEmpty={notifications.length === 0}
              emptyMessage="No notifications yet."
            >
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const unread = notificationIsUnread(notification.status);
                  return (
                    <li
                      key={notification.id}
                      className="flex cursor-pointer items-start gap-4 py-5 first:pt-0 last:pb-0"
                      onClick={() => {
                        if (unread) markRead.mutate(notification.id);
                      }}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                        <Bell className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-medium text-foreground", unread && "text-primary")}>
                          {notification.title ?? "Notification"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatRelativeTime(notification.notification_date)}
                        </p>
                      </div>
                      {unread && <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" />}
                    </li>
                  );
                })}
              </ul>
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Foundation announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState isEmpty emptyMessage="No foundation announcements yet.">
              {null}
            </DataState>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function BeneficiaryProfilePage() {
  const { profile, roleProfile, roleProfileId, isLoading } = useRoleProfile();
  const beneficiaryRole = roleProfile as BeneficiaryProfile | null;
  const requestsQuery = useQuery({
    queryKey: ["beneficiary-requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });
  const totalRequests = (requestsQuery.data ?? []).length;
  const name = profile?.full_name ?? "Beneficiary";

  const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Email address", value: profile?.email ?? "—", icon: Mail },
    { label: "Phone number", value: profile?.phone_number ?? "—", icon: Phone },
    { label: "Member since", value: formatMonthYear(beneficiaryRole?.created_at), icon: Clock3 },
    { label: "Residential area", value: beneficiaryRole?.residential_address ?? "—", icon: MapPin },
  ];

  return (
    <AdminPageShell
      label="Your account"
      title="Beneficiary profile"
      description="Your current beneficiary details and contact information."
      actions={
        <Button to="/beneficiary/settings" variant="outline">
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <DataState isLoading={isLoading} isEmpty={!profile} emptyMessage="Profile not found.">
        <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
          <DashboardCard>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ProfilePictureEditor />
              <p className="mt-4 text-lg font-semibold text-foreground">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{beneficiaryRole?.residential_address ?? "—"}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" />
                {beneficiaryRole?.eligibility_status
                  ? formatStatusLabel(beneficiaryRole.eligibility_status)
                  : "Approved"}{" "}
                beneficiary
              </span>
              <p className="mt-3 text-sm text-muted-foreground">{totalRequests} assistance requests submitted</p>
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
      </DataState>
    </AdminPageShell>
  );
}

export function BeneficiarySettingsPage() {
  const queryClient = useQueryClient();
  const { profile, roleProfile, roleProfileId, session, isLoading, refetch } = useRoleProfile();
  const beneficiaryRole = roleProfile as BeneficiaryProfile | null;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [assistanceType, setAssistanceType] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone_number ?? "");
    setResidentialAddress(beneficiaryRole?.residential_address ?? "");
    setAssistanceType(beneficiaryRole?.assistance_type ?? "");
  }, [profile, beneficiaryRole]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id ?? profile?.id;
      if (!userId || !roleProfileId) throw new Error("Beneficiary profile not found.");
      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
      });
      await updateBeneficiaryProfile(roleProfileId, {
        residential_address: residentialAddress.trim() || null,
        assistance_type: assistanceType.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Settings saved");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["role-profile"] });
    },
    onError: () => {
      toast.error(toUserMessage("Could not save settings"));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return (
    <AdminPageShell
      label="Your account"
      title="Settings"
      description="Manage your account preferences and beneficiary profile details."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState isLoading={isLoading} isEmpty={!profile} emptyMessage="Profile not found.">
              <form className="form-grid" onSubmit={handleSubmit}>
                <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                <Input label="Email address" value={profile?.email ?? ""} readOnly />
                <Input label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
                <Input
                  label="Residential area"
                  value={residentialAddress}
                  onChange={(event) => setResidentialAddress(event.target.value)}
                />
                <Input
                  label="Assistance type"
                  value={assistanceType}
                  onChange={(event) => setAssistanceType(event.target.value)}
                  placeholder="e.g. Food Support"
                />
                <Button type="submit" disabled={saveMutation.isPending}>
                  Save changes
                </Button>
              </form>
            </DataState>
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
