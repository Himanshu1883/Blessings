import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLayout, authInputClass } from "@/components/site/auth-page-layout";
import { GoogleAuthButton } from "@/components/site/google-auth-button";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { loginSearch } from "@/lib/login-search";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "/",
  }),
  head: () =>
    seoHead({
      title: "Create an account",
      description: "Join Blessings The Men's Boutique to save looks, track orders and checkout faster.",
      path: "/signup",
      noindex: true,
    }),
  component: SignupPage,
});

function SignupPage() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, googleEnabled, getGoogleLoginUrl } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = email.trim();
    const phoneValue = phone.trim();
    if (!emailValue && !phoneValue) {
      toast.error("Email or phone is required.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: emailValue || undefined,
        phone: phoneValue || undefined,
        password: signupPassword,
      });
      toast.success(`Welcome, ${user.name.split(" ")[0]}.`);
      navigate({ to: from });
    } catch (err) {
      if (err instanceof ApiError && err.code === "ACCOUNT_EXISTS") {
        const details = (err.data ?? {}) as { hasGoogle?: boolean; hasPassword?: boolean; field?: string };
        if (details.hasGoogle && !details.hasPassword) {
          toast.error(err.message);
        } else {
          toast.error(err.message);
          navigate({
            to: "/login",
            search: loginSearch(from, { identifier: emailValue || phoneValue }),
          });
        }
        return;
      }
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout mode="signup">
      <h1 className="font-serif text-4xl sm:text-5xl italic text-foreground mb-3">Create account</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Join as a guest with email or phone, or continue with Google. Your bag and saved pieces stay with you.
      </p>

      <form onSubmit={handleSignup} className="space-y-5">
        <Input
          id="signup-name"
          placeholder="Full name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className={authInputClass}
        />
        <Input
          id="signup-email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={authInputClass}
        />
        <Input
          id="signup-phone"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          className={authInputClass}
        />
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Password (min. 8 characters) *"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
        <Input
          id="signup-confirm"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password *"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={authInputClass}
        />
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 eyebrow text-[11px] tracking-[0.18em]"
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {googleEnabled && (
        <div className="mt-6 pt-6 border-t border-border">
          <GoogleAuthButton href={getGoogleLoginUrl(from)} label="Sign up with Google" />
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={loginSearch(from)} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPageLayout>
  );
}