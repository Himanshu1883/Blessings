import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Star, Truck, Scissors, Ruler, Shield, Heart, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import craftImg from "@/assets/craft.jpg";
import bespokeImg from "@/assets/bespoke.jpg";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ParallaxScroll } from "@/components/site/parallax-scroll";
import { PreFooterBanner } from "@/components/site/pre-footer-banner";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { InstagramLink } from "@/components/site/instagram-link";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { INSTAGRAM_HANDLE } from "@/lib/social";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { useShop } from "@/lib/shop-store";
import { toast } from "sonner";

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
      <ParallaxCraftsmanship />
      <Testimonials />
      <TrustStrip />
      <PreFooterBanner>
        <Newsletter />
      </PreFooterBanner>
    </>
  );
}

const HERO_BANNERS = [
  { src: "/banners/banner-1.jpeg", alt: "Blessings horse print shirt collection" },
  { src: "/banners/banner-2.jpeg", alt: "Blessings tiger embroidery jacket" },
  { src: "/banners/banner-3.jpeg", alt: "Blessings Gisa crest shirt with Dubai skyline" },
  { src: "/banners/banner-4.jpeg", alt: "Blessings flame graphic statement shirt" },
] as const;

function Hero() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    setActive((index + HERO_BANNERS.length) % HERO_BANNERS.length);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive((current) => (current + 1) % HERO_BANNERS.length);
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resume = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((current) => (current + 1) % HERO_BANNERS.length);
    }, 6000);
  };

  return (
    <section
      className="reveal-ignore relative w-full overflow-hidden bg-[color:var(--charcoal)] md:bg-transparent"
      onMouseEnter={pause}
      onMouseLeave={resume}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Image stage — 16:9 on mobile shows full banner; tall crop on desktop */}
      <div className="relative w-full aspect-video md:aspect-auto md:h-[min(92vh,900px)] md:min-h-[640px]">
        {HERO_BANNERS.map((banner, index) => (
          <img
            key={banner.src}
            src={banner.src}
            alt={banner.alt}
            width={2560}
            height={1440}
            fetchPriority={index === 0 ? "high" : "low"}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-[1400ms] ease-in-out",
              "object-contain object-center md:object-cover md:object-center",
              index === active ? "opacity-100 z-0" : "opacity-0 z-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--charcoal)]/10 via-transparent to-[color:var(--charcoal)]/15 md:from-[color:var(--charcoal)]/25 md:to-[color:var(--charcoal)]/35 z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--charcoal)]/10 via-transparent to-[color:var(--charcoal)]/30 md:from-[color:var(--charcoal)]/20 md:to-[color:var(--charcoal)]/55 z-[1] pointer-events-none" />

        {/* Carousel dots — on image */}
        <div className="absolute bottom-3 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {HERO_BANNERS.map((banner, index) => (
            <button
              key={banner.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === active}
              className="min-h-11 min-w-11 flex items-center justify-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  index === active ? "w-8 bg-[color:var(--gold-soft)]" : "w-1.5 bg-[color:var(--ivory)]/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="relative md:absolute md:inset-0 z-10 flex flex-col items-center md:items-end justify-end text-center md:text-right text-[color:var(--ivory)] pb-8 pt-6 sm:pb-10 md:pb-32 px-4 sm:px-6 md:px-16 lg:px-24 bg-[color:var(--charcoal)] md:bg-transparent">
        <p className="eyebrow text-[9px] sm:text-[10px] text-[color:var(--gold-soft)] mb-4 sm:mb-6 animate-reveal">The Wedding Season, 2026</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[92px] leading-[0.95] max-w-5xl italic animate-reveal text-balance">
          Tailored for <span className="text-[color:var(--gold-soft)]">Every&nbsp;Vow.</span>
        </h1>
        <p className="mt-8 max-w-md text-sm md:text-base text-[color:var(--ivory)]/80 leading-relaxed animate-reveal md:ml-auto">
          Bespoke elegance, handcrafted in Delhi. Delivered to grooms in London, New York, Dubai and Toronto.
        </p>
        <Link
          to="/shop/$category"
          params={{ category: "sherwanis" }}
          className="mt-8 sm:mt-10 inline-flex items-center gap-3 border border-[color:var(--ivory)]/60 hover:border-[color:var(--gold)] hover:text-[color:var(--gold-soft)] px-6 sm:px-10 py-3.5 sm:py-4 eyebrow text-[10px] sm:text-[10.5px] transition-colors md:ml-auto"
        >
          Explore the Collection <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-4 z-10">
        <div className="flex flex-col items-center gap-2">
          <span className="eyebrow text-[8px] text-[color:var(--ivory)]/60">Scroll</span>
          <div className="w-px h-10 bg-[color:var(--ivory)]/30 animate-pulse" />
        </div>
      </div>
      <div className="absolute inset-y-0 left-4 right-4 md:left-8 md:right-8 z-10 hidden md:flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          className="pointer-events-auto size-11 border border-[color:var(--ivory)]/25 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] text-[color:var(--ivory)] flex items-center justify-center transition-colors bg-[color:var(--charcoal)]/20 backdrop-blur-sm"
          aria-label="Previous banner"
        >
          <ArrowLeft className="size-4" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          className="pointer-events-auto size-11 border border-[color:var(--ivory)]/25 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] text-[color:var(--ivory)] flex items-center justify-center transition-colors bg-[color:var(--charcoal)]/20 backdrop-blur-sm"
          aria-label="Next banner"
        >
          <ArrowRight className="size-4" strokeWidth={1.4} />
        </button>
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
    <section data-reveal-direction="alternate" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
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
        <div className="mt-3 flex items-center gap-2 eyebrow text-[10px] opacity-100 translate-x-0 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-500">
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
    <section data-reveal-direction="split" className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">(02) New Arrivals</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl">Winter Weddings Edit</h2>
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
      <div ref={scroller} className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} dark layout="carousel" />
        ))}
      </div>
    </section>
  );
}

export function ProductCard({
  product,
  dark = false,
  layout = "grid",
}: {
  product: (typeof PRODUCTS)[number];
  dark?: boolean;
  layout?: "grid" | "carousel";
}) {
  const { format } = useCurrency();
  const { toggleWishlist, isInWishlist, addToCart } = useShop();
  const saved = isInWishlist(product.id);

  return (
    <div
      className={cn(
        "group min-w-0",
        layout === "carousel" ? "min-w-[min(280px,85vw)] md:min-w-[340px] snap-start shrink-0" : "w-full",
      )}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
          <img src={product.image} alt={product.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
          {product.isNew && (
            <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">New</span>
          )}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-100 translate-x-0 md:opacity-0 md:translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-500">
            <button
              type="button"
              aria-label="Wishlist"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
                toast.success(saved ? "Removed from wishlist." : "Saved to wishlist.");
              }}
              className="size-10 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"
            >
              <Heart className={cn("size-4", saved && "fill-[color:var(--maroon)] text-[color:var(--maroon)]")} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Add to bag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product.id);
                toast.success("Added to your bag.");
              }}
              className="size-10 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"
            >
              <ShoppingBag className="size-4" strokeWidth={1.5} />
            </button>
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
    <section className="bg-[color:var(--maroon)] text-[color:var(--ivory)] py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute -top-10 left-0 right-0 text-center pointer-events-none select-none">
        <span className="font-serif italic text-[18vw] leading-none text-[color:var(--ivory)]/[0.04]">Bespoke</span>
      </div>
      <div data-reveal-section data-reveal-direction="split" className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 md:gap-24 items-center">
        <div className="relative">
          <img src={bespokeImg} alt="Midnight black statement piece with gold details" width={1200} height={1500} loading="lazy" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute bottom-0 right-0 md:-bottom-8 md:-right-12 size-32 sm:size-40 md:size-52 bg-[color:var(--gold)] text-[color:var(--maroon)] flex flex-col items-center justify-center text-center p-4 md:p-6">
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
    <section data-reveal-direction="alternate" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionHeader eyebrow="(04) The Groom's Edit" title="Best sellers for the modern wedding." ctaHref="/shop/sherwanis" ctaLabel="View all →" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {groomProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function ParallaxCraftsmanship() {
  return (
    <ParallaxScroll
      image={craftImg}
      coverGradient="to-background"
      foreground={
        <section data-reveal-direction="left" className="parallax-scroll__panel max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 w-full">
          <div className="max-w-xl text-[color:var(--ivory)] py-16 md:py-0">
            <p className="eyebrow text-[color:var(--gold-soft)] mb-6">(05) Craftsmanship</p>
            <h2 className="font-serif italic text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-balance">
              Every stitch, an inheritance.
            </h2>
            <p className="mt-8 text-[color:var(--ivory)]/85 text-sm md:text-base leading-relaxed max-w-md">
              Zardosi, dabka, aari — the same hands, the same threads, the same wooden frames that have graced Delhi
              ateliers for four generations. We do not chase trends. We uphold traditions.
            </p>
            <Link
              to="/about"
              className="mt-10 inline-flex items-center gap-3 eyebrow text-[10px] border-b border-[color:var(--gold-soft)]/50 pb-1 hover:border-[color:var(--gold-soft)] hover:text-[color:var(--gold-soft)] transition-colors"
            >
              Discover our atelier <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>
      }
      cover={<InstagramGrid />}
    />
  );
}

function InstagramGrid() {
  const imgs = [
    ...CATEGORIES.map((c) => c.image),
  ].slice(0, 6);
  return (
    <section data-reveal-direction="alternate" className="py-16 sm:py-24 md:py-28 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">(06) The Journal</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl">@{INSTAGRAM_HANDLE}</h2>
        </div>
        <InstagramLink
          className="inline-flex items-center gap-3 eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:text-[color:var(--maroon)] hover:border-[color:var(--maroon)]"
          iconClassName="size-3.5"
        >
          Follow on Instagram
        </InstagramLink>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-foreground/10">
        {imgs.map((src, i) => (
          <InstagramLink
            key={i}
            className="relative aspect-square block group overflow-hidden bg-background p-0"
            showIcon={false}
            aria-label="View on Instagram"
          >
            <img src={src} alt="Instagram post" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[color:var(--charcoal)]/30 md:bg-[color:var(--charcoal)]/0 md:group-hover:bg-[color:var(--charcoal)]/60 transition-colors flex items-center justify-center md:opacity-0 md:group-hover:opacity-100">
              <InstagramIcon className="size-6 text-[color:var(--ivory)]" />
            </div>
          </InstagramLink>
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
    <section data-reveal-direction="alternate" className="bg-[color:var(--muted)]/40 py-16 sm:py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow text-[color:var(--gold)] mb-4">(07) Testimonials</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl text-balance">Trusted by grooms across four continents.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="bg-background p-6 sm:p-8 md:p-10 border border-foreground/5">
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
  ];
  return (
    <section className="border-y border-foreground/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
        {items.map((i) => (
          <div key={i.title} className="flex items-center gap-4">
            <i.icon className="size-6 text-[color:var(--gold)] shrink-0" strokeWidth={1.2} />
            <div className="min-w-0">
              <p className="eyebrow text-[10px]">{i.title}</p>
              <p className="text-[11px] text-foreground/50 mt-1 line-clamp-2">{i.sub}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4">
          <WhatsAppLink
            message={WHATSAPP_MESSAGES.chat}
            showIcon
            iconClassName="size-6 text-[#25D366]"
            className="shrink-0 hover:opacity-80"
            aria-label="WhatsApp Concierge"
          />
          <div className="min-w-0">
            <WhatsAppLink
              message={WHATSAPP_MESSAGES.chat}
              showIcon={false}
              className="eyebrow text-[10px] hover:text-[#25D366] text-foreground"
            >
              WhatsApp Concierge
            </WhatsAppLink>
            <p className="text-[11px] text-foreground/50 mt-1 line-clamp-2">Same-day response</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-16 sm:py-24 md:py-32 text-center px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <p className="eyebrow text-[color:var(--gold)] mb-6">The Inner Circle</p>
        <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">
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
