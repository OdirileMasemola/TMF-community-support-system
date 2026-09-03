import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/app-shell/admin-layout";
import { BeneficiaryLayout } from "@/components/app-shell/beneficiary-layout";
import { DonorLayout } from "@/components/app-shell/donor-layout";
import { SponsorLayout } from "@/components/app-shell/sponsor-layout";
import { VolunteerLayout } from "@/components/app-shell/volunteer-layout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/shared/RoleProtectedRoute";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { AdminCampaignsPage } from "@/pages/admin/AdminCampaignsPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminDonationsPage } from "@/pages/admin/AdminDonationsPage";
import { AdminEventsPage } from "@/pages/admin/AdminEventsPage";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage";
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { AdminSponsorsPage } from "@/pages/admin/AdminSponsorsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminVolunteersPage } from "@/pages/admin/AdminVolunteersPage";
import { DonorDashboardPage } from "./pages/donor/DonorDashboardPage";
import {
  DonorCampaignsPage,
  DonorDonatePage,
  DonorDonationsPage,
  DonorNotificationsPage,
  DonorProfilePage,
  DonorProofOfPaymentPage,
  DonorSettingsPage,
} from "@/pages/donor/DonorPortalPages";
import { BeneficiaryDashboardPage } from "@/pages/beneficiary/BeneficiaryDashboardPage";
import {
  BeneficiaryHelpPage,
  BeneficiaryNotificationsPage,
  BeneficiaryProfilePage,
  BeneficiaryProgrammesPage,
  BeneficiaryRequestPage,
  BeneficiaryRequestsPage,
  BeneficiarySettingsPage,
} from "@/pages/beneficiary/BeneficiaryPortalPages";
import { VolunteerDashboardPage } from "@/pages/volunteer/VolunteerDashboardPage";
import {
  VolunteerApplicationsPage,
  VolunteerAssignmentsPage,
  VolunteerHoursPage,
  VolunteerNotificationsPage,
  VolunteerOpportunitiesPage,
  VolunteerProfilePage,
  VolunteerSettingsPage,
} from "@/pages/volunteer/VolunteerPortalPages";
import { SponsorDashboardPage } from "@/pages/sponsor/SponsorDashboardPage";
import {
  SponsorCampaignsPage,
  SponsorHistoryPage,
  SponsorImpactPage,
  SponsorNotificationsPage,
  SponsorProfilePage,
  SponsorRequestsPage,
  SponsorSettingsPage,
  SponsorSponsorshipsPage,
} from "@/pages/sponsor/SponsorPortalPages";
import { AboutPage } from "@/pages/public/AboutPage";
import { CampaignsPage } from "@/pages/public/CampaignsPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { DonatePage } from "@/pages/public/DonatePage";
import { GetInvolvedPage } from "@/pages/public/GetInvolvedPage";
import { HomePage } from "@/pages/public/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register/complete-profile" element={<CompleteProfilePage />} />
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
  );
}
