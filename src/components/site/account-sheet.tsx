import { Link } from "@tanstack/react-router";
import { LogOut, Package, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-context";

export function AccountSheet() {
  const { panel, closePanel, cartCount, wishlistCount } = useShop();
  const { user, isAuthenticated, login, register, logout, googleLoginUrl } = useAuth();
  const open = panel === "account";

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginId.trim(), loginPassword);
      toast.success("Welcome back.");
      setLoginId("");
      setLoginPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      toast.error("Email or phone is required.");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: signupPassword,
      });
      toast.success(`Welcome, ${name.trim().split(" ")[0]}.`);
      setName("");
      setEmail("");
      setPhone("");
      setSignupPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out.");
    closePanel();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closePanel()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" data-lenis-prevent>
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl italic">My Account</SheetTitle>
          <SheetDescription className="eyebrow text-[10px]">
            {isAuthenticated ? "Your Blessings profile" : "Sign in for a personalised experience"}
          </SheetDescription>
        </SheetHeader>

        {isAuthenticated && user ? (
          <div className="mt-8 flex flex-1 flex-col">
            <div className="flex items-center gap-4 border border-foreground/10 p-5">
              <div className="size-12 rounded-full bg-[color:var(--muted)] flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-5 text-foreground/50" />
                )}
              </div>
              <div>
                <p className="font-serif text-lg">{user.name}</p>
                <p className="text-xs text-foreground/50">{user.email ?? user.phone}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="border border-foreground/10 p-4 text-center">
                <p className="font-serif text-2xl tabular-nums">{cartCount}</p>
                <p className="eyebrow text-[9px] mt-1">In bag</p>
              </div>
              <div className="border border-foreground/10 p-4 text-center">
                <p className="font-serif text-2xl tabular-nums">{wishlistCount}</p>
                <p className="eyebrow text-[9px] mt-1">Saved</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <Link
                to="/orders"
                onClick={closePanel}
                className="flex items-center gap-3 border border-foreground/10 px-4 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
              >
                <Package className="size-4" />
                Order history
              </Link>
              <Link
                to="/contact"
                onClick={closePanel}
                className="flex items-center gap-3 border border-foreground/10 px-4 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
              >
                Concierge
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={closePanel}
                  className="flex items-center gap-3 border border-foreground/10 px-4 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
                >
                  Admin dashboard
                </Link>
              )}
            </div>

            <Button
              variant="outline"
              className="mt-auto rounded-none eyebrow text-[10px] tracking-[0.2em]"
              onClick={handleLogout}
            >
              <LogOut className="size-3.5 mr-2" />
              Sign out
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="login" className="mt-6 flex flex-1 flex-col">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="login" className="rounded-none eyebrow text-[10px]">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none eyebrow text-[10px]">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="flex-1">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-id" className="eyebrow text-[10px]">
                    Email or phone
                  </Label>
                  <Input
                    id="login-id"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="eyebrow text-[10px]">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="rounded-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.2em] h-11"
                >
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="flex-1">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="eyebrow text-[10px]">
                    Full name
                  </Label>
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="eyebrow text-[10px]">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="eyebrow text-[10px]">
                    Phone
                  </Label>
                  <Input
                    id="signup-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="eyebrow text-[10px]">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={8}
                    className="rounded-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.2em] h-11"
                >
                  Create account
                </Button>
              </form>
            </TabsContent>

            <div className="mt-6 pt-4 border-t border-foreground/10">
              <a
                href={googleLoginUrl}
                className="flex w-full items-center justify-center gap-2 border border-foreground/20 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
              >
                Continue with Google
              </a>
            </div>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
