import { useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { resolveMediaUrl } from "@/lib/api-client";
import type { ApiProduct } from "@/lib/api-types";
import type { RecentProduct } from "@/lib/recently-viewed";

export function ProfileRecentCarousel({
  recent,
  catalog,
}: {
  recent: RecentProduct[];
  catalog: ApiProduct[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { format } = useCurrency();
  const { addToCart } = useShop();

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px] tracking-[0.28em] text-[color:var(--gold)]">On this device</p>
          <h2 className="profile-display mt-2 text-3xl italic sm:text-4xl">Recently viewed</h2>
        </div>
        {recent.length > 0 ? (
          <div className="mb-1 hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollBy(-1)}
              className="flex size-9 items-center justify-center rounded-full border border-[color:var(--gold)]/40 bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"
            >
              <ChevronLeft className="size-4" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollBy(1)}
              className="flex size-9 items-center justify-center rounded-full border border-[color:var(--gold)]/40 bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"
            >
              <ChevronRight className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        ) : null}
      </div>

      {recent.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">Pieces you open will appear here on this device.</p>
      ) : (
        <div
          ref={scrollerRef}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {recent.map((item) => {
            const match = catalog.find((p) => p.slug === item.slug);
            const productId = item.productId || match?.id;
            const src = resolveMediaUrl(item.imageUrl) ?? item.imageUrl;

            const handleAdd = () => {
              if (!productId) {
                toast.message("Open the piece to add it to your bag.");
                return;
              }
              addToCart(productId, match?.sizes?.[0] ?? "M");
              toast.success("Added to your bag.");
            };

            return (
              <article
                key={item.slug}
                className="w-[min(220px,78vw)] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-[0_10px_32px_rgba(40,16,10,0.06)] sm:w-[210px]"
              >
                <Link
                  to="/product/$id"
                  params={{ id: item.slug }}
                  className="block aspect-[3/4] overflow-hidden bg-muted"
                >
                  {src ? (
                    <img src={src} alt={item.name} className="size-full object-cover" loading="lazy" />
                  ) : null}
                </Link>
                <div className="flex flex-col px-3.5 pb-4 pt-3">
                  <Link to="/product/$id" params={{ id: item.slug }}>
                    <h3 className="profile-display line-clamp-2 min-h-10 text-[15px] leading-snug text-[color:var(--charcoal)]">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-[color:var(--charcoal)]">
                    {format(item.price)}
                  </p>
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--maroon)] text-[12px] font-medium text-white transition-colors hover:bg-[color:var(--maroon)]/90"
                  >
                    <ShoppingBag className="size-3.5" strokeWidth={1.7} />
                    Add to bag
                  </button>
                  <Link
                    to="/product/$id"
                    params={{ id: item.slug }}
                    className="mt-2.5 text-center text-[12px] text-[color:var(--gold)] hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
