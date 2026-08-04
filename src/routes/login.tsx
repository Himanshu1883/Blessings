import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLayout, authInputClass } from "@/components/site/auth-page-layout";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "/",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, googleLoginUrl } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(loginId.trim(), loginPassword);
      toast.success("Welcome back.");
      navigate({ to: from });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout mode="login">
      <h1 className="font-serif text-4xl sm:text-5xl italic text-foreground mb-3">Login</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Welcome back! Log in to your account to access your order history and enjoy faster checkout.
      </p>

      <form onSubmit={handleLogin} className="space-y-6">
        <Input
          id="login-id"
          type="email"
          placeholder="Email address *"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
          autoComplete="email"
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
        <Link to="/contact" className="inline-block text-sm font-medium hover:text-primary transition-colors">
          Forgot your password?
        </Link>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 eyebrow text-[11px] tracking-[0.18em]"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New customer?{" "}
        <Link to="/signup" search={{ from }} className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-border">
        <a
          href={googleLoginUrl}
          className="flex w-full items-center justify-center gap-2 border border-foreground/15 py-3 text-sm hover:bg-muted/40 transition-colors"
        >
          Continue with Google
        </a>
      </div>
    </AuthPageLayout>
  );
}
