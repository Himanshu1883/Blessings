import { Link } from "@tanstack/react-router";
import { LogOut, Package, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/lib/shop-store";

export function AccountSheet() {
  const { panel, closePanel, account, signIn, signOut, cartCount, wishlistCount } = useShop();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const open = panel === "account";

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    signIn({ name: name.trim(), email: email.trim() });
    toast.success(`Welcome back, ${name.trim().split(" ")[0]}.`);
    setName("");
    setEmail("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closePanel()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" data-lenis-prevent>
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl italic">My Account</SheetTitle>
          <SheetDescription className="eyebrow text-[10px]">
            {account ? "Your Blessings profile" : "Sign in for a personalised experience"}
          </SheetDescription>
        </SheetHeader>

        {account ? (
          <div className="mt-8 flex flex-1 flex-col">
            <div className="flex items-center gap-4 border border-foreground/10 p-5">
              <div className="size-12 rounded-full bg-[color:var(--muted)] flex items-center justify-center">
                <User className="size-5 text-foreground/50" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-lg truncate">{account.name}</p>
                <p className="text-sm text-foreground/60 truncate">{account.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="border border-foreground/10 p-4 text-center">
                <p className="font-serif text-2xl">{cartCount}</p>
                <p className="eyebrow text-[9px] mt-1 text-foreground/50">In bag</p>
              </div>
              <div className="border border-foreground/10 p-4 text-center">
                <p className="font-serif text-2xl">{wishlistCount}</p>
                <p className="eyebrow text-[9px] mt-1 text-foreground/50">Wishlist</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start rounded-none h-11 gap-3">
                <Link to="/contact" onClick={closePanel}>
                  <Package className="size-4" />
                  Book a consultation
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-none h-11 gap-3">
                <Link to="/bespoke" onClick={closePanel}>
                  Bespoke process
                </Link>
              </Button>
            </div>

            <Button
              variant="ghost"
              className="mt-auto rounded-none eyebrow text-[10px] tracking-[0.2em] text-foreground/60 hover:text-[color:var(--maroon)] gap-2"
              onClick={() => {
                signOut();
                toast.success("Signed out successfully.");
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="mt-8 flex flex-1 flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="account-name" className="eyebrow text-[10px]">Full name</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Arjun Sharma"
                className="rounded-none border-foreground/15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-email" className="eyebrow text-[10px]">Email</Label>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-none border-foreground/15"
              />
            </div>
            <Button
              type="submit"
              className="mt-2 rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.2em] h-11"
            >
              Sign in
            </Button>
            <p className="text-xs text-foreground/50 leading-relaxed">
              By signing in you agree to receive order updates and exclusive invitations from Blessings Men&apos;s Boutique.
            </p>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
