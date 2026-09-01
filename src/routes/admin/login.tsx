import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { safeAdminFrom } from "@/lib/require-auth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "/admin/dashboard",
  }),
  head: () =>
    seoHead({
      title: "Admin sign in",
      description: "Blessings admin.",
      path: "/admin/login",
      noindex: true,
    }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { login, logout, isAdmin, isLoading, isAuthenticated } = useAuth();
  const { from } = Route.useSearch();
  const dest = safeAdminFrom(from);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated && isAdmin) {
    window.location.replace(dest);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        await logout();
        setError("Invalid credentials or insufficient permissions.");
        return;
      }
      window.location.replace(dest);
    } catch {
      setError("Invalid credentials or insufficient permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-charcoal via-black to-charcoal p-4">
      <div className="admin-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <p className="font-serif italic text-2xl text-foreground">Blessings</p>
          <p className="eyebrow text-[10px] text-muted-foreground mt-1">Admin Control Panel</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-input"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary underline-offset-4 hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
