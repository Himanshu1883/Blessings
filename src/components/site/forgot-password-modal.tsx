import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authInputClass } from "@/components/site/auth-page-layout";
import { useScrollExperience } from "@/components/site/scroll-experience";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ForgotPasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIdentifier?: string;
  onComplete?: () => void;
};

type Step = "verify" | "reset";

const STEPS: { key: Step; label: string }[] = [
  { key: "verify", label: "Verify identity" },
  { key: "reset", label: "New password" },
];

function StepTracker({ step }: { step: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="relative mt-6 flex items-start justify-between px-1">
      <div className="absolute left-0 right-0 top-[5px] h-px bg-foreground/10" />
      <div
        className="absolute left-0 top-[5px] h-px bg-[color:var(--gold)] transition-all duration-300"
        style={{ width: currentIndex === 0 ? "0%" : "100%" }}
      />
      {STEPS.map((s, i) => {
        const tone = i < currentIndex ? "complete" : i === currentIndex ? "current" : "upcoming";
        return (
          <div key={s.key} className="relative z-10 flex flex-1 flex-col items-center text-center">
            <span
              className={cn(
                "flex size-2.5 items-center justify-center rounded-full",
                tone === "complete" && "bg-[color:var(--gold)]",
                tone === "current" && "bg-[color:var(--maroon)] ring-2 ring-[color:var(--maroon)]/25",
                tone === "upcoming" && "bg-foreground/15",
              )}
            />
            <p
              className={cn(
                "mt-2 text-[10px] uppercase tracking-[0.1em]",
                tone === "upcoming" ? "text-foreground/35" : "text-foreground/70",
                tone === "current" && "font-medium text-foreground",
              )}
            >
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  initialIdentifier = "",
  onComplete,
}: ForgotPasswordModalProps) {
  const { lenis } = useScrollExperience();
  const [step, setStep] = useState<Step>("verify");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordsFilled = newPassword.length >= 8 && confirmPassword.length >= 8;
  const passwordsMatch = passwordsFilled && newPassword === confirmPassword;

  const resetForm = () => {
    setStep("verify");
    setIdentifier(initialIdentifier);
    setName("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      setIdentifier(initialIdentifier);
    } else {
      resetForm();
    }
  }, [open, initialIdentifier]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [open, lenis]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.post<{ resetToken: string }>("/api/auth/password/verify", {
        identifier: identifier.trim(),
        name: name.trim(),
      });
      setResetToken(result.resetToken);
      setStep("reset");
      toast.success("Account verified. Set your new password.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/auth/password/reset", {
        resetToken,
        newPassword,
      });
      toast.success("Password updated. You can sign in now.");
      onOpenChange(false);
      onComplete?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESET_EXPIRED") {
        toast.error(err.message);
        setStep("verify");
        setResetToken("");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not reset password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-lenis-prevent
        className="max-w-md overflow-hidden rounded-none border-foreground/10 p-0"
      >
        <div className="bg-[color:var(--ivory)] px-6 pb-6 pt-7 sm:px-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--gold)]/50 bg-white text-[color:var(--gold)]">
                {step === "verify" ? (
                  <ShieldCheck className="size-4" strokeWidth={1.6} />
                ) : (
                  <KeyRound className="size-4" strokeWidth={1.6} />
                )}
              </span>
              <p className="eyebrow text-[9px] tracking-[0.24em] text-[color:var(--gold)]">
                Account recovery
              </p>
            </div>
            <DialogTitle className="font-serif text-2xl italic text-[color:var(--charcoal)]">
              {step === "verify" ? "Verify your account" : "Choose a new password"}
            </DialogTitle>
            <p className="text-sm leading-relaxed text-foreground/60">
              {step === "verify"
                ? "Enter the email or phone and full name you used when creating your account."
                : "Pick something you'll remember — at least 8 characters."}
            </p>
          </DialogHeader>

          <StepTracker step={step} />
        </div>

        <div className="border-t border-foreground/10 bg-white px-6 py-6 sm:px-8">
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="reset-identifier" className="eyebrow mb-1.5 block text-[9px] text-foreground/45">
                  Email or phone
                </label>
                <Input
                  id="reset-identifier"
                  type="text"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  className={authInputClass}
                />
              </div>
              <div>
                <label htmlFor="reset-name" className="eyebrow mb-1.5 block text-[9px] text-foreground/45">
                  Full name on account
                </label>
                <Input
                  id="reset-name"
                  type="text"
                  placeholder="As entered at signup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={authInputClass}
                />
              </div>
              <p className="text-xs leading-relaxed text-foreground/45">
                We match these details against your account before allowing a reset — no email or SMS
                round-trip required.
              </p>
              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 h-11 w-full rounded-none bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.18em] text-white hover:bg-[color:var(--maroon)]/90"
              >
                {submitting ? "Verifying…" : "Verify account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="reset-new-password" className="eyebrow mb-1.5 block text-[9px] text-foreground/45">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={cn(authInputClass, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reset-confirm-password" className="eyebrow mb-1.5 block text-[9px] text-foreground/45">
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={cn(authInputClass, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 ? (
                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1 text-xs",
                      passwordsMatch ? "text-emerald-700" : "text-[color:var(--maroon)]",
                    )}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="size-3.5" strokeWidth={1.8} />
                        Passwords match
                      </>
                    ) : (
                      "Passwords don't match yet"
                    )}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => {
                    setStep("verify");
                    setResetToken("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="h-11 flex-1 rounded-none border-foreground/15 eyebrow text-[10px] tracking-[0.18em]"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !passwordsMatch}
                  className="h-11 flex-[1.4] rounded-none bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.18em] text-white hover:bg-[color:var(--maroon)]/90 disabled:opacity-40"
                >
                  {submitting ? "Saving…" : "Set password"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}