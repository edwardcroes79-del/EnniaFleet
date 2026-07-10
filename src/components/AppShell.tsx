import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { settingsService, type AppSettings } from "@/services/settingsService";
import {
  LayoutDashboard,
  Car,
  Users,
  ClipboardList,
  Wrench,
  Fuel,
  AlertTriangle,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Array<"admin" | "director" | "employee">;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Employees", href: "/employees", icon: Users, roles: ["admin", "director"] },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Fuel Log", href: "/fuel", icon: Fuel },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "director"] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut, hasRole } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    settingsService.get().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const visibleNav = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => hasRole([r]))
  );

  const NavLink = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          mobile
            ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  const companyName = settings?.company_name || "FleetCommand";
  const logoUrl = settings?.logo_url;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 w-8 object-contain" />
          ) : (
            <Shield className="h-6 w-6 text-sidebar-primary" />
          )}
          <span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
            {companyName}
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {profile?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <ThemeSwitch />
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
                  {logoUrl ? (
                    <img src={logoUrl} alt={companyName} className="h-8 w-8 object-contain" />
                  ) : (
                    <Shield className="h-6 w-6 text-sidebar-primary" />
                  )}
                  <span className="font-display text-lg font-semibold text-sidebar-foreground">
                    {companyName}
                  </span>
                </div>
                <nav className="space-y-1 px-3 py-4">
                  {visibleNav.map((item) => (
                    <NavLink key={item.href} item={item} mobile />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <span className="font-display text-lg font-semibold">{companyName}</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 bg-background p-4 lg:p-8">
          <div className="container-fleet">{children}</div>
        </main>
      </div>
    </div>
  );
}