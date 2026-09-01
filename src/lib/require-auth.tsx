import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loginSearch } from "@/lib/login-search";

function AuthLoading({ label = "Checking your session…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-7 animate-spin text-[color:var(--maroon)]" />
      <p className="eyebrow text-[10px] text-foreground/45">{label}</p>
    </div>
  );
}

function useFreshSession() {
  const { refreshUser, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    void refreshUser().finally(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, [refreshUser]);

  return isLoading || !ready;
}

export function RequireAuth({
  children,
  from,
}: {
  children: ReactNode;
  from: string;
}) {
  const waiting = useFreshSession();
  const { isAuthenticated } = useAuth();

  if (waiting) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" search={loginSearch(from)} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const waiting = useFreshSession();
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (waiting) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        search={{ from: location.pathname.startsWith("/admin") ? location.pathname : "/admin/dashboard" }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export function safeAdminFrom(from: string) {
  if (from.startsWith("/admin/") && from !== "/admin/login") return from;
  return "/admin/dashboard";
}
