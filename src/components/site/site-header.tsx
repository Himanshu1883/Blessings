import { ChevronDownIcon } from "@/components/icons/site-icons";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNavbarCategories,
  fetchProducts,
  type StoreCategory,
  type StoreProduct,
} from "@/lib/catalog-api";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const UTILITY_LEFT = [
  { label: "RETURNS", to: "/contact" as const },
  { label: "SHIPPING", to: "/contact" as const },
  { label: "HELP", to: "/contact" as const },
] as const;

const STATIC_NAV = [
  { label: "ABOUT", to: "/about" as const },
  { label: "BLOG", to: "/journal" as const },
  { label: "BESPOKE", to: "/bespoke" as const },
  { label: "CONTACT", to: "/contact" as const },
] as const;

const BRAND_TAGLINE = "The Men's Boutique · Delhi";

let navbarCategoriesCache: StoreCategory[] | null = null;
let navbarCategoriesPromise: Promise<StoreCategory[]> | null = null;
let navbarProductsCache: StoreProduct[] | null = null;
let navbarProductsPromise: Promise<StoreProduct[]> | null = null;

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

function getNavbarProducts(): Promise<StoreProduct[]> {
  if (navbarProductsCache) return Promise.resolve(navbarProductsCache);
  if (!navbarProductsPromise) {
    navbarProductsPromise = fetchProducts().then((products) => {
      navbarProductsCache = products;
      return products;
    });
  }
  return navbarProductsPromise;
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navbarCategories, setNavbarCategories] = useState<StoreCategory[]>(
    () => navbarCategoriesCache ?? [],
  );
  const [navbarProducts, setNavbarProducts] = useState<StoreProduct[]>(
    () => navbarProductsCache ?? [],
  );
  const [scrolled, setScrolled] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const menuCloseTimer = useRef<number | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openPanel, cartCount } = useShop();

  const visibleCategories = useMemo(
    () => navbarCategories.filter((c) => c.showOnNavbar !== false),
    [navbarCategories],
  );

  useEffect(() => {
    let mounted = true;
    getNavbarCategories().then((cats) => {
      if (mounted) setNavbarCategories(cats);
    });
    getNavbarProducts().then((products) => {
      if (mounted) setNavbarProducts(products);
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
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShopMenuOpen(false);
  }, [pathname]);

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

  const solidHeader = scrolled || pathname !== "/" || shopMenuOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
          solidHeader
            ? "bg-white text-[color:var(--charcoal)] shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent text-white",
        )}
      >
        <div className="relative w-full" onMouseLeave={scheduleCloseShopMenu}>
          {/* ── Desktop: two-row header ── */}
          <div className="hidden lg:block">
            {/* Top row: utility | logo | utility */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center px-8 xl:px-14 pt-5 pb-2">
              <div className="flex items-center min-w-0">
                {UTILITY_LEFT.map((item, i) => (
                  <span key={item.label} className="inline-flex items-center">
                    {i > 0 && (
                      <span
                        className={cn(
                          "mx-3 text-[10px] select-none",
                          solidHeader ? "text-[color:var(--charcoal)]/30" : "text-white/40",
                        )}
                        aria-hidden
                      >
                        |
                      </span>
                    )}
                    <Link
                      to={item.to}
                      className={cn(
                        "text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                        solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </span>
                ))}
              </div>

              <Link to="/" className="text-center transition-opacity hover:opacity-80">
                <span
                  className={cn(
                    "block text-[26px] xl:text-[28px] font-bold tracking-[0.18em] uppercase",
                    solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                  )}
                >
                  Blessings
                </span>
                <span
                  className={cn(
                    "block mt-1.5 text-[8px] xl:text-[8.5px] tracking-[0.36em] uppercase",
                    solidHeader ? "text-[color:var(--charcoal)]/45" : "text-white/55",
                  )}
                >
                  {BRAND_TAGLINE}
                </span>
              </Link>

              <div className="flex items-center justify-end gap-6 xl:gap-7 min-w-0">
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
              </div>
            </div>

            {/* Bottom row: nav links grouped with tighter spacing */}
            <nav className="flex w-full items-center justify-center gap-5 xl:gap-6 px-8 xl:px-14 pb-4">
              <NavDropdownTrigger
                label="Shop All"
                active={shopMenuOpen}
                solidHeader={solidHeader}
                onOpen={openShopMenu}
                href="/shop/$category"
                hrefParams={{ category: "all" }}
                onNavigate={() => setShopMenuOpen(false)}
              />

              {STATIC_NAV.map((item) => (
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
            </nav>
          </div>

          {/* ── Mobile header ── */}
          <nav className="lg:hidden px-4 sm:px-6 py-3.5">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <button
                className={cn(
                  "text-[11px] font-medium tracking-[0.14em] uppercase min-h-11 px-1 transition-opacity hover:opacity-70",
                  solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                )}
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menu"
              >
                {mobileOpen ? "Close" : "Menu"}
              </button>

              <Link to="/" className="justify-self-center text-center transition-opacity hover:opacity-80">
                <span
                  className={cn(
                    "block text-[20px] sm:text-[22px] font-bold tracking-[0.16em] uppercase",
                    solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                  )}
                >
                  Blessings
                </span>
                <span
                  className={cn(
                    "block mt-1 text-[6.5px] sm:text-[7px] tracking-[0.32em] uppercase",
                    solidHeader ? "text-[color:var(--charcoal)]/45" : "text-white/55",
                  )}
                >
                  {BRAND_TAGLINE}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => openPanel("cart")}
                className={cn(
                  "justify-self-end text-[11px] font-medium tracking-[0.14em] uppercase min-h-11 px-1 transition-opacity hover:opacity-70",
                  solidHeader ? "text-[color:var(--charcoal)]" : "text-white",
                )}
              >
                Cart ({cartCount})
              </button>
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
          categories={visibleCategories}
          onClose={() => setMobileOpen(false)}
          onAccount={openAccount}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
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
  const { format, currency } = useCurrency();

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
                currency={currency}
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
  currency,
  onClose,
}: {
  product: StoreProduct;
  formatPrice: (price: number) => string;
  currency: CurrencyCode;
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
        From {formatPrice(product.price)} {currency}
      </p>
    </Link>
  );
}

function MobileDrawer({
  categories,
  onClose,
  onAccount,
  isAuthenticated,
}: {
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
        className="lg:hidden fixed inset-0 top-[4.25rem] z-40 bg-black/40"
        onClick={onClose}
        aria-label="Close menu"
      />

      <div
        className="lg:hidden fixed inset-x-0 top-[4.25rem] bottom-[calc(62px+env(safe-area-inset-bottom))] z-50 bg-white overflow-y-auto animate-reveal"
        data-lenis-prevent
      >
        <div className="px-6 py-8 space-y-8">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium tracking-[0.14em] uppercase text-[color:var(--charcoal)]/60">
            {UTILITY_LEFT.map((item) => (
              <Link key={item.label} to={item.to} onClick={onClose}>
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
            <CurrencyDropdownMobile />
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

function CurrencyDropdownMobile() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div>
      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[color:var(--charcoal)]/45 mb-3">
        Currency
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <button
            key={code}
            onClick={() => setCurrency(code)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium tracking-[0.1em] uppercase border transition-colors",
              currency === code
                ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                : "border-black/15 text-[color:var(--charcoal)]/70 hover:border-[color:var(--charcoal)]",
            )}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
