import { Link } from "@tanstack/react-router";
import { LogOutIcon, PackageIcon, UserIcon } from "@/components/icons/site-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const { user, isAuthenticated, logout } = useAuth();
  const open = panel === "account" && isAuthenticated;

  const handleClose = () => closePanel();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out.");
    handleClose();
  };

  if (!isAuthenticated || !user) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" data-lenis-prevent>
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl italic">My Account</SheetTitle>
          <SheetDescription className="eyebrow text-[10px]">
            Your Blessings profile
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex flex-1 flex-col">
          <div className="flex items-center gap-4 border border-foreground/10 p-5">
            <div className="size-12 rounded-full bg-[color:var(--muted)] flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserIcon className="size-5 text-foreground/50" />
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
              onClick={handleClose}
              className="flex items-center gap-3 border border-foreground/10 px-4 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
            >
              <PackageIcon className="size-4" />
              Order history
            </Link>
            <Link
              to="/contact"
              onClick={handleClose}
              className="flex items-center gap-3 border border-foreground/10 px-4 py-3 text-sm hover:bg-[color:var(--muted)]/40 transition-colors"
            >
              Concierge
            </Link>
            {user.role === "admin" && (
              <Link
                to="/admin/$tab"
                params={{ tab: "dashboard" }}
                onClick={handleClose}
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
            <LogOutIcon className="size-3.5 mr-2" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
