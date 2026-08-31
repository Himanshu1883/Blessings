import { cn } from "@/lib/utils";
import type { StoreCategory, StoreProduct } from "@/lib/catalog-api";
import { fetchCategories, fetchCategory, fetchProducts, storeProductFromApi } from "@/lib/catalog-api";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Check, ChevronDown, Loader2, Plus, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { Button } from "@/components/ui/button";
import { useAdminProductCatalog } from "@/hooks/useAdminProductCatalog";
import { useAuth } from "@/lib/auth-context";
import type { AdminProduct } from "@/lib/admin/product-form";
import type { ApiProduct } from "@/lib/api-types";
import { toast } from "sonner";
import { ProductCard } from "./index";

const ALL_CATEGORY: StoreCategory = {
  slug: "all",
  name: "All",
  tagline: "The complete Blessings collection — every silhouette, every fabric, every occasion.",
  imageUrl: "",
  subCategories: [],
};

const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price — Low to High" },
  { value: "price-desc", label: "Price — High to Low" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function getFilterGroups(cat: StoreCategory) {
  return [
    { key: "subCategory", title: "Sub-Category", options: cat.subCategories },
    { key: "fabric", title: "Fabric", options: ["Silk", "Velvet", "Cotton", "Wool", "Linen"] },
    {
      key: "color",
      title: "Color",
      options: ["Ivory", "Maroon", "Emerald", "Midnight", "Charcoal", "Pastel"],
    },
    {
      key: "occasion",
      title: "Occasion",
      options: ["Wedding", "Engagement", "Reception", "Sangeet", "Cocktail"],
    },
    { key: "size", title: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "Custom"] },
  ].filter((g) => g.options.length > 0);
}

export const Route = createFileRoute("/shop/$category")({
  head: ({ loaderData }: { loaderData?: { cat?: StoreCategory } }) => {
    const cat = loaderData?.cat;
    const title = cat ? `${cat.name} — Blessings Men's Boutique` : "Shop — Blessings";
    const desc = cat?.tagline ?? "Shop bespoke menswear at Blessings.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  loader: async ({ params }) => {
    const isAll = params.category === "all";
    const cat = isAll ? ALL_CATEGORY : await fetchCategory(params.category);
    const categories = await fetchCategories();
    const products = await fetchProducts(isAll ? undefined : params.category);
    if (!cat) throw notFound();
    return { cat, categories, products } as {
      cat: StoreCategory;
      categories: StoreCategory[];
      products: StoreProduct[];
    };
  },
  component: ShopCategory,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif italic text-2xl">Category not found.</p>
    </div>
  ),
});

function ShopCategory() {
  const loaderData = Route.useLoaderData() as {
    cat: StoreCategory;
    categories: StoreCategory[];
    products: StoreProduct[];
  };
  const { cat, categories } = loaderData;

  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminCatalog = useAdminProductCatalog(isAdmin);

  const [products, setProducts] = useState(loaderData.products);
  const [sort, setSort] = useState<SortValue>("new");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [mobileSheet, setMobileSheet] = useState<"filter" | "sort" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setProducts(loaderData.products);
  }, [loaderData.products]);

  const groups = useMemo(() => getFilterGroups(cat), [cat]);
  const activeFilterCount = Object.values(filters).reduce((n, arr) => n + arr.length, 0);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";
  const isEmptyCollection = products.length === 0;

  const defaultCategoryId = useMemo(() => {
    if (cat.slug === "all") return adminCatalog.categories[0]?.id ?? "";
    return adminCatalog.categories.find((c) => c.slug === cat.slug)?.id ?? "";
  }, [cat.slug, adminCatalog.categories]);

  const toggleFilter = (key: string, option: string) => {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => setFilters({});

  const sorted = [...products].sort((a: StoreProduct, b: StoreProduct) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return Number(!!b.isNew) - Number(!!a.isNew);
  });

  const handleAdminEdit = async (storeProduct: StoreProduct) => {
    try {
      const adminProduct = await adminCatalog.ensureProduct(
        storeProduct.mongoId,
        storeProduct.slug,
      );
      setEditingProduct(adminProduct);
      setEditOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open product editor.");
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setEditOpen(true);
  };

  const handleProductSaved = async (saved: ApiProduct) => {
    const mapped = storeProductFromApi(saved);
    const belongsHere = cat.slug === "all" || saved.categorySlug === cat.slug;
    setProducts((prev) => {
      const isExisting = prev.some(
        (p) => p.mongoId === saved.id || p.slug === saved.slug,
      );
      if (isExisting) {
        if (!belongsHere) {
          return prev.filter((p) => p.mongoId !== saved.id && p.slug !== saved.slug);
        }
        return prev.map((p) =>
          p.mongoId === saved.id || p.slug === saved.slug ? mapped : p,
        );
      }
      if (belongsHere) return [mapped, ...prev];
      return prev;
    });
    setEditingProduct(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["product"] }),
      router.invalidate(),
    ]);
  };

  const handleAdminDelete = (storeProduct: StoreProduct) => {
    setDeleteTarget(storeProduct);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCatalog.deleteProduct(deleteTarget.mongoId);
      setProducts((prev) => prev.filter((p) => p.mongoId !== deleteTarget.mongoId));
      toast.success("Product deleted");
      setDeleteTarget(null);
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <section className="reveal-ignore relative h-[45vh] sm:h-[50vh] min-h-[280px] sm:min-h-[360px] overflow-hidden -mt-21">
        <img
          src={cat.imageUrl}
          alt={cat.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[color:var(--charcoal)]/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-[color:var(--ivory)] px-4 sm:px-6">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-3 sm:mb-4">The Collection</p>
          <h1 className="font-serif italic text-3xl sm:text-5xl md:text-7xl text-balance">
            {cat.name}
          </h1>
          <p className="mt-4 sm:mt-6 max-w-lg text-sm sm:text-base text-[color:var(--ivory)]/80 px-2">
            {cat.tagline}
          </p>
        </div>
      </section>

      <div className="border-b border-foreground/10 overflow-x-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex items-center gap-6 sm:gap-8 py-4 sm:py-5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop/$category"
              params={{ category: c.slug }}
              className="eyebrow text-[10px] whitespace-nowrap hover:text-[color:var(--maroon)] data-[active]:text-[color:var(--maroon)] data-[active]:border-b data-[active]:border-[color:var(--maroon)] pb-1"
              activeProps={{ "data-active": "" } as Record<string, string>}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div
        data-reveal-section
        data-reveal-direction="alternate"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 grid grid-cols-12 gap-6 sm:gap-8 pb-28 md:pb-14"
      >
        {/* Desktop sidebar — hidden when collection is empty */}
        {!isEmptyCollection && (
        <aside className="hidden md:block md:col-span-3 lg:col-span-2">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 space-y-8 [scrollbar-width:thin]">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[10px] text-foreground/50">Refine</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="eyebrow text-[9px] text-foreground/50 underline underline-offset-2 hover:text-[color:var(--maroon)] transition-colors"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {groups.map((g) => (
              <FilterGroup
                key={g.key}
                title={g.title}
                options={g.options}
                selected={filters[g.key] ?? []}
                onToggle={(option) => toggleFilter(g.key, option)}
              />
            ))}
          </div>
        </aside>
        )}

        <div className={cn("col-span-12", !isEmptyCollection && "md:col-span-9 lg:col-span-10")}>
          {!isEmptyCollection && (
          <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <p className="eyebrow text-[10px] text-foreground/50 order-first sm:order-none">
              {sorted.length} pieces
            </p>

            {/* Desktop-only inline sort — mobile uses the bottom sheet instead */}
            <div className="relative hidden sm:block">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="appearance-none bg-transparent border border-foreground/20 pl-4 pr-9 py-2.5 eyebrow text-[10px] cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Applied filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
              {Object.entries(filters).flatMap(([key, opts]) =>
                opts.map((o) => (
                  <button
                    key={`${key}-${o}`}
                    type="button"
                    onClick={() => toggleFilter(key, o)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 pl-3 pr-2 py-1.5 text-[11px] text-foreground/80 transition-colors hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)]"
                  >
                    {o}
                    <X className="size-3" />
                  </button>
                )),
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-foreground/50 underline underline-offset-2 hover:text-[color:var(--maroon)] transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 min-w-0">
            {sorted.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdminEdit={isAdmin ? handleAdminEdit : undefined}
                onAdminDelete={isAdmin ? handleAdminDelete : undefined}
              />
            ))}
          </div>
          </>
          )}

          {isEmptyCollection && (
            <CategoryEmptyState
              categoryName={cat.name}
              isAdmin={isAdmin}
              adminReady={adminCatalog.ready}
              adminLoading={adminCatalog.loading}
              onAddProduct={openAddProduct}
            />
          )}
        </div>
      </div>

      {/* Mobile — fixed filter/sort bar */}
      {!isEmptyCollection && (
      <div className="md:hidden fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-30 grid grid-cols-2 divide-x divide-foreground/10 border-t border-foreground/10 bg-background/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setMobileSheet("filter")}
          className="flex items-center justify-center gap-2 py-3.5 eyebrow text-[10px] min-h-11"
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.6} />
          Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setMobileSheet("sort")}
          className="flex items-center justify-center gap-2 py-3.5 eyebrow text-[10px] min-h-11"
        >
          <ArrowUpDown className="size-3.5" strokeWidth={1.6} />
          {sortLabel}
        </button>
      </div>
      )}

      {mobileSheet === "filter" && !isEmptyCollection && (
        <BottomSheet
          title="Filters"
          onClose={() => setMobileSheet(null)}
          footer={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 border border-foreground/20 py-3.5 eyebrow text-[10px]"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="flex-[2] bg-[color:var(--maroon)] text-[color:var(--ivory)] py-3.5 eyebrow text-[10px]"
              >
                Show {sorted.length} results
              </button>
            </div>
          }
        >
          <div className="space-y-8">
            {groups.map((g) => (
              <FilterGroup
                key={g.key}
                title={g.title}
                options={g.options}
                selected={filters[g.key] ?? []}
                onToggle={(option) => toggleFilter(g.key, option)}
              />
            ))}
          </div>
        </BottomSheet>
      )}

      {mobileSheet === "sort" && !isEmptyCollection && (
        <BottomSheet title="Sort by" onClose={() => setMobileSheet(null)}>
          <div className="space-y-1">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setSort(o.value);
                  setMobileSheet(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between py-4 text-left text-[15px] min-h-11",
                  sort === o.value ? "text-[color:var(--maroon)]" : "text-foreground",
                )}
              >
                {o.label}
                {sort === o.value && <Check className="size-4" strokeWidth={1.8} />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {isAdmin && (
        <ProductEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          product={editingProduct}
          categories={adminCatalog.categories}
          defaultCategoryId={defaultCategoryId}
          onSave={async (id, body) => {
            if (id) return adminCatalog.updateProduct(id, body);
            return adminCatalog.createProduct(body);
          }}
          uploadMedia={adminCatalog.uploadMedia}
          onSaved={handleProductSaved}
        />
      )}

      <AdminModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Delete product"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}

function CategoryEmptyState({
  categoryName,
  isAdmin,
  adminReady,
  adminLoading,
  onAddProduct,
}: {
  categoryName: string;
  isAdmin: boolean;
  adminReady: boolean;
  adminLoading: boolean;
  onAddProduct: () => void;
}) {
  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 border border-dashed border-foreground/15 bg-[color:var(--muted)]/20">
        <p className="eyebrow text-[10px] text-[color:var(--gold)] mb-4">Admin</p>
        <h2 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-3">
          No products in {categoryName} yet
        </h2>
        <p className="text-sm text-foreground/60 max-w-md mb-8 leading-relaxed">
          This collection is empty. Add the first piece here — it will appear on the storefront
          as soon as you save.
        </p>
        <button
          type="button"
          onClick={onAddProduct}
          disabled={!adminReady || adminLoading}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-8 py-3.5 text-[11px] font-medium tracking-[0.18em] text-[color:var(--ivory)] transition-colors hover:bg-[color:var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adminLoading || !adminReady ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" strokeWidth={1.6} />
          )}
          Add product
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 sm:py-28 px-4">
      <p className="eyebrow text-[10px] text-foreground/45 mb-4">Coming soon</p>
      <h2 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-3">
        This collection is being curated
      </h2>
      <p className="text-sm text-foreground/60 max-w-md mb-10 leading-relaxed">
        New pieces for {categoryName} will appear here shortly. Explore our other collections or
        speak with our concierge for bespoke requests.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <Link
          to="/shop/$category"
          params={{ category: "all" }}
          className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-7 py-3 text-[11px] tracking-[0.16em] hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
        >
          View all collections
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--charcoal)] px-7 py-3 text-[11px] tracking-[0.16em] text-[color:var(--ivory)] hover:bg-[color:var(--maroon)] transition-colors"
        >
          Contact concierge
        </Link>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  if (!options.length) return null;

  return (
    <details open className="group border-b border-foreground/10 pb-6 last:border-b-0 last:pb-0">
      <summary className="flex items-center justify-between cursor-pointer eyebrow text-[10px] list-none">
        <span className="flex items-center gap-1.5">
          {title}
          {selected.length > 0 && (
            <span className="text-[color:var(--maroon)]">({selected.length})</span>
          )}
        </span>
        <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-4 space-y-3">
        {options.map((o) => (
          <li key={o}>
            <label className="flex items-center gap-3 text-[13px] text-foreground/70 cursor-pointer hover:text-foreground min-h-6">
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => onToggle(o)}
                className="size-4 accent-[color:var(--maroon)]"
              />
              {o}
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}

// Slide-up sheet used for both the Filter and Sort mobile flows.
function BottomSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-40 bg-[color:var(--charcoal)]/40 animate-reveal"
      />
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 flex max-h-[82vh] flex-col rounded-t-2xl bg-background shadow-2xl animate-reveal"
        data-lenis-prevent
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-foreground/15" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 pb-4">
          <h3 className="font-serif text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-11 min-w-11 items-center justify-center text-foreground/70 hover:text-foreground"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5" data-lenis-prevent>
          {children}
        </div>
        {footer && (
          <div className="border-t border-foreground/10 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}