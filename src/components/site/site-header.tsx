import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/catalog";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

const ANNOUNCEMENTS = [
  "Complimentary Worldwide Shipping on Orders over $1,000",
  "Bespoke Virtual Fittings Available — Book a Consultation",
  "Handcrafted in Delhi. Delivered to London, New York, Dubai, Toronto.",
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openPanel, cartCount, wishlistCount } = useShop();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMega(null);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-[color:var(--charcoal)] text-[color:var(--ivory)]/90 h-9 overflow-hidden flex items-center justify-center px-4 sm:px-6">
        <span className="eyebrow text-[9px] sm:text-[10px] text-[color:var(--gold-soft)] transition-opacity duration-500 text-center truncate max-w-full px-2">
          {ANNOUNCEMENTS[announcementIdx]}
        </span>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "relative border-b border-foreground/5 backdrop-blur-md transition-colors",
          scrolled ? "bg-background/95 shadow-[0_1px_0_rgba(0,0,0,0.04)]" : "bg-background/88",
        )}
        onMouseLeave={() => setOpenMega(null)}
      >
        <nav className="relative max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8 h-[72px] md:h-20">
          {/* Mobile — balanced 3-column grid */}
          <div className="lg:hidden grid grid-cols-[44px_1fr_auto] items-center h-full w-full gap-2">
            <button
              className="justify-self-start min-h-11 min-w-11 flex items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <Link to="/" className="justify-self-center text-center min-w-0 max-w-full group">
              <span className="block font-serif text-[19px] sm:text-[22px] tracking-[0.06em] leading-none text-foreground group-hover:text-[color:var(--maroon)] transition-colors duration-300 truncate">
                Blessings
              </span>
              <span className="block eyebrow text-[6px] sm:text-[7px] mt-1 sm:mt-1.5 tracking-[0.28em] sm:tracking-[0.36em] text-foreground/45 group-hover:text-[color:var(--gold)] transition-colors duration-300 truncate">
                Men&apos;s Boutique — Delhi
              </span>
            </Link>

            <div className="justify-self-end flex items-center gap-0.5 shrink-0">
              <CurrencyDropdown compact />
              <button
                type="button"
                onClick={() => openPanel("cart")}
                className="relative min-h-11 min-w-11 flex items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="size-[17px]" strokeWidth={1.4} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex items-center h-full relative w-full">
          {/* Left — nav */}
          <div className="flex flex-1 items-center gap-5 lg:gap-8 min-w-0 pr-[140px]">
            <div className="flex items-center gap-7 xl:gap-8 eyebrow">
              {CATEGORIES.slice(0, 3).map((cat) => (
                <div
                  key={cat.slug}
                  className="relative py-6"
                  onMouseEnter={() => setOpenMega(cat.slug)}
                >
                  <Link
                    to="/shop/$category"
                    params={{ category: cat.slug }}
                    className="gold-underline text-[10px] tracking-[0.28em] hover:text-[color:var(--maroon)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </div>
              ))}
              <div className="relative py-6" onMouseEnter={() => setOpenMega("indo-western")}>
                <Link
                  to="/shop/$category"
                  params={{ category: "indo-western" }}
                  className="gold-underline text-[10px] tracking-[0.28em] hover:text-[color:var(--maroon)] transition-colors"
                >
                  Indo-Western
                </Link>
              </div>
            </div>
          </div>

          {/* Center — logo (true viewport center) */}
          <Link
            to="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center group z-10"
          >
            <span className="block font-serif text-[22px] md:text-[30px] tracking-[0.06em] leading-none text-foreground group-hover:text-[color:var(--maroon)] transition-colors duration-300">
              Blessings
            </span>
            <span className="block eyebrow text-[7.5px] md:text-[8.5px] mt-1.5 md:mt-2 tracking-[0.42em] text-foreground/45 group-hover:text-[color:var(--gold)] transition-colors duration-300">
              Men&apos;s Boutique — Delhi
            </span>
          </Link>

          {/* Right — nav + utilities */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-5 min-w-0 pl-[140px] text-foreground/80">
            <div className="flex items-center gap-7 xl:gap-8 eyebrow mr-1">
              <Link to="/bespoke" className="gold-underline text-[10px] tracking-[0.28em] hover:text-[color:var(--maroon)] transition-colors">
                Bespoke
              </Link>
              <Link to="/journal" className="gold-underline text-[10px] tracking-[0.28em] hover:text-[color:var(--maroon)] transition-colors">
                Journal
              </Link>
            </div>
            <span className="h-4 w-px bg-foreground/15" aria-hidden="true" />
            <CurrencyDropdown />
            <button
              type="button"
              onClick={() => openPanel("search")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
              aria-label="Search"
              title="Search (Ctrl+K)"
            >
              <Search className="size-[17px]" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => openPanel("wishlist")}
              className="inline-flex relative min-h-11 min-w-11 items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={cn("size-[17px]", wishlistCount > 0 && "fill-[color:var(--maroon)] text-[color:var(--maroon)]")} strokeWidth={1.4} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => openPanel("account")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
              aria-label="Account"
            >
              <User className="size-[17px]" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => openPanel("cart")}
              className="relative min-h-11 min-w-11 flex items-center justify-center hover:text-[color:var(--maroon)] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="size-[17px]" strokeWidth={1.4} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          </div>
        </nav>

        {/* Mega menu */}
        {openMega && (
          <MegaMenu categorySlug={openMega} onClose={() => setOpenMega(null)} />
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

function CurrencyDropdown({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, info } = useCurrency();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center min-h-11 hover:text-[color:var(--maroon)] transition-colors",
          compact ? "gap-0.5 px-1 eyebrow text-[9px] sm:text-[10px]" : "gap-1 eyebrow text-[10px]",
        )}
        aria-label="Change currency"
      >
        {compact ? (
          <>
            <span className="text-sm leading-none">{info.flag}</span>
            <ChevronDown className="size-2.5 shrink-0" strokeWidth={1.5} />
          </>
        ) : (
          <>
            <span>{info.flag}</span>
            <span>{currency}</span>
            <ChevronDown className="size-3" strokeWidth={1.5} />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-foreground/10 shadow-xl py-2 animate-reveal">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const c = CURRENCIES[code];
            return (
              <button
                key={code}
                onClick={() => {
                  setCurrency(code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-xs hover:bg-[color:var(--muted)] transition-colors text-left",
                  currency === code && "text-[color:var(--maroon)]",
                )}
              >
                <span className="text-sm">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-foreground/50 text-[10px] ml-auto">{c.symbol}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MegaMenu({ categorySlug, onClose }: { categorySlug: string; onClose: () => void }) {
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return null;
  const featureCats = CATEGORIES.filter((c) => c.slug !== categorySlug).slice(0, 2);
  return (
    <div
      className="absolute left-0 right-0 top-full bg-background border-t border-foreground/10 shadow-2xl animate-reveal"
      onMouseLeave={onClose}
    >
      <div className="max-w-[1600px] mx-auto px-8 py-14 grid grid-cols-12 gap-10">
        <div className="col-span-3">
          <p className="eyebrow text-[color:var(--gold)] mb-6">Shop by Style</p>
          <ul className="space-y-3.5 text-sm">
            {cat.subCategories.map((s) => (
              <li key={s}>
                <Link
                  to="/shop/$category"
                  params={{ category: cat.slug }}
                  className="text-foreground/70 hover:text-[color:var(--maroon)] transition-colors"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/shop/$category"
            params={{ category: cat.slug }}
            className="inline-block mt-8 eyebrow text-[10px] text-[color:var(--maroon)] border-b border-[color:var(--maroon)]/40 pb-1"
          >
            Shop all {cat.name} →
          </Link>
        </div>
        <div className="col-span-3">
          <p className="eyebrow text-[color:var(--gold)] mb-6">Curated Edits</p>
          <ul className="space-y-3.5 text-sm">
            <li><Link to="/shop/$category" params={{ category: "sherwanis" }} className="text-foreground/70 hover:text-[color:var(--maroon)]">The Groom's Edit</Link></li>
            <li><Link to="/shop/$category" params={{ category: "wedding-suits" }} className="text-foreground/70 hover:text-[color:var(--maroon)]">Reception Ready</Link></li>
            <li><Link to="/shop/$category" params={{ category: "occasion-kurtas" }} className="text-foreground/70 hover:text-[color:var(--maroon)]">Sangeet & Mehendi</Link></li>
            <li><Link to="/bespoke" className="text-foreground/70 hover:text-[color:var(--maroon)]">Made-to-Measure</Link></li>
            <li><Link to="/shop/$category" params={{ category: "accessories" }} className="text-foreground/70 hover:text-[color:var(--maroon)]">Safas & Stoles</Link></li>
          </ul>
        </div>
        {featureCats.map((f) => (
          <Link
            key={f.slug}
            to="/shop/$category"
            params={{ category: f.slug }}
            className="col-span-3 group block"
          >
            <div className="aspect-[4/5] overflow-hidden bg-[color:var(--muted)]">
              <img
                src={f.image}
                alt={f.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <p className="eyebrow text-[10px] text-[color:var(--gold)] mt-4">Featured</p>
            <h4 className="font-serif text-xl mt-1">{f.name}</h4>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const { openPanel, cartCount, wishlistCount } = useShop();

  const open = (panel: "search" | "cart" | "wishlist" | "account") => {
    onClose();
    openPanel(panel);
  };

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed inset-0 top-[calc(2.25rem+4.5rem)] z-40 bg-black/40"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="lg:hidden fixed inset-x-0 top-[calc(2.25rem+4.5rem)] bottom-[calc(62px+env(safe-area-inset-bottom))] z-50 bg-background border-t border-foreground/10 overflow-y-auto animate-reveal" data-lenis-prevent>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-2 pb-4 border-b border-foreground/10">
          <button type="button" onClick={() => open("search")} className="flex items-center justify-center gap-2 border border-foreground/15 py-3 eyebrow text-[10px]">
            <Search className="size-4" /> Search
          </button>
          <button type="button" onClick={() => open("cart")} className="flex items-center justify-center gap-2 border border-foreground/15 py-3 eyebrow text-[10px]">
            <ShoppingBag className="size-4" /> Bag ({cartCount})
          </button>
          <button type="button" onClick={() => open("wishlist")} className="flex items-center justify-center gap-2 border border-foreground/15 py-3 eyebrow text-[10px]">
            <Heart className="size-4" /> Wishlist ({wishlistCount})
          </button>
          <button type="button" onClick={() => open("account")} className="flex items-center justify-center gap-2 border border-foreground/15 py-3 eyebrow text-[10px]">
            <User className="size-4" /> Account
          </button>
          <WhatsAppLink
            message={WHATSAPP_MESSAGES.general}
            className="col-span-2 flex items-center justify-center gap-2 border border-[#25D366]/30 bg-[#25D366]/5 py-3 eyebrow text-[10px] text-[#25D366]"
          >
            WhatsApp Concierge
          </WhatsAppLink>
        </div>
        {CATEGORIES.map((cat) => (
          <details key={cat.slug} className="border-b border-foreground/10 pb-4">
            <summary className="flex justify-between items-center font-serif text-lg cursor-pointer">
              {cat.name}
              <ChevronDown className="size-4" />
            </summary>
            <ul className="mt-4 space-y-3 pl-1">
              {cat.subCategories.map((s) => (
                <li key={s}>
                  <Link
                    to="/shop/$category"
                    params={{ category: cat.slug }}
                    className="text-sm text-foreground/70"
                    onClick={onClose}
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <Link to="/bespoke" onClick={onClose} className="block font-serif text-lg">Bespoke Fitting</Link>
        <Link to="/journal" onClick={onClose} className="block font-serif text-lg">Journal</Link>
      </div>
    </div>
    </>
  );
}