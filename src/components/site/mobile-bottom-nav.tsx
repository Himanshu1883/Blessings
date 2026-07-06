import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Calendar, Home, MessageCircle, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { WHATSAPP_MESSAGES, whatsappUrl } from "@/lib/whatsapp";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

const WHATSAPP_GREEN = "#25D366";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openPanel } = useShop();

  const isHome = pathname === "/";
  const isBook = pathname === "/contact" || pathname === "/bespoke";

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-foreground/10 bg-[#f3f3f3]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 h-[62px]">
        <NavLink to="/" active={isHome} label="Home">
          <Home className="size-[22px]" strokeWidth={1.5} />
        </NavLink>

        <NavButton label="Explore" onClick={() => openPanel("search")}>
          <Search className="size-[22px]" strokeWidth={1.5} />
        </NavButton>

        <a
          href={whatsappUrl(WHATSAPP_MESSAGES.general)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors"
          style={{ color: WHATSAPP_GREEN }}
        >
          <WhatsAppIcon className="size-[22px]" />
          <span>WhatsApp</span>
        </a>

        <NavLink to="/contact" active={isBook} label="Book">
          <Calendar className="size-[22px]" strokeWidth={1.5} />
        </NavLink>

        <a
          href={whatsappUrl(WHATSAPP_MESSAGES.chat)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase text-foreground/45 hover:text-foreground/70 transition-colors"
        >
          <MessageCircle className="size-[22px]" strokeWidth={1.5} />
          <span>Chat</span>
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
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors",
        active ? "text-foreground" : "text-foreground/45 hover:text-foreground/70",
      )}
    >
      {active && (
        <span className="absolute top-1.5 size-1.5 rounded-full bg-[#3b82f6]" aria-hidden="true" />
      )}
      {children}
      <span>{label}</span>
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.12em] uppercase text-foreground/45 hover:text-foreground/70 transition-colors"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
