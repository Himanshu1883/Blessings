import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/catalog";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
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
      <div className="bg-[color:var(--charcoal)] text-[color:var(--ivory)]/90 h-9 overflow-hidden flex items-center justify-center px-6">
        <span className="eyebrow text-[10px] text-[color:var(--gold-soft)] transition-opacity duration-500">
          {ANNOUNCEMENTS[announcementIdx]}
        </span>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "border-b border-foreground/5 backdrop-blur-md transition-colors",
          scrolled ? "bg-background/95" : "bg-background/85",
        )}
        onMouseLeave={() => setOpenMega(null)}
      >
        <nav className="max-w-[1600px] mx-auto px-4 md:px-8 h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: nav or mobile trigger */}
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="hidden lg:flex items-center gap-8 eyebrow">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <div
                  key={cat.slug}
                  className="relative py-6"
                  onMouseEnter={() => setOpenMega(cat.slug)}
                >
                  <Link
                    to="/shop/$category"
                    params={{ category: cat.slug }}
                    className="gold-underline text-[10.5px] hover:text-[color:var(--maroon)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </div>
              ))}
              <Link to="/bespoke" className="gold-underline text-[10.5px]">
                Bespoke
              </Link>
              <Link to="/journal" className="gold-underline text-[10.5px]">
                Journal
              </Link>
            </div>
          </div>

          {/* Center: logo */}
          <Link to="/" className="text-center block">
            <h1 className="font-serif text-2xl md:text-[28px] font-medium tracking-tight leading-none">
              Blessings
            </h1>
            <p className="eyebrow text-[8px] mt-1 text-foreground/60">Men's Boutique — Delhi</p>
          </Link>

          {/* Right: utilities */}
          <div className="flex items-center justify-end gap-3 md:gap-5 text-foreground/80">
            <CurrencyDropdown />
            <button className="hidden sm:inline-flex p-1.5 hover:text-[color:var(--maroon)]" aria-label="Search">
              <Search className="size-[18px]" strokeWidth={1.4} />
            </button>
            <button className="hidden sm:inline-flex p-1.5 hover:text-[color:var(--maroon)]" aria-label="Wishlist">
              <Heart className="size-[18px]" strokeWidth={1.4} />
            </button>
            <button className="hidden sm:inline-flex p-1.5 hover:text-[color:var(--maroon)]" aria-label="Account">
              <User className="size-[18px]" strokeWidth={1.4} />
            </button>
            <button className="relative p-1.5 hover:text-[color:var(--maroon)]" aria-label="Cart">
              <ShoppingBag className="size-[18px]" strokeWidth={1.4} />
              <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                0
              </span>
            </button>
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

function CurrencyDropdown() {
  const { currency, setCurrency, info } = useCurrency();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1 eyebrow text-[10px] hover:text-[color:var(--maroon)]"
      >
        <span>{info.flag}</span>
        <span>{currency}</span>
        <ChevronDown className="size-3" strokeWidth={1.5} />
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
  return (
    <div className="lg:hidden fixed inset-0 top-[calc(2.25rem+5rem)] bg-background border-t border-foreground/10 overflow-y-auto animate-reveal">
      <div className="p-6 space-y-6">
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
  );
}