import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES } from "@/lib/catalog";
import { fetchNavbarCategories, type StoreCategory } from "@/lib/catalog-api";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ANNOUNCEMENTS = [
  "Complimentary Worldwide Shipping on Orders over $1,000",
  "Bespoke Virtual Fittings Available — Book a Consultation",
  "Handcrafted in Delhi. Delivered to London, New York, Dubai, Toronto.",
];

// ── Module-level cache so navbar categories are fetched once and reused across mounts ──
let navbarCategoriesCache: StoreCategory[] | null = null;
let navbarCategoriesPromise: Promise<StoreCategory[]> | null = null;

function getNavbarCategories(): Promise<StoreCategory[]> {
  if (navbarCategoriesCache) return Promise.resolve(navbarCategoriesCache);
  if (!navbarCategoriesPromise) {
    navbarCategoriesPromise = fetchNavbarCategories().then((cats) => {
      navbarCategoriesCache = cats;
      return cats;
    });
  }
  return navbarCategoriesPromise;
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [navbarCategories, setNavbarCategories] = useState<StoreCategory[]>(
    () => navbarCategoriesCache ?? [],
  );
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [desktopMenuTop, setDesktopMenuTop] = useState(80);
  const [activeDesktopCategory, setActiveDesktopCategory] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openPanel, cartCount, wishlistCount } = useShop();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let mounted = true;
    getNavbarCategories().then((cats) => {
      if (mounted) setNavbarCategories(cats);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openAccount = () => {
    if (isAuthenticated) {
      openPanel("account");
    } else {
      navigate({ to: "/login", search: { from: pathname } });
    }
  };

  // Scroll handling for hide/show with smooth animation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 10) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 10) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const t = setInterval(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navbarCategories.length) return;

    setActiveDesktopCategory((current) => {
      if (current && navbarCategories.some((cat) => cat.slug === current)) return current;
      return navbarCategories[0]?.slug ?? null;
    });
  }, [navbarCategories]);

  useEffect(() => {
    if (!mobileOpen && !desktopOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [desktopOpen, mobileOpen]);

  useEffect(() => {
    if (!desktopOpen) return;

    const syncDesktopMenuTop = () => {
      const nextTop = headerRef.current?.getBoundingClientRect().bottom ?? 80;
      setDesktopMenuTop(Math.max(nextTop, 0));
    };

    syncDesktopMenuTop();
    window.addEventListener("resize", syncDesktopMenuTop);
    window.addEventListener("scroll", syncDesktopMenuTop, { passive: true });

    return () => {
      window.removeEventListener("resize", syncDesktopMenuTop);
      window.removeEventListener("scroll", syncDesktopMenuTop);
    };
  }, [desktopOpen, isVisible]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setDesktopOpen(false);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen && !desktopOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setDesktopOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [desktopOpen, mobileOpen]);

  return (
    <>
      {/* Announcement bar - always visible */}
      <div
        className={cn(
          "bg-[color:var(--charcoal)] text-[color:var(--ivory)]/90 h-10 overflow-hidden flex items-center justify-center px-4 sm:px-6 transition-all duration-500 w-full relative z-50",
          !isVisible && "opacity-70",
        )}
      >
        <span className="eyebrow text-[9px] sm:text-[10px] text-[color:var(--gold-soft)] transition-opacity duration-500 text-center truncate max-w-full px-2">
          {ANNOUNCEMENTS[announcementIdx]}
        </span>
      </div>

      {/* Main header with hide/show animation */}
      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 transition-all duration-500 ease-in-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div
          className="relative transition-all duration-500 w-full bg-background/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)] border-b border-foreground/5"
          style={{
            backgroundColor: "#f5f0eb",
          }}
        >
          <nav className="relative w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 h-[72px] md:h-20">
            {/* Mobile — balanced 3-column grid */}
            <div className="lg:hidden grid grid-cols-[44px_1fr_auto] items-center h-full w-full gap-2">
              <button
                className="justify-self-start min-h-11 min-w-11 flex items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              <Link to="/" className="justify-self-center text-center min-w-0 max-w-full group">
                <span className="block font-serif text-[19px] sm:text-[22px] tracking-[0.06em] leading-none transition-colors duration-300 truncate text-foreground group-hover:text-[color:var(--maroon)]">
                  Blessings
                </span>
                <span className="block eyebrow text-[6px] sm:text-[7px] mt-1 sm:mt-1.5 tracking-[0.28em] sm:tracking-[0.36em] transition-colors duration-300 truncate text-foreground/45 group-hover:text-[color:var(--gold)]">
                  Men's Boutique — Delhi
                </span>
              </Link>

              <div className="justify-self-end flex items-center gap-0.5 shrink-0">
                <CurrencyDropdown compact transparent={false} />
                <button
                  type="button"
                  onClick={() => openPanel("cart")}
                  className="relative min-h-11 min-w-11 flex items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
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

            {/* Desktop — 3-column grid so left/right stay full-width and the logo stays truly centered regardless of how much content sits on either side */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-full w-full">
              {/* Left */}
              <div className="flex items-center gap-9 min-w-0">
                <button
                  type="button"
                  onClick={() => setDesktopOpen((open) => !open)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground transition-colors hover:text-[color:var(--maroon)]"
                  aria-label={desktopOpen ? "Close menu" : "Open menu"}
                  aria-expanded={desktopOpen}
                >
                  {desktopOpen ? <X className="size-[18px]" strokeWidth={1.6} /> : <Menu className="size-[18px]" strokeWidth={1.6} />}
                </button>

                <div
                  className={cn(
                    "flex items-center gap-8 xl:gap-9 eyebrow whitespace-nowrap transition-all duration-300 ease-in-out",
                    desktopOpen
                      ? "opacity-0 -translate-x-2 pointer-events-none"
                      : "opacity-100 translate-x-0",
                  )}
                  aria-hidden={desktopOpen}
                >
                  <Link
                    to="/about"
                    className="text-[10px] tracking-[0.24em] transition-colors text-foreground hover:text-[color:var(--maroon)]"
                  >
                    About Us
                  </Link>
                  <Link
                    to="/journal"
                    className="text-[10px] tracking-[0.24em] transition-colors text-foreground hover:text-[color:var(--maroon)]"
                  >
                    Blog
                  </Link>
                  <Link
                    to="/contact"
                    className="text-[10px] tracking-[0.24em] transition-colors text-foreground hover:text-[color:var(--maroon)]"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Center — logo */}
              <Link to="/" className="text-center group z-10 justify-self-center">
                <span className="block font-serif text-[22px] md:text-[28px] tracking-[0.06em] leading-none transition-colors duration-300 whitespace-nowrap text-foreground group-hover:text-[color:var(--maroon)]">
                  Blessings
                </span>
                <span className="block eyebrow text-[7.5px] md:text-[8px] mt-1.5 md:mt-2 tracking-[0.4em] transition-colors duration-300 whitespace-nowrap text-foreground/45 group-hover:text-[color:var(--gold)]">
                  Men's Boutique — Delhi
                </span>
              </Link>

              {/* Right — nav + utilities */}
              <div className="flex items-center justify-end gap-4 md:gap-5 min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-8 xl:gap-9 eyebrow whitespace-nowrap transition-all duration-300 ease-in-out",
                    desktopOpen
                      ? "opacity-0 translate-x-2 pointer-events-none w-0 overflow-hidden"
                      : "opacity-100 translate-x-0",
                  )}
                  aria-hidden={desktopOpen}
                >
                  <Link
                    to="/bespoke"
                    className="text-[10px] tracking-[0.24em] transition-colors whitespace-nowrap text-foreground hover:text-[color:var(--maroon)]"
                  >
                    Bespoke
                  </Link>
                  <Link
                    to="/journal"
                    className="text-[10px] tracking-[0.24em] transition-colors whitespace-nowrap text-foreground hover:text-[color:var(--maroon)]"
                  >
                    Journal
                  </Link>
                </div>
                <span className="h-4 w-px bg-foreground/15" aria-hidden="true" />
                <CurrencyDropdown transparent={false} />
                <button
                  type="button"
                  onClick={() => openPanel("search")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors duration-300 hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Search"
                  title="Search (Ctrl+K)"
                >
                  <Search className="size-[17px]" strokeWidth={1.4} />
                </button>
                <button
                  type="button"
                  onClick={() => openPanel("wishlist")}
                  className="inline-flex relative min-h-11 min-w-11 items-center justify-center transition-colors duration-300 hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={cn(
                      "size-[17px] transition-colors duration-300",
                      wishlistCount > 0 && "fill-[color:var(--maroon)] text-[color:var(--maroon)]",
                    )}
                    strokeWidth={1.4}
                  />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={openAccount}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors duration-300 hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Account"
                >
                  <User className="size-[17px]" strokeWidth={1.4} />
                </button>
                <button
                  type="button"
                  onClick={() => openPanel("cart")}
                  className="relative min-h-11 min-w-11 flex items-center justify-center transition-colors duration-300 hover:text-[color:var(--maroon)] text-foreground"
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
        </div>
      </header>

      {desktopOpen && (
        <DesktopMenuPanel
          categories={navbarCategories}
          activeCategorySlug={activeDesktopCategory}
          onCategoryChange={setActiveDesktopCategory}
          onClose={() => setDesktopOpen(false)}
          onAccount={openAccount}
          topOffset={desktopMenuTop}
        />
      )}

      {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} onAccount={openAccount} />}
    </>
  );
}

function CurrencyDropdown({
  compact = false,
  transparent = false,
}: {
  compact?: boolean;
  transparent?: boolean;
}) {
  const { currency, setCurrency, info } = useCurrency();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center min-h-11 transition-colors duration-300",
          compact ? "gap-0.5 px-1 eyebrow text-[9px] sm:text-[10px]" : "gap-1 eyebrow text-[10px]",
          transparent
            ? "text-white/80 hover:text-white"
            : "text-foreground hover:text-[color:var(--maroon)]",
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

/**
 * Allure-style flyout: a quiet, borderless serif list on the left (active item
 * gets a thin underline, the rest just fade in on hover), and a softly
 * blurred, minimally-captioned image on the right. No boxes, no dividers.
 */
function DesktopMenuPanel({
  categories,
  activeCategorySlug,
  onCategoryChange,
  onClose,
  onAccount,
  topOffset,
}: {
  categories: StoreCategory[];
  activeCategorySlug: string | null;
  onCategoryChange: (slug: string) => void;
  onClose: () => void;
  onAccount: () => void;
  topOffset: number;
}) {
  const { openPanel, cartCount, wishlistCount } = useShop();
  const activeCategory =
    categories.find((category) => category.slug === activeCategorySlug) ?? categories[0] ?? null;

  return (
    <>
      <button
        type="button"
        className="hidden lg:block fixed inset-x-0 bottom-0 z-30 bg-[color:var(--charcoal)]/25 backdrop-blur-[2px]"
        style={{ top: `${topOffset}px` }}
        onClick={onClose}
        aria-label="Close desktop menu"
      />

      <div
        className="hidden lg:grid fixed inset-x-0 z-40 bg-background shadow-2xl"
        style={{ top: `${topOffset}px`, height: `calc(100vh - ${topOffset}px)` }}
      >
        <div className="grid h-full grid-cols-[minmax(360px,30rem)_minmax(0,1fr)]">
          {/* Left — quiet, borderless category list */}
          <div className="flex h-full flex-col overflow-y-auto bg-background px-12 py-10">
            <button
              type="button"
              onClick={onClose}
              className="mb-10 inline-flex w-fit items-center text-foreground transition-colors hover:text-[color:var(--maroon)]"
              aria-label="Close desktop menu"
            >
              <X className="size-5" strokeWidth={1.6} />
            </button>

            <nav className="flex flex-col gap-1">
              <Link
                to="/shop/$category"
                params={{ category: "all" }}
                onClick={onClose}
                onMouseEnter={() => onCategoryChange("all")}
                className={cn(
                  "w-fit font-serif text-4xl leading-[1.35] transition-colors",
                  activeCategory === null || activeCategorySlug === "all"
                    ? "text-foreground border-b border-foreground/70"
                    : "text-foreground/85 hover:text-[color:var(--maroon)]",
                )}
              >
                All collections
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to="/shop/$category"
                  params={{ category: category.slug }}
                  onClick={onClose}
                  onMouseEnter={() => onCategoryChange(category.slug)}
                  onFocus={() => onCategoryChange(category.slug)}
                  className={cn(
                    "flex w-fit items-center gap-2 text-left font-serif text-4xl leading-[1.35] transition-colors",
                    activeCategory?.slug === category.slug
                      ? "text-foreground border-b border-foreground/70"
                      : "text-foreground/85 hover:text-[color:var(--maroon)]",
                  )}
                >
                  <span>{category.name}</span>
                  {category.subCategories?.length ? (
                    <ChevronRight className="size-5 opacity-50" strokeWidth={1.4} />
                  ) : null}
                </Link>
              ))}

              <Link
                to="/bespoke"
                onClick={onClose}
                className="w-fit font-serif text-4xl leading-[1.35] text-foreground/85 transition-colors hover:text-[color:var(--maroon)]"
              >
                Bespoke
              </Link>
              <Link
                to="/journal"
                onClick={onClose}
                className="w-fit font-serif text-4xl leading-[1.35] text-foreground/85 transition-colors hover:text-[color:var(--maroon)]"
              >
                Journal
              </Link>
            </nav>

            {/* Utility links — plain text, no boxes */}
            <div className="mt-auto flex flex-col gap-4 pt-10 text-sm">
              <Link
                to="/orders"
                onClick={onClose}
                className="text-foreground/70 transition-colors hover:text-[color:var(--maroon)] w-fit"
              >
                Orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAccount();
                }}
                className="text-left text-foreground/70 transition-colors hover:text-[color:var(--maroon)] w-fit"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openPanel("wishlist");
                }}
                className="text-left text-foreground/70 transition-colors hover:text-[color:var(--maroon)] w-fit"
              >
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openPanel("cart");
                }}
                className="text-left text-foreground/70 transition-colors hover:text-[color:var(--maroon)] w-fit"
              >
                Bag {cartCount > 0 ? `(${cartCount})` : ""}
              </button>
            </div>
          </div>

          {/* Right — softly blurred image, minimal caption, no gradient card */}
          <div className="relative hidden h-full overflow-hidden xl:block bg-[color:var(--maroon)]">
            {activeCategory?.imageUrl ? (
              <img
                src={activeCategory.imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover scale-105 blur-sm"
              />
            ) : null}
            <div className="absolute inset-0 bg-[color:var(--charcoal)]/45" />

            <div className="relative flex h-full items-center justify-center px-12">
              <h3 className="font-serif text-7xl tracking-tight text-[color:var(--ivory)]/95 text-center">
                {activeCategory?.name ?? "Collection"}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile menu drawer — same quiet, borderless list treatment as desktop
function MobileDrawer({ onClose, onAccount }: { onClose: () => void; onAccount: () => void }) {
  const { openPanel, cartCount, wishlistCount } = useShop();

  const open = (panel: "search" | "cart" | "wishlist") => {
    onClose();
    openPanel(panel);
  };

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed inset-0 top-[7rem] z-40 bg-black/40"
        onClick={onClose}
        aria-label="Close menu"
      />

      <div
        className="lg:hidden fixed inset-x-0 top-[7rem] bottom-[calc(62px+env(safe-area-inset-bottom))] z-50 bg-background overflow-y-auto animate-reveal"
        data-lenis-prevent
      >
        <div className="p-8 space-y-8">
          <Link
            to="/shop/$category"
            params={{ category: "all" }}
            onClick={onClose}
            className="block w-fit font-serif text-3xl text-foreground hover:text-[color:var(--maroon)] transition-colors"
          >
            All collections
          </Link>

          {CATEGORIES.map((cat) => (
            <details key={cat.slug} className="group">
              <summary className="flex items-center gap-2 w-fit font-serif text-3xl cursor-pointer list-none text-foreground hover:text-[color:var(--maroon)] transition-colors">
                <span>{cat.name}</span>
                <ChevronDown className="size-4 opacity-50 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-4 space-y-3 pl-1">
                {cat.subCategories.map((s) => (
                  <li key={s}>
                    <Link
                      to="/shop/$category"
                      params={{ category: cat.slug }}
                      className="text-base text-foreground/65 hover:text-[color:var(--maroon)] transition-colors"
                      onClick={onClose}
                    >
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}

          <Link
            to="/bespoke"
            onClick={onClose}
            className="block w-fit font-serif text-3xl text-foreground hover:text-[color:var(--maroon)] transition-colors"
          >
            Bespoke Fitting
          </Link>

          <Link
            to="/journal"
            onClick={onClose}
            className="block w-fit font-serif text-3xl text-foreground hover:text-[color:var(--maroon)] transition-colors"
          >
            Journal
          </Link>

          {/* Utility links — plain text, no boxes */}
          <div className="flex flex-col gap-4 border-t border-foreground/10 pt-6 text-sm">
            <button
              type="button"
              onClick={() => open("search")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <Search className="size-4" /> Search
            </button>
            <button
              type="button"
              onClick={() => open("cart")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <ShoppingBag className="size-4" /> Bag {cartCount > 0 ? `(${cartCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => open("wishlist")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <Heart className="size-4" /> Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAccount();
              }}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <User className="size-4" /> Account
            </button>
            <WhatsAppLink
              message={WHATSAPP_MESSAGES.general}
              className="flex items-center gap-2 text-[#25D366] w-fit"
            >
              WhatsApp Concierge
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </>
  );
}