import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { useState } from "react";
import { Heart, Ruler, Scissors, Truck, Shield, ChevronDown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "./index";
import { cn } from "@/lib/utils";
import { fetchProduct, fetchProducts } from "@/lib/catalog-api";

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
    const all = await fetchProducts();
    return { product, related: all.filter((p) => p.id !== product.id).slice(0, 4) };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif italic text-2xl">Product not found.</p>
    </div>
  ),
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const { format } = useCurrency();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const [size, setSize] = useState(product.sizes[0] ?? "M");
  const saved = isInWishlist(product.mongoId);

  return (
    <div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8">
        <nav className="eyebrow text-[10px] text-foreground/50 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-foreground shrink-0">Home</Link>
          <span>/</span>
          <Link to="/shop/$category" params={{ category: product.categorySlug }} className="hover:text-foreground capitalize shrink-0">{product.categorySlug.replace("-", " ")}</Link>
          <span>/</span>
          <span className="text-foreground/70 truncate">{product.name}</span>
        </nav>
      </div>

      <div data-reveal-section data-reveal-direction="split" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 grid grid-cols-12 gap-6 sm:gap-8 lg:gap-16">
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
          <img src={product.imageUrl} alt={product.name} className="w-full aspect-[3/4] object-cover md:col-span-2" />
          <img src={product.imageUrl} alt="" className="w-full aspect-square object-cover" />
          <img src={product.imageUrl} alt="" className="w-full aspect-square object-cover" />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-32 space-y-8">
            <div>
              <p className="eyebrow text-[color:var(--gold)] mb-3">The {product.categorySlug.replace("-", " ")}</p>
              <h1 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">{product.name}</h1>
              <p className="mt-4 eyebrow text-[10px] text-foreground/60">{product.fabric}</p>
              <p className="mt-6 text-2xl font-serif text-[color:var(--maroon)] tabular-nums">{format(product.price)}</p>
              <p className="mt-2 text-[11px] text-foreground/50">Inclusive of all duties. Complimentary worldwide shipping.</p>
            </div>

            <p className="text-sm leading-relaxed text-foreground/70">{product.description}</p>

            <div>
              <p className="eyebrow text-[10px] mb-3">Select size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-12 px-4 py-2 border eyebrow text-[10px] transition-colors",
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  addToCart(product.mongoId, size);
                  toast.success("Added to your bag.");
                }}
                className="flex-1 bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] text-[color:var(--ivory)] py-4 eyebrow text-[10px] tracking-[0.2em] transition-colors"
              >
                Add to bag
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleWishlist(product.mongoId);
                  toast.success(saved ? "Removed from wishlist." : "Saved to wishlist.");
                }}
                className="px-6 py-4 border border-foreground/15 hover:border-[color:var(--maroon)] transition-colors flex items-center justify-center gap-2 eyebrow text-[10px]"
              >
                <Heart className={cn("size-4", saved && "fill-[color:var(--maroon)] text-[color:var(--maroon)]")} strokeWidth={1.5} />
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/10">
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
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section data-reveal-section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 border-t border-foreground/10">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif italic text-3xl">Complete the look</h2>
            <Link to="/shop/$category" params={{ category: product.categorySlug }} className="eyebrow text-[10px] flex items-center gap-2 hover:text-[color:var(--maroon)]">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
