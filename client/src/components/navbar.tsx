import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
    Home,
    BarChart2,
    Award,
    Settings,
    User,
    Palette,
    LogOut,
    Menu,
    X,
    Link2
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Feature flag for AI Branding
const BRANDING_ENABLED = import.meta.env.VITE_FEATURE_BRANDING === "true";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/social-score", icon: Award, label: "Social Score" },
    { href: "/spotlight", icon: Link2, label: "Spotlight" },
    { href: "/profile", icon: User, label: "Profile" },
    ...(BRANDING_ENABLED ? [{ href: "/branding", icon: Palette, label: "Branding" }] : []),
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:flex h-screen w-64 flex-col bg-zinc-50 border-r border-zinc-200 p-4">
        <div className="flex items-center mb-8 px-2">
          <img 
            src="/assets/logo-horizontal.png" 
            alt="MyLinked" 
            className="h-8 w-auto"
            style={{ imageRendering: 'crisp-edges' }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = 'none';
              const fallback = document.createElement('h1');
              fallback.className = 'text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent';
              fallback.textContent = 'MyLinked';
              img.parentNode?.appendChild(fallback);
            }}
          />
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            </Link>
          ))}
        </div>

        <div className="mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-700 hover:bg-zinc-100 px-3 py-2 h-9"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Log out
          </Button>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-zinc-200 px-4 py-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          MyLinked
        </h1>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              MyLinked
            </h1>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      location === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-zinc-700 hover:bg-zinc-100"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
            <div className="mt-8 border-t border-zinc-200 pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-700 hover:bg-zinc-100 px-3 py-2 h-9"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Log out
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}