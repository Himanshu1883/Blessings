import { useState, type ReactNode } from "react";
import { Calendar, Lock, Mail, Pencil, Phone, RefreshCw, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiUser } from "@/lib/api-types";
import { useAuth } from "@/lib/auth-context";
import {
  displayEmail,
  formatIndianMobile,
  isIndianMobile,
  normalizeIndianMobile,
} from "@/lib/format-contact";
import { useNavigate } from "@tanstack/react-router";
import { loginSearch } from "@/lib/login-search";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center text-[color:var(--gold)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="eyebrow text-[9px] tracking-[0.22em] text-[color:var(--gold)]">{label}</p>
        <p className="mt-1 truncate text-[15px] text-[color:var(--charcoal)]">{value}</p>
      </div>
    </div>
  );
}

export function ProfileMemberCard({ user }: { user: ApiUser }) {
  const { updateAccount } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const email = displayEmail(user.email);
  const [form, setForm] = useState({
    name: user.name,
    email: email ?? "",
    phone: user.phone ? normalizeIndianMobile(user.phone) : "",
    currentPassword: "",
    newPassword: "",
  });

  const startEdit = () => {
    setForm({
      name: user.name,
      email: displayEmail(user.email) ?? "",
      phone: user.phone ? normalizeIndianMobile(user.phone) : "",
      currentPassword: "",
      newPassword: "",
    });
    setEditing(true);
  };

  const save = async () => {
    if (form.name.trim().length < 2) {
      toast.error("Name is required.");
      return;
    }
    const phone = form.phone.trim() ? normalizeIndianMobile(form.phone) : "";
    if (phone && !isIndianMobile(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!form.email.trim() && !phone) {
      toast.error("Keep at least an email or a mobile number.");
      return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (user.hasPassword && form.newPassword && !form.currentPassword) {
      toast.error("Current password is required to change it.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateAccount({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: phone || null,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });
      if (result.requiresRelogin) {
        toast.success("Details updated. Please sign in again.");
        navigate({ to: "/login", search: loginSearch("/profile", { identifier: form.email.trim() || phone }) });
        return;
      }
      toast.success("Profile updated.");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const iconProps = { className: "size-[18px]", strokeWidth: 1.5 } as const;

  return (
    <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(40,16,10,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px] tracking-[0.28em] text-[color:var(--gold)]">Member details</p>
          <h2 className="profile-display mt-2 text-3xl italic text-[color:var(--charcoal)] sm:text-[2.15rem]">
            {user.name}
          </h2>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/50 bg-white px-4 py-2 text-sm text-[color:var(--gold)] transition-colors hover:border-[color:var(--gold)] hover:bg-[color:var(--ivory)]"
          >
            <Pencil className="size-3.5" strokeWidth={1.6} />
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-white px-4 py-2 text-sm text-foreground/60"
            aria-label="Cancel editing"
          >
            <X className="size-3.5" />
            Cancel
          </button>
        )}
      </div>

      {!editing ? (
        <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Detail icon={<User {...iconProps} />} label="Full Name" value={user.name} />
          <Detail icon={<Mail {...iconProps} />} label="Email" value={email ?? "—"} />
          <Detail icon={<Phone {...iconProps} />} label="Mobile" value={formatIndianMobile(user.phone) ?? "—"} />
          <Detail
            icon={<Lock {...iconProps} />}
            label="Password"
            value={user.hasPassword ? "Set" : "Google sign-in only"}
          />
          <Detail icon={<Calendar {...iconProps} />} label="Joined" value={formatDate(user.createdAt)} />
          <Detail icon={<RefreshCw {...iconProps} />} label="Last Updated" value={formatDate(user.updatedAt)} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="eyebrow text-[9px]">Full name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="eyebrow text-[9px]">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="eyebrow text-[9px]">10-digit Indian mobile</Label>
            <Input
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="rounded-xl"
              placeholder="98765 43210"
            />
          </div>
          {user.hasPassword && (
            <div className="space-y-2">
              <Label className="eyebrow text-[9px]">Current password</Label>
              <Input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="rounded-xl"
                autoComplete="current-password"
              />
              <p className="text-[11px] text-foreground/45">Required only if you set a new password.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="eyebrow text-[9px]">
              {user.hasPassword ? "New password (optional)" : "Set a password (optional)"}
            </Label>
            <Input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="rounded-xl"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-3 pt-2">
            <p className="text-[11px] text-foreground/45">
              Changing your login email or password signs you out so you can sign in again.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-11 rounded-full px-8 eyebrow text-[10px] tracking-[0.18em] bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
              >
                {saving ? "Saving…" : "Save details"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                className="h-11 rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
