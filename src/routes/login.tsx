import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLayout, authInputClass } from "@/components/site/auth-page-layout";
import { ForgotPasswordModal } from "@/components/site/forgot-password-modal";
import { GoogleAuthButton } from "@/components/site/google-auth-button";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { safeStoreFrom } from "@/lib/login-search";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): {
    from: string;
    identifier?: string;
    auth?: string;
  } => ({
    from: typeof search.from === "string" ? search.from : "/",
    ...(typeof search.identifier === "string" ? { identifier: search.identifier } : {}),
    ...(typeof search.auth === "string" ? { auth: search.auth } : {}),
  }),
  head: () =>
    seoHead({
      title: "Sign in",
      description: "Sign in to Blessings The Men's Boutique to view orders, wishlist and checkout.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const { from, identifier: prefill, auth } = Route.useSearch();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, isAdmin, googleEnabled, getGoogleLoginUrl } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginId, setLoginId] = useState(prefill ?? "");
  const [loginPassword, setLoginPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (prefill) setLoginId(prefill);
  }, [prefill]);

  useEffect(() => {
    if (auth === "failed") {
      toast.error("Google sign-in did not complete. Please try again.");
    }
  }, [auth]);

  if (!isLoading && isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={safeStoreFrom(from)} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(loginId.trim(), loginPassword);
      toast.success("Welcome back.");
      navigate({ to: user.role === "admin" ? "/admin/dashboard" : safeStoreFrom(from) });
    } catch (err) {
      if (err instanceof ApiError && err.code === "GOOGLE_ONLY") {
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout mode="login">
      <h1 className="font-serif text-4xl sm:text-5xl italic text-foreground mb-3">Login</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Welcome back. Sign in to track orders, save favourites, and check out faster.
      </p>

      <form onSubmit={handleLogin} className="space-y-6">
        <Input
          id="login-id"
          type="text"
          inputMode="email"
          placeholder="Email or phone *"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
          autoComplete="username"
          className={authInputClass}
        />
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password *"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={cn(authInputClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="inline-block text-sm font-medium hover:text-primary transition-colors"
        >
          Forgot your password?
        </button>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 eyebrow text-[11px] tracking-[0.18em]"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {googleEnabled && (
        <div className="mt-6 pt-6 border-t border-border">
          <GoogleAuthButton href={getGoogleLoginUrl(from)} />
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New customer?{" "}
        <Link to="/signup" search={{ from }} className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <ForgotPasswordModal
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        initialIdentifier={loginId}
      />
    </AuthPageLayout>
  );
}
