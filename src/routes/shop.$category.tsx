import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "./index";
import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { fetchCategory, fetchCategories, fetchProducts } from "@/lib/catalog-api";
import type { StoreProduct } from "@/lib/catalog-api";

export const Route = createFileRoute("/shop/$category")({
  head: ({ loaderData }) => {
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
    const [cat, categories, products] = await Promise.all([
      fetchCategory(params.category),
      fetchCategories(),
      fetchProducts(params.category),
    ]);
    if (!cat) throw notFound();
    return { cat, categories, products };
  },
  component: ShopCategory,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif italic text-2xl">Category not found.</p>
    </div>
  ),
});

function ShopCategory() {
  const { cat, categories, products } = Route.useLoaderData();
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [openFilters, setOpenFilters] = useState(false);

  const sorted = [...products].sort((a: StoreProduct, b: StoreProduct) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return Number(!!b.isNew) - Number(!!a.isNew);
  });

  return (
    <div>
      <section className="reveal-ignore relative h-[45vh] sm:h-[50vh] min-h-[280px] sm:min-h-[360px] overflow-hidden">
        <img src={cat.imageUrl} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[color:var(--charcoal)]/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-[color:var(--ivory)] px-4 sm:px-6">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-3 sm:mb-4">The Collection</p>
          <h1 className="font-serif italic text-3xl sm:text-5xl md:text-7xl text-balance">{cat.name}</h1>
          <p className="mt-4 sm:mt-6 max-w-lg text-sm sm:text-base text-[color:var(--ivory)]/80 px-2">{cat.tagline}</p>
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

      <div data-reveal-section data-reveal-direction="alternate" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 grid grid-cols-12 gap-6 sm:gap-8">
        <aside className={`col-span-12 md:col-span-3 lg:col-span-2 ${openFilters ? "block" : "hidden md:block"}`}>
          <div className="sticky top-32 space-y-8">
            <FilterGroup title="Sub-Category" options={cat.subCategories} />
            <FilterGroup title="Fabric" options={["Silk", "Velvet", "Cotton", "Wool", "Linen"]} />
            <FilterGroup title="Color" options={["Ivory", "Maroon", "Emerald", "Midnight", "Charcoal", "Pastel"]} />
            <FilterGroup title="Occasion" options={["Wedding", "Engagement", "Reception", "Sangeet", "Cocktail"]} />
            <FilterGroup title="Size" options={["XS", "S", "M", "L", "XL", "XXL", "Custom"]} />
          </div>
        </aside>

        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button onClick={() => setOpenFilters((o) => !o)} className="md:hidden inline-flex items-center gap-2 eyebrow text-[10px] min-h-11">
              <SlidersHorizontal className="size-3.5" /> Filter
            </button>
            <p className="eyebrow text-[10px] text-foreground/50 order-first sm:order-none">{sorted.length} pieces</p>
            <div className="relative w-full sm:w-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "new" | "price-asc" | "price-desc")}
                className="appearance-none bg-transparent border border-foreground/20 pl-4 pr-9 py-2.5 eyebrow text-[10px] cursor-pointer w-full sm:w-auto"
              >
                <option value="new">Newest</option>
                <option value="price-asc">Price — Low to High</option>
                <option value="price-desc">Price — High to Low</option>
              </select>
              <ChevronDown className="size-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 min-w-0">
            {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <details open className="border-b border-foreground/10 pb-6">
      <summary className="flex items-center justify-between cursor-pointer eyebrow text-[10px] list-none">
        {title}
        <ChevronDown className="size-3" />
      </summary>
      <ul className="mt-4 space-y-2.5">
        {options.map((o) => (
          <li key={o}>
            <label className="flex items-center gap-3 text-xs text-foreground/70 cursor-pointer hover:text-foreground">
              <input type="checkbox" className="accent-[color:var(--maroon)]" /> {o}
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}
