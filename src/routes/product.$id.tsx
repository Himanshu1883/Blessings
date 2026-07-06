import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProduct, PRODUCTS } from "@/lib/catalog";
import { useCurrency } from "@/lib/currency";
import { useState } from "react";
import { Heart, Ruler, Scissors, Truck, Shield, ChevronDown, ArrowRight } from "lucide-react";
import { ProductCard } from "./index";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => {
    const p = getProduct(params.id);
    const title = p ? `${p.name} — Blessings` : "Product — Blessings";
    const desc = p?.description ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p ? [{ property: "og:image", content: p.image }] : []),
      ],
    };
  },
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return { product: p };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif italic text-2xl">Product not found.</p>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { format } = useCurrency();
  const [size, setSize] = useState("M");
  const complete = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 pt-8">
        <nav className="eyebrow text-[10px] text-foreground/50 flex items-center gap-2">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/shop/$category" params={{ category: product.categorySlug }} className="hover:text-foreground capitalize">{product.categorySlug.replace("-", " ")}</Link>
          <span>/</span>
          <span className="text-foreground/70">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-10 grid grid-cols-12 gap-8 lg:gap-16">
        {/* Gallery */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
          <img src={product.image} alt={product.name} className="w-full aspect-[3/4] object-cover md:col-span-2" />
          <img src={product.image} alt="" className="w-full aspect-square object-cover" />
          <img src={product.image} alt="" className="w-full aspect-square object-cover" />
        </div>

        {/* Sticky info */}
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-32 space-y-8">
            <div>
              <p className="eyebrow text-[color:var(--gold)] mb-3">The {product.categorySlug.replace("-", " ")}</p>
              <h1 className="font-serif italic text-4xl md:text-5xl leading-tight">{product.name}</h1>
              <p className="mt-4 eyebrow text-[10px] text-foreground/60">{product.fabric}</p>
              <p className="mt-6 text-2xl font-serif text-[color:var(--maroon)] tabular-nums">{format(product.price)}</p>
              <p className="mt-2 text-[11px] text-foreground/50">Inclusive of all duties. Complimentary worldwide shipping.</p>
            </div>

            <p className="text-sm leading-relaxed text-foreground/70">{product.description}</p>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="eyebrow text-[10px]">Size</span>
                <button className="eyebrow text-[10px] text-foreground/60 border-b border-foreground/20 pb-0.5 hover:text-[color:var(--maroon)]">Size Guide</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-11 border text-xs transition-colors ${size === s ? "border-[color:var(--maroon)] bg-[color:var(--maroon)] text-[color:var(--ivory)]" : "border-foreground/20 hover:border-foreground/60"}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button className="w-full bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] text-[color:var(--ivory)] py-4 eyebrow text-[10.5px] transition-colors flex items-center justify-center gap-3">
                Add to Cart
              </button>
              <button className="w-full border border-[color:var(--maroon)] text-[color:var(--maroon)] hover:bg-[color:var(--maroon)] hover:text-[color:var(--ivory)] py-4 eyebrow text-[10.5px] transition-colors">
                Book a Custom Fitting
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 eyebrow text-[10px] text-foreground/60 py-2">
                <Heart className="size-3.5" /> Add to Wishlist
              </button>
            </div>

            {/* Meta rows */}
            <div className="space-y-1 border-t border-foreground/10 pt-2">
              {[
                { icon: Scissors, t: "Fabric & Craftsmanship", body: "Hand-embroidered by our Delhi atelier over 30+ days. Fully canvassed construction, silk lining." },
                { icon: Ruler, t: "Size & Fit", body: "Model is 6'1\" wearing size M. Slim, tailored silhouette. Made-to-measure available." },
                { icon: Truck, t: "Shipping & Delivery", body: "Complimentary worldwide express shipping. Delivered in 10–15 business days." },
                { icon: Shield, t: "Care", body: "Dry-clean only. Store on padded hanger with muslin cover." },
              ].map((row) => (
                <details key={row.t} className="border-b border-foreground/10 group">
                  <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
                    <span className="flex items-center gap-3 eyebrow text-[10px]"><row.icon className="size-3.5" strokeWidth={1.4} /> {row.t}</span>
                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 text-sm text-foreground/60 leading-relaxed">{row.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complete the look */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-8 py-24 border-t border-foreground/10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow text-[color:var(--gold)] mb-3">Complete the Look</p>
            <h2 className="font-serif italic text-3xl md:text-4xl">You may also love</h2>
          </div>
          <Link to="/shop/$category" params={{ category: product.categorySlug }} className="eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:text-[color:var(--maroon)]">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {complete.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}