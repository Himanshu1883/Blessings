import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Calendar, Home, MessageCircle, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { WHATSAPP_MESSAGES, whatsappUrl } from "@/lib/whatsapp";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

const WHATSAPP_GREEN = "#25D366";
const NAV_BG = "#f3f3f3";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openPanel } = useShop();

  const isHome = pathname === "/";
  const isBook = pathname === "/contact" || pathname === "/bespoke";

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50" aria-label="Mobile navigation">
      <div
        className="relative border-t border-foreground/10 backdrop-blur-md"
        style={{ backgroundColor: `${NAV_BG}f2` }}
      >
        <div
          className="mx-auto grid w-full max-w-md grid-cols-5 items-stretch h-[60px] [@media(max-height:420px)]:h-12 px-1 pb-[env(safe-area-inset-bottom)]"
        >
          <NavLink to="/" active={isHome} label="Home">
            <Home className="size-[22px]" strokeWidth={1.5} />
          </NavLink>

          <NavButton label="Explore" onClick={() => openPanel("search")}>
            <Search className="size-[22px]" strokeWidth={1.5} />
          </NavButton>

          {/* Reserved center column — the WhatsApp FAB floats above this slot */}
          <div className="flex items-center justify-center" aria-hidden="true" />

          <NavLink to="/contact" active={isBook} label="Book">
            <Calendar className="size-[22px]" strokeWidth={1.5} />
          </NavLink>

          <a
            href={whatsappUrl(WHATSAPP_MESSAGES.chat)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.1em] uppercase text-foreground/45 transition-colors hover:text-foreground/70 active:scale-95 [@media(max-height:420px)]:gap-0"
          >
            <MessageCircle className="size-[22px]" strokeWidth={1.5} />
            <span className="[@media(max-height:420px)]:hidden">Chat</span>
          </a>
        </div>

        {/* Elevated WhatsApp FAB — the bar's one primary action, raised half above the bar edge */}
        <a
          href={whatsappUrl(WHATSAPP_MESSAGES.general)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="absolute left-1/2 -top-7 flex size-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: WHATSAPP_GREEN, boxShadow: `0 0 0 4px ${NAV_BG}` }}
        >
          <WhatsAppIcon className="size-6 text-white" />
        </a>
      </div>
    </nav>
  );
}

function NavLink({
  to,
  active,
  label,
  children,
}: {
  to: "/" | "/contact";
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.1em] uppercase transition-colors active:scale-95 [@media(max-height:420px)]:gap-0",
        active ? "text-foreground" : "text-foreground/45 hover:text-foreground/70",
      )}
    >
      {active && (
        <span
          className="absolute top-1 size-1.5 rounded-full"
          style={{ backgroundColor: "var(--maroon)" }}
          aria-hidden="true"
        />
      )}
      {children}
      <span className="[@media(max-height:420px)]:hidden">{label}</span>
    </Link>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.1em] uppercase text-foreground/45 transition-colors hover:text-foreground/70 active:scale-95 [@media(max-height:420px)]:gap-0"
    >
      {children}
      <span className="[@media(max-height:420px)]:hidden">{label}</span>
    </button>
  );
}