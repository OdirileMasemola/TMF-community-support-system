import { Link } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/get-involved", label: "Get Involved" },
  { to: "/donate", label: "Donate" },
  { to: "/contact", label: "Contact" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-footer-border bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 md:px-6">
        <div>
          <h3 className="text-lg font-bold">TMF Support</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            A digital platform for the Themba Molefe Foundation to manage campaigns, donations,
            volunteers, and community assistance in one organised place.
          </p>
        </div>

        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-footer-accent transition hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">Contact</h4>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-footer-accent" />
              <span>Johannesburg, South Africa</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-footer-accent" />
              <span>+27 11 000 0000</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-footer-accent" />
              <span>info@themolefefoundation.org</span>
            </li>
          </ul>
        </div>

        <ThemeSelector />
      </div>

      <div className="border-t border-footer-border/40">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs opacity-70 md:px-6">
          © {new Date().getFullYear()} Themba Molefe Foundation. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
