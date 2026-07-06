import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Star, Truck, Scissors, Ruler, Shield, MessageCircle, Instagram, Heart, Eye } from "lucide-react";
import { useRef } from "react";
import heroImg from "@/assets/hero.jpg";
import craftImg from "@/assets/craft.jpg";
import bespokeImg from "@/assets/bespoke.jpg";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <CategoryEditorial />
      <NewArrivals />
      <BespokeStory />
      <GroomsEdit />
      <CraftsmanshipBanner />
      <InstagramGrid />
      <Testimonials />
      <TrustStrip />
      <Newsletter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden">
      <img
        src={heroImg}
        alt="Groom in maroon embroidered sherwani"
        width={1920}
        height={1200}
        className="absolute inset-0 w-full h-full object-cover scale-105 animate-[reveal-up_1.4s_ease-out]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--charcoal)]/40 via-transparent to-[color:var(--charcoal)]/70" />
      <div className="relative z-10 h-full flex flex-col items-center justify-end text-center text-[color:var(--ivory)] pb-24 md:pb-32 px-6">
        <p className="eyebrow text-[10px] text-[color:var(--gold-soft)] mb-6 animate-reveal">The Wedding Season, 2026</p>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-[92px] leading-[0.95] max-w-5xl italic animate-reveal">
          Tailored for <span className="text-[color:var(--gold-soft)]">Every&nbsp;Vow.</span>
        </h1>
        <p className="mt-8 max-w-md text-sm md:text-base text-[color:var(--ivory)]/80 leading-relaxed animate-reveal">
          Bespoke elegance, handcrafted in Delhi. Delivered to grooms in London, New York, Dubai and Toronto.
        </p>
        <Link
          to="/shop/$category"
          params={{ category: "sherwanis" }}
          className="mt-10 inline-flex items-center gap-3 border border-[color:var(--ivory)]/60 hover:border-[color:var(--gold)] hover:text-[color:var(--gold-soft)] px-10 py-4 eyebrow text-[10.5px] transition-colors"
        >
          Explore the Collection <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="eyebrow text-[8px] text-[color:var(--ivory)]/60">Scroll</span>
        <div className="w-px h-10 bg-[color:var(--ivory)]/30 animate-pulse" />
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, ctaHref, ctaLabel }: { eyebrow: string; title: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
      <div className="max-w-xl">
        <p className="eyebrow text-[color:var(--gold)] mb-4">{eyebrow}</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight italic text-balance">{title}</h2>
      </div>
      {ctaHref && (
        <a href={ctaHref} className="eyebrow text-[10px] border-b border-foreground/20 pb-1 self-start md:self-end hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors">
          {ctaLabel}
        </a>
      )}
    </div>
  );
}

function CategoryEditorial() {
  const cats = CATEGORIES;
  return (
    <section className="max-w-[1600px] mx-auto px-6 md:px-8 py-24 md:py-32">
      <SectionHeader
        eyebrow="(01) The Collections"
        title="Heritage silhouettes, contemporary craft."
        ctaHref="/shop/sherwanis"
        ctaLabel="View all →"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Big feature */}
        <CategoryTile cat={cats[0]} className="col-span-12 md:col-span-7 aspect-[4/5]" size="lg" />
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4 md:gap-6">
          <CategoryTile cat={cats[1]} className="aspect-[5/4]" />
          <CategoryTile cat={cats[3]} className="aspect-[3/4]" />
        </div>
        <CategoryTile cat={cats[2]} className="col-span-12 md:col-span-4 aspect-[3/4]" />
        <CategoryTile cat={cats[4]} className="col-span-12 md:col-span-4 aspect-[3/4]" />
        <CategoryTile cat={cats[5]} className="col-span-12 md:col-span-4 aspect-[3/4]" />
      </div>
    </section>
  );
}

function CategoryTile({ cat, className, size = "md" }: { cat: (typeof CATEGORIES)[number]; className?: string; size?: "md" | "lg" }) {
  return (
    <Link
      to="/shop/$category"
      params={{ category: cat.slug }}
      className={cn("group relative block overflow-hidden bg-[color:var(--muted)]", className)}
    >
      <img
        src={cat.image}
        alt={cat.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-[color:var(--ivory)]">
        <p className="eyebrow text-[9px] text-[color:var(--gold-soft)] mb-2">The Collection</p>
        <h3 className={cn("font-serif italic leading-tight", size === "lg" ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl")}>{cat.name}</h3>
        <div className="mt-3 flex items-center gap-2 eyebrow text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
          Shop <ArrowRight className="size-3" />
        </div>
      </div>
    </Link>
  );
}

function NewArrivals() {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });
  return (
    <section className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">(02) New Arrivals</p>
          <h2 className="font-serif italic text-4xl md:text-5xl">Winter Weddings Edit</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => scrollBy(-360)} className="size-11 border border-[color:var(--ivory)]/20 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] flex items-center justify-center transition-colors" aria-label="Previous">
            <ArrowLeft className="size-4" strokeWidth={1.4} />
          </button>
          <button onClick={() => scrollBy(360)} className="size-11 border border-[color:var(--ivory)]/20 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] flex items-center justify-center transition-colors" aria-label="Next">
            <ArrowRight className="size-4" strokeWidth={1.4} />
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-8 max-w-[1600px] mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} dark />
        ))}
      </div>
    </section>
  );
}

export function ProductCard({ product, dark = false }: { product: (typeof PRODUCTS)[number]; dark?: boolean }) {
  const { format } = useCurrency();
  return (
    <div className="min-w-[280px] md:min-w-[340px] snap-start group">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
          <img src={product.image} alt={product.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
          {product.isNew && (
            <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">New</span>
          )}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
            <button aria-label="Wishlist" className="size-9 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"><Heart className="size-4" strokeWidth={1.5} /></button>
            <button aria-label="Quick view" className="size-9 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"><Eye className="size-4" strokeWidth={1.5} /></button>
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className={cn("font-serif text-lg leading-tight truncate", dark ? "text-[color:var(--ivory)]" : "text-foreground")}>{product.name}</h4>
            <p className={cn("eyebrow text-[9px] mt-1.5", dark ? "text-[color:var(--ivory)]/50" : "text-foreground/50")}>{product.fabric}</p>
          </div>
          <p className={cn("text-sm font-medium tabular-nums shrink-0", dark ? "text-[color:var(--gold-soft)]" : "text-[color:var(--maroon)]")}>{format(product.price)}</p>
        </div>
      </Link>
    </div>
  );
}

function BespokeStory() {
  return (
    <section className="bg-[color:var(--maroon)] text-[color:var(--ivory)] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute -top-10 left-0 right-0 text-center pointer-events-none select-none">
        <span className="font-serif italic text-[18vw] leading-none text-[color:var(--ivory)]/[0.04]">Bespoke</span>
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        <div className="relative">
          <img src={bespokeImg} alt="Master tailor at work" width={1200} height={1500} loading="lazy" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute -bottom-8 -right-4 md:-right-12 size-40 md:size-52 bg-[color:var(--gold)] text-[color:var(--maroon)] flex flex-col items-center justify-center text-center p-6">
            <span className="font-serif italic text-4xl md:text-5xl">30+</span>
            <span className="eyebrow text-[9px] mt-2 leading-tight">Days of Artisan Craftsmanship</span>
          </div>
        </div>
        <div>
          <p className="eyebrow text-[color:var(--gold-soft)] mb-6">(03) The Bespoke Experience</p>
          <h2 className="font-serif italic text-4xl md:text-6xl leading-[1.05] text-balance">
            Tailored to your story, delivered to your door.
          </h2>
          <p className="mt-8 text-[color:var(--ivory)]/70 leading-relaxed max-w-md">
            From our flagship atelier in Delhi to your doorstep in London, New York or Dubai — every garment is a dialogue between tradition and your personal vision. Virtual consultations available for our international clientele.
          </p>
          <div className="mt-10 space-y-4">
            {[
              ["01", "Private virtual or in-person consultation"],
              ["02", "Fabric selection — silk, velvet, pashmina"],
              ["03", "Master pattern & three fittings"],
              ["04", "White-glove worldwide delivery"],
            ].map(([n, t]) => (
              <div key={n} className="flex items-center gap-6 border-b border-[color:var(--ivory)]/10 pb-4">
                <span className="font-serif italic text-[color:var(--gold-soft)] text-lg">{n}</span>
                <span className="eyebrow text-[10px]">{t}</span>
              </div>
            ))}
          </div>
          <Link to="/bespoke" className="mt-10 inline-flex items-center gap-3 bg-[color:var(--gold)] hover:bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-10 py-4 eyebrow text-[10.5px] transition-colors">
            Book an appointment <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GroomsEdit() {
  const groomProducts = PRODUCTS.filter((p) => p.bestSeller).slice(0, 4);
  return (
    <section className="max-w-[1600px] mx-auto px-6 md:px-8 py-24 md:py-32">
      <SectionHeader eyebrow="(04) The Groom's Edit" title="Best sellers for the modern wedding." ctaHref="/shop/sherwanis" ctaLabel="View all →" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {groomProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function CraftsmanshipBanner() {
  return (
    <section className="relative h-[80vh] min-h-[520px] overflow-hidden">
      <img src={craftImg} alt="Hand-embroidered gold on emerald silk" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--charcoal)]/85 via-[color:var(--charcoal)]/40 to-transparent" />
      <div className="relative h-full max-w-[1600px] mx-auto px-6 md:px-8 flex items-center">
        <div className="max-w-lg text-[color:var(--ivory)]">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-6">(05) Craftsmanship</p>
          <h2 className="font-serif italic text-5xl md:text-6xl leading-[1.05] text-balance">
            Every stitch, an inheritance.
          </h2>
          <p className="mt-8 text-[color:var(--ivory)]/80 leading-relaxed">
            Zardosi, dabka, aari — the same hands, the same threads, the same wooden frames that have graced Delhi ateliers for four generations. We do not chase trends. We uphold traditions.
          </p>
          <a href="/about" className="mt-10 inline-flex items-center gap-3 eyebrow text-[10px] border-b border-[color:var(--gold-soft)]/50 pb-1">
            Discover our atelier <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

const IG_TILES = [
  { img: "sherwani", prompt: "moody wedding" },
  { img: "bandhgala", prompt: "detail" },
  { img: "groom", prompt: "portrait" },
  { img: "indowestern", prompt: "editorial" },
  { img: "accessories", prompt: "flatlay" },
  { img: "craft", prompt: "atelier" },
];

function InstagramGrid() {
  const imgs = [
    ...CATEGORIES.map((c) => c.image),
  ].slice(0, 6);
  return (
    <section className="py-24 md:py-28 bg-background">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">(06) The Journal</p>
          <h2 className="font-serif italic text-4xl md:text-5xl">@blessingsthemensboutique</h2>
        </div>
        <a href="#" className="inline-flex items-center gap-3 eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:text-[color:var(--maroon)] hover:border-[color:var(--maroon)]">
          <Instagram className="size-3.5" /> Follow on Instagram
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-foreground/10">
        {imgs.map((src, i) => (
          <a key={i} href="#" className="relative aspect-square block group overflow-hidden bg-background">
            <img src={src} alt="Instagram post" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[color:var(--charcoal)]/0 group-hover:bg-[color:var(--charcoal)]/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Instagram className="size-6 text-[color:var(--ivory)]" strokeWidth={1.2} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { quote: "The sherwani arrived in London a week before the wedding — the fit was flawless from the very first try-on. Nothing short of a masterpiece.", author: "Rohan M.", location: "London, UK" },
  { quote: "Blessings styled my entire wedding party from New Jersey. Every fitting, every fabric choice, was handled with the care of an old family tailor.", author: "Arjun S.", location: "New York, USA" },
  { quote: "The virtual consultation felt intimate. My bandhgala fit like it had been made in Dubai — not stitched thousands of miles away.", author: "Faisal K.", location: "Dubai, UAE" },
  { quote: "Received my wedding suit in Toronto three weeks after ordering. Impeccable finish, and worth every penny.", author: "Karanveer J.", location: "Toronto, Canada" },
];

function Testimonials() {
  return (
    <section className="bg-[color:var(--muted)]/40 py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow text-[color:var(--gold)] mb-4">(07) Testimonials</p>
          <h2 className="font-serif italic text-4xl md:text-5xl">Trusted by grooms across four continents.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="bg-background p-10 border border-foreground/5">
              <div className="flex gap-0.5 text-[color:var(--gold)] mb-6">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3.5 fill-current" strokeWidth={0} />)}
              </div>
              <blockquote className="font-serif italic text-xl md:text-2xl leading-snug text-balance">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="eyebrow text-[10px]">{t.author}</span>
                <span className="h-px w-6 bg-[color:var(--gold)]" />
                <span className="eyebrow text-[10px] text-foreground/50">{t.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Truck, title: "Worldwide Shipping", sub: "Express to 40+ countries" },
    { icon: Scissors, title: "Handcrafted in Delhi", sub: "Four-generation atelier" },
    { icon: Ruler, title: "Custom Fittings", sub: "Virtual & in-person" },
    { icon: Shield, title: "Secure Checkout", sub: "Encrypted payments" },
    { icon: MessageCircle, title: "WhatsApp Concierge", sub: "Same-day response" },
  ];
  return (
    <section className="border-y border-foreground/10">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {items.map((i) => (
          <div key={i.title} className="flex items-center gap-4">
            <i.icon className="size-6 text-[color:var(--gold)] shrink-0" strokeWidth={1.2} />
            <div className="min-w-0">
              <p className="eyebrow text-[10px]">{i.title}</p>
              <p className="text-[11px] text-foreground/50 mt-1 truncate">{i.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-24 md:py-32 text-center px-6">
      <div className="max-w-xl mx-auto">
        <p className="eyebrow text-[color:var(--gold)] mb-6">The Inner Circle</p>
        <h2 className="font-serif italic text-4xl md:text-5xl leading-tight text-balance">
          Private access to new collections & trunk shows.
        </h2>
        <p className="text-[color:var(--ivory)]/60 mt-6 text-sm">Fewer than four emails a year. Never a promotion.</p>
        <form className="mt-12 flex items-center border-b border-[color:var(--ivory)]/30 focus-within:border-[color:var(--gold)] transition-colors max-w-md mx-auto">
          <input type="email" placeholder="EMAIL ADDRESS" className="flex-1 bg-transparent py-3 text-xs tracking-widest outline-none placeholder:text-[color:var(--ivory)]/40 text-center" />
          <button type="submit" className="eyebrow text-[10px] text-[color:var(--gold)] px-4">Subscribe →</button>
        </form>
      </div>
    </section>
  );
}
