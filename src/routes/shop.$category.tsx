import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategory, productsByCategory, CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "./index";
import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/shop/$category")({
  head: ({ params }) => {
    const cat = getCategory(params.category);
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
  loader: ({ params }) => {
    const cat = getCategory(params.category);
    if (!cat) throw notFound();
    return { cat };
  },
  component: ShopCategory,
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-serif italic text-2xl">Category not found.</p>
    </div>
  ),
});

function ShopCategory() {
  const { cat } = Route.useLoaderData();
  const list = productsByCategory(cat.slug);
  const items = list.length > 0 ? list : PRODUCTS;
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [openFilters, setOpenFilters] = useState(false);

  const sorted = [...items].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return Number(!!b.isNew) - Number(!!a.isNew);
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[color:var(--charcoal)]/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-[color:var(--ivory)] px-6">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-4">The Collection</p>
          <h1 className="font-serif italic text-5xl md:text-7xl">{cat.name}</h1>
          <p className="mt-6 max-w-lg text-[color:var(--ivory)]/80">{cat.tagline}</p>
        </div>
      </section>

      {/* Category strip */}
      <div className="border-b border-foreground/10 overflow-x-auto">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 flex items-center gap-8 py-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/shop/$category"
              params={{ category: c.slug }}
              className="eyebrow text-[10px] whitespace-nowrap hover:text-[color:var(--maroon)] data-[active]:text-[color:var(--maroon)] data-[active]:border-b data-[active]:border-[color:var(--maroon)] pb-1"
              activeProps={{ "data-active": "" } as any}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-14 grid grid-cols-12 gap-8">
        {/* Filters */}
        <aside className={`col-span-12 md:col-span-3 lg:col-span-2 ${openFilters ? "block" : "hidden md:block"}`}>
          <div className="sticky top-32 space-y-8">
            <FilterGroup title="Sub-Category" options={cat.subCategories} />
            <FilterGroup title="Fabric" options={["Silk", "Velvet", "Cotton", "Wool", "Linen"]} />
            <FilterGroup title="Color" options={["Ivory", "Maroon", "Emerald", "Midnight", "Charcoal", "Pastel"]} />
            <FilterGroup title="Occasion" options={["Wedding", "Engagement", "Reception", "Sangeet", "Cocktail"]} />
            <FilterGroup title="Size" options={["XS", "S", "M", "L", "XL", "XXL", "Custom"]} />
          </div>
        </aside>

        {/* Products */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setOpenFilters((o) => !o)} className="md:hidden inline-flex items-center gap-2 eyebrow text-[10px]">
              <SlidersHorizontal className="size-3.5" /> Filter
            </button>
            <p className="eyebrow text-[10px] text-foreground/50">{sorted.length} pieces</p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="appearance-none bg-transparent border border-foreground/20 pl-4 pr-9 py-2 eyebrow text-[10px] cursor-pointer"
              >
                <option value="new">Newest</option>
                <option value="price-asc">Price — Low to High</option>
                <option value="price-desc">Price — High to Low</option>
              </select>
              <ChevronDown className="size-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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