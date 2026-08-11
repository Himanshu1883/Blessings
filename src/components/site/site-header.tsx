import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { useAuth } from "@/lib/auth-context";
import { fetchNavbarCategories, type StoreCategory } from "@/lib/catalog-api";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon, BagIcon } from "@/components/icons/site-icons";
import { useEffect, useMemo, useRef, useState } from "react";

const ALL_COLLECTIONS: StoreCategory = {
  slug: "all",
  name: "All Collections",
  tagline: "The complete Blessings collection — every silhouette, every fabric, every occasion.",
  imageUrl: "/banners/banner-1.jpeg",
  subCategories: [],
};

const ANNOUNCEMENTS = [
  "Complimentary Worldwide Shipping on Orders over $1,000",
  "Bespoke Virtual Fittings Available — Book a Consultation",
  "Handcrafted in Delhi. Delivered to London, New York, Dubai, Toronto.",
];

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
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [navbarCategories, setNavbarCategories] = useState<StoreCategory[]>(
    () => navbarCategoriesCache ?? [],
  );
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("");
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const collectionsCloseTimer = useRef<number | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openPanel, cartCount, wishlistCount } = useShop();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let mounted = true;
    getNavbarCategories().then((cats) => {
      if (mounted) {
        setNavbarCategories(cats);
        setActiveCategorySlug((current) => current || cats[0]?.slug || "all");
      }
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
    setCollectionsOpen(false);
  }, [pathname]);

  const openCollectionsMenu = () => {
    if (collectionsCloseTimer.current) {
      window.clearTimeout(collectionsCloseTimer.current);
      collectionsCloseTimer.current = null;
    }
    setCollectionsOpen(true);
    setActiveCategorySlug((current) => current || navbarCategories[0]?.slug || "all");
  };

  const scheduleCloseCollectionsMenu = () => {
    if (collectionsCloseTimer.current) window.clearTimeout(collectionsCloseTimer.current);
    collectionsCloseTimer.current = window.setTimeout(() => {
      setCollectionsOpen(false);
      collectionsCloseTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (collectionsCloseTimer.current) window.clearTimeout(collectionsCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <>
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

      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 transition-all duration-500 ease-in-out",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div
          className="relative w-full bg-background/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)] border-b border-foreground/5"
          style={{ backgroundColor: "#f5f0eb" }}
          onMouseLeave={scheduleCloseCollectionsMenu}
        >
          <nav className="relative w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 h-[72px] md:h-20">
            {/* Mobile */}
            <div className="lg:hidden grid grid-cols-[44px_1fr_auto] items-center h-full w-full gap-2">
              <button
                className="justify-self-start min-h-11 min-w-11 flex items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menu"
              >
                {mobileOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
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
                <CurrencyDropdown compact />
                <button
                  type="button"
                  onClick={() => openPanel("cart")}
                  className="relative min-h-11 min-w-11 flex items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Cart"
                >
                  <BagIcon className="size-[17px]" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-full w-full">
              <div className="flex items-center gap-8 xl:gap-9 min-w-0 eyebrow whitespace-nowrap">
                <div className="relative py-1" onMouseEnter={openCollectionsMenu}>
                  <Link
                    to="/shop/$category"
                    params={{ category: "all" }}
                    onClick={() => setCollectionsOpen(false)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] tracking-[0.24em] transition-colors",
                      collectionsOpen || pathname.startsWith("/shop/")
                        ? "text-[color:var(--maroon)]"
                        : "text-foreground hover:text-[color:var(--maroon)]",
                    )}
                  >
                    All Collections
                    <ChevronDownIcon
                      className={cn("size-3 transition-transform duration-200", collectionsOpen && "rotate-180")}
                    />
                  </Link>
                </div>
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

              <Link to="/" className="text-center group z-10 justify-self-center">
                <span className="block font-serif text-[22px] md:text-[28px] tracking-[0.06em] leading-none transition-colors duration-300 whitespace-nowrap text-foreground group-hover:text-[color:var(--maroon)]">
                  Blessings
                </span>
                <span className="block eyebrow text-[7.5px] md:text-[8px] mt-1.5 md:mt-2 tracking-[0.4em] transition-colors duration-300 whitespace-nowrap text-foreground/45 group-hover:text-[color:var(--gold)]">
                  Men's Boutique — Delhi
                </span>
              </Link>

              <div className="flex items-center justify-end gap-4 md:gap-5 min-w-0">
                <div className="flex items-center gap-8 xl:gap-9 eyebrow whitespace-nowrap">
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
                <CurrencyDropdown />
                <button
                  type="button"
                  onClick={() => openPanel("search")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Search"
                  title="Search (Ctrl+K)"
                >
                  <SearchIcon className="size-[17px]" />
                </button>
                <button
                  type="button"
                  onClick={() => openPanel("wishlist")}
                  className="inline-flex relative min-h-11 min-w-11 items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Wishlist"
                >
                  <HeartIcon
                    className={cn(
                      "size-[17px]",
                      wishlistCount > 0 && "text-[color:var(--maroon)]",
                    )}
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
                  className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Account"
                >
                  <UserIcon className="size-[17px]" />
                </button>
                <button
                  type="button"
                  onClick={() => openPanel("cart")}
                  className="relative min-h-11 min-w-11 flex items-center justify-center transition-colors hover:text-[color:var(--maroon)] text-foreground"
                  aria-label="Cart"
                >
                  <BagIcon className="size-[17px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)] text-[9px] flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </nav>

          {collectionsOpen && (
            <CollectionsMegaMenu
              categories={navbarCategories}
              activeCategorySlug={activeCategorySlug}
              onCategoryHover={setActiveCategorySlug}
              onClose={() => setCollectionsOpen(false)}
              onMouseEnter={openCollectionsMenu}
            />
          )}
        </div>
      </header>

      {mobileOpen && (
        <MobileDrawer
          categories={navbarCategories}
          onClose={() => setMobileOpen(false)}
          onAccount={openAccount}
        />
      )}
    </>
  );
}

function getActiveCollection(categories: StoreCategory[], slug: string): StoreCategory {
  if (slug === "all") return ALL_COLLECTIONS;
  return categories.find((c) => c.slug === slug) ?? categories[0] ?? ALL_COLLECTIONS;
}

function isFeaturedCategory(index: number) {
  return index % 2 === 0;
}

function splitCategories(columns: StoreCategory[], count: number) {
  const perCol = Math.ceil(columns.length / count);
  return Array.from({ length: count }, (_, i) =>
    columns.slice(i * perCol, (i + 1) * perCol),
  ).filter((col) => col.length > 0);
}

function CollectionsMegaMenu({
  categories,
  activeCategorySlug,
  onCategoryHover,
  onClose,
  onMouseEnter,
}: {
  categories: StoreCategory[];
  activeCategorySlug: string;
  onCategoryHover: (slug: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
}) {
  const active = getActiveCollection(categories, activeCategorySlug);
  const columnCount = categories.length > 10 ? 3 : 2;
  const cols = useMemo(() => splitCategories(categories, columnCount), [categories, columnCount]);
  const startIndexes = useMemo(() => {
    let offset = 0;
    return cols.map((col) => {
      const start = offset;
      offset += col.length;
      return start;
    });
  }, [cols]);

  return (
    <div
      className="hidden lg:block absolute left-0 right-0 top-full z-50 border-t border-foreground/8 bg-background shadow-[0_24px_48px_rgba(0,0,0,0.08)] animate-reveal"
      onMouseEnter={onMouseEnter}
    >
      <div className="max-w-[1400px] mx-auto px-10 xl:px-14 py-10 grid grid-cols-[1fr_minmax(340px,420px)] gap-10 xl:gap-14 items-stretch">
        <div className="flex flex-col min-h-[22rem] max-h-[min(70vh,36rem)]">
          <div
            className={cn(
              "grid gap-x-8 xl:gap-x-10 gap-y-4 flex-1 content-start overflow-y-auto pr-2 [scrollbar-width:thin]",
              columnCount === 3 ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {cols.map((col, colIndex) => (
              <CollectionLinkColumn
                key={colIndex}
                categories={col}
                startIndex={startIndexes[colIndex] ?? 0}
                activeSlug={activeCategorySlug}
                onHover={onCategoryHover}
                onClose={onClose}
              />
            ))}
          </div>

          <Link
            to="/shop/$category"
            params={{ category: "all" }}
            onClick={onClose}
            className="mt-10 inline-flex w-fit items-center justify-center rounded-full bg-[color:var(--charcoal)] px-8 py-3.5 text-[11px] font-medium tracking-[0.22em] text-[color:var(--ivory)] transition-colors hover:bg-[color:var(--maroon)]"
          >
            VIEW ALL COLLECTIONS
          </Link>
        </div>

        <CollectionHeroCard category={active} onClose={onClose} />
      </div>
    </div>
  );
}

function CollectionLinkColumn({
  categories,
  startIndex,
  activeSlug,
  onHover,
  onClose,
}: {
  categories: StoreCategory[];
  startIndex: number;
  activeSlug: string;
  onHover: (slug: string) => void;
  onClose: () => void;
}) {
  return (
    <ul className="space-y-3.5">
      {categories.map((category, i) => {
        const index = startIndex + i;
        const featured = isFeaturedCategory(index);
        const active = activeSlug === category.slug;

        return (
          <li key={category.slug}>
            <Link
              to="/shop/$category"
              params={{ category: category.slug }}
              onClick={onClose}
              onMouseEnter={() => onHover(category.slug)}
              onFocus={() => onHover(category.slug)}
              className={cn(
                "group inline-flex items-center gap-2.5 text-[11px] font-medium tracking-[0.18em] uppercase transition-colors",
                active
                  ? "text-[color:var(--maroon)]"
                  : "text-foreground/80 hover:text-[color:var(--maroon)]",
              )}
            >
              <span>{category.name}</span>
              {featured && (
                <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-[8px] tracking-[0.16em] text-foreground/45">
                  Featured
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CollectionHeroCard({
  category,
  onClose,
}: {
  category: StoreCategory;
  onClose: () => void;
}) {
  const imageUrl = category.imageUrl || "/banners/banner-1.jpeg";
  const shopSlug = category.slug === "all" ? "all" : category.slug;
  const eyebrow =
    category.slug === "all" ? "Blessings / Curated" : `Blessings / ${category.name}`;

  return (
    <Link
      to="/shop/$category"
      params={{ category: shopSlug }}
      onClick={onClose}
      className="group relative block min-h-[22rem] overflow-hidden rounded-2xl bg-[color:var(--muted)]"
    >
      <img
        src={imageUrl}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/75 via-[color:var(--charcoal)]/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
        <p className="eyebrow text-[9px] sm:text-[10px] text-[color:var(--ivory)]/70 mb-2 tracking-[0.28em]">
          {eyebrow}
        </p>
        <h3 className="font-serif text-3xl sm:text-[2rem] leading-tight text-[color:var(--ivory)] max-w-[16ch]">
          {category.slug === "all" ? "Every Occasion" : category.name}
        </h3>
        {category.tagline ? (
          <p className="mt-2 text-sm text-[color:var(--ivory)]/75 line-clamp-2 max-w-xs hidden sm:block">
            {category.tagline}
          </p>
        ) : null}
        <span className="mt-5 inline-block eyebrow text-[10px] tracking-[0.22em] text-[color:var(--ivory)] border-b border-[color:var(--ivory)]/60 pb-1 transition-colors group-hover:border-[color:var(--gold-soft)] group-hover:text-[color:var(--gold-soft)]">
          Explore Collection
        </span>
      </div>
    </Link>
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
          "flex items-center justify-center min-h-11 transition-colors duration-300 text-foreground hover:text-[color:var(--maroon)]",
          compact ? "gap-0.5 px-1 eyebrow text-[9px] sm:text-[10px]" : "gap-1 eyebrow text-[10px]",
        )}
        aria-label="Change currency"
      >
        {compact ? (
          <>
            <span className="text-sm leading-none">{info.flag}</span>
            <ChevronDownIcon className="size-2.5 shrink-0" />
          </>
        ) : (
          <>
            <span>{info.flag}</span>
            <span>{currency}</span>
            <ChevronDownIcon className="size-3 shrink-0" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-foreground/10 shadow-xl py-2 animate-reveal z-50">
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

function MobileDrawer({
  categories,
  onClose,
  onAccount,
}: {
  categories: StoreCategory[];
  onClose: () => void;
  onAccount: () => void;
}) {
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
          <div>
            <p className="eyebrow text-[10px] text-foreground/45 mb-4">Collections</p>
            <Link
              to="/shop/$category"
              params={{ category: "all" }}
              onClick={onClose}
              className="block w-fit font-serif text-3xl text-foreground hover:text-[color:var(--maroon)] transition-colors"
            >
              All Collections
            </Link>
          </div>

          {categories.map((cat) => (
            <div key={cat.slug}>
              <Link
                to="/shop/$category"
                params={{ category: cat.slug }}
                onClick={onClose}
                className="block w-fit font-serif text-3xl text-foreground hover:text-[color:var(--maroon)] transition-colors"
              >
                {cat.name}
              </Link>
              {cat.subCategories.length > 0 && (
                <ul className="mt-3 ml-1 space-y-2">
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
              )}
            </div>
          ))}

          <Link
            to="/shop/$category"
            params={{ category: "all" }}
            onClick={onClose}
            className="inline-flex w-fit items-center justify-center rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-[10px] tracking-[0.2em] text-[color:var(--ivory)]"
          >
            VIEW ALL COLLECTIONS
          </Link>

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

          <div className="flex flex-col gap-4 border-t border-foreground/10 pt-6 text-sm">
            <button
              type="button"
              onClick={() => open("search")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <SearchIcon className="size-4" /> Search
            </button>
            <button
              type="button"
              onClick={() => open("cart")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <BagIcon className="size-4" /> Bag {cartCount > 0 ? `(${cartCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => open("wishlist")}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <HeartIcon className="size-4" /> Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAccount();
              }}
              className="text-left text-foreground/70 hover:text-[color:var(--maroon)] transition-colors flex items-center gap-2 w-fit"
            >
              <UserIcon className="size-4" /> Account
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
