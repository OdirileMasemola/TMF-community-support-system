import { Route, Routes } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { CampaignsPage } from "@/pages/public/CampaignsPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { DonatePage } from "@/pages/public/DonatePage";
import { GetInvolvedPage } from "@/pages/public/GetInvolvedPage";
import { HomePage } from "@/pages/public/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="get-involved" element={<GetInvolvedPage />} />
        <Route path="donate" element={<DonatePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
