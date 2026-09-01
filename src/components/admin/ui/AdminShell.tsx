import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ADMIN_NAV, tabLabel, type AdminTabId } from "@/components/admin/adminNav";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/seo";

type Badges = {
  pendingOrders?: number;
  pendingReturns?: number;
  lowStock?: number;
};

export function AdminShell({
  activeTab,
  children,
  badges = {},
}: {
  activeTab: AdminTabId;
  children: ReactNode;
  badges?: Badges;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AD";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/admin/login", replace: true });
  };

  const sidebarContent = (
    <>
      <div className={cn("px-4 py-5 border-b border-white/10", collapsed && "px-2")}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3" aria-label={`${BRAND_NAME} storefront`}>
            <img src={BRAND_LOGO} alt="" className="size-11 rounded-full object-contain ring-1 ring-[color:var(--gold)]/40" />
            <span>
              <p className="font-serif italic text-lg text-[color:var(--ivory)]">{BRAND_NAME}</p>
              <p className="eyebrow text-[9px] text-[color:var(--gold)] mt-0.5">Admin / Control Panel</p>
            </span>
          </Link>
        )}
        {collapsed && (
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="mx-auto size-9 rounded-full object-contain" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto admin-scrollbar py-3 px-2 space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeTab;
          const badge =
            item.badgeKey === "pendingOrders"
              ? badges.pendingOrders
              : item.badgeKey === "pendingReturns"
                ? badges.pendingReturns
                : item.badgeKey === "lowStock"
                  ? badges.lowStock
                  : undefined;

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors relative",
                active
                  ? "bg-white/10 text-[color:var(--ivory)] border-l-2 border-[color:var(--gold)]"
                  : "text-[color:var(--ivory)]/70 hover:bg-white/5 hover:text-[color:var(--ivory)]",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && badge != null && badge > 0 && (
                <span className="rounded-full bg-[color:var(--gold)] text-[color:var(--charcoal)] text-[10px] font-medium px-1.5 min-w-[1.25rem] text-center">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-white/10 p-3 space-y-2", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 px-1", collapsed && "justify-center")}>
          <div className="size-9 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] flex items-center justify-center text-xs font-medium shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm text-[color:var(--ivory)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[color:var(--ivory)]/50 uppercase tracking-wider">Admin</p>
            </div>
          )}
        </div>
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 text-xs text-[color:var(--ivory)]/70 hover:text-[color:var(--gold)] px-2 py-1.5",
            collapsed && "justify-center",
          )}
        >
          <ExternalLink className="size-3.5" />
          {!collapsed && "View Store"}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2 text-xs text-[color:var(--ivory)]/70 hover:text-destructive px-2 py-1.5",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="size-3.5" />
          {!collapsed && "Sign out"}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-full items-center justify-center gap-1 text-[10px] text-[color:var(--ivory)]/50 hover:text-[color:var(--gold)] py-2"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-shell flex min-h-svh bg-[color:var(--ivory)]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "admin-sidebar fixed lg:sticky top-0 z-50 h-svh flex flex-col bg-gradient-to-b from-charcoal to-black text-[color:var(--ivory)] transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <button
          type="button"
          className="lg:hidden absolute top-4 right-3 text-[color:var(--ivory)]"
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-5" />
        </button>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={cn(
            "admin-topbar sticky top-0 z-30 bg-[color:var(--ivory)]/95 border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4",
            activeTab === "dashboard" && "lg:hidden",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <p className="eyebrow text-[10px] text-muted-foreground truncate">
                Admin / {tabLabel(activeTab)}
              </p>
              <h2 className="font-serif italic text-lg truncate">{tabLabel(activeTab)}</h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <p className="text-xs text-muted-foreground">{today}</p>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="size-3.5" />
                View Store
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="size-3.5" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
