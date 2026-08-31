import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { Heart, Ruler, Scissors, Truck, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "./index";
import { cn } from "@/lib/utils";
import { fetchProduct, fetchProducts, storeProductFromApi, type StoreProduct } from "@/lib/catalog-api";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { ProductGallery } from "@/components/site/product-gallery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { whatsappUrl } from "@/lib/whatsapp";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { Button } from "@/components/ui/button";
import { useAdminProductCatalog } from "@/hooks/useAdminProductCatalog";
import type { AdminProduct } from "@/lib/admin/product-form";
import type { ApiProduct } from "@/lib/api-types";
import { AdminProductActions } from "@/components/site/admin-product-actions";

export const Route = createFileRoute("/product/$id")({
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Blessings` : "Product — Blessings";
    const desc = p?.description ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p?.imageUrl ? [{ property: "og:image", content: p.imageUrl }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const product = await fetchProduct(params.id);
    if (!product) throw notFound();
    const pool = await fetchProducts(product.categorySlug || undefined);
    let related = pool.filter((p) => p.id !== product.id).slice(0, 4);
    if (related.length < 4) {
      const all = await fetchProducts();
      const extras = all.filter(
        (p) => p.id !== product.id && !related.some((r) => r.id === p.id),
      );
      related = [...related, ...extras].slice(0, 4);
    }
    return { product, related };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif text-2xl">Product not found.</p>
    </div>
  ),
});

const SIZE_CHART = [
  { size: "S", chest: "38", waist: "32", shoulder: "17" },
  { size: "M", chest: "40", waist: "34", shoulder: "17.5" },
  { size: "L", chest: "42", waist: "36", shoulder: "18" },
  { size: "XL", chest: "44", waist: "38", shoulder: "18.5" },
  { size: "XXL", chest: "46", waist: "40", shoulder: "19" },
];

function ProductPage() {
  const { product, related: relatedFromLoader } = Route.useLoaderData();
  const { format } = useCurrency();
  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const router = useRouter();
  const navigate = useNavigate();
  const adminCatalog = useAdminProductCatalog(isAdmin);
  const [related, setRelated] = useState(relatedFromLoader);
  const [size, setSize] = useState(product.sizes[0] ?? "M");
  const saved = isInWishlist(product.mongoId);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const gallery =
    product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const categoryLabel = product.categorySlug.replace(/-/g, " ");

  useEffect(() => {
    setSize(product.sizes[0] ?? "M");
    setRelated(relatedFromLoader);
  }, [product.slug, product.sizes, relatedFromLoader]);

  useEffect(() => {
    addRecentlyViewed({
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  }, [product.slug, product.name, product.price, product.imageUrl]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product.slug]);

  const handleAdd = () => {
    addToCart(product.mongoId, size);
    toast.success("Added to your bag.");
  };

  const handleWishlist = () => {
    toggleWishlist(product.mongoId);
    if (isAuthenticated) toast.success(saved ? "Removed from wishlist." : "Saved to wishlist.");
  };

  const handleAdminEdit = (storeProduct: StoreProduct) => {
    const adminProduct = adminCatalog.products.find((p) => p.id === storeProduct.mongoId);
    if (!adminProduct) {
      toast.error("Product details are still loading. Please try again.");
      return;
    }
    setEditingProduct(adminProduct);
    setEditOpen(true);
  };

  const handleProductSaved = async (saved: ApiProduct) => {
    const mapped = storeProductFromApi(saved);
    if (editingProduct?.id === product.mongoId && mapped.slug !== product.slug) {
      await navigate({ to: "/product/$id", params: { id: mapped.slug } });
      return;
    }
    await router.invalidate();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCatalog.deleteProduct(deleteTarget.mongoId);
      toast.success("Product deleted");
      const deletingCurrent = deleteTarget.mongoId === product.mongoId;
      setDeleteTarget(null);
      if (deletingCurrent) {
        await navigate({
          to: "/shop/$category",
          params: { category: product.categorySlug || "all" },
        });
      } else {
        setRelated((prev) => prev.filter((p) => p.mongoId !== deleteTarget.mongoId));
        await router.invalidate();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-8 pt-5 sm:pt-8 pb-10 lg:pb-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7 lg:sticky lg:top-[calc(var(--header-height)+1.25rem)] lg:self-start">
            <ProductGallery key={product.slug} images={gallery} alt={product.name} />
          </div>

          <div className="lg:col-span-5">
            <nav className="eyebrow mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[10px] text-foreground/45">
            <Link to="/" className="hover:text-foreground shrink-0">
              Home
            </Link>
            <span>/</span>
            <Link
              to="/shop/$category"
              params={{ category: product.categorySlug }}
              className="hover:text-foreground capitalize shrink-0"
            >
              {categoryLabel}
            </Link>
            <span>/</span>
            <span className="truncate text-foreground/70">{product.name}</span>
          </nav>

          <div className="max-w-xl space-y-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <p className="eyebrow text-[color:var(--gold)]">The {categoryLabel}</p>
                {product.isNew && (
                  <span className="eyebrow bg-[color:var(--charcoal)] px-2 py-1 text-[9px] text-[color:var(--ivory)]">
                    New
                  </span>
                )}
                {product.bestSeller && (
                  <span className="eyebrow border border-foreground/15 px-2 py-1 text-[9px]">
                    Bestseller
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-3xl leading-tight text-balance sm:text-4xl xl:text-[2.75rem]">
                  {product.name}
                </h1>
                {isAdmin && (
                  <AdminProductActions
                    layout="row"
                    disabled={!adminCatalog.ready}
                    onEdit={() => handleAdminEdit(product)}
                    onDelete={() => setDeleteTarget(product)}
                  />
                )}
              </div>
              {product.fabric ? (
                <p className="mt-4 eyebrow text-[10px] text-foreground/55">{product.fabric}</p>
              ) : null}
              <p className="mt-6 font-serif text-2xl tabular-nums text-[color:var(--maroon)]">
                {format(product.price)}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-foreground/45">
                Inclusive of all duties. Complimentary worldwide shipping.
              </p>
            </div>

            {product.sizes.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="eyebrow text-[10px]">Select size</p>
                  <span className="text-[11px] text-foreground/40">Size {size}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={cn(
                        "min-w-12 px-4 py-2.5 border eyebrow text-[10px] transition-colors",
                        size === s
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-[color:var(--ivory)]"
                          : "border-foreground/15 hover:border-foreground/40",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={ctaRef} className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 bg-[color:var(--charcoal)] py-4 eyebrow text-[10px] tracking-[0.22em] text-[color:var(--ivory)] transition-colors hover:bg-[color:var(--maroon)]"
              >
                Add to bag
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                className="flex items-center justify-center gap-2 border border-foreground/15 px-6 py-4 eyebrow text-[10px] transition-colors hover:border-[color:var(--maroon)]"
              >
                <Heart
                  className={cn("size-4", saved && "fill-[color:var(--maroon)] text-[color:var(--maroon)]")}
                  strokeWidth={1.5}
                />
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-foreground/10 py-5">
              {[
                [Truck, "Worldwide shipping"],
                [Shield, "Secure checkout"],
                [Ruler, "Complimentary alterations"],
                [Scissors, "Made to order"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-3 text-[11px] text-foreground/60">
                  <Icon className="size-4 shrink-0" strokeWidth={1.3} />
                  {label as string}
                </div>
              ))}
            </div>

            <Accordion type="single" collapsible defaultValue="story" className="w-full">
              <AccordionItem value="story" className="border-foreground/10">
                <AccordionTrigger className="eyebrow py-4 text-[10px] tracking-[0.22em] hover:no-underline">
                  The piece
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-foreground/70">
                  {product.description || "A Blessings atelier piece, cut and finished in Delhi."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="fabric" className="border-foreground/10">
                <AccordionTrigger className="eyebrow py-4 text-[10px] tracking-[0.22em] hover:no-underline">
                  Fabric & care
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm leading-relaxed text-foreground/70">
                  {product.fabric ? <p>{product.fabric}</p> : null}
                  <p>Dry clean only. Store on a wide hanger, away from direct sunlight.</p>
                  <p>Complimentary pressing on first wear when collected from the atelier.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="size" className="border-foreground/10">
                <AccordionTrigger className="eyebrow py-4 text-[10px] tracking-[0.22em] hover:no-underline">
                  Size guide
                </AccordionTrigger>
                <AccordionContent>
                  <table className="w-full text-left text-[12px] text-foreground/70">
                    <thead>
                      <tr className="eyebrow text-[9px] text-foreground/45">
                        <th className="pb-2 font-medium">Size</th>
                        <th className="pb-2 font-medium">Chest</th>
                        <th className="pb-2 font-medium">Waist</th>
                        <th className="pb-2 font-medium">Shoulder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CHART.map((row) => (
                        <tr
                          key={row.size}
                          className={cn(
                            "border-t border-foreground/10",
                            row.size === size && "text-foreground",
                          )}
                        >
                          <td className="py-2">{row.size}</td>
                          <td className="py-2">{row.chest}</td>
                          <td className="py-2">{row.waist}</td>
                          <td className="py-2">{row.shoulder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-[11px] text-foreground/45">Measurements in inches. Need a custom fit? Ask the atelier.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-foreground/10">
                <AccordionTrigger className="eyebrow py-4 text-[10px] tracking-[0.22em] hover:no-underline">
                  Shipping & returns
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm leading-relaxed text-foreground/70">
                  <p>Complimentary worldwide shipping. Made-to-order pieces dispatch in 3–5 weeks.</p>
                  <p>Ready pieces leave Delhi within 3–5 working days. Returns accepted within 7 days, unworn, with tags.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <a
              href={whatsappUrl(`Hi Blessings, I'm interested in ${product.name}. Could you help with sizing or a custom fit?`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[12px] text-foreground/60 transition-colors hover:text-[color:var(--maroon)]"
            >
              Talk to the atelier
              <ArrowRight className="size-3.5" />
            </a>
          </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section
          data-reveal-section
          className="mx-auto max-w-[1600px] border-t border-foreground/10 px-4 py-16 sm:px-6 sm:py-24 md:px-8"
        >
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">Complete the look</h2>
            <Link
              to="/shop/$category"
              params={{ category: product.categorySlug }}
              className="eyebrow flex items-center gap-2 text-[10px] hover:text-[color:var(--maroon)]"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdminEdit={isAdmin ? handleAdminEdit : undefined}
                onAdminDelete={isAdmin ? setDeleteTarget : undefined}
                adminEditReady={adminCatalog.ready}
              />
            ))}
          </div>
        </section>
      )}

      <div
        className={cn(
          "fixed inset-x-0 z-40 border-t border-foreground/10 bg-[color:var(--ivory)]/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 lg:hidden",
          "bottom-[calc(62px+env(safe-area-inset-bottom))]",
          showSticky ? "translate-y-0" : "translate-y-[120%]",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="font-serif text-[color:var(--maroon)] tabular-nums">{format(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 bg-[color:var(--charcoal)] px-5 py-3 eyebrow text-[10px] tracking-[0.18em] text-[color:var(--ivory)]"
          >
            Add · {size}
          </button>
        </div>
      </div>

      {isAdmin && (
        <ProductEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          product={editingProduct}
          categories={adminCatalog.categories}
          defaultCategoryId={
            adminCatalog.categories.find((c) => c.slug === product.categorySlug)?.id ?? ""
          }
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
