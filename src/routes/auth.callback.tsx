import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { loginSearch } from "@/lib/login-search";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
    from: typeof search.from === "string" ? search.from : "/",
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { token, from } = Route.useSearch();
  const navigate = useNavigate();
  const { completeGoogleSession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      if (!token) {
        toast.error("Google sign-in did not complete.");
        navigate({ to: "/login", search: loginSearch(from, { auth: "failed" }) });
        return;
      }
      try {
        const user = await completeGoogleSession(token);
        toast.success(`Welcome, ${user.name.split(" ")[0]}.`);
        navigate({ to: user.role === "admin" ? "/admin/dashboard" : from, replace: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Google sign-in failed");
        navigate({ to: "/login", search: loginSearch(from, { auth: "failed" }) });
      }
    };

    void finish();
  }, [completeGoogleSession, from, navigate, token]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="eyebrow text-[10px] tracking-[0.18em] text-muted-foreground">Signing you in…</p>
    </div>
  );
}
