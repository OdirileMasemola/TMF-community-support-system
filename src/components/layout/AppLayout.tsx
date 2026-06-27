import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AppLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar />
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-border bg-background px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Logged in as</p>
            <p className="font-semibold text-foreground">{profile?.full_name ?? "User"} - {profile?.role ?? "Loading"}</p>
          </div>
          <Button variant="secondary" onClick={signOut}>Sign out</Button>
        </header>
        <section className="p-5 lg:p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
