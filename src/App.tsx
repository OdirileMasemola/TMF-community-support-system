import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/app-shell/admin-layout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
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
import { DonorDashboardPage } from "@/pages/donor/DonorDashboardPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { CampaignsPage } from "@/pages/public/CampaignsPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { DonatePage } from "@/pages/public/DonatePage";
import { GetInvolvedPage } from "@/pages/public/GetInvolvedPage";
import { HomePage } from "@/pages/public/HomePage";

// this is the main app component 
export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Signed-in users land on /dashboard (not /admin/*). */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* Temporary public preview using the same shell as the admin workspace. */}
      <Route path="/donor" element={<AdminLayout />}>
        <Route path="dashboard" element={<DonorDashboardPage />} />
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

      {/* Admin shell lives only under /admin/* — do not reclaim /dashboard here. */}
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

      {/* Legacy root paths from before the /admin/* move. */}
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
