import {
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
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  donationHistory,
  donorNotifications,
  donorProfile,
  proofHistory,
  recommendedCampaigns,
  type DonationStatus,
} from "@/data/donorDashboardData";
import { bankingDetails } from "@/data/donationData";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: DonationStatus }) {
  const tone = status === "Verified"
    ? "bg-primary/10 text-primary"
    : status === "Pending"
      ? "bg-secondary text-secondary-foreground"
      : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

function DonorTable({ children }: { children: ReactNode }) {
  return <DashboardCard className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left text-sm">
      {children}
    </table>
  </DashboardCard>;
}

const tableHeadClass = "border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tableCellClass = "border-b border-border px-5 py-4 align-middle text-foreground last:border-b-0";

const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Email address", value: donorProfile.email, icon: Mail },
  { label: "Phone number", value: donorProfile.phone, icon: Phone },
  { label: "Member since", value: donorProfile.memberSince, icon: HeartHandshake },
  { label: "Preferred donation type", value: donorProfile.preferredDonationType, icon: Receipt },
];

export function DonorDonatePage() {
  return (
    <AdminPageShell
      label="Your support"
      title="Make a donation"
      description="Use the TMF EFT details below, then submit your proof of payment for verification."
    >
      <div className="grid gap-px bg-border xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardCard>
          <CardHeader><CardTitle>Donation details</CardTitle><CardDescription>Tell us how you would like your contribution to be allocated.</CardDescription></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">Donation type<select className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"><option>Campaign donation</option><option>General donation</option></select></label>
              <label className="grid gap-2 text-sm font-medium text-foreground">Campaign<select className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground">{recommendedCampaigns.map((campaign) => <option key={campaign.id}>{campaign.title}</option>)}</select></label>
              <Input label="Amount" placeholder="R 0.00" />
              <Input label="Payment reference" placeholder="e.g. TMF-ODIRILE-01" />
              <Input label="Payment date" type="date" />
              <div className="flex items-end"><Button to="/donor/dashboard/proof-of-payment" className="w-full">Continue to proof of payment</Button></div>
            </form>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader><CardTitle>TMF banking details</CardTitle><CardDescription>Please use your payment reference when making an EFT.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              ["Bank", bankingDetails.bankName],
              ["Account holder", bankingDetails.accountHolder],
              ["Account number", bankingDetails.accountNumber],
              ["Account type", bankingDetails.accountType],
              ["Branch code", bankingDetails.branchCode],
              ["Reference", "TMF-ODIRILE-01"],
            ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-border pb-3 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium text-foreground">{value}</span></div>)}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function DonorCampaignsPage() {
  return <AdminPageShell label="Your support" title="Browse campaigns" description="Explore current foundation campaigns and choose a cause to support.">
    <div className="grid gap-px bg-border md:grid-cols-2">
      {recommendedCampaigns.map((campaign) => <DashboardCard key={campaign.id} className="overflow-hidden">
        <img src={campaign.image} alt="" className="h-44 w-full object-cover" />
        <CardHeader><p className="text-xs font-semibold uppercase tracking-wide text-primary">{campaign.category}</p><CardTitle>{campaign.title}</CardTitle><CardDescription>{campaign.description}</CardDescription></CardHeader>
        <CardContent><div className="flex justify-between text-xs text-muted-foreground"><span>{campaign.raised}</span><span>{campaign.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${campaign.progress}%` }} /></div><Button to="/donor/dashboard/donate" className="mt-5 w-full">Support campaign</Button></CardContent>
      </DashboardCard>)}
    </div>
  </AdminPageShell>;
}

export function DonorDonationsPage() {
  return <AdminPageShell label="Your support" title="Donation history" description="Review all of your submitted donations and their verification status." actions={<Button to="/donor/dashboard/donate">Make a donation</Button>}>
    <DonorTable><thead><tr>{["Donation", "Amount", "Reference", "Date", "Status", ""].map((label) => <th key={label} className={tableHeadClass}>{label}</th>)}</tr></thead><tbody>
      {donationHistory.map((donation) => <tr key={donation.id}><td className={tableCellClass}><p className="font-medium">{donation.type}</p><p className="mt-1 text-xs text-muted-foreground">{donation.campaign}</p></td><td className={tableCellClass}>{donation.amount}</td><td className={tableCellClass}>{donation.reference}</td><td className={tableCellClass}>{donation.date}</td><td className={tableCellClass}><StatusBadge status={donation.status} /></td><td className={tableCellClass}><Button variant="ghost" size="sm">View details</Button></td></tr>)}
    </tbody></DonorTable>
  </AdminPageShell>;
}

export function DonorProofOfPaymentPage() {
  return <AdminPageShell label="Your support" title="Proof of payment" description="Manage your submitted payment proofs and see verification feedback." actions={<Button type="button"><FileUp className="mr-2 size-4" />Submit new proof</Button>}>
    <DonorTable><thead><tr>{["File", "Amount", "Reference", "Submitted", "Status", "Admin comments", ""].map((label) => <th key={label} className={tableHeadClass}>{label}</th>)}</tr></thead><tbody>
      {proofHistory.map((proof) => <tr key={proof.id}><td className={tableCellClass}><span className="flex items-center gap-2 font-medium"><Receipt className="size-4 text-primary" />{proof.fileName}</span></td><td className={tableCellClass}>{proof.amount}</td><td className={tableCellClass}>{proof.reference}</td><td className={tableCellClass}>{proof.submittedAt}</td><td className={tableCellClass}><StatusBadge status={proof.status} /></td><td className={tableCellClass}><span className="max-w-52 text-muted-foreground">{proof.comment}</span></td><td className={tableCellClass}><div className="flex"><Button variant="ghost" size="icon" aria-label="View proof"><Eye className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Download proof"><Download className="size-4" /></Button></div></td></tr>)}
    </tbody></DonorTable>
  </AdminPageShell>;
}

export function DonorNotificationsPage() {
  return <AdminPageShell label="Your account" title="Notifications" description="Stay up to date with your donations, proof submissions, and foundation campaigns." actions={<Button variant="outline">Mark all read</Button>}>
    <DashboardCard><CardContent><ul className="divide-y divide-border">
      {donorNotifications.map((notification) => { const Icon = notification.icon; return <li key={notification.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className={cn("font-medium text-foreground", notification.unread && "text-primary")}>{notification.title}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{notification.priority}</span></div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p><p className="mt-2 text-xs text-muted-foreground">{notification.timestamp}</p></div>{notification.unread && <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" />}</li>; })}
    </ul></CardContent></DashboardCard>
  </AdminPageShell>;
}

export function DonorProfilePage() {
  return <AdminPageShell label="Your account" title="Donor profile" description="Your current donor details and contribution preferences." actions={<Button variant="outline"><UserRound className="mr-2 size-4" />Edit profile</Button>}>
    <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
      <DashboardCard><CardContent className="flex flex-col items-center py-10 text-center"><span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">{donorProfile.initials}</span><p className="mt-4 text-lg font-semibold text-foreground">{donorProfile.name}</p><p className="mt-1 text-sm text-muted-foreground">{donorProfile.donorId}</p><span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="size-4" />Active donor</span></CardContent></DashboardCard>
      <DashboardCard><CardHeader><CardTitle>Personal information</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{profileDetails.map(({ label, value, icon: Icon }) => <div key={label}><p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Icon className="size-3.5 text-primary" />{label}</p><p className="mt-2 font-medium text-foreground">{value}</p></div>)}</CardContent></DashboardCard>
    </div>
  </AdminPageShell>;
}

export function DonorSettingsPage() {
  return <AdminPageShell label="Your account" title="Settings" description="Manage your account preferences. Changes are visual placeholders until account settings are connected.">
    <div className="grid gap-px bg-border lg:grid-cols-2">
      <DashboardCard><CardHeader><CardTitle>Account settings</CardTitle><CardDescription>Contact details and profile preferences.</CardDescription></CardHeader><CardContent className="form-grid"><Input label="Email address" defaultValue={donorProfile.email} /><Input label="Phone number" defaultValue={donorProfile.phone} /><Button type="button">Save changes</Button></CardContent></DashboardCard>
      <DashboardCard><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose the updates you would like to receive.</CardDescription></CardHeader><CardContent className="space-y-4">{["Donation verification updates", "Campaign updates", "Foundation announcements"].map((label) => <label key={label} className="flex items-center justify-between gap-4 text-sm font-medium text-foreground"><span>{label}</span><input type="checkbox" defaultChecked className="size-4 accent-primary" /></label>)}</CardContent></DashboardCard>
      <DashboardCard><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Use the theme selector in the header to switch between light and dark themes.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 text-sm text-muted-foreground"><Settings2 className="size-5 text-primary" />Your selected theme is applied across the donor portal.</div></CardContent></DashboardCard>
      <DashboardCard><CardHeader><CardTitle>Security</CardTitle><CardDescription>Password and account security options will be available when account management is connected.</CardDescription></CardHeader><CardContent><Button type="button" variant="outline"><LockKeyhole className="mr-2 size-4" />Manage account security</Button></CardContent></DashboardCard>
    </div>
  </AdminPageShell>;
}
