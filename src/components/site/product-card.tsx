import { useEffect, useState, type MouseEvent } from "react";
import { ArrowRight, Globe, Heart, ShoppingBag } from "lucide-react";
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
  const thumbs = images.slice(0, 3);

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
        "group flex min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(40,16,10,0.08)] lg:rounded-2xl lg:border lg:border-foreground/10 lg:shadow-sm",
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
          <span className="pointer-events-none absolute top-2 left-2 z-10 rounded-md bg-[color:var(--gold)] px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.16em] text-white lg:top-3 lg:left-3 lg:rounded-full lg:px-3 lg:py-1 lg:text-[9px] lg:tracking-[0.2em]">
            New
          </span>
        )}

        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5 lg:top-3 lg:right-3 lg:gap-2">
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={handleWishlist}
            className="flex size-8 items-center justify-center rounded-full border border-foreground/10 bg-white text-[color:var(--charcoal)] shadow-sm lg:size-9 lg:border-[color:var(--gold)] lg:bg-white/90 lg:text-[color:var(--gold)] lg:backdrop-blur-sm lg:hover:bg-[color:var(--gold)] lg:hover:text-[color:var(--charcoal)]"
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
          <div className="absolute top-1/2 left-1.5 z-10 flex -translate-y-1/2 flex-col gap-1 lg:left-3 lg:gap-2">
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
                  "size-7 overflow-hidden rounded-md border bg-white/90 lg:size-10 lg:rounded-lg",
                  i === activeIndex
                    ? "border-white ring-1 ring-[color:var(--gold)]"
                    : "border-white/90 hover:border-[color:var(--gold)]",
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-[color:var(--ivory)] px-2.5 py-2.5 lg:gap-4 lg:bg-white lg:px-5 lg:py-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to="/product/$id" params={{ id: product.id }}>
              <h4 className="profile-display line-clamp-2 text-[13px] leading-snug text-[color:var(--charcoal)] lg:font-serif lg:text-xl lg:text-balance">
                {product.name}
              </h4>
            </Link>
            {product.fabric ? (
              <p className="mt-1 flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.18em] text-[color:var(--charcoal)]/55 lg:mt-2 lg:text-[9px] lg:tracking-[0.22em] lg:text-[color:var(--gold)]">
                <Globe className="size-2.5 shrink-0 lg:hidden" strokeWidth={1.75} />
                <span className="truncate">{product.fabric}</span>
              </p>
            ) : null}
          </div>
          <p className="profile-display shrink-0 text-[13px] tabular-nums text-[color:var(--maroon)] lg:font-serif lg:text-xl">
            {format(product.price)}
          </p>
        </div>

        <div className="mt-2 h-px bg-[color:var(--gold)]/25 lg:hidden" />

        <div className="mt-2 grid grid-cols-[1.15fr_1fr] gap-1.5 lg:mt-auto lg:grid-cols-[1.4fr_1fr] lg:gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md bg-[color:var(--charcoal)] px-1.5 text-[8px] font-medium uppercase tracking-[0.08em] text-white lg:min-h-11 lg:gap-2 lg:rounded-full lg:px-3 lg:eyebrow lg:text-[9px] lg:tracking-[0.16em] lg:text-[color:var(--ivory)] lg:shadow-sm lg:hover:bg-[color:var(--maroon)]"
          >
            <ShoppingBag className="size-3 shrink-0 lg:size-3.5" strokeWidth={1.6} />
            <span className="truncate">Add to bag</span>
          </button>
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="inline-flex min-h-8 items-center justify-center gap-0.5 rounded-md border border-[color:var(--gold)]/40 bg-transparent px-1.5 text-[8px] font-medium uppercase tracking-[0.08em] text-[color:var(--charcoal)]/80 lg:min-h-11 lg:rounded-full lg:border-foreground/15 lg:bg-[color:var(--ivory)] lg:px-3 lg:eyebrow lg:text-[9px] lg:tracking-[0.16em] lg:text-[color:var(--charcoal)] lg:hover:border-[color:var(--gold)] lg:hover:text-[color:var(--maroon)]"
          >
            <span className="truncate">View details</span>
            <ArrowRight className="size-2.5 shrink-0 lg:hidden" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </article>
  );
}
