import { NavLink } from "react-router";
import { Bell, ChartNoAxesColumn, HandCoins, HeartHandshake, LayoutDashboard, Megaphone, ShieldCheck, Users } from "lucide-react";
import type { NavItem } from "@/types/app.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users", roles: ["administrator"] },
  { label: "Campaigns", path: "/campaigns" },
  { label: "Applications", path: "/applications", roles: ["administrator", "volunteer"] },
  { label: "Assistance", path: "/assistance", roles: ["administrator", "beneficiary"] },
  { label: "Donations", path: "/donations", roles: ["administrator", "donor"] },
  { label: "Sponsorships", path: "/sponsorships", roles: ["administrator", "sponsor"] },
  { label: "Reports", path: "/reports", roles: ["administrator"] },
  { label: "Notifications", path: "/notifications" },
];

const icons = [LayoutDashboard, Users, Megaphone, ShieldCheck, HeartHandshake, HandCoins, HeartHandshake, ChartNoAxesColumn, Bell];

export function Sidebar() {
  const { profile } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return profile?.role ? item.roles.includes(profile.role) : false;
  });

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Themba Molefe Foundation</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Community Support</h1>
      </div>

      <nav className="grid gap-2">
        {visibleItems.map((item, index) => {
          const Icon = icons[index] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
                  isActive && "bg-teal-50 text-teal-800",
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
