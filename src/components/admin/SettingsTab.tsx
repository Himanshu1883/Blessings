import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isGoogleAccount(user: { avatarUrl: string | null; email: string | null }): boolean {
  if (user.avatarUrl?.includes("googleusercontent.com")) return true;
  return false;
}

export function SettingsTab() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const googleLogin = user ? isGoogleAccount(user) : false;

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch("/api/auth/profile", { name: name.trim() });
      await refreshUser();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Fill in both password fields");
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/api/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <AdminCard>
        <p className="text-sm text-muted-foreground">Loading account…</p>
      </AdminCard>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Manage your admin account and sign-in preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <h3 className="font-serif italic text-lg mb-4">Profile</h3>
          <div className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email ?? "—"} disabled />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save profile
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="font-serif italic text-lg mb-4">Sign-in method</h3>
          <div className="space-y-3">
            <div
              className={`rounded-lg border px-4 py-3 ${
                googleLogin ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <p className="eyebrow text-[10px] text-muted-foreground mb-1">Google</p>
              <p className="text-sm">
                {googleLogin ? "Connected via Google Sign-In" : "Not connected"}
              </p>
            </div>
            <div
              className={`rounded-lg border px-4 py-3 ${
                !googleLogin ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <p className="eyebrow text-[10px] text-muted-foreground mb-1">Email & password</p>
              <p className="text-sm">
                {googleLogin
                  ? "Password sign-in not available for Google accounts"
                  : "Email and password sign-in active"}
              </p>
            </div>
          </div>
        </AdminCard>

        {!googleLogin && (
          <AdminCard className="lg:col-span-2">
            <h3 className="font-serif italic text-lg mb-4">Change password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-1.5">
                <Label htmlFor="settings-current-pw">Current password</Label>
                <Input
                  id="settings-current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-new-pw">New password</Label>
                <Input
                  id="settings-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button className="mt-4" onClick={savePassword} disabled={savingPassword}>
              {savingPassword && <Loader2 className="size-4 mr-2 animate-spin" />}
              Update password
            </Button>
          </AdminCard>
        )}
      </div>
    </div>
  );
}
