import { useEffect, useState, type MouseEvent } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminProductActions } from "@/components/site/admin-product-actions";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import type { StoreProduct } from "@/lib/catalog-api";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  layout = "grid",
  onAdminEdit,
  onAdminDelete,
  adminEditReady = true,
}: {
  product: StoreProduct;
  layout?: "grid" | "carousel";
  onAdminEdit?: (product: StoreProduct) => void;
  onAdminDelete?: (product: StoreProduct) => void;
  adminEditReady?: boolean;
}) {
  const { format } = useCurrency();
  const { toggleWishlist, isInWishlist, addToCart } = useShop();
  const saved = isInWishlist(product.mongoId);
  const images =
    product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSrc = images[activeIndex] ?? product.imageUrl;
  const thumbs = images.slice(0, 4);

  useEffect(() => {
    setActiveIndex(0);
  }, [product.id, product.imageUrl]);

  const handleAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.mongoId, product.sizes[0] ?? "M");
    toast.success("Added to your bag.");
  };

  const handleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.mongoId);
    toast.success(saved ? "Removed from wishlist." : "Saved to wishlist.");
  };

  return (
    <article
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-sm",
        layout === "carousel" && "w-[min(280px,85vw)] shrink-0 snap-start md:w-[300px]",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
        <Link to="/product/$id" params={{ id: product.id }} className="absolute inset-0 block">
          {activeSrc ? (
            <img
              src={activeSrc}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
            />
          ) : null}
        </Link>

        {product.isNew && (
          <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-[color:var(--gold)] px-3 py-1 eyebrow text-[9px] tracking-[0.2em] text-white">
            New
          </span>
        )}

        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={handleWishlist}
            className="flex size-9 items-center justify-center rounded-full border border-[color:var(--gold)] bg-white/90 text-[color:var(--gold)] shadow-sm backdrop-blur-sm transition-colors hover:bg-[color:var(--gold)] hover:text-[color:var(--charcoal)]"
          >
            <Heart className={cn("size-3.5", saved && "fill-current")} strokeWidth={1.6} />
          </button>
          {(onAdminEdit || onAdminDelete) && (
            <AdminProductActions
              layout="stack"
              tone="light"
              disabled={!adminEditReady}
              onEdit={onAdminEdit ? () => onAdminEdit(product) : undefined}
              onDelete={onAdminDelete ? () => onAdminDelete(product) : undefined}
            />
          )}
        </div>

        {thumbs.length > 1 && (
          <div className="absolute top-1/2 left-2 z-10 flex -translate-y-1/2 flex-col gap-1.5 sm:left-3 sm:gap-2">
            {thumbs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                aria-label={`View image ${i + 1}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                className={cn(
                  "size-8 overflow-hidden rounded-lg border bg-white/80 sm:size-10",
                  i === activeIndex
                    ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)]"
                    : "border-white/70 hover:border-[color:var(--gold)]",
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/product/$id" params={{ id: product.id }}>
              <h4 className="font-serif text-lg leading-snug text-balance text-[color:var(--charcoal)] sm:text-xl">
                {product.name}
              </h4>
            </Link>
            {product.fabric ? (
              <p className="mt-2 eyebrow text-[9px] tracking-[0.22em] text-[color:var(--gold)]">
                {product.fabric}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 font-serif text-lg tabular-nums text-[color:var(--maroon)] sm:text-xl">
            {format(product.price)}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-[1.4fr_1fr] gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--charcoal)] px-3 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--ivory)] shadow-sm transition-colors hover:bg-[color:var(--maroon)]"
          >
            <ShoppingBag className="size-3.5" strokeWidth={1.6} />
            Add to bag
          </button>
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/15 bg-[color:var(--ivory)] px-3 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--charcoal)] transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--maroon)]"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
