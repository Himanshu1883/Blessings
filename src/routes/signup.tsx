import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLayout, authInputClass } from "@/components/site/auth-page-layout";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "/",
  }),
  component: SignupPage,
});

function SignupPage() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, googleLoginUrl } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      toast.error("Email or phone is required.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: signupPassword,
      });
      toast.success(`Welcome, ${name.trim().split(" ")[0]}.`);
      navigate({ to: from });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout mode="signup">
      <h1 className="font-serif text-4xl sm:text-5xl italic text-foreground mb-3">Create account</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Join Blessings for saved favourites, order tracking, and a smoother checkout experience.
      </p>

      <form onSubmit={handleSignup} className="space-y-5">
        <Input
          id="signup-name"
          placeholder="Full name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={authInputClass}
        />
        <Input
          id="signup-email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
        />
        <Input
          id="signup-phone"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 eyebrow text-[11px] tracking-[0.18em]"
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ from }} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
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
