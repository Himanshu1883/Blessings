import { Navigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AdminProtected({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        search={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
}
