import {
  Bell,
  CheckCircle2,
  Download,
  Eye,
  FileUp,
  HeartHandshake,
  LockKeyhole,
  Mail,
  Phone,
  Receipt,
  Settings2,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import campaignFallbackImage from "@/assets/images/campaigns/Food Support Drive.webp";
import { bankingDetails } from "@/data/donationData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toUserMessage } from "@/lib/errors";
import { useNotifications } from "@/hooks/useNotifications";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import {
  campaignProgress,
  formatCurrency,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  getInitials,
  notificationIsUnread,
  paymentStatusLabel,
  verificationStatusLabel,
} from "@/lib/display";
import { getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { fetchCampaigns } from "@/services/campaigns";
import {
  createDonation,
  createDonationProof,
  fetchDonorDonations,
  fetchDonorProofs,
} from "@/services/donations";
import { fetchDonorProfile, updateProfile, type DonorProfile } from "@/services/profiles";
import { getSignedFileUrl, uploadUserFile } from "@/services/storage";

function asDonorProfile(value: unknown): DonorProfile | null {
  if (!value || typeof value !== "object") return null;
  if (!("donation_preference" in value) || !("member_since" in value)) return null;
  return value as DonorProfile;
}

function paymentBadgeStatus(status: string): string {
  if (status === "successful") return "Verified";
  if (status === "pending") return "Pending";
  if (status === "failed" || status === "cancelled") return "Rejected";
  return paymentStatusLabel(status);
}

function verificationBadgeStatus(status: string): string {
  if (status === "approved") return "Verified";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return verificationStatusLabel(status);
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Verified"
      ? "bg-primary/10 text-primary"
      : status === "Pending"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

function DonorTable({ children }: { children: ReactNode }) {
  return (
    <DashboardCard className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </DashboardCard>
  );
}

const tableHeadClass = "border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tableCellClass = "border-b border-border px-5 py-4 align-middle text-foreground last:border-b-0";

function parseAmountInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function DonorDonatePage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const supabaseReady = isSupabaseConfigured();
  const userId = session?.user.id;

  const [donationType, setDonationType] = useState<"campaign" | "general">("campaign");
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createdDonationId, setCreatedDonationId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public"],
    enabled: supabaseReady,
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const campaigns = campaignsQuery.data ?? [];

  useEffect(() => {
    if (!campaignId && campaigns[0]?.id) {
      setCampaignId(campaigns[0].id);
    }
  }, [campaignId, campaigns]);

  const createDonationMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Donor profile was not found.");
      const parsedAmount = parseAmountInput(amount);
      if (!parsedAmount) throw new Error("Enter a valid donation amount.");
      if (!reference.trim()) throw new Error("Enter a payment reference.");
      if (!paymentDate) throw new Error("Select a payment date.");
      if (donationType === "campaign" && !campaignId) throw new Error("Select a campaign.");

      return createDonation({
        donor_id: roleProfileId,
        campaign_id: donationType === "campaign" ? campaignId : null,
        amount: parsedAmount,
        donation_date: paymentDate,
        payment_method: "EFT",
        status: "pending",
        donation_kind: "money",
        payment_reference: reference.trim(),
      });
    },
    onSuccess: async (donation) => {
      setCreatedDonationId(donation.id);
      await queryClient.invalidateQueries({ queryKey: ["donor-donations"] });
      toast.success("Donation recorded. You can upload proof of payment next.");
    },
    onError: () => {
      toast.error(toUserMessage("Could not create donation."));
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be signed in.");
      if (!createdDonationId) throw new Error("Create a donation before uploading proof.");
      if (!proofFile) throw new Error("Choose a proof of payment file.");

      const uploaded = await uploadUserFile({
        bucket: "donation-proofs",
        userId,
        file: proofFile,
      });

      return createDonationProof({
        donation_id: createdDonationId,
        file_path: uploaded.path,
        file_name: uploaded.fileName,
        payment_reference: reference.trim() || null,
        payment_date: paymentDate || null,
        verification_status: "pending",
      });
    },
    onSuccess: async () => {
      setProofFile(null);
      await queryClient.invalidateQueries({ queryKey: ["donor-proofs"] });
      toast.success("Proof of payment submitted for review.");
    },
    onError: () => {
      toast.error(toUserMessage("Could not upload proof."));
    },
  });

  const displayReference = reference.trim() || "Your payment reference";

  return (
    <AdminPageShell
      label="Your support"
      title="Make a donation"
      description="Use the TMF EFT details below, then submit your proof of payment for verification."
    >
      <div className="grid gap-px bg-border xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Donation details</CardTitle>
            <CardDescription>Tell us how you would like your contribution to be allocated.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              isLoading={roleLoading || campaignsQuery.isLoading}
              isError={campaignsQuery.isError}
              errorMessage="Could not load campaigns for donations."
              loadingMessage="Loading donation form..."
            >
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  createDonationMutation.mutate();
                }}
              >
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Donation type
                  <select
                    className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                    value={donationType}
                    onChange={(event) => setDonationType(event.target.value as "campaign" | "general")}
                  >
                    <option value="campaign">Campaign donation</option>
                    <option value="general">General donation</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Campaign
                  <select
                    className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                    value={campaignId}
                    onChange={(event) => setCampaignId(event.target.value)}
                    disabled={donationType === "general" || campaigns.length === 0}
                  >
                    {campaigns.length === 0 ? <option value="">No active campaigns</option> : null}
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Input label="Amount" placeholder="R 0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
                <Input
                  label="Payment reference"
                  placeholder="e.g. TMF-ODIRILE-01"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
                <Input
                  label="Payment date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={createDonationMutation.isPending || !roleProfileId}>
                    {createDonationMutation.isPending ? "Saving..." : "Record donation"}
                  </Button>
                </div>
              </form>

              {createdDonationId ? (
                <div className="mt-6 space-y-4 border-t border-border pt-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">Optional: upload proof of payment</p>
                    <p className="mt-1 text-xs text-muted-foreground">Attach your EFT receipt so the TMF team can verify this donation.</p>
                  </div>
                  <Input
                    label="Proof file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadProofMutation.isPending || !proofFile}
                    onClick={() => uploadProofMutation.mutate()}
                  >
                    <FileUp className="mr-2 size-4" />
                    {uploadProofMutation.isPending ? "Uploading..." : "Submit proof of payment"}
                  </Button>
                </div>
              ) : null}
            </DataState>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>TMF banking details</CardTitle>
            <CardDescription>Please use your payment reference when making an EFT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              ["Bank", bankingDetails.bankName],
              ["Account holder", bankingDetails.accountHolder],
              ["Account number", bankingDetails.accountNumber],
              ["Account type", bankingDetails.accountType],
              ["Branch code", bankingDetails.branchCode],
              ["Reference", displayReference],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-border pb-3 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function DonorCampaignsPage() {
  const supabaseReady = isSupabaseConfigured();

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public"],
    enabled: supabaseReady,
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const campaigns = campaignsQuery.data ?? [];

  return (
    <AdminPageShell label="Your support" title="Browse campaigns" description="Explore current foundation campaigns and choose a cause to support.">
      <DataState
        isLoading={campaignsQuery.isLoading}
        isError={campaignsQuery.isError}
        isEmpty={!campaignsQuery.isLoading && campaigns.length === 0}
        emptyMessage="No public campaigns are available right now."
        errorMessage="Could not load campaigns."
        loadingMessage="Loading campaigns..."
      >
        <div className="grid gap-px bg-border md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progress = campaignProgress(campaign.amount_raised, campaign.funding_goal);
            return (
              <DashboardCard key={campaign.id} className="overflow-hidden">
                <img src={campaign.image_url || campaignFallbackImage} alt="" className="h-44 w-full object-cover" />
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{campaign.category ?? "Campaign"}</p>
                  <CardTitle>{campaign.title}</CardTitle>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(campaign.amount_raised)} raised</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <Button to="/donor/dashboard/donate" className="mt-5 w-full">
                    Support campaign
                  </Button>
                </CardContent>
              </DashboardCard>
            );
          })}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function DonorDonationsPage() {
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const enabled = Boolean(isSupabaseConfigured() && roleProfileId);

  const donationsQuery = useQuery({
    queryKey: ["donor-donations", roleProfileId],
    enabled,
    queryFn: () => fetchDonorDonations(roleProfileId!),
  });

  const donations = donationsQuery.data ?? [];

  return (
    <AdminPageShell
      label="Your support"
      title="Donation history"
      description="Review all of your submitted donations and their verification status."
      actions={<Button to="/donor/dashboard/donate">Make a donation</Button>}
    >
      <DataState
        isLoading={roleLoading || (enabled && donationsQuery.isLoading)}
        isError={donationsQuery.isError}
        isEmpty={!donationsQuery.isLoading && donations.length === 0}
        emptyMessage="You have not submitted any donations yet."
        errorMessage="Could not load your donation history."
        loadingMessage="Loading donations..."
      >
        <DonorTable>
          <thead>
            <tr>
              {["Donation", "Amount", "Reference", "Date", "Status", ""].map((label) => (
                <th key={label || "actions"} className={tableHeadClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td className={tableCellClass}>
                  <p className="font-medium">{donation.campaign_id ? "Campaign Donation" : "General Donation"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{donation.campaigns?.title ?? "Themba Molefe Foundation"}</p>
                </td>
                <td className={tableCellClass}>{formatCurrency(donation.amount)}</td>
                <td className={tableCellClass}>{donation.payment_reference ?? donation.receipt_number ?? "—"}</td>
                <td className={tableCellClass}>{formatShortDate(donation.donation_date)}</td>
                <td className={tableCellClass}>
                  <StatusBadge status={paymentBadgeStatus(donation.status)} />
                </td>
                <td className={tableCellClass}>
                  <Button to="/donor/dashboard/proof-of-payment" variant="ghost" size="sm">
                    View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DonorTable>
      </DataState>
    </AdminPageShell>
  );
}

export function DonorProofOfPaymentPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const userId = session?.user.id;
  const enabled = Boolean(isSupabaseConfigured() && roleProfileId);

  const [showUpload, setShowUpload] = useState(false);
  const [donationId, setDonationId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const donationsQuery = useQuery({
    queryKey: ["donor-donations", roleProfileId],
    enabled,
    queryFn: () => fetchDonorDonations(roleProfileId!),
  });

  const proofsQuery = useQuery({
    queryKey: ["donor-proofs", roleProfileId],
    enabled,
    queryFn: () => fetchDonorProofs(roleProfileId!),
  });

  const donations = donationsQuery.data ?? [];
  const proofs = proofsQuery.data ?? [];

  useEffect(() => {
    if (!donationId && donations[0]?.id) {
      setDonationId(donations[0].id);
    }
  }, [donationId, donations]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be signed in.");
      if (!donationId) throw new Error("Select a donation.");
      if (!proofFile) throw new Error("Choose a proof of payment file.");

      const uploaded = await uploadUserFile({
        bucket: "donation-proofs",
        userId,
        file: proofFile,
      });

      return createDonationProof({
        donation_id: donationId,
        file_path: uploaded.path,
        file_name: uploaded.fileName,
        payment_reference: paymentReference.trim() || null,
        payment_date: paymentDate || null,
        verification_status: "pending",
      });
    },
    onSuccess: async () => {
      setProofFile(null);
      setShowUpload(false);
      await queryClient.invalidateQueries({ queryKey: ["donor-proofs"] });
      toast.success("Proof of payment submitted.");
    },
    onError: () => {
      toast.error(toUserMessage("Could not upload proof."));
    },
  });

  async function openProof(filePath: string) {
    try {
      const url = await getSignedFileUrl("donation-proofs", filePath);
      if (!url) throw new Error("Could not open proof file.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(toUserMessage("Could not open proof file."));
    }
  }

  return (
    <AdminPageShell
      label="Your support"
      title="Proof of payment"
      description="Manage your submitted payment proofs and see verification feedback."
      actions={
        <Button type="button" onClick={() => setShowUpload((current) => !current)}>
          <FileUp className="mr-2 size-4" />
          {showUpload ? "Hide upload form" : "Submit new proof"}
        </Button>
      }
    >
      {showUpload ? (
        <DashboardCard className="mb-6">
          <CardHeader>
            <CardTitle>Submit proof of payment</CardTitle>
            <CardDescription>Upload a receipt for one of your recorded donations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Donation
              <select
                className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                value={donationId}
                onChange={(event) => setDonationId(event.target.value)}
              >
                {donations.length === 0 ? <option value="">No donations available</option> : null}
                {donations.map((donation) => (
                  <option key={donation.id} value={donation.id}>
                    {donation.campaigns?.title ?? "General donation"} · {formatCurrency(donation.amount)} ·{" "}
                    {donation.payment_reference ?? formatShortDate(donation.donation_date)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Payment reference"
              placeholder="Optional reference"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
            />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            <Input
              label="Proof file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
            />
            <div className="sm:col-span-2">
              <Button type="button" disabled={uploadMutation.isPending || !donationId || !proofFile} onClick={() => uploadMutation.mutate()}>
                {uploadMutation.isPending ? "Uploading..." : "Upload proof"}
              </Button>
            </div>
          </CardContent>
        </DashboardCard>
      ) : null}

      <DataState
        isLoading={roleLoading || (enabled && (proofsQuery.isLoading || donationsQuery.isLoading))}
        isError={proofsQuery.isError || donationsQuery.isError}
        isEmpty={!proofsQuery.isLoading && proofs.length === 0}
        emptyMessage="No proofs submitted yet."
        errorMessage="Could not load proof of payment records."
        loadingMessage="Loading proofs..."
      >
        <DonorTable>
          <thead>
            <tr>
              {["File", "Amount", "Reference", "Submitted", "Status", "Admin comments", ""].map((label) => (
                <th key={label || "actions"} className={tableHeadClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proofs.map((proof) => (
              <tr key={proof.id}>
                <td className={tableCellClass}>
                  <span className="flex items-center gap-2 font-medium">
                    <Receipt className="size-4 text-primary" />
                    {proof.file_name ?? "Proof file"}
                  </span>
                </td>
                <td className={tableCellClass}>{formatCurrency(proof.donations?.amount)}</td>
                <td className={tableCellClass}>{proof.payment_reference ?? proof.donations?.payment_reference ?? "—"}</td>
                <td className={tableCellClass}>{formatShortDate(proof.uploaded_at)}</td>
                <td className={tableCellClass}>
                  <StatusBadge status={verificationBadgeStatus(proof.verification_status)} />
                </td>
                <td className={tableCellClass}>
                  <span className="max-w-52 text-muted-foreground">{proof.admin_comment ?? "—"}</span>
                </td>
                <td className={tableCellClass}>
                  <div className="flex">
                    <Button variant="ghost" size="icon" aria-label="View proof" type="button" onClick={() => openProof(proof.file_path)}>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Download proof" type="button" onClick={() => openProof(proof.file_path)}>
                      <Download className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DonorTable>
      </DataState>
    </AdminPageShell>
  );
}

export function DonorNotificationsPage() {
  const { notifications, isLoading, isError, markRead, markAllRead } = useNotifications();

  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with your donations, proof submissions, and foundation campaigns."
      actions={
        <Button
          variant="outline"
          type="button"
          disabled={markAllRead.isPending || notifications.every((item) => !notificationIsUnread(item.status))}
          onClick={() => {
            markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("All notifications marked as read."),
              onError: () => toast.error(toUserMessage("Could not update notifications.")),
            });
          }}
        >
          Mark all read
        </Button>
      }
    >
      <DashboardCard>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && notifications.length === 0}
            emptyMessage="You have no notifications yet."
            errorMessage="Could not load notifications."
            loadingMessage="Loading notifications..."
          >
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const unread = notificationIsUnread(notification.status);
                return (
                  <li
                    key={notification.id}
                    className="flex cursor-pointer items-start gap-4 py-5 first:pt-0 last:pb-0"
                    onClick={() => {
                      if (!unread || markRead.isPending) return;
                      markRead.mutate(notification.id, {
                        onError: () => toast.error(toUserMessage("Could not mark as read.")),
                      });
                    }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Bell className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium text-foreground", unread && "text-primary")}>{notification.title ?? "Notification"}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {notification.notification_type ?? "Update"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(notification.notification_date)}</p>
                    </div>
                    {unread ? <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" /> : null}
                  </li>
                );
              })}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

export function DonorProfilePage() {
  const queryClient = useQueryClient();
  const { profile, session } = useAuth();
  const { roleProfile, roleProfileId, isLoading: roleLoading, refetch } = useRoleProfile();
  const userId = session?.user.id;
  const supabaseReady = isSupabaseConfigured();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [donationPreference, setDonationPreference] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone_number ?? "");
  }, [profile?.full_name, profile?.phone_number]);

  const donorProfileQuery = useQuery({
    queryKey: ["donor-profile", userId],
    enabled: Boolean(supabaseReady && userId),
    queryFn: () => fetchDonorProfile(userId!),
  });

  const donorProfile = donorProfileQuery.data ?? asDonorProfile(roleProfile);

  useEffect(() => {
    setDonationPreference(donorProfile?.donation_preference ?? "");
  }, [donorProfile?.donation_preference]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !roleProfileId) throw new Error("Donor profile was not found.");
      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
      });

      const client = getSupabaseClientOrNull();
      if (!client) throw new Error("Supabase is not configured.");

      const { error } = await client
        .from("donor_profiles")
        .update({ donation_preference: donationPreference.trim() || null })
        .eq("id", roleProfileId);

      if (error) throw error;
    },
    onSuccess: async () => {
      setEditing(false);
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["donor-profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["role-profile"] }),
      ]);
      toast.success("Profile updated.");
    },
    onError: () => {
      toast.error(toUserMessage("Could not update profile."));
    },
  });

  const displayName = profile?.full_name?.trim() || "Donor";
  const initials = getInitials(displayName);
  const memberSince = formatMonthYear(donorProfile?.member_since ?? donorProfile?.created_at);
  const preference = donorProfile?.donation_preference?.trim() || "Not set";

  const profileDetails: { label: string; value: string; icon: LucideIcon }[] = useMemo(
    () => [
      { label: "Email address", value: profile?.email ?? "—", icon: Mail },
      { label: "Phone number", value: profile?.phone_number?.trim() || "—", icon: Phone },
      { label: "Member since", value: memberSince, icon: HeartHandshake },
      { label: "Preferred donation type", value: preference, icon: Receipt },
    ],
    [memberSince, preference, profile?.email, profile?.phone_number],
  );

  return (
    <AdminPageShell
      label="Your account"
      title="Donor profile"
      description="Your current donor details and contribution preferences."
      actions={
        <Button variant="outline" type="button" onClick={() => setEditing((current) => !current)}>
          <UserRound className="mr-2 size-4" />
          {editing ? "Cancel" : "Edit profile"}
        </Button>
      }
    >
      <DataState
        isLoading={roleLoading || donorProfileQuery.isLoading}
        isError={donorProfileQuery.isError}
        errorMessage="Could not load your donor profile."
        loadingMessage="Loading profile..."
      >
        <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
          <DashboardCard>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">{initials}</span>
              <p className="mt-4 text-lg font-semibold text-foreground">{displayName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{roleProfileId ? `DON-${roleProfileId.slice(0, 8).toUpperCase()}` : "Donor"}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" />
                Active donor
              </span>
            </CardContent>
          </DashboardCard>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveMutation.mutate();
                  }}
                >
                  <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  <Input label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  <Input label="Email address" value={profile?.email ?? ""} disabled />
                  <Input
                    label="Preferred donation type"
                    value={donationPreference}
                    onChange={(event) => setDonationPreference(event.target.value)}
                    placeholder="e.g. Campaign support"
                  />
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? "Saving..." : "Save profile"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {profileDetails.map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Icon className="size-3.5 text-primary" />
                        {label}
                      </p>
                      <p className="mt-2 font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </DashboardCard>
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function DonorSettingsPage() {
  const queryClient = useQueryClient();
  const { profile, session } = useAuth();
  const { roleProfileId, roleProfile, refetch } = useRoleProfile();
  const userId = session?.user.id;
  const supabaseReady = isSupabaseConfigured();

  const [email] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [donationPreference, setDonationPreference] = useState("");

  const donorProfileQuery = useQuery({
    queryKey: ["donor-profile", userId],
    enabled: Boolean(supabaseReady && userId),
    queryFn: () => fetchDonorProfile(userId!),
  });

  const donorProfile = donorProfileQuery.data ?? asDonorProfile(roleProfile);

  useEffect(() => {
    setPhone(profile?.phone_number ?? "");
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name, profile?.phone_number]);

  useEffect(() => {
    setDonationPreference(donorProfile?.donation_preference ?? "");
  }, [donorProfile?.donation_preference]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !roleProfileId) throw new Error("Donor profile was not found.");
      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
      });

      const client = getSupabaseClientOrNull();
      if (!client) throw new Error("Supabase is not configured.");

      const { error } = await client
        .from("donor_profiles")
        .update({ donation_preference: donationPreference.trim() || null })
        .eq("id", roleProfileId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["donor-profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["role-profile"] }),
      ]);
      toast.success("Account settings saved.");
    },
    onError: () => {
      toast.error(toUserMessage("Could not save settings."));
    },
  });

  return (
    <AdminPageShell label="Your account" title="Settings" description="Manage your account preferences and contact details.">
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <form
              className="contents"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate();
              }}
            >
              <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <Input label="Email address" value={email || profile?.email || ""} disabled />
              <Input label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Input
                label="Preferred donation type"
                value={donationPreference}
                onChange={(event) => setDonationPreference(event.target.value)}
                placeholder="e.g. Campaign support"
              />
              <Button type="submit" disabled={saveMutation.isPending || !roleProfileId}>
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose the updates you would like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Donation verification updates", "Campaign updates", "Foundation announcements"].map((label) => (
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
              Your selected theme is applied across the donor portal.
            </div>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Password and account security options will be available when account management is connected.</CardDescription>
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
