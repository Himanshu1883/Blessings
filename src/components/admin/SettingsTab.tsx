import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Headset,
  Instagram,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminErrorState, AdminSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  formatStoreAddress,
  instagramUrlFromHandle,
  whatsappUrlFor,
  type StoreSettings,
} from "@/lib/store-settings";
import { cn } from "@/lib/utils";

type SectionId = "store" | "contact" | "whatsapp" | "shipping" | "operations" | "account";

const SECTIONS: Array<{ id: SectionId; label: string; hint: string; icon: typeof Building2 }> = [
  { id: "store", label: "Store", hint: "Name and brand", icon: Building2 },
  { id: "contact", label: "Contact", hint: "Email, phone, atelier", icon: Headset },
  { id: "whatsapp", label: "WhatsApp & Instagram", hint: "Customer chat & social", icon: Instagram },
  { id: "shipping", label: "Shipping", hint: "Fee and copy", icon: Truck },
  { id: "operations", label: "Operations", hint: "Returns and policies", icon: RotateCcw },
  { id: "account", label: "Admin account", hint: "Your sign-in", icon: UserRound },
];

function copyText(value: string, label: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Could not copy"),
  );
}

export function SettingsTab() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<SectionId>("store");
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<StoreSettings>("/api/admin/settings");
      setForm(data);
      setSaved(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const dirty = useMemo(() => {
    if (!form || !saved) return false;
    return JSON.stringify(form) !== JSON.stringify(saved);
  }, [form, saved]);

  const patch = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const savedSettings = await api.patch<StoreSettings>("/api/admin/settings", {
        ...form,
        shippingFee: Number(form.shippingFee) || 0,
      });
      setForm(savedSettings);
      setSaved(savedSettings);
      await queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Store settings saved. The site will use these now.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminSkeleton />;
  if (error || !form) return <AdminErrorState message={error ?? "Settings unavailable"} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Live store details used on contact, checkout, WhatsApp, invoices, and SEO. Changes apply to the storefront immediately."
        actions={
          <>
            <a href="/" target="_blank" rel="noreferrer">
              <Button variant="outline" className="h-10 gap-1.5 rounded-lg border-foreground/15 bg-white">
                <ExternalLink className="size-3.5" />
                View storefront
              </Button>
            </a>
            <Button
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="h-10 rounded-lg bg-[color:var(--charcoal)] text-white hover:bg-[color:var(--maroon)]"
            >
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex min-w-[10.5rem] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors lg:min-w-0",
                  on
                    ? "border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 text-[color:var(--charcoal)]"
                    : "border-foreground/8 bg-white text-foreground/70 hover:border-foreground/20",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block truncate text-[11px] text-foreground/45">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-6">
          {active === "store" && <StoreSection form={form} patch={patch} />}
          {active === "contact" && <ContactSection form={form} patch={patch} />}
          {active === "whatsapp" && <SocialSection form={form} patch={patch} />}
          {active === "shipping" && <ShippingSection form={form} patch={patch} />}
          {active === "operations" && <OperationsSection form={form} patch={patch} />}
          {active === "account" && <AccountSection />}
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-foreground/45">{hint}</p> : null}
    </div>
  );
}

function StoreSection({
  form,
  patch,
}: {
  form: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  return (
    <AdminCard>
      <h3 className="font-serif italic text-xl mb-1">Store identity</h3>
      <p className="text-sm text-foreground/50 mb-6">Shown in invoices, SEO, and the public site.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="settings-store-name" label="Store name">
          <Input
            id="settings-store-name"
            value={form.storeName}
            onChange={(e) => patch("storeName", e.target.value)}
          />
        </Field>
        <Field id="settings-brand-name" label="Short brand name">
          <Input
            id="settings-brand-name"
            value={form.brandName}
            onChange={(e) => patch("brandName", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="settings-tagline" label="Tagline">
            <Input
              id="settings-tagline"
              value={form.tagline}
              onChange={(e) => patch("tagline", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </AdminCard>
  );
}

function ContactSection({
  form,
  patch,
}: {
  form: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  return (
    <AdminCard>
      <h3 className="font-serif italic text-xl mb-1">Contact & atelier</h3>
      <p className="text-sm text-foreground/50 mb-6">Used on the contact page, checkout help, and customer emails.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="settings-email" label="Store email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
            <Input
              id="settings-email"
              type="email"
              className="pl-9"
              value={form.email}
              onChange={(e) => patch("email", e.target.value)}
            />
          </div>
        </Field>
        <Field id="settings-hours" label="Opening hours">
          <Input
            id="settings-hours"
            value={form.hours}
            onChange={(e) => patch("hours", e.target.value)}
          />
        </Field>
        <Field id="settings-landline" label="Landline (digits)" hint="Used for click-to-call.">
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
            <Input
              id="settings-landline"
              className="pl-9"
              value={form.landline}
              onChange={(e) => patch("landline", e.target.value)}
            />
          </div>
        </Field>
        <Field id="settings-landline-display" label="Landline display">
          <Input
            id="settings-landline-display"
            value={form.landlineDisplay}
            onChange={(e) => patch("landlineDisplay", e.target.value)}
            placeholder="Auto-formatted if left empty on save"
          />
        </Field>
        <Field id="settings-address-1" label="Address line 1">
          <Input
            id="settings-address-1"
            value={form.addressLine1}
            onChange={(e) => patch("addressLine1", e.target.value)}
          />
        </Field>
        <Field id="settings-address-2" label="Address line 2">
          <Input
            id="settings-address-2"
            value={form.addressLine2}
            onChange={(e) => patch("addressLine2", e.target.value)}
          />
        </Field>
        <Field id="settings-city" label="City">
          <Input id="settings-city" value={form.city} onChange={(e) => patch("city", e.target.value)} />
        </Field>
        <Field id="settings-state" label="State">
          <Input id="settings-state" value={form.state} onChange={(e) => patch("state", e.target.value)} />
        </Field>
        <Field id="settings-pincode" label="PIN code">
          <Input
            id="settings-pincode"
            value={form.pincode}
            onChange={(e) => patch("pincode", e.target.value)}
          />
        </Field>
        <Field id="settings-country" label="Country">
          <Input
            id="settings-country"
            value={form.country}
            onChange={(e) => patch("country", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-6 rounded-xl border border-foreground/8 bg-[color:var(--ivory)] p-4 text-sm">
        <p className="eyebrow text-[9px] text-foreground/45 mb-2 flex items-center gap-1.5">
          <MapPin className="size-3.5" /> Preview
        </p>
        <p className="whitespace-pre-line text-foreground/70">{formatStoreAddress(form) || "Add an atelier address"}</p>
        <p className="mt-2 text-foreground/60">{form.hours}</p>
      </div>
    </AdminCard>
  );
}

function SocialSection({
  form,
  patch,
}: {
  form: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  const wa = whatsappUrlFor(form.whatsappNumber, "Hi Blessings, I'd love to know more about your collections.");
  const ig = instagramUrlFromHandle(form.instagramHandle);

  return (
    <AdminCard>
      <h3 className="font-serif italic text-xl mb-1">WhatsApp & Instagram</h3>
      <p className="text-sm text-foreground/50 mb-6">
        Floating chat, header, footer, and contact form all use these values.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="settings-wa-number"
          label="WhatsApp number"
          hint="Include country code. 10-digit Indian numbers get +91 automatically."
        >
          <Input
            id="settings-wa-number"
            value={form.whatsappNumber}
            onChange={(e) => patch("whatsappNumber", e.target.value)}
            placeholder="918860306034"
          />
        </Field>
        <Field id="settings-wa-display" label="WhatsApp display">
          <Input
            id="settings-wa-display"
            value={form.whatsappDisplay}
            onChange={(e) => patch("whatsappDisplay", e.target.value)}
            placeholder="+91 88603 06034"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="settings-ig" label="Instagram handle" hint="Without @">
            <Input
              id="settings-ig"
              value={form.instagramHandle}
              onChange={(e) => patch("instagramHandle", e.target.value)}
            />
          </Field>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PreviewLink href={wa} label="Open WhatsApp preview" onCopy={() => copyText(wa, "WhatsApp link")} />
        <PreviewLink href={ig} label="Open Instagram" onCopy={() => copyText(ig, "Instagram link")} />
      </div>
    </AdminCard>
  );
}

function PreviewLink({ href, label, onCopy }: { href: string; label: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-foreground/8 px-3 py-2.5">
      <a href={href} target="_blank" rel="noreferrer" className="text-sm hover:text-[color:var(--maroon)] truncate">
        {label}
      </a>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onCopy} aria-label="Copy link">
          <Copy className="size-3.5" />
        </Button>
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center">
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function ShippingSection({
  form,
  patch,
}: {
  form: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  return (
    <AdminCard>
      <h3 className="font-serif italic text-xl mb-1">Shipping</h3>
      <p className="text-sm text-foreground/50 mb-6">
        Checkout and new orders use this fee in INR. Set 0 for complimentary shipping.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="settings-shipping-fee" label="Shipping fee (INR)">
          <Input
            id="settings-shipping-fee"
            type="number"
            min={0}
            step={1}
            value={form.shippingFee}
            onChange={(e) => patch("shippingFee", Number(e.target.value) || 0)}
          />
        </Field>
        <div className="flex items-end">
          <p className="rounded-xl border border-foreground/8 bg-[color:var(--ivory)] px-4 py-2.5 text-sm text-foreground/65">
            Checkout shows: {form.shippingFee > 0 ? `₹${form.shippingFee.toLocaleString("en-IN")}` : "Free"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <Field id="settings-shipping-note" label="Shipping note" hint="Shown on the contact shipping section.">
            <Textarea
              id="settings-shipping-note"
              rows={3}
              value={form.shippingNote}
              onChange={(e) => patch("shippingNote", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </AdminCard>
  );
}

function OperationsSection({
  form,
  patch,
}: {
  form: StoreSettings;
  patch: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
}) {
  return (
    <AdminCard>
      <h3 className="font-serif italic text-xl mb-1">Operations</h3>
      <p className="text-sm text-foreground/50 mb-6">Feature flags for the live store. APIs stay in place when hidden.</p>
      <div className="flex items-start justify-between gap-4 rounded-xl border border-foreground/8 p-4">
        <div>
          <p className="font-medium">Customer returns</p>
          <p className="mt-1 text-sm text-foreground/50">
            Shows the Returns tab in admin and return actions on orders. Turn off while you handle returns privately.
          </p>
        </div>
        <Switch
          checked={form.returnsEnabled}
          onCheckedChange={(checked) => patch("returnsEnabled", checked)}
          aria-label="Enable customer returns"
        />
      </div>
    </AdminCard>
  );
}

function AccountSection() {
  const { user, refreshUser, updateAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.name, user?.email, user?.phone]);

  if (!user) {
    return (
      <AdminCard>
        <p className="text-sm text-muted-foreground">Loading account…</p>
      </AdminCard>
    );
  }

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateAccount({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      if (result.requiresRelogin) {
        toast.success("Profile updated. Please sign in again.");
        return;
      }
      await refreshUser();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (user.hasPassword && !currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await updateAccount({
        currentPassword: user.hasPassword ? currentPassword : undefined,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard>
        <h3 className="font-serif italic text-xl mb-1">Your admin profile</h3>
        <p className="text-sm text-foreground/50 mb-6">This is the account you use to sign in to this panel.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="admin-name" label="Display name">
            <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="admin-email" label="Email">
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="admin-phone" label="Phone">
            <Input id="admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-foreground/8 px-4 py-2.5 text-sm">
              <p className="eyebrow text-[9px] text-foreground/45 mb-1">Sign-in</p>
              <p className="flex items-center gap-2">
                {user.hasGoogle ? <Check className="size-3.5 text-emerald-700" /> : null}
                {user.hasGoogle ? "Google connected" : "Password account"}
                {user.hasPassword ? " · password enabled" : ""}
              </p>
            </div>
          </div>
        </div>
        <Button className="mt-5" onClick={() => void saveProfile()} disabled={savingProfile}>
          {savingProfile && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save profile
        </Button>
      </AdminCard>

      <AdminCard>
        <h3 className="font-serif italic text-xl mb-1">{user.hasPassword ? "Change password" : "Set a password"}</h3>
        <p className="text-sm text-foreground/50 mb-6">
          {user.hasPassword
            ? "Use this to rotate your admin password."
            : "This Google account can also get a password for email sign-in."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {user.hasPassword ? (
            <Field id="admin-current-pw" label="Current password">
              <Input
                id="admin-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          ) : null}
          <Field id="admin-new-pw" label="New password">
            <div className="relative">
              <Input
                id="admin-new-pw"
                type={showPassword ? "text" : "password"}
                className="pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-foreground/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field id="admin-confirm-pw" label="Confirm new password">
            <Input
              id="admin-confirm-pw"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <Button className="mt-5" onClick={() => void savePassword()} disabled={savingPassword}>
          {savingPassword && <Loader2 className="size-4 mr-2 animate-spin" />}
          {user.hasPassword ? "Update password" : "Set password"}
          <Lock className="size-3.5 ml-2" />
        </Button>
      </AdminCard>
    </div>
  );
}
