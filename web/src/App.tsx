import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/shared/RoleProtectedRoute";
import { PageFallback } from "@/components/shared/DataState";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { HomePage } from "@/pages/public/HomePage";

const AppLayout = lazy(() => import("@/components/layout/AppLayout").then((module) => ({ default: module.AppLayout })));
const AdminLayout = lazy(() =>
  import("@/components/app-shell/admin-layout").then((module) => ({ default: module.AdminLayout })),
);
const DonorLayout = lazy(() =>
  import("@/components/app-shell/donor-layout").then((module) => ({ default: module.DonorLayout })),
);
const VolunteerLayout = lazy(() =>
  import("@/components/app-shell/volunteer-layout").then((module) => ({ default: module.VolunteerLayout })),
);
const BeneficiaryLayout = lazy(() =>
  import("@/components/app-shell/beneficiary-layout").then((module) => ({ default: module.BeneficiaryLayout })),
);
const SponsorLayout = lazy(() =>
  import("@/components/app-shell/sponsor-layout").then((module) => ({ default: module.SponsorLayout })),
);

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);

const AboutPage = lazy(() => import("@/pages/public/AboutPage").then((module) => ({ default: module.AboutPage })));
const CampaignsPage = lazy(() =>
  import("@/pages/public/CampaignsPage").then((module) => ({ default: module.CampaignsPage })),
);
const ContactPage = lazy(() => import("@/pages/public/ContactPage").then((module) => ({ default: module.ContactPage })));
const DonatePage = lazy(() => import("@/pages/public/DonatePage").then((module) => ({ default: module.DonatePage })));
const GetInvolvedPage = lazy(() =>
  import("@/pages/public/GetInvolvedPage").then((module) => ({ default: module.GetInvolvedPage })),
);

const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })),
);
const AdminReportsPage = lazy(() =>
  import("@/pages/admin/AdminReportsPage").then((module) => ({ default: module.AdminReportsPage })),
);
const AdminCampaignsPage = lazy(() =>
  import("@/pages/admin/AdminCampaignsPage").then((module) => ({ default: module.AdminCampaignsPage })),
);
const AdminDonationsPage = lazy(() =>
  import("@/pages/admin/AdminDonationsPage").then((module) => ({ default: module.AdminDonationsPage })),
);
const AdminVolunteersPage = lazy(() =>
  import("@/pages/admin/AdminVolunteersPage").then((module) => ({ default: module.AdminVolunteersPage })),
);
const AdminSponsorsPage = lazy(() =>
  import("@/pages/admin/AdminSponsorsPage").then((module) => ({ default: module.AdminSponsorsPage })),
);
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((module) => ({ default: module.AdminUsersPage })),
);
const AdminEventsPage = lazy(() =>
  import("@/pages/admin/AdminEventsPage").then((module) => ({ default: module.AdminEventsPage })),
);
const AdminNotificationsPage = lazy(() =>
  import("@/pages/admin/AdminNotificationsPage").then((module) => ({ default: module.AdminNotificationsPage })),
);
const AdminMessagesPage = lazy(() =>
  import("@/pages/admin/AdminMessagesPage").then((module) => ({ default: module.AdminMessagesPage })),
);
const AdminSettingsPage = lazy(() =>
  import("@/pages/admin/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })),
);

const loadDonorPages = () => import("@/pages/donor/DonorPortalPages");
const DonorDashboardPage = lazy(() =>
  import("@/pages/donor/DonorDashboardPage").then((module) => ({ default: module.DonorDashboardPage })),
);
const DonorDonatePage = lazy(() => loadDonorPages().then((module) => ({ default: module.DonorDonatePage })));
const DonorCampaignsPage = lazy(() => loadDonorPages().then((module) => ({ default: module.DonorCampaignsPage })));
const DonorDonationsPage = lazy(() => loadDonorPages().then((module) => ({ default: module.DonorDonationsPage })));
const DonorProofOfPaymentPage = lazy(() =>
  loadDonorPages().then((module) => ({ default: module.DonorProofOfPaymentPage })),
);
const DonorNotificationsPage = lazy(() =>
  loadDonorPages().then((module) => ({ default: module.DonorNotificationsPage })),
);
const DonorProfilePage = lazy(() => loadDonorPages().then((module) => ({ default: module.DonorProfilePage })));
const DonorSettingsPage = lazy(() => loadDonorPages().then((module) => ({ default: module.DonorSettingsPage })));

const loadVolunteerPages = () => import("@/pages/volunteer/VolunteerPortalPages");
const VolunteerDashboardPage = lazy(() =>
  import("@/pages/volunteer/VolunteerDashboardPage").then((module) => ({ default: module.VolunteerDashboardPage })),
);
const VolunteerOpportunitiesPage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerOpportunitiesPage })),
);
const VolunteerApplicationsPage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerApplicationsPage })),
);
const VolunteerAssignmentsPage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerAssignmentsPage })),
);
const VolunteerHoursPage = lazy(() => loadVolunteerPages().then((module) => ({ default: module.VolunteerHoursPage })));
const VolunteerNotificationsPage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerNotificationsPage })),
);
const VolunteerProfilePage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerProfilePage })),
);
const VolunteerSettingsPage = lazy(() =>
  loadVolunteerPages().then((module) => ({ default: module.VolunteerSettingsPage })),
);

const loadBeneficiaryPages = () => import("@/pages/beneficiary/BeneficiaryPortalPages");
const BeneficiaryDashboardPage = lazy(() =>
  import("@/pages/beneficiary/BeneficiaryDashboardPage").then((module) => ({ default: module.BeneficiaryDashboardPage })),
);
const BeneficiaryRequestPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryRequestPage })),
);
const BeneficiaryRequestsPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryRequestsPage })),
);
const BeneficiaryProgrammesPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryProgrammesPage })),
);
const BeneficiaryHelpPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryHelpPage })),
);
const BeneficiaryNotificationsPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryNotificationsPage })),
);
const BeneficiaryProfilePage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiaryProfilePage })),
);
const BeneficiarySettingsPage = lazy(() =>
  loadBeneficiaryPages().then((module) => ({ default: module.BeneficiarySettingsPage })),
);

const loadSponsorPages = () => import("@/pages/sponsor/SponsorPortalPages");
const SponsorDashboardPage = lazy(() =>
  import("@/pages/sponsor/SponsorDashboardPage").then((module) => ({ default: module.SponsorDashboardPage })),
);
const SponsorCampaignsPage = lazy(() =>
  loadSponsorPages().then((module) => ({ default: module.SponsorCampaignsPage })),
);
const SponsorSponsorshipsPage = lazy(() =>
  loadSponsorPages().then((module) => ({ default: module.SponsorSponsorshipsPage })),
);
const SponsorRequestsPage = lazy(() => loadSponsorPages().then((module) => ({ default: module.SponsorRequestsPage })));
const SponsorHistoryPage = lazy(() => loadSponsorPages().then((module) => ({ default: module.SponsorHistoryPage })));
const SponsorImpactPage = lazy(() => loadSponsorPages().then((module) => ({ default: module.SponsorImpactPage })));
const SponsorNotificationsPage = lazy(() =>
  loadSponsorPages().then((module) => ({ default: module.SponsorNotificationsPage })),
);
const SponsorProfilePage = lazy(() => loadSponsorPages().then((module) => ({ default: module.SponsorProfilePage })));
const SponsorSettingsPage = lazy(() => loadSponsorPages().then((module) => ({ default: module.SponsorSettingsPage })));

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/complete-profile" element={<CompleteProfilePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["donor"]} />}>
          <Route path="/donor" element={<DonorLayout />}>
            <Route path="dashboard" element={<DonorDashboardPage />} />
            <Route path="dashboard/donate" element={<DonorDonatePage />} />
            <Route path="dashboard/campaigns" element={<DonorCampaignsPage />} />
            <Route path="dashboard/donations" element={<DonorDonationsPage />} />
            <Route path="dashboard/proof-of-payment" element={<DonorProofOfPaymentPage />} />
            <Route path="dashboard/notifications" element={<DonorNotificationsPage />} />
            <Route path="dashboard/profile" element={<DonorProfilePage />} />
            <Route path="dashboard/settings" element={<DonorSettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["volunteer"]} />}>
          <Route path="/volunteer" element={<VolunteerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VolunteerDashboardPage />} />
            <Route path="opportunities" element={<VolunteerOpportunitiesPage />} />
            <Route path="applications" element={<VolunteerApplicationsPage />} />
            <Route path="assignments" element={<VolunteerAssignmentsPage />} />
            <Route path="hours" element={<VolunteerHoursPage />} />
            <Route path="notifications" element={<VolunteerNotificationsPage />} />
            <Route path="profile" element={<VolunteerProfilePage />} />
            <Route path="settings" element={<VolunteerSettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["beneficiary"]} />}>
          <Route path="/beneficiary" element={<BeneficiaryLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BeneficiaryDashboardPage />} />
            <Route path="request" element={<BeneficiaryRequestPage />} />
            <Route path="requests" element={<BeneficiaryRequestsPage />} />
            <Route path="programmes" element={<BeneficiaryProgrammesPage />} />
            <Route path="help" element={<BeneficiaryHelpPage />} />
            <Route path="notifications" element={<BeneficiaryNotificationsPage />} />
            <Route path="profile" element={<BeneficiaryProfilePage />} />
            <Route path="settings" element={<BeneficiarySettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["sponsor"]} />}>
          <Route path="/sponsor" element={<SponsorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SponsorDashboardPage />} />
            <Route path="campaigns" element={<SponsorCampaignsPage />} />
            <Route path="sponsorships" element={<SponsorSponsorshipsPage />} />
            <Route path="requests" element={<SponsorRequestsPage />} />
            <Route path="history" element={<SponsorHistoryPage />} />
            <Route path="impact" element={<SponsorImpactPage />} />
            <Route path="notifications" element={<SponsorNotificationsPage />} />
            <Route path="profile" element={<SponsorProfilePage />} />
            <Route path="settings" element={<SponsorSettingsPage />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="get-involved" element={<GetInvolvedPage />} />
          <Route path="donate" element={<DonatePage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["administrator"]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="donations" element={<AdminDonationsPage />} />
            <Route path="volunteers" element={<AdminVolunteersPage />} />
            <Route path="sponsors" element={<AdminSponsorsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="donations" element={<Navigate to="/admin/donations" replace />} />
        <Route path="applications" element={<Navigate to="/admin/volunteers" replace />} />
        <Route path="sponsorships" element={<Navigate to="/admin/sponsors" replace />} />
        <Route path="users" element={<Navigate to="/admin/users" replace />} />
        <Route path="events" element={<Navigate to="/admin/events" replace />} />
        <Route path="notifications" element={<Navigate to="/admin/notifications" replace />} />
        <Route path="settings" element={<Navigate to="/admin/settings" replace />} />
      </Routes>
    </Suspense>
  );
}
