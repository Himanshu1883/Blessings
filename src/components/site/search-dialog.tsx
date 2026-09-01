import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CloseIcon, SearchIcon } from "@/components/icons/site-icons";
import { useCategories, useProducts } from "@/lib/api-hooks";
import { collectionHasProducts } from "@/lib/catalog-api";
import { resolveMediaUrl } from "@/lib/api-client";
import { useCurrency } from "@/lib/currency";
import { JOURNAL_POSTS } from "@/lib/journal-posts";
import { getRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import { useShop } from "@/lib/shop-store";
import { useScrollExperience } from "@/components/site/scroll-experience";
import { cn } from "@/lib/utils";

const TRENDING_TERMS = ["Sherwani", "Bandhgala", "Wedding Suit", "Indo-Western", "Kurta"];

const PAGES = [
  { label: "About the House", to: "/about" as const },
  { label: "Bespoke Tailoring", to: "/bespoke" as const },
  { label: "Book a Consultation", to: "/contact" as const },
  { label: "Journal", to: "/journal" as const },
];

type SearchTab = "products" | "articles" | "pages";

function matchQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function SearchDialog() {
  const { panel, closePanel, openPanel } = useShop();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { lenis } = useScrollExperience();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const open = panel === "search";
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("products");
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPanel("search");
      }
      if (e.key === "Escape" && panel === "search") {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPanel, closePanel, panel]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setRecent(getRecentlyViewed());
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setQuery("");
      setTab("products");
    }, 420);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onUpdate = () => setRecent(getRecentlyViewed());
    window.addEventListener("recently-viewed-updated", onUpdate);
    return () => window.removeEventListener("recently-viewed-updated", onUpdate);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
      cancelAnimationFrame(frame);
    };
  }, [open, lenis]);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  const filteredProducts = useMemo(() => {
    if (!hasQuery) return [];
    return products.filter(
      (p) =>
        matchQuery(p.name, trimmed) ||
        matchQuery(p.fabric, trimmed) ||
        matchQuery(p.categorySlug ?? "", trimmed),
    );
  }, [products, trimmed, hasQuery]);

  const filteredArticles = useMemo(() => {
    if (!hasQuery) return [];
    return JOURNAL_POSTS.filter(
      (a) =>
        matchQuery(a.title, trimmed) ||
        matchQuery(a.excerpt, trimmed) ||
        matchQuery(a.tag, trimmed),
    );
  }, [trimmed, hasQuery]);

  const filteredPages = useMemo(() => {
    if (!hasQuery) return [];
    const staticPages = PAGES.filter((p) => matchQuery(p.label, trimmed));
    const collectionPages = categories
      .filter(
        (c) =>
          collectionHasProducts(products, c.slug) &&
          (matchQuery(c.name, trimmed) || matchQuery(c.tagline, trimmed)),
      )
      .map((c) => ({ label: c.name, to: "/shop/$category" as const, category: c.slug }));
    return { staticPages, collectionPages };
  }, [categories, products, trimmed, hasQuery]);

  const displayProducts = useMemo(() => {
    if (hasQuery) {
      return filteredProducts.slice(0, 12).map((p) => ({
        slug: p.slug,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ?? p.imageUrls[0] ?? null,
      }));
    }
    if (recent.length > 0) return recent;
    return products
      .filter((p) => p.bestSeller || p.isNew)
      .slice(0, 6)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ?? p.imageUrls[0] ?? null,
      }));
  }, [hasQuery, filteredProducts, recent, products]);

  const goProduct = (slug: string) => {
    closePanel();
    navigate({ to: "/product/$id", params: { id: slug } });
  };

  const goPage = (to: string, params?: { category: string }) => {
    closePanel();
    if (params) {
      navigate({ to: "/shop/$category", params });
    } else {
      navigate({ to: to as "/about" | "/bespoke" | "/contact" | "/journal" });
    }
  };

  const goJournal = () => {
    closePanel();
    navigate({ to: "/journal" });
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "search-overlay fixed inset-0 z-[100] bg-background",
        visible ? "search-overlay--open" : "search-overlay--closed",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      data-lenis-prevent
    >
      <div className="flex h-full flex-col overflow-hidden">
        <header className="relative shrink-0 border-b border-foreground/10 px-4 py-5 sm:px-6 sm:py-6">
          <Link
            to="/"
            onClick={closePanel}
            className="mx-auto block w-fit text-center group"
          >
            <span className="block font-serif text-[22px] sm:text-[26px] tracking-[0.06em] leading-none text-foreground group-hover:text-[color:var(--maroon)] transition-colors">
              Blessings
            </span>
            <span className="mt-1.5 block eyebrow text-[7px] sm:text-[8px] tracking-[0.36em] text-foreground/45">
              Men&apos;s Boutique — Delhi
            </span>
          </Link>
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-3 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
              onSubmit={(e) => {
                e.preventDefault();
                inputRef.current?.blur();
              }}
            >
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="h-12 sm:h-14 flex-1 border border-foreground/20 bg-background px-4 text-sm sm:text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                autoComplete="off"
              />
              <button
                type="submit"
                className="h-12 sm:h-14 inline-flex items-center justify-center gap-2 bg-[color:var(--charcoal)] px-5 sm:px-8 text-[color:var(--ivory)] text-xs sm:text-sm font-medium tracking-wide hover:bg-[color:var(--charcoal)]/90 transition-colors shrink-0"
              >
                <SearchIcon className="size-4" />
                <span>Search</span>
              </button>
            </form>

            <nav className="mt-6 sm:mt-8 flex items-center gap-6 sm:gap-8 border-b border-foreground/10 pb-3 overflow-x-auto">
              {(
                [
                  ["products", "Products"],
                  ["articles", "Articles"],
                  ["pages", "Pages"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "shrink-0 pb-3 -mb-3 border-b-2 transition-colors text-sm sm:text-base",
                    tab === id
                      ? "border-foreground font-serif text-foreground"
                      : "border-transparent text-foreground/45 hover:text-foreground/70",
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>

            {!hasQuery && tab === "products" && (
              <section className="mt-6 sm:mt-8">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-foreground">
                  Trending Search Terms
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TRENDING_TERMS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-full border border-foreground/15 bg-[color:var(--muted)]/60 px-3.5 py-1.5 text-xs sm:text-sm text-foreground/75 hover:border-foreground/30 hover:text-foreground transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {tab === "products" && (
              <section className="mt-8 sm:mt-10">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-foreground">
                  {hasQuery
                    ? filteredProducts.length > 0
                      ? "Results"
                      : "No products found"
                    : recent.length > 0
                      ? "Recently viewed"
                      : "Popular pieces"}
                </h3>
                {displayProducts.length > 0 ? (
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {displayProducts.map((item) => {
                      const resolved = resolveMediaUrl(item.imageUrl) ?? "";

                      return (
                        <li key={item.slug}>
                          <button
                            type="button"
                            onClick={() => goProduct(item.slug)}
                            className="group flex w-full items-center gap-3 sm:gap-4 border border-foreground/12 bg-background p-2.5 sm:p-3 text-left hover:border-foreground/25 transition-colors"
                          >
                            <div className="size-16 sm:size-[4.5rem] shrink-0 overflow-hidden bg-[color:var(--muted)]">
                              {resolved ? (
                                <img
                                  src={resolved}
                                  alt=""
                                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-[color:var(--maroon)] transition-colors">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs sm:text-sm text-foreground/60 tabular-nums">
                                From {format(item.price)}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : hasQuery ? (
                  <p className="mt-4 text-sm text-foreground/50">
                    Try another term or browse our collections.
                  </p>
                ) : null}
              </section>
            )}

            {tab === "articles" && (
              <section className="mt-8 sm:mt-10">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-foreground">
                  {hasQuery
                    ? filteredArticles.length > 0
                      ? "Results"
                      : "No articles found"
                    : "From the Journal"}
                </h3>
                <ul className="mt-4 space-y-3">
                  {(hasQuery ? filteredArticles : JOURNAL_POSTS.slice(0, 6)).map((article) => (
                    <li key={article.slug}>
                      <button
                        type="button"
                        onClick={goJournal}
                        className="group flex w-full items-center gap-3 sm:gap-4 border border-foreground/12 p-2.5 sm:p-3 text-left hover:border-foreground/25 transition-colors"
                      >
                        <div className="size-16 sm:size-[4.5rem] shrink-0 overflow-hidden bg-[color:var(--muted)]">
                          <img
                            src={article.image}
                            alt=""
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-[color:var(--maroon)] transition-colors">
                            {article.title}
                          </p>
                          <p className="mt-1 text-xs text-foreground/50">
                            {article.tag} · {article.readTime}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tab === "pages" && (
              <section className="mt-8 sm:mt-10">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-foreground">
                  {hasQuery ? "Results" : "Browse"}
                </h3>
                <ul className="mt-4 divide-y divide-foreground/10 border border-foreground/12">
                  {(hasQuery
                    ? [
                        ...filteredPages.staticPages.map((p) => ({ ...p, kind: "page" as const })),
                        ...filteredPages.collectionPages.map((p) => ({
                          label: p.label,
                          to: p.to,
                          category: p.category,
                          kind: "collection" as const,
                        })),
                      ]
                    : [
                        ...PAGES.map((p) => ({ ...p, kind: "page" as const })),
                        ...categories
                          .filter((c) => collectionHasProducts(products, c.slug))
                          .slice(0, 6)
                          .map((c) => ({
                          label: c.name,
                          to: "/shop/$category" as const,
                          category: c.slug,
                          kind: "collection" as const,
                        })),
                      ]
                  ).map((item) => (
                    <li key={`${item.kind}-${item.label}`}>
                      <button
                        type="button"
                        onClick={() =>
                          item.kind === "collection"
                            ? goPage(item.to, { category: item.category })
                            : goPage(item.to)
                        }
                        className="w-full px-4 py-3.5 text-left text-sm sm:text-[15px] hover:bg-[color:var(--muted)]/50 hover:text-[color:var(--maroon)] transition-colors"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
                {hasQuery &&
                  filteredPages.staticPages.length === 0 &&
                  filteredPages.collectionPages.length === 0 && (
                    <p className="mt-4 text-sm text-foreground/50">No pages found.</p>
                  )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
