import bespokeImg from "@/assets/bespoke.jpg";
import craftImg from "@/assets/craft.jpg";
import { BagIcon, HeartIcon } from "@/components/icons/site-icons";
import { AdminProductActions } from "@/components/site/admin-product-actions";
import { InstagramReelsSection } from "@/components/site/instagram-reels-section";
import { ParallaxScroll } from "@/components/site/parallax-scroll";
import { PreFooterBanner } from "@/components/site/pre-footer-banner";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import type { StoreCategory, StoreProduct } from "@/lib/catalog-api";
import { fetchCategories, fetchProducts } from "@/lib/catalog-api";
import { useCurrency } from "@/lib/currency";
import { fetchHomepageContent } from "@/lib/homepage-api";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Ruler,
  Scissors,
  Shield,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, categories, homepage] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchHomepageContent(),
    ]);
    return { products, categories, homepage };
  },
  component: Index,
});

function Index() {
  const { homepage } = Route.useLoaderData();
  return (
    <>
      <Hero
        cms={homepage.hero as Record<string, unknown> | undefined}
        sectionCopy={homepage.sectionCopy as Record<string, unknown> | undefined}
      />
      <CategoryEditorial />
      <NewArrivals />
      <ExploreMenswear />
      <ShopByOccasion />
      <StyleSeekersMarquee />
      <BespokeStory />
      <GroomsEdit />
      <RelatedLooks />
      <ParallaxCraftsmanship />
      <Testimonials cms={homepage.reviews as Record<string, unknown> | undefined} />
      <TrustStrip />
      <PreFooterBanner>
        <Newsletter />
      </PreFooterBanner>
    </>
  );
}

// -------------------------------------------------------------
// 👇 1. OLD DESKTOP IMAGES (kept as-is)
// -------------------------------------------------------------
const HERO_BANNERS = [
  { src: "/banners/banner-1.jpeg", alt: "Blessings horse print shirt collection" },
  { src: "/banners/banner-2.jpeg", alt: "Blessings tiger embroidery jacket" },
  { src: "/banners/banner-3.jpeg", alt: "Blessings Gisa crest shirt with Dubai skyline" },
  { src: "/banners/banner-4.jpeg", alt: "Blessings flame graphic statement shirt" },
] as const;

// -------------------------------------------------------------
// 👇 2. NEW MOBILE IMAGES (Replace these paths with your 4 new images)
// -------------------------------------------------------------
const MOBILE_HERO_BANNERS = [
  { src: "/blessings_1.jpg.jpeg", alt: "Blessings yellow flame shirt mobile" },
  { src: "/blessings_2.jpg.jpeg", alt: "Blessings tiger embroidery jacket mobile" },
  { src: "/blessings_3.jpg.jpeg", alt: "Blessings gold floral black shirt mobile" },
  { src: "/blessings_4.jpg.jpeg", alt: "Blessings leopard print statement shirt mobile" },
] as const;
// -------------------------------------------------------------

type HeroSlide = { src: string; alt: string };

// Custom hook to detect mobile screens (Tailwind's 'md' breakpoint = 768px)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
}

function Hero({
  cms,
  sectionCopy,
}: {
  cms?: Record<string, unknown>;
  sectionCopy?: Record<string, unknown>;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Choose which set of banners to use based on screen size
  const cmsSlides = Array.isArray(cms?.slides)
    ? (cms.slides as HeroSlide[]).filter((s) => s?.src)
    : null;

  const desktopBanners: HeroSlide[] = cmsSlides?.length ? cmsSlides : [...HERO_BANNERS];
  const mobileBanners: HeroSlide[] = cmsSlides?.length ? cmsSlides : [...MOBILE_HERO_BANNERS];

  // Dynamically assign the banners based on the isMobile state
  const banners: HeroSlide[] = isMobile ? mobileBanners : desktopBanners;

  const overline = String(sectionCopy?.overline ?? cms?.overline ?? "Men's Boutique");
  const title = String(sectionCopy?.title ?? cms?.title ?? "Crafted for the Modern Groom");
  const subtitle = String(sectionCopy?.subtitle ?? cms?.subtitle ?? "");
  const ctaText = String(sectionCopy?.ctaText ?? cms?.ctaText ?? "Explore Collection");

  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    const newIndex = (index + banners.length) % banners.length;
    setActive(newIndex);
  };

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setActive((current) => (current + 1) % banners.length);
    }, 6000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [banners.length, isPaused]);

  // Reset active slide when switching between mobile/desktop to prevent index mismatch
  useEffect(() => {
    setActive(0);
  }, [isMobile]);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  // Debug log to check which banners are loading
  console.log("Current Screen:", isMobile ? "Mobile" : "Desktop");
  console.log("Banners loaded:", banners.length);

  return (
    <section
      className="reveal-ignore relative w-full overflow-hidden bg-white"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[calc(100svh-var(--header-height))] min-h-[32rem] w-full lg:min-h-[44rem]">
        {banners.map((banner, index) => {
          const isActive = index === active;
          return (
            <div
              key={banner.src}
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-[1400ms] ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0",
              )}
            >
              <img
                src={banner.src}
                alt={banner.alt}
                width={2560}
                height={1440}
                fetchPriority={index === 0 ? "high" : "low"}
                className="h-full w-full object-cover object-top"
                onError={(e) => {
                  console.error(`Failed to load image: ${banner.src}`);
                  e.currentTarget.style.display = "none";
                }}
                onLoad={() => {
                  console.log(`Loaded image: ${banner.src}`);
                }}
              />
            </div>
          );
        })}

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-[color:var(--charcoal)]/45 via-[color:var(--charcoal)]/10 to-[color:var(--charcoal)]/25 md:from-[color:var(--charcoal)]/25 md:to-[color:var(--charcoal)]/35" />
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent via-35% to-[color:var(--charcoal)]/78 md:to-[color:var(--charcoal)]/55" />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-start justify-end px-4 pb-20 pt-24 text-left text-[color:var(--ivory)] sm:px-6 sm:pb-24 sm:pt-28 md:items-end md:px-16 md:pb-32 lg:px-24 md:text-right">
          <p className="eyebrow mb-3 text-[9px] text-[color:var(--gold-soft)] animate-reveal sm:mb-5 sm:text-[10px]">
            {overline}
          </p>
          <h1 className="max-w-[13ch] font-serif text-3xl leading-[0.95] text-balance animate-reveal sm:text-5xl md:max-w-5xl md:text-7xl lg:text-[92px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[color:var(--ivory)]/85 animate-reveal sm:mt-6 md:ml-auto md:mt-8 md:max-w-md md:text-base">
              {subtitle}
            </p>
          )}
          <Link
            to="/shop/$category"
            params={{ category: "sherwanis" }}
            className="mt-6 inline-flex items-center gap-3 border border-[color:var(--ivory)]/70 px-5 py-3.5 eyebrow text-[10px] transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold-soft)] sm:mt-8 sm:px-8 md:ml-auto md:mt-10 md:px-10 md:py-4 sm:text-[10.5px]"
          >
            {ctaText} <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Navigation dots */}
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 md:bottom-8">
          {banners.map((banner, index) => (
            <button
              key={banner.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === active}
              className="min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  index === active
                    ? "w-8 bg-[color:var(--gold-soft)]"
                    : "w-1.5 bg-[color:var(--ivory)]/40 hover:bg-[color:var(--ivory)]/70",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-4 z-30">
        <div className="flex flex-col items-center gap-2">
          <span className="eyebrow text-[8px] text-[color:var(--ivory)]/60">Scroll</span>
          <div className="w-px h-10 bg-[color:var(--ivory)]/30 animate-pulse" />
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute inset-y-0 left-4 right-4 md:left-8 md:right-8 z-30 hidden md:flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          className="pointer-events-auto size-11 border border-[color:var(--ivory)]/25 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] text-[color:var(--ivory)] flex items-center justify-center transition-colors bg-[color:var(--charcoal)]/20 backdrop-blur-sm touch-manipulation"
          aria-label="Previous banner"
        >
          <ArrowLeft className="size-4" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          className="pointer-events-auto size-11 border border-[color:var(--ivory)]/25 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] text-[color:var(--ivory)] flex items-center justify-center transition-colors bg-[color:var(--charcoal)]/20 backdrop-blur-sm touch-manipulation"
          aria-label="Next banner"
        >
          <ArrowRight className="size-4" strokeWidth={1.4} />
        </button>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
      <div className="max-w-xl">
        <p className="eyebrow text-[color:var(--gold)] mb-4">{eyebrow}</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight italic text-balance">
          {title}
        </h2>
      </div>
      {ctaHref && (
        <a
          href={ctaHref}
          className="eyebrow text-[10px] border-b border-foreground/20 pb-1 self-start md:self-end hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}

/**
 * Redesigned to match the "Best selling products" reference: a horizontal,
 * arrow-navigated rail instead of the old masonry grid. Header carries the
 * eyebrow + italic serif title on the left, a text CTA + round-cornerless
 * bordered prev/next buttons on the right (same button language as
 * NewArrivals below, so the two rails feel like one system).
 */
function CategoryEditorial() {
  const { categories } = Route.useLoaderData();
  const cats = categories;
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section
      data-reveal-direction="alternate"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 sm:mb-12">
        <div className="max-w-xl">
          <p className="eyebrow text-[color:var(--gold)] mb-4">(01) The Collections</p>
          <h2 className="font-serif italic text-4xl md:text-5xl leading-tight text-balance">
            Heritage silhouettes, contemporary craft.
          </h2>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <a
            href="/shop/sherwanis"
            className="eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
          >
            View all →
          </a>
          <div className="hidden sm:flex gap-3">
            <button
              type="button"
              onClick={() => scrollBy(-360)}
              aria-label="Previous collections"
              className="size-11 border border-foreground/15 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="size-4" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(360)}
              aria-label="Next collections"
              className="size-11 border border-foreground/15 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] flex items-center justify-center transition-colors"
            >
              <ArrowRight className="size-4" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {cats.map((cat) => (
          <CategoryTile key={cat.slug} cat={cat} />
        ))}
      </div>
    </section>
  );
}

/**
 * Card anatomy mirrors the reference: tall product-style image, a subtle
 * "New" tag if present, a hover overlay chip ("Shop the edit" — our stand-in
 * for the reference's "Quick view"), then a light caption stack below the
 * image (eyebrow label + serif italic name) rather than the old dark
 * gradient-overlay caption baked into the image itself.
 */
function CategoryTile({ cat }: { cat: StoreCategory & { tag?: string } }) {
  return (
    <Link
      to="/shop/$category"
      params={{ category: cat.slug }}
      className="group min-w-[min(280px,78vw)] sm:min-w-[320px] md:min-w-[360px] snap-start shrink-0"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
        <img
          src={cat.imageUrl}
          alt={cat.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        {cat.tag && (
          <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">
            {cat.tag}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--charcoal)]/0 group-hover:bg-[color:var(--charcoal)]/25 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="eyebrow text-[10px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-4 py-2">
            Shop the edit
          </span>
        </div>
      </div>
      <div className="mt-4">
        <p className="eyebrow text-[9px] text-foreground/50 mb-1.5">The Collection</p>
        <h3 className="font-serif italic text-2xl leading-tight">{cat.name}</h3>
      </div>
    </Link>
  );
}

/**
 * Shoppable lookbook, redesigned after the reference: a full-bleed photo
 * that auto-advances through "looks" (here, best-seller products standing
 * in for outfit photography), a big serif "New look" headline pinned left,
 * a pulsing hotspot dot over the garment that toggles a quick-view card,
 * and a "See all" link bottom-right. Pauses on hover/touch like the Hero
 * carousel above, for the same reason — don't fight someone mid-read.
 *
 * NOTE: hotspot position is currently a single fixed point (`HOTSPOT`)
 * because StoreProduct doesn't carry per-image garment coordinates. If you
 * shoot dedicated lookbook photography later, swap `looks` to read real
 * x/y per photo (e.g. a `look.hotspots` field) instead of reusing product
 * thumbnails as full-bleed backgrounds.
 */
const HOTSPOT = { x: "50%", y: "58%" };

function NewArrivals() {
  const { products } = Route.useLoaderData();
  const { format } = useCurrency();
  const looks = products.filter((p) => p.bestSeller).slice(0, 5);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cardOpen, setCardOpen] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused || looks.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActive((c) => (c + 1) % looks.length);
      setCardOpen(true);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, looks.length]);

  const goTo = (index: number) => {
    setActive((index + looks.length) % looks.length);
    setCardOpen(true);
  };

  if (!looks.length) return null;
  const look = looks[active];

  return (
    <section
      data-reveal-direction="split"
      className="relative bg-[color:var(--muted)] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="New arrivals lookbook"
    >
      <div className="relative h-[36rem] sm:h-[42rem] md:h-[46rem] w-full">
        {looks.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-[color:var(--muted)] transition-opacity duration-[1400ms] ease-in-out",
              i === active ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
          >
            <img
              src={p.imageUrl}
              alt={p.name}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-contain object-center"
            />
          </div>
        ))}

        {/* Headline */}
        <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-center px-6 sm:px-10 md:px-16 max-w-md pointer-events-none">
          <p className="eyebrow text-[color:var(--maroon)] mb-4">(02) New Arrivals</p>
          <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-foreground">
            New look
          </h2>
          <p className="mt-4 text-sm text-foreground/60">Discover our new arrivals.</p>
        </div>

        {/* Hotspot */}
        <button
          type="button"
          onClick={() => setCardOpen((v) => !v)}
          aria-label={cardOpen ? "Hide product details" : `Show details for ${look.name}`}
          className="absolute z-20 size-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: HOTSPOT.x, top: HOTSPOT.y }}
        >
          <span className="absolute size-6 rounded-full bg-[color:var(--charcoal)]/30 animate-ping" />
          <span className="absolute size-6 rounded-full bg-[color:var(--charcoal)]/80 flex items-center justify-center">
            <span className="size-1.5 rounded-full bg-[color:var(--ivory)]" />
          </span>
        </button>

        {/* Quick-view card */}
        <div
          className={cn(
            "absolute z-20 left-6 sm:left-10 md:left-16 bottom-10 sm:bottom-14 md:bottom-16 w-[calc(100%-3rem)] max-w-sm bg-background shadow-lg flex items-stretch transition-all duration-500",
            cardOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          <Link to="/product/$id" params={{ id: look.id }} className="w-24 sm:w-28 shrink-0 block">
            <img src={look.imageUrl} alt={look.name} className="h-full w-full object-cover" />
          </Link>
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <Link
                to="/product/$id"
                params={{ id: look.id }}
                className="font-serif text-lg leading-tight text-foreground truncate block"
              >
                {look.name}
              </Link>
              <p className="text-sm mt-1.5 text-[color:var(--maroon)]">{format(look.price)}</p>
            </div>
            <Link
              to="/product/$id"
              params={{ id: look.id }}
              className="mt-3 inline-flex items-center gap-1.5 eyebrow text-[10px] text-foreground/70 hover:text-[color:var(--maroon)] transition-colors"
            >
              <Plus className="size-3" strokeWidth={1.6} /> Quick view
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setCardOpen(false)}
            aria-label="Close product details"
            className="absolute top-3 right-3 text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="size-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* Manual slide dots */}
        {looks.length > 1 && (
          <div className="absolute z-20 right-6 sm:right-10 md:right-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5">
            {looks.map((p, index) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show look ${index + 1}`}
                aria-current={index === active}
                className="min-h-11 min-w-6 flex items-center justify-center touch-manipulation"
              >
                <span
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-500",
                    index === active
                      ? "h-8 bg-[color:var(--maroon)]"
                      : "h-1.5 bg-foreground/25 hover:bg-foreground/50",
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* See all */}
        <a
          href="/shop/sherwanis"
          className="absolute z-20 right-6 sm:right-10 md:right-16 bottom-6 eyebrow text-[10px] border-b border-foreground/30 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] pb-0.5 transition-colors"
        >
          See all
        </a>
      </div>
    </section>
  );
}

const STYLE_SEEKER_CATEGORIES = [
  {
    label: "Sherwanis",
    slug: "sherwanis",
    image: "/blessings_1.jpg.jpeg",
  },
  {
    label: "Bandhgalas",
    slug: "bandhgalas",
    image: "/blessings_2.jpg.jpeg",
  },
  {
    label: "Wedding Suits",
    slug: "wedding-suits",
    image: "/blessings_3.jpg.jpeg",
  },
  {
    label: "Indo-Western",
    slug: "indo-western",
    image: "/blessings_4.jpg.jpeg",
  },
  {
    label: "Shirts",
    slug: "shirts",
    image: "/blessings_5.jpg.jpeg",
  },
  {
    label: "Occasion Kurtas",
    slug: "occasion-kurtas",
    image: "/blessings_5.jpg.jpeg",
  },
  {
    label: "Accessories",
    slug: "accessories",
    image: "/banners/banner-1.jpeg",
  },
] as const;

// Cycled per tile so widths alternate like the reference (narrow, wide, narrow...)
const TILE_WIDTHS = ["w-[200px] sm:w-[230px]", "w-[260px] sm:w-[320px]"] as const;

function StyleSeekersMarquee() {
  const track = [...STYLE_SEEKER_CATEGORIES, ...STYLE_SEEKER_CATEGORIES];
  return (
    <section data-reveal-direction="alternate" className="py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center mb-14 md:mb-20">
        <p className="eyebrow text-[color:var(--gold)] mb-5">Loved by Style Seekers</p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl leading-snug text-balance">
          Trusted by thousands for quality and style. Discover why customers love our timeless
          designs and service.
        </h2>

        <Link
          to="/shop/$category"
          params={{ category: "sherwanis" }}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-foreground/20 px-8 py-3 eyebrow text-[10px] hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
        >
          Explore Collection
        </Link>
      </div>

      <div className="group [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div className="flex items-end gap-4 sm:gap-5 w-max animate-marquee group-hover:[animation-play-state:paused]">
          {track.map((cat, i) => (
            <Link
              key={`${cat.label}-${i}`}
              to="/shop/$category"
              params={{ category: cat.slug }}
              className={cn(
                "group/tile relative block aspect-[3/4] overflow-hidden bg-[color:var(--muted)] shrink-0",
                TILE_WIDTHS[i % TILE_WIDTHS.length],
              )}
            >
              <img
                src={cat.image}
                alt={cat.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/tile:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/70 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 eyebrow text-[10px] text-[color:var(--ivory)]">
                {cat.label}
              </span>
              <span className="absolute bottom-4 right-4 size-9 rounded-full bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center">
                <ArrowUpRight className="size-4" strokeWidth={1.6} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductCard({
  product,
  dark = false,
  layout = "grid",
  onAdminEdit,
  onAdminDelete,
  adminEditReady = true,
}: {
  product: StoreProduct;
  dark?: boolean;
  layout?: "grid" | "carousel";
  onAdminEdit?: (product: StoreProduct) => void;
  onAdminDelete?: (product: StoreProduct) => void;
  adminEditReady?: boolean;
}) {
  const { format } = useCurrency();
  const { toggleWishlist, isInWishlist, addToCart } = useShop();
  const saved = isInWishlist(product.mongoId);

  return (
    <div
      className={cn(
        "group min-w-0",
        layout === "carousel"
          ? "min-w-[min(280px,85vw)] md:min-w-[340px] snap-start shrink-0"
          : "w-full",
      )}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
          />
          {product.isNew && (
            <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">
              New
            </span>
          )}
          {(onAdminEdit || onAdminDelete) && (
            <div className="absolute top-3 right-3 z-10">
              <AdminProductActions
                disabled={!adminEditReady}
                onEdit={onAdminEdit ? () => onAdminEdit(product) : undefined}
                onDelete={onAdminDelete ? () => onAdminDelete(product) : undefined}
              />
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-100 translate-x-0 md:opacity-0 md:translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-500">
            <button
              type="button"
              aria-label="Wishlist"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.mongoId);
                toast.success(saved ? "Removed from wishlist." : "Saved to wishlist.");
              }}
              className="size-10 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"
            >
              <HeartIcon className={cn("size-4", saved && "text-[color:var(--maroon)]")} />
            </button>
            <button
              type="button"
              aria-label="Add to bag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product.mongoId);
                toast.success("Added to your bag.");
              }}
              className="size-10 bg-[color:var(--ivory)] text-[color:var(--charcoal)] flex items-center justify-center hover:bg-[color:var(--gold)]"
            >
              <BagIcon className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4
              className={cn(
                "font-serif text-lg leading-tight truncate",
                dark ? "text-[color:var(--ivory)]" : "text-foreground",
              )}
            >
              {product.name}
            </h4>
            <p
              className={cn(
                "eyebrow text-[9px] mt-1.5",
                dark ? "text-[color:var(--ivory)]/50" : "text-foreground/50",
              )}
            >
              {product.fabric}
            </p>
          </div>
          <p
            className={cn(
              "text-sm font-medium tabular-nums shrink-0",
              dark ? "text-[color:var(--gold-soft)]" : "text-[color:var(--maroon)]",
            )}
          >
            {format(product.price)}
          </p>
        </div>
      </Link>
    </div>
  );
}

const MENSWEAR_SILHOUETTES = [
  {
    slug: "sherwanis",
    title: "Sherwani",
    occasion: "The wedding ceremony",
    copy: "The most famous Indian groomswear silhouette — a long, structured coat worn for the pheras. Blessings cuts it slim on the Delhi last, with zardosi and silk that read as heirloom, not costume.",
  },
  {
    slug: "bandhgalas",
    title: "Bandhgala",
    occasion: "Reception & black tie",
    copy: "The closed-collar jacket that moved from princely courts to every modern reception. Mandarin collar, a clean button line, evening sovereignty — the bandhgala is India’s answer to the tuxedo.",
  },
  {
    slug: "indo-western",
    title: "Indo Western",
    occasion: "Sangeet, cocktail, after-party",
    copy: "Where drape meets tailoring: kurtas, jackets, and statement prints for the nights around the wedding. The silhouette famous street-style menswear made global — Blessings makes it atelier-grade.",
  },
  {
    slug: "shirts",
    title: "Shirts",
    occasion: "Everyday & cocktail",
    copy: "The most famous everyday menswear piece — cut as a Blessings statement: print, embroidery, and cotton that holds its own next to a bandhgala.",
  },
] as const;

function ExploreMenswear() {
  const { categories, products } = Route.useLoaderData();

  return (
    <section
      data-reveal-direction="alternate"
      className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-16 sm:py-24 md:py-32"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mb-12 md:mb-20">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-4">The Wardrobe</p>
          <h2 className="font-serif italic text-4xl md:text-5xl leading-tight text-balance">
            Explore famous men’s wear — cut for Blessings.
          </h2>
          <p className="mt-6 text-[color:var(--ivory)]/65 text-sm md:text-base leading-relaxed max-w-lg">
            Three silhouettes every well-dressed Indian man knows — plus the statement shirt.
            Sherwani, bandhgala, Indo-Western, and shirts from the Delhi atelier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {MENSWEAR_SILHOUETTES.map((item) => {
            const cat = categories.find((c) => c.slug === item.slug);
            const cover =
              cat?.imageUrl ||
              products.find((p) => p.categorySlug === item.slug)?.imageUrl ||
              "/banners/banner-1.jpeg";
            const count = products.filter((p) => p.categorySlug === item.slug).length;
            return (
              <Link
                key={item.slug}
                to="/shop/$category"
                params={{ category: item.slug }}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]">
                  <img
                    src={cover}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/80 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">
                    {item.occasion}
                  </span>
                </div>
                <h3 className="mt-5 font-serif italic text-3xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--ivory)]/60">
                  {item.copy}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 eyebrow text-[10px] text-[color:var(--gold-soft)] group-hover:gap-3 transition-all">
                  Shop {count > 0 ? `${count} looks` : "the collection"}{" "}
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const OCCASIONS = [
  {
    label: "Wedding",
    slug: "sherwanis" as const,
    line: "Pheras & the main ceremony",
    pick: 0,
  },
  {
    label: "Reception",
    slug: "bandhgalas" as const,
    line: "Closed collar, evening light",
    pick: 0,
  },
  {
    label: "Sangeet",
    slug: "indo-western" as const,
    line: "Drape, print, movement",
    pick: 0,
  },
  {
    label: "Cocktail",
    slug: "indo-western" as const,
    line: "After-party statement",
    pick: 1,
  },
] as const;

function ShopByOccasion() {
  const { products } = Route.useLoaderData();

  return (
    <section
      data-reveal-direction="split"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32"
    >
      <SectionHeader
        eyebrow="Worn For"
        title="Shop famous occasions, not just categories."
        ctaHref="/shop/all"
        ctaLabel="Shop all →"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {OCCASIONS.map((occ) => {
          const pool = products.filter((p) => p.categorySlug === occ.slug);
          const cover = pool[occ.pick] ?? pool[0];
          return (
            <Link
              key={occ.label}
              to="/shop/$category"
              params={{ category: occ.slug }}
              className="group relative aspect-[3/4] overflow-hidden bg-[color:var(--muted)]"
            >
              {cover?.imageUrl ? (
                <img
                  src={cover.imageUrl}
                  alt={occ.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/75 via-[color:var(--charcoal)]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-[color:var(--ivory)]">
                <p className="eyebrow text-[9px] text-[color:var(--gold-soft)] mb-2">{occ.line}</p>
                <h3 className="font-serif italic text-2xl sm:text-3xl">{occ.label}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RelatedLooks() {
  const { products } = Route.useLoaderData();
  const scroller = useRef<HTMLDivElement>(null);
  const core = products.filter((p) =>
    ["sherwanis", "bandhgalas", "indo-western", "shirts"].includes(p.categorySlug),
  );
  const looks = (core.length >= 6 ? core.slice(4) : core).slice(0, 10);
  if (looks.length < 3) return null;

  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section
      data-reveal-direction="alternate"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 sm:mb-14">
        <div className="max-w-xl">
          <p className="eyebrow text-[color:var(--gold)] mb-4">(06) Related Looks</p>
          <h2 className="font-serif italic text-4xl md:text-5xl leading-tight text-balance">
            More from the atelier.
          </h2>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <Link
            to="/shop/$category"
            params={{ category: "all" }}
            className="eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
          >
            View all →
          </Link>
          <div className="hidden sm:flex gap-3">
            <button
              type="button"
              onClick={() => scrollBy(-360)}
              aria-label="Previous related looks"
              className="size-11 border border-foreground/15 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="size-4" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(360)}
              aria-label="Next related looks"
              className="size-11 border border-foreground/15 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] flex items-center justify-center transition-colors"
            >
              <ArrowRight className="size-4" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {looks.map((p) => (
          <ProductCard key={p.id} product={p} layout="carousel" />
        ))}
      </div>
    </section>
  );
}

function BespokeStory() {
  return (
    <section className="bg-background py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute -top-10 left-0 right-0 text-center pointer-events-none select-none">
        <span className="font-serif italic text-[18vw] leading-none text-foreground/[0.03]">
          Bespoke
        </span>
      </div>
      <div
        data-reveal-section
        data-reveal-direction="split"
        className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 md:gap-24 items-center"
      >
        <div className="relative">
          <img
            src={bespokeImg}
            alt="Midnight black statement piece with gold details"
            width={1200}
            height={1500}
            loading="lazy"
            className="w-full aspect-[4/5] object-cover"
          />
          <div className="absolute bottom-0 right-0 md:-bottom-8 md:-right-12 size-32 sm:size-40 md:size-52 bg-[color:var(--ivory)] border border-[color:var(--gold)]/30 text-[color:var(--maroon)] flex flex-col items-center justify-center text-center p-4 md:p-6 shadow-sm">
            <span className="font-serif italic text-4xl md:text-5xl">30+</span>
            <span className="eyebrow text-[9px] mt-2 leading-tight text-foreground/60">
              Days of Artisan Craftsmanship
            </span>
          </div>
        </div>
        <div>
          <p className="eyebrow text-[color:var(--maroon)] mb-6">(03) The Bespoke Experience</p>
          <h2 className="font-serif italic text-4xl md:text-6xl leading-[1.05] text-balance text-foreground">
            Tailored to your story, delivered to your door.
          </h2>
          <p className="mt-8 text-foreground/60 leading-relaxed max-w-md">
            From our flagship atelier in Delhi to your doorstep in London, New York or Dubai — every
            garment is a dialogue between tradition and your personal vision. Virtual consultations
            available for our international clientele.
          </p>
          <div className="mt-10 space-y-4">
            {[
              ["01", "Private virtual or in-person consultation"],
              ["02", "Fabric selection — silk, velvet, pashmina"],
              ["03", "Master pattern & three fittings"],
              ["04", "White-glove worldwide delivery"],
            ].map(([n, t]) => (
              <div key={n} className="flex items-center gap-6 border-b border-foreground/10 pb-4">
                <span className="font-serif italic text-[color:var(--maroon)] text-lg">{n}</span>
                <span className="eyebrow text-[10px] text-foreground/80">{t}</span>
              </div>
            ))}
          </div>
          <Link
            to="/bespoke"
            className="mt-10 inline-flex items-center gap-3 bg-[color:var(--maroon)] hover:bg-[color:var(--charcoal)] text-[color:var(--ivory)] px-10 py-4 eyebrow text-[10.5px] transition-colors"
          >
            Book an appointment <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GroomsEdit() {
  const { products } = Route.useLoaderData();
  const groomProducts = products.filter((p) => p.bestSeller).slice(0, 4);
  return (
    <section
      data-reveal-direction="alternate"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32"
    >
      <SectionHeader
        eyebrow="(04) The Groom's Edit"
        title="Best sellers for the modern wedding."
        ctaHref="/shop/sherwanis"
        ctaLabel="View all →"
      />
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
        <section
          data-reveal-direction="left"
          className="parallax-scroll__panel max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 w-full"
        >
          <div className="max-w-xl text-[color:var(--ivory)] py-16 md:py-0">
            <p className="eyebrow text-[color:var(--gold-soft)] mb-6">(05) Craftsmanship</p>
            <h2 className="font-serif italic text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-balance">
              Every stitch, an inheritance.
            </h2>
            <p className="mt-8 text-[color:var(--ivory)]/85 text-sm md:text-base leading-relaxed max-w-md">
              Zardosi, dabka, aari — the same hands, the same threads, the same wooden frames that
              have graced Delhi ateliers for four generations. We do not chase trends. We uphold
              traditions.
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
      cover={<InstagramReelsSection />}
    />
  );
}

const TESTIMONIALS = [
  {
    quote:
      "The sherwani arrived in London a week before the wedding — the fit was flawless from the very first try-on. Nothing short of a masterpiece.",
    author: "Rohan M.",
    location: "London, UK",
  },
  {
    quote:
      "Blessings styled my entire wedding party from New Jersey. Every fitting, every fabric choice, was handled with the care of an old family tailor.",
    author: "Arjun S.",
    location: "New York, USA",
  },
  {
    quote:
      "The virtual consultation felt intimate. My bandhgala fit like it had been made in Dubai — not stitched thousands of miles away.",
    author: "Faisal K.",
    location: "Dubai, UAE",
  },
  {
    quote:
      "Received my wedding suit in Toronto three weeks after ordering. Impeccable finish, and worth every penny.",
    author: "Karanveer J.",
    location: "Toronto, Canada",
  },
];

function Testimonials({ cms }: { cms?: Record<string, unknown> }) {
  const cmsReviews = Array.isArray(cms?.items)
    ? (cms.items as Array<{ quote: string; author: string; location: string }>)
    : null;
  const reviews = cmsReviews?.length ? cmsReviews : TESTIMONIALS;
  const eyebrow = String(cms?.eyebrow ?? "(07) Testimonials");
  const title = String(cms?.title ?? "Trusted by grooms across four continents.");

  return (
    <section
      data-reveal-direction="alternate"
      className="bg-[color:var(--muted)]/40 py-16 sm:py-24 md:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow text-[color:var(--gold)] mb-4">{eyebrow}</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl text-balance">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((t) => (
            <figure
              key={t.author}
              className="bg-background p-6 sm:p-8 md:p-10 border border-foreground/5"
            >
              <div className="flex gap-0.5 text-[color:var(--gold)] mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" strokeWidth={0} />
                ))}
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
        <p className="text-[color:var(--ivory)]/60 mt-6 text-sm">
          Fewer than four emails a year. Never a promotion.
        </p>
        <form className="mt-12 flex items-center border-b border-[color:var(--ivory)]/30 focus-within:border-[color:var(--gold)] transition-colors max-w-md mx-auto">
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="flex-1 bg-transparent py-3 text-xs tracking-widest outline-none placeholder:text-[color:var(--ivory)]/40 text-center"
          />
          <button type="submit" className="eyebrow text-[10px] text-[color:var(--gold)] px-4">
            Subscribe →
          </button>
        </form>
      </div>
    </section>
  );
}
