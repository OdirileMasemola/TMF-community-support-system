import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { cn } from "@/lib/utils";
import logo from "@/assets/images/logo.jpeg";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About", end: false },
  { to: "/campaigns", label: "Campaigns", end: false },
  { to: "/get-involved", label: "Get Involved", end: false },
  { to: "/donate", label: "Donate", end: false },
  { to: "/contact", label: "Contact", end: false },
];

function navLinkClassName(isActive: boolean) {
  return cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
  );
}

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 text-foreground">
      <div
        className={cn(
          "relative mx-auto flex items-center gap-4 transition-all duration-300",
          isScrolled
            ? "max-w-5xl rounded-2xl border border-border bg-background/70 px-4 py-2 shadow-lg backdrop-blur-xl"
            : "max-w-7xl bg-background/80 px-2 py-3 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none",
        )}
      >
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-border dark:shadow-[0_0_18px_rgba(255,255,255,0.35)]">
            <img src={logo} alt="TMF Logo" className="h-full w-full scale-[1.65] object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">TMF Support</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex lg:-translate-x-8 xl:-translate-x-12">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => navLinkClassName(isActive)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ThemeSelector />
          {isScrolled ? (
            <Button to="/register">Get Started</Button>
          ) : (
            <>
              <Button to="/login" variant="secondary">
                Login
              </Button>
              <Button to="/register">Register</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto shrink-0 rounded-md p-2 text-foreground hover:bg-muted lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="mx-auto mt-3 max-w-5xl rounded-2xl border border-border bg-background p-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => navLinkClassName(isActive)}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            <ThemeSelector />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button to="/login" variant="secondary" className="w-full">
              Login
            </Button>
            <Button to="/register" className="w-full">
              Register
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
