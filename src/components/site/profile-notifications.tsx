import { ArrowRight, Bell } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { forwardRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAccountNotifications, useMarkNotificationsRead } from "@/lib/api-hooks";
import { cn } from "@/lib/utils";

export const profileActionClass =
  "relative flex min-h-[148px] w-full flex-col rounded-2xl bg-white p-5 text-left shadow-[0_10px_32px_rgba(40,16,10,0.06)] transition-shadow hover:shadow-[0_14px_40px_rgba(40,16,10,0.1)]";

export function ActionCardVisual({
  icon,
  kicker,
  title,
  badge,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  badge?: boolean;
}) {
  return (
    <>
      <span className="text-[color:var(--gold)]">{icon}</span>
      {badge ? <span className="absolute top-5 right-5 size-2 rounded-full bg-[color:var(--maroon)]" /> : null}
      <p className="eyebrow mt-4 text-[9px] tracking-[0.24em] text-[color:var(--gold)]">{kicker}</p>
      <p className="mt-auto flex items-center gap-1.5 pt-3 text-[15px] font-medium text-[color:var(--charcoal)]">
        {title}
        <ArrowRight className="size-3.5 text-[color:var(--gold)]" strokeWidth={1.75} />
      </p>
    </>
  );
}

export const ProfileActionCard = forwardRef<
  HTMLButtonElement,
  {
    icon: ReactNode;
    kicker: string;
    title: string;
    badge?: boolean;
    onClick?: () => void;
  }
>(function ProfileActionCard({ icon, kicker, title, badge, onClick }, ref) {
  return (
    <button type="button" ref={ref} onClick={onClick} className={profileActionClass}>
      <ActionCardVisual icon={icon} kicker={kicker} title={title} badge={badge} />
    </button>
  );
});

export function ProfileActionLink({
  to,
  params,
  icon,
  kicker,
  title,
}: {
  to: "/shop/$category" | "/bespoke";
  params?: { category: string };
  icon: ReactNode;
  kicker: string;
  title: string;
}) {
  if (to === "/shop/$category") {
    return (
      <Link to="/shop/$category" params={params ?? { category: "all" }} className={profileActionClass}>
        <ActionCardVisual icon={icon} kicker={kicker} title={title} />
      </Link>
    );
  }
  return (
    <Link to="/bespoke" className={profileActionClass}>
      <ActionCardVisual icon={icon} kicker={kicker} title={title} />
    </Link>
  );
}

export function ProfileNotifications() {
  const navigate = useNavigate();
  const { data: notices = [] } = useAccountNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notices.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ProfileActionCard
          icon={<Bell className="size-5" strokeWidth={1.5} />}
          kicker="Notifications"
          title={unread > 0 ? `${unread} new` : "All caught up"}
          badge={unread > 0}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
          <p className="profile-display text-xl italic">Updates</p>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => markRead.mutate()}
              disabled={markRead.isPending}
            >
              Mark all as read
            </Button>
          ) : null}
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {notices.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-foreground/50">No updates yet.</li>
          ) : (
            notices.map((n) => (
              <li key={n.id} className="border-b border-foreground/8 last:border-0">
                <button
                  type="button"
                  className={cn("w-full px-4 py-3 text-left", !n.read && "bg-[color:var(--ivory)]")}
                  onClick={() => {
                    setOpen(false);
                    if (n.orderId) {
                      navigate({ to: "/profile", hash: `order-${n.orderId}` });
                    }
                  }}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-1 text-xs text-foreground/55">{n.message}</p>
                  <p className="mt-1 text-[10px] text-foreground/35">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
