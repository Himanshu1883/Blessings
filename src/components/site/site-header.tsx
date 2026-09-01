import { Menu, ShoppingBag, User, X } from "lucide-react";
import { ChevronDownIcon } from "@/components/icons/site-icons";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { useAuth } from "@/lib/auth-context";
import { loginSearch } from "@/lib/login-search";
import {
  fetchNavbarCategories,
  fetchProducts,
  type StoreCategory,
  type StoreProduct,
} from "@/lib/catalog-api";
import { CurrencySwitcher } from "@/components/site/currency-switcher";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const UTILITY_LEFT = [
  { label: "SHIPPING", to: "/contact" as const, hash: "shipping" },
  { label: "HELP", to: "/contact" as const, hash: "help" },
] as const;

const STATIC_NAV = [
  { label: "ABOUT", to: "/about" as const },
  // { label: "BLOG", to: "/journal" as const },
  // { label: "BESPOKE", to: "/bespoke" as const },
  { label: "CONTACT", to: "/contact" as const },
] as const;

import { BRAND_LOGO, BRAND_NAME, BRAND_TAGLINE } from "@/lib/seo";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navbarCategories, setNavbarCategories] = useState<StoreCategory[]>([]);
  const [navbarProducts, setNavbarProducts] = useState<StoreProduct[]>([]);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const menuCloseTimer = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const [mobileMenuTop, setMobileMenuTop] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { openPanel, cartCount } = useShop();

  const visibleCategories = useMemo(
    () => navbarCategories.filter((c) => c.showOnNavbar !== false),
    [navbarCategories],
  );

  useEffect(() => {
    let mounted = true;
    fetchNavbarCategories().then((cats) => {
      if (mounted) setNavbarCategories(cats);
    });
    fetchProducts().then((products) => {
      if (mounted) setNavbarProducts(products);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openAccount = () => {
    if (isLoading) return;
    if (isAuthenticated) {
      navigate({ to: "/profile" });
    } else {
      navigate({ to: "/login", search: loginSearch(pathname) });
    }
  };

  const syncHeaderLayout = useCallback(() => {
    const header = headerRef.current;
    const mobileNav = mobileNavRef.current;
    if (header) {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    }
    if (mobileNav) {
      setMobileMenuTop(mobileNav.getBoundingClientRect().bottom);
    }
  }, []);

  useLayoutEffect(() => {
    syncHeaderLayout();
    const header = headerRef.current;
    const mobileNav = mobileNavRef.current;
    const ro = new ResizeObserver(syncHeaderLayout);
    if (header) ro.observe(header);
    if (mobileNav) ro.observe(mobileNav);
    window.addEventListener("resize", syncHeaderLayout);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeaderLayout);
    };
  }, [syncHeaderLayout]);

  useLayoutEffect(() => {
    if (!mobileOpen) return;
    syncHeaderLayout();
  }, [mobileOpen, syncHeaderLayout]);

  const openShopMenu = () => {
    if (menuCloseTimer.current) {
      window.clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
    setShopMenuOpen(true);
  };

  const scheduleCloseShopMenu = () => {
    if (menuCloseTimer.current) window.clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = window.setTimeout(() => {
      setShopMenuOpen(false);
      menuCloseTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    setMobileOpen(false);
    setShopMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (menuCloseTimer.current) window.clearTimeout(menuCloseTimer.current);
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

  const solidHeader = true;

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
          solidHeader
            ? "bg-[color:var(--ivory)] text-[color:var(--charcoal)] lg:bg-white lg:shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent text-white",
        )}
      >
        <div className="relative w-full" onMouseLeave={scheduleCloseShopMenu}>
          {/* ── Desktop: one-row links | stacked logo | one-row links ── */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-4 xl:gap-8 px-8 xl:px-14 py-3">
            <nav className="flex min-w-0 flex-wrap items-center justify-start gap-x-6 gap-y-1 xl:gap-x-8">
              <NavDropdownTrigger
                label="Shop All"
                active={shopMenuOpen}
                solidHeader={solidHeader}
                onOpen={openShopMenu}
                href="/shop/$category"
                hrefParams={{ category: "all" }}
                onNavigate={() => setShopMenuOpen(false)}
              />
              {STATIC_NAV.slice(0, 2).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                    solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                    pathname === item.to && "opacity-70",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {UTILITY_LEFT.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  className={cn(
                    "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                    solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <BrandLogo solidHeader={solidHeader} />

            <nav className="flex min-w-0 flex-wrap items-center justify-end gap-x-6 gap-y-1 xl:gap-x-8">
              {STATIC_NAV.slice(2).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                    solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                    pathname === item.to && "opacity-70",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <CurrencySwitcher variant="nav" />
              <button
                type="button"
                onClick={() => openPanel("search")}
                className={cn(
                  "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                  solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                )}
              >
                Search
              </button>
              <button
                type="button"
                onClick={openAccount}
                className={cn(
                  "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                  solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                )}
              >
                {isAuthenticated ? "Account" : "Login"}
              </button>
              <button
                type="button"
                onClick={() => openPanel("cart")}
                className={cn(
                  "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                  solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                )}
              >
                Cart ({cartCount})
              </button>
            </nav>
          </div>

          {/* ── Mobile header ── */}
          <nav
            ref={mobileNavRef}
            className={cn(
              "lg:hidden mx-2 sm:mx-3 mt-2 rounded-2xl border border-foreground/8 bg-white px-2 py-2 shadow-[0_2px_14px_rgba(0,0,0,0.05)]",
              mobileOpen ? "mb-0 rounded-b-none border-b-0 shadow-none" : "mb-1.5",
            )}
            aria-label="Mobile"
          >
            <div className="flex min-h-12 items-center gap-0.5">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center text-[color:var(--charcoal)] transition-opacity hover:opacity-70"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? (
                  <X className="size-5" strokeWidth={1.5} />
                ) : (
                  <Menu className="size-5" strokeWidth={1.5} />
                )}
              </button>

              <div className="flex min-w-0 flex-1 items-center justify-center px-0.5">
                <BrandLogo solidHeader={solidHeader} variant="mobile" />
              </div>

              <div className="flex shrink-0 items-center">
                <CurrencySwitcher variant="mobile" />
                <button
                  type="button"
                  onClick={openAccount}
                  className="flex size-10 shrink-0 items-center justify-center text-[color:var(--charcoal)] transition-opacity hover:opacity-70"
                  aria-label={isAuthenticated ? "Account" : "Login or sign up"}
                >
                  <User className="size-[1.15rem]" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => openPanel("cart")}
                  className="relative flex size-10 shrink-0 items-center justify-center text-[color:var(--charcoal)] transition-opacity hover:opacity-70"
                  aria-label={`Cart, ${cartCount} items`}
                >
                  <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
                  {cartCount > 0 ? (
                    <span className="absolute right-1 top-1 grid min-w-[0.9rem] place-items-center rounded-full bg-[color:var(--maroon)] px-0.5 text-[8px] font-medium leading-none text-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </nav>

          {shopMenuOpen && (
            <ShopAllMegaMenu
              categories={visibleCategories}
              products={navbarProducts}
              onClose={() => setShopMenuOpen(false)}
              onMouseEnter={openShopMenu}
            />
          )}
        </div>
      </header>

      {mobileOpen && (
        <MobileDrawer
          menuTop={mobileMenuTop}
          categories={visibleCategories}
          onClose={() => setMobileOpen(false)}
          onAccount={openAccount}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
}

function BrandLogo({
  solidHeader,
  variant = "desktop",
  compact = false,
}: {
  solidHeader: boolean;
  variant?: "desktop" | "mobile";
  compact?: boolean;
}) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    if (compact) {
      return (
        <Link
          to="/"
          aria-label="Blessings home"
          className="pointer-events-auto group flex shrink-0 items-center justify-center"
        >
          <span className="relative size-9 overflow-hidden rounded-full bg-black ring-1 ring-[color:var(--gold)]/45 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]">
            <img
              src={BRAND_LOGO}
              alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
              className="h-full w-full object-contain"
            />
          </span>
        </Link>
      );
    }

    return (
      <Link
        to="/"
        aria-label="Blessings home"
        className="group flex min-w-0 max-w-full items-center gap-2 overflow-hidden"
      >
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-[color:var(--gold)]/45 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform duration-700 ease-in-out group-hover:rotate-[360deg] sm:size-11">
          <img
            src={BRAND_LOGO}
            alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
            className="h-full w-full object-contain"
          />
        </span>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span className="profile-display truncate text-[14px] uppercase leading-none tracking-[0.05em] text-[color:var(--charcoal)] sm:text-[16px]">
            Blessings
          </span>
          <span className="mt-1 truncate text-[6px] uppercase leading-tight tracking-[0.22em] text-[color:var(--gold)] sm:text-[7px] sm:tracking-[0.26em]">
            The Men&apos;s Boutique
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/"
      aria-label="Blessings home"
      className="group flex shrink-0 items-center gap-3.5"
    >
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-black ring-1 shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]",
          "size-14 xl:size-16",
          solidHeader ? "ring-[color:var(--gold)]/50" : "ring-white/50",
        )}
      >
        <img
          src={BRAND_LOGO}
          alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="flex min-w-0 flex-col items-start text-left">
        <span
          className={cn(
            "font-bold uppercase tracking-[0.16em] leading-none text-[20px] xl:text-[22px]",
            solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
          )}
        >
          Blessings
        </span>
        <span
          className={cn(
            "mt-1.5 uppercase tracking-[0.28em] leading-none text-[7.5px] xl:text-[8px]",
            solidHeader ? "text-[color:var(--charcoal)]/45" : "text-white/55",
          )}
        >
          {BRAND_TAGLINE}
        </span>
      </span>
    </Link>
  );
}

function NavDropdownTrigger({
  label,
  active,
  solidHeader,
  onOpen,
  href,
  hrefParams,
  onNavigate,
}: {
  label: string;
  active: boolean;
  solidHeader: boolean;
  onOpen: () => void;
  href: "/shop/$category";
  hrefParams: { category: string };
  onNavigate: () => void;
}) {
  return (
    <div className="relative py-1" onMouseEnter={onOpen}>
      <Link
        to={href}
        params={hrefParams}
        onClick={onNavigate}
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
          solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
          active && "opacity-70",
        )}
      >
        {label}
        <ChevronDownIcon
          className={cn("size-3 transition-transform duration-200", active && "rotate-180")}
        />
      </Link>
    </div>
  );
}

function ShopAllMegaMenu({
  categories,
  products,
  onClose,
  onMouseEnter,
}: {
  categories: StoreCategory[];
  products: StoreProduct[];
  onClose: () => void;
  onMouseEnter: () => void;
}) {
  const { format } = useCurrency();

  const featuredProducts = useMemo(() => {
    const slugs = new Set(categories.map((c) => c.slug));
    return products.filter((p) => slugs.has(p.categorySlug)).slice(0, 5);
  }, [categories, products]);

  if (categories.length === 0) return null;

  return (
    <div
      className="hidden lg:flex absolute inset-x-0 top-full z-50 h-[70vh] w-full flex-col overflow-hidden bg-white border-t border-black/6 shadow-[0_20px_48px_rgba(0,0,0,0.08)] animate-reveal"
      onMouseEnter={onMouseEnter}
    >
      {/* Categories — 6-column grid, no scroll */}
      <div className="flex-[2] min-h-0 overflow-hidden px-10 xl:px-16 pt-5 pb-3">
        <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-6 content-start gap-x-5 xl:gap-x-7 gap-y-3">
          {categories.map((category) => (
            <CategoryColumn key={category.slug} category={category} onClose={onClose} compact />
          ))}
        </div>
      </div>

      {/* Products — fills remaining height */}
      {featuredProducts.length > 0 && (
        <div className="flex min-h-0 flex-[3] flex-col overflow-hidden border-t border-black/8 px-10 xl:px-16 py-3">
          <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-5 gap-3 xl:gap-4">
            {featuredProducts.map((product) => (
              <MegaMenuProductCard
                key={product.id}
                product={product}
                formatPrice={format}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryColumn({
  category,
  onClose,
  compact = false,
}: {
  category: StoreCategory;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <Link
        to="/shop/$category"
        params={{ category: category.slug }}
        onClick={onClose}
        className={cn(
          "block font-bold text-[color:var(--charcoal)] hover:opacity-70 transition-opacity",
          compact ? "text-[12px] mb-1.5" : "text-[15px] mb-4",
        )}
      >
        {category.name}
      </Link>
      {category.subCategories.length > 0 ? (
        <ul className={cn(compact ? "space-y-1" : "space-y-2.5")}>
          {(compact ? category.subCategories.slice(0, 4) : category.subCategories).map((sub) => (
            <li key={sub}>
              <Link
                to="/shop/$category"
                params={{ category: category.slug }}
                onClick={onClose}
                className={cn(
                  "text-[color:var(--charcoal)]/80 hover:text-[color:var(--charcoal)] transition-colors",
                  compact ? "text-[11px] leading-tight" : "text-[14px]",
                )}
              >
                {sub}
              </Link>
            </li>
          ))}
          {compact && category.subCategories.length > 4 && (
            <li>
              <Link
                to="/shop/$category"
                params={{ category: category.slug }}
                onClick={onClose}
                className="text-[11px] font-medium text-[color:var(--charcoal)] hover:opacity-70 transition-opacity"
              >
                View all
              </Link>
            </li>
          )}
        </ul>
      ) : (
        <Link
          to="/shop/$category"
          params={{ category: category.slug }}
          onClick={onClose}
          className={cn(
            "text-[color:var(--charcoal)]/80 hover:text-[color:var(--charcoal)] transition-colors",
            compact ? "text-[12px]" : "text-[14px]",
          )}
        >
          Shop {category.name}
        </Link>
      )}
    </div>
  );
}

function MegaMenuProductCard({
  product,
  formatPrice,
  onClose,
}: {
  product: StoreProduct;
  formatPrice: (price: number) => string;
  onClose: () => void;
}) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.slug }}
      onClick={onClose}
      className="group flex h-full min-h-0 flex-col"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#ececec]">
        {product.bestSeller && (
          <span className="absolute top-2 left-2 z-10 bg-white px-2 py-0.5 text-[10px] font-medium text-[#c45c3e]">
            Sale
          </span>
        )}
        <img
          src={product.imageUrl || "/banners/banner-1.jpeg"}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <h4 className="mt-2 shrink-0 text-[13px] font-bold leading-tight text-[color:var(--charcoal)] line-clamp-1">
        {product.name}
      </h4>
      <p className="mt-0.5 shrink-0 text-[12px] text-[color:var(--charcoal)]">
        From {formatPrice(product.price)}
      </p>
    </Link>
  );
}

function MobileDrawer({
  menuTop,
  categories,
  onClose,
  onAccount,
  isAuthenticated,
}: {
  menuTop: number;
  categories: StoreCategory[];
  onClose: () => void;
  onAccount: () => void;
  isAuthenticated: boolean;
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
        className="lg:hidden fixed inset-0 z-40 bg-black/40"
        style={{ top: menuTop }}
        onClick={onClose}
        aria-label="Close menu"
      />

      <div
        className="lg:hidden fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-50 bg-white overflow-y-auto animate-reveal border-t border-foreground/8"
        style={{ top: menuTop }}
        data-lenis-prevent
      >
        <div className="px-6 py-8 space-y-8">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium tracking-[0.14em] uppercase text-[color:var(--charcoal)]/60">
            {UTILITY_LEFT.map((item) => (
              <Link key={item.label} to={item.to} hash={item.hash} onClick={onClose}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium tracking-[0.14em] uppercase text-[color:var(--charcoal)]">
            <button type="button" onClick={() => open("search")}>
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAccount();
              }}
            >
              {isAuthenticated ? "Account" : "Login"}
            </button>
            <button type="button" onClick={() => open("cart")}>
              Cart ({cartCount})
            </button>
            <button type="button" onClick={() => open("wishlist")}>
              Wishlist ({wishlistCount})
            </button>
          </div>

          <div className="border-t border-black/8 pt-6">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[color:var(--charcoal)]/45 mb-4">
              Shop All
            </p>
            <Link
              to="/shop/$category"
              params={{ category: "all" }}
              onClick={onClose}
              className="block text-[15px] font-bold tracking-[0.06em] uppercase text-[color:var(--charcoal)] mb-5"
            >
              View All Collections
            </Link>
            {categories.length > 0 ? (
              <ul className="space-y-4">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      to="/shop/$category"
                      params={{ category: cat.slug }}
                      onClick={onClose}
                      className="block text-[15px] font-bold tracking-[0.06em] uppercase text-[color:var(--charcoal)]"
                    >
                      {cat.name}
                    </Link>
                    {cat.subCategories.length > 0 && (
                      <ul className="mt-2 ml-1 space-y-2">
                        {cat.subCategories.map((sub) => (
                          <li key={sub}>
                            <Link
                              to="/shop/$category"
                              params={{ category: cat.slug }}
                              onClick={onClose}
                              className="text-[13px] text-[color:var(--charcoal)]/65 hover:text-[color:var(--charcoal)] transition-colors"
                            >
                              {sub}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[color:var(--charcoal)]/50">No collections available.</p>
            )}
          </div>

          <div className="border-t border-black/8 pt-6 space-y-3">
            {STATIC_NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={onClose}
                className="block text-[15px] font-bold tracking-[0.06em] uppercase text-[color:var(--charcoal)]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-black/8 pt-6">
            <CurrencySwitcher variant="drawer" />
          </div>

          <WhatsAppLink
            message={WHATSAPP_MESSAGES.general}
            className="flex items-center gap-2 text-[#25D366] text-[13px] font-medium"
          >
            WhatsApp Concierge
          </WhatsAppLink>
        </div>
      </div>
    </>
  );
}
