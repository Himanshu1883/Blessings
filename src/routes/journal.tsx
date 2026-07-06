import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/catalog";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Blessings Men's Boutique" },
      { name: "description", content: "Notes from our atelier — craftsmanship, styling and the modern Indian wedding." },
      { property: "og:title", content: "Journal — Blessings" },
      { property: "og:description", content: "Notes from our atelier." },
    ],
  }),
  component: Journal,
});

const POSTS = [
  { title: "The Anatomy of a Zardosi Sherwani", excerpt: "Thirty days, four artisans, sixteen thousand stitches. Inside the making of our signature groom silhouette.", tag: "Craftsmanship" },
  { title: "Choosing Your Wedding Palette", excerpt: "Maroon, ivory, emerald, midnight — a house stylist's guide to picking colour for the modern Indian groom.", tag: "Styling" },
  { title: "From Delhi to Toronto: A Fitting Story", excerpt: "How we dressed one groom and his eleven groomsmen without ever meeting them in person.", tag: "Clients" },
];

function Journal() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-24 md:py-32">
      <p className="eyebrow text-[color:var(--gold)] mb-6">The Journal</p>
      <h1 className="font-serif italic text-5xl md:text-7xl leading-[1.05] max-w-3xl">Notes from the atelier.</h1>
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
        {POSTS.map((post, i) => (
          <article key={post.title} className="group">
            <div className="aspect-[4/5] overflow-hidden bg-[color:var(--muted)]">
              <img src={CATEGORIES[i].image} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            </div>
            <p className="eyebrow text-[10px] text-[color:var(--gold)] mt-6">{post.tag}</p>
            <h3 className="font-serif italic text-2xl mt-2">{post.title}</h3>
            <p className="mt-3 text-sm text-foreground/60 leading-relaxed">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}