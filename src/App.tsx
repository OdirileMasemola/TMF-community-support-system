import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
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

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
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
    </Routes>
  );
}
