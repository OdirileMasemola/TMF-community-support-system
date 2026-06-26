import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleGate } from "@/components/shared/RoleGate";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { UserManagementPage } from "@/features/users/pages/UserManagementPage";
import { CampaignListPage } from "@/features/campaigns/pages/CampaignListPage";
import { CampaignFormPage } from "@/features/campaigns/pages/CampaignFormPage";
import { VolunteerApplicationsPage } from "@/features/applications/pages/VolunteerApplicationsPage";
import { AssistanceRequestsPage } from "@/features/assistance/pages/AssistanceRequestsPage";
import { AssistanceRequestFormPage } from "@/features/assistance/pages/AssistanceRequestFormPage";
import { DonationPage } from "@/features/donations/pages/DonationPage";
import { SponsorshipPage } from "@/features/sponsorships/pages/SponsorshipPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignListPage />} />
          <Route path="/campaigns/new" element={<RoleGate allowedRoles={["administrator"]}><CampaignFormPage /></RoleGate>} />
          <Route path="/applications" element={<RoleGate allowedRoles={["administrator", "volunteer"]}><VolunteerApplicationsPage /></RoleGate>} />
          <Route path="/assistance" element={<RoleGate allowedRoles={["administrator", "beneficiary"]}><AssistanceRequestsPage /></RoleGate>} />
          <Route path="/assistance/new" element={<RoleGate allowedRoles={["beneficiary"]}><AssistanceRequestFormPage /></RoleGate>} />
          <Route path="/donations" element={<RoleGate allowedRoles={["administrator", "donor"]}><DonationPage /></RoleGate>} />
          <Route path="/sponsorships" element={<RoleGate allowedRoles={["administrator", "sponsor"]}><SponsorshipPage /></RoleGate>} />
          <Route path="/reports" element={<RoleGate allowedRoles={["administrator"]}><ReportsPage /></RoleGate>} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<RoleGate allowedRoles={["administrator"]}><UserManagementPage /></RoleGate>} />
        </Route>
      </Route>
    </Routes>
  );
}
