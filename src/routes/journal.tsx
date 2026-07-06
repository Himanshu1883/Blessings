import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, User } from "lucide-react";
import craftImg from "@/assets/craft.jpg";
import bespokeImg from "@/assets/bespoke.jpg";
import { CATEGORIES } from "@/lib/catalog";
import { useScrollExperience } from "@/components/site/scroll-experience";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Blessings Men's Boutique" },
      {
        name: "description",
        content:
          "Notes from our Delhi atelier — craftsmanship diaries, wedding styling guides, and stories from grooms across the world.",
      },
      { property: "og:title", content: "Journal — Blessings" },
      {
        property: "og:description",
        content: "Craftsmanship, styling and the modern Indian wedding — from the house of Blessings.",
      },
      { property: "og:image", content: "/banners/banner-3.jpeg" },
    ],
  }),
  component: Journal,
});

const TOPICS = ["All", "Craftsmanship", "Styling", "Weddings", "Clients", "Atelier"] as const;
type Topic = (typeof TOPICS)[number];

type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: Topic;
  readTime: string;
  date: string;
  author: string;
  image: string;
  featured?: boolean;
};

const POSTS: JournalPost[] = [
  {
    slug: "anatomy-zardosi-sherwani",
    title: "The Anatomy of a Zardosi Sherwani",
    excerpt:
      "Thirty days, four artisans, sixteen thousand stitches. We open the atelier doors on the making of our signature groom silhouette — from muslin toile to the final press.",
    tag: "Craftsmanship",
    readTime: "8 min",
    date: "Mar 12, 2026",
    author: "Arjun Mehta",
    image: CATEGORIES[0].image,
    featured: true,
  },
  {
    slug: "wedding-palette-guide",
    title: "Choosing Your Wedding Palette",
    excerpt:
      "Maroon, ivory, emerald, midnight — a house stylist's guide to picking colour for the modern Indian groom across sangeet, ceremony and reception.",
    tag: "Styling",
    readTime: "6 min",
    date: "Feb 28, 2026",
    author: "Priya Nair",
    image: CATEGORIES[1].image,
  },
  {
    slug: "delhi-to-toronto",
    title: "From Delhi to Toronto: A Fitting Story",
    excerpt:
      "How we dressed one groom and his eleven groomsmen without ever meeting them in person — virtual measurements, muslin trials and white-glove delivery.",
    tag: "Clients",
    readTime: "10 min",
    date: "Feb 14, 2026",
    author: "House Editorial",
    image: CATEGORIES[2].image,
  },
  {
    slug: "hand-painted-motifs",
    title: "Hand-Painted Motifs: Tiger, Horse & Heritage",
    excerpt:
      "Our artists sketch directly onto silk and cotton canvases. A look at the wild motif edit that has become synonymous with Blessings statement pieces.",
    tag: "Craftsmanship",
    readTime: "7 min",
    date: "Jan 30, 2026",
    author: "Rahul Verma",
    image: "/banners/banner-2.jpeg",
  },
  {
    slug: "reception-bandhgala",
    title: "The Reception Bandhgala Edit",
    excerpt:
      "Midnight velvet, emerald silk, ivory prince coats — how to transition from ceremony sherwani to reception-ready tailoring without losing narrative.",
    tag: "Weddings",
    readTime: "5 min",
    date: "Jan 18, 2026",
    author: "Priya Nair",
    image: CATEGORIES[3].image,
  },
  {
    slug: "atelier-morning",
    title: "Five AM in the Delhi Atelier",
    excerpt:
      "Before the boutique opens, master embroiderers arrive with chai and wooden frames. A photo essay from the lanes of South Extension.",
    tag: "Atelier",
    readTime: "4 min",
    date: "Jan 5, 2026",
    author: "House Editorial",
    image: craftImg,
  },
  {
    slug: "groomsmen-uniform",
    title: "Dressing Twelve Groomsmen as One Story",
    excerpt:
      "Coordinated indo-western sets for a Dubai wedding — same palette, varied silhouettes, each piece numbered and packed for the concierge team.",
    tag: "Clients",
    readTime: "9 min",
    date: "Dec 20, 2025",
    author: "Arjun Mehta",
    image: CATEGORIES[4].image,
  },
  {
    slug: "fabric-library",
    title: "Inside Our Fabric Library",
    excerpt:
      "From Banarasi silks to Italian wools — two hundred swatches, each with a provenance card and a recommended silhouette from the house stylists.",
    tag: "Atelier",
    readTime: "6 min",
    date: "Dec 8, 2025",
    author: "Rahul Verma",
    image: bespokeImg,
  },
];

const STATS = [
  { value: "48+", label: "Stories published" },
  { value: "12", label: "House contributors" },
  { value: "40", label: "Countries covered" },
  { value: "1962", label: "Heritage since" },
];

function Journal() {
  const [topic, setTopic] = useState<Topic>("All");
  const featured = POSTS.find((p) => p.featured)!;
  const filtered = topic === "All" ? POSTS.filter((p) => !p.featured) : POSTS.filter((p) => p.tag === topic && !p.featured);

  return (
    <div>
      <JournalHero />
      <JournalStats />
      <FeaturedArticle post={featured} />

      <JournalParallaxBand />
      <JournalTopics active={topic} onChange={setTopic} />
      <JournalGrid posts={filtered} />
      <EditorsNote />
      <JournalNewsletter />
    </div>
  );
}

function JournalParallaxBand() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const { lenis } = useScrollExperience();

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const update = () => {
      const rect = media.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const progress = Math.min(1, Math.max(0, 1 - rect.bottom / (rect.height + window.innerHeight * 0.5)));
      media.style.transform = `scale(${1 + progress * 0.06})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    lenis?.on("scroll", update);
    return () => {
      window.removeEventListener("scroll", update);
      lenis?.off("scroll", update);
    };
  }, [lenis]);

  return (
    <section
      data-reveal-direction="fade"
      className="parallax-band h-[30vh] min-h-[220px] sm:min-h-[260px]"
    >
      <div
        ref={mediaRef}
        className="parallax-band__media"
        style={{ backgroundImage: "url(/banners/banner-3.jpeg)" }}
        aria-hidden="true"
      />
      <div className="parallax-band__shade" aria-hidden="true" />
      <div className="parallax-band__content max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 w-full">
        <div className="max-w-3xl mx-auto text-center text-[color:var(--ivory)] py-6">
          <p className="eyebrow text-[color:var(--gold-soft)] mb-4 sm:mb-5">Words from the Workroom</p>
          <blockquote className="font-serif italic text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-snug text-balance">
            &ldquo;Every garment is a letter written in thread — posted from our atelier to your wedding day.&rdquo;
          </blockquote>
          <p className="eyebrow text-[9px] sm:text-[10px] text-[color:var(--ivory)]/60 mt-6 md:mt-8">
            — The House of Blessings, Delhi
          </p>
        </div>
      </div>
    </section>
  );
}

function JournalHero() {
  return (
    <section className="reveal-ignore relative h-[min(55vh,520px)] min-h-[300px] sm:min-h-[360px] overflow-hidden">
      <img
        src="/banners/banner-1.jpeg"
        alt="Blessings journal editorial"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--charcoal)]/50 via-[color:var(--charcoal)]/35 to-[color:var(--charcoal)]/75" />
      <div className="relative h-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20">
        <p className="eyebrow text-[color:var(--gold-soft)] mb-4 animate-reveal">The Journal</p>
        <h1 className="font-serif italic text-4xl sm:text-5xl md:text-7xl lg:text-[88px] leading-[0.95] text-[color:var(--ivory)] max-w-4xl text-balance animate-reveal">
          Notes from the <span className="text-[color:var(--gold-soft)]">atelier.</span>
        </h1>
        <p className="mt-6 max-w-xl text-sm sm:text-base text-[color:var(--ivory)]/75 leading-relaxed animate-reveal">
          Craftsmanship diaries, wedding styling guides, and stories from grooms in London, Dubai, New York and beyond.
        </p>
      </div>
    </section>
  );
}

function JournalStats() {
  return (
    <section data-reveal-direction="alternate" className="border-b border-foreground/10 bg-[color:var(--muted)]/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <p className="font-serif italic text-3xl sm:text-4xl md:text-5xl text-[color:var(--maroon)]">{s.value}</p>
            <p className="eyebrow text-[9px] sm:text-[10px] text-foreground/50 mt-2">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedArticle({ post }: { post: JournalPost }) {
  return (
    <section data-reveal-direction="split" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28">
      <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
        <p className="eyebrow text-[color:var(--gold)]">Featured Story</p>
        <span className="eyebrow text-[9px] text-foreground/40 hidden sm:inline">Editor&apos;s pick</span>
      </div>
      <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center group">
        <div className="lg:col-span-7 relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5] overflow-hidden bg-[color:var(--muted)]">
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
        <div className="lg:col-span-5">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="eyebrow text-[10px] text-[color:var(--maroon)] border border-[color:var(--maroon)]/30 px-3 py-1">
              {post.tag}
            </span>
            <PostMeta readTime={post.readTime} date={post.date} />
          </div>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-balance group-hover:text-[color:var(--maroon)] transition-colors duration-500">
            {post.title}
          </h2>
          <p className="mt-6 text-sm sm:text-base text-foreground/65 leading-relaxed">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-2 text-foreground/50">
            <User className="size-3.5" strokeWidth={1.4} />
            <span className="eyebrow text-[10px]">{post.author}</span>
          </div>
          <button
            type="button"
            className="mt-10 inline-flex items-center gap-3 eyebrow text-[10px] border-b border-foreground/25 pb-1 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors"
          >
            Read the full story <ArrowRight className="size-3.5" />
          </button>
        </div>
      </article>
    </section>
  );
}

function JournalTopics({ active, onChange }: { active: Topic; onChange: (t: Topic) => void }) {
  return (
    <section data-reveal-direction="up" className="bg-background max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-14 sm:pt-20 pb-8 sm:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-3">Browse by Topic</p>
          <h2 className="font-serif italic text-2xl sm:text-3xl md:text-4xl">Latest from the house.</h2>
        </div>
        <p className="eyebrow text-[10px] text-foreground/45 max-w-xs">
          Filter stories by craft, styling, weddings and client journeys.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              "eyebrow text-[9px] sm:text-[10px] px-4 sm:px-5 py-2.5 border transition-all duration-300",
              active === t
                ? "bg-[color:var(--charcoal)] text-[color:var(--ivory)] border-[color:var(--charcoal)]"
                : "border-foreground/15 text-foreground/60 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </section>
  );
}

function JournalGrid({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) {
    return (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-16 text-center">
        <p className="font-serif italic text-2xl text-foreground/50">No stories in this topic yet.</p>
        <p className="eyebrow text-[10px] text-foreground/40 mt-3">Try another filter or check back soon.</p>
      </section>
    );
  }

  return (
    <section data-reveal-direction="alternate" className="bg-background max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-14">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

function ArticleCard({ post }: { post: JournalPost }) {
  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--muted)]">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[color:var(--charcoal)]/0 group-hover:bg-[color:var(--charcoal)]/25 transition-colors duration-500" />
        <span className="absolute top-4 left-4 eyebrow text-[9px] bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-2.5 py-1">
          {post.tag}
        </span>
      </div>
      <div className="mt-5 flex flex-col flex-1">
        <PostMeta readTime={post.readTime} date={post.date} />
        <h3 className="font-serif italic text-xl sm:text-2xl mt-3 leading-snug group-hover:text-[color:var(--maroon)] transition-colors duration-300">
          {post.title}
        </h3>
        <p className="mt-3 text-sm text-foreground/60 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
        <div className="mt-5 flex items-center justify-between gap-4 pt-4 border-t border-foreground/8">
          <span className="eyebrow text-[9px] text-foreground/45">{post.author}</span>
          <span className="eyebrow text-[9px] text-[color:var(--maroon)] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1.5">
            Read <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </article>
  );
}

function PostMeta({ readTime, date }: { readTime: string; date: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow text-[9px] text-foreground/45">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3" strokeWidth={1.4} />
        {readTime} read
      </span>
      <span>{date}</span>
    </div>
  );
}

function EditorsNote() {
  return (
    <section
      data-reveal-direction="split"
      className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] py-16 sm:py-24 md:py-28"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden">
          <img src={craftImg} alt="Editor at work" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[color:var(--charcoal)]/20" />
        </div>
        <div>
          <p className="eyebrow text-[color:var(--gold-soft)] mb-5">Editor&apos;s Note</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-balance">
            We write what we stitch.
          </h2>
          <p className="mt-6 text-sm sm:text-base text-[color:var(--ivory)]/70 leading-relaxed">
            The Journal is not a marketing catalogue — it is a record of hands, hours and heritage. Each story is
            reported from our South Extension atelier or filed by stylists on the road to London, Dubai and Toronto.
          </p>
          <p className="mt-4 text-sm sm:text-base text-[color:var(--ivory)]/70 leading-relaxed">
            Have a wedding story to share? Our editorial desk welcomes submissions from grooms and families who wore
            Blessings on their greatest day.
          </p>
          <Link
            to="/contact"
            className="mt-8 sm:mt-10 inline-flex items-center gap-3 bg-[color:var(--gold)] hover:bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-6 sm:px-8 py-3.5 sm:py-4 eyebrow text-[10px] transition-colors"
          >
            Pitch a story <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function JournalNewsletter() {
  return (
    <section
      data-reveal-direction="up"
      className="border-t border-foreground/10 py-16 sm:py-24 md:py-28 text-center px-4 sm:px-6"
    >
      <div className="max-w-xl mx-auto">
        <p className="eyebrow text-[color:var(--gold)] mb-5">Stay in the Loop</p>
        <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">
          New stories, once a month.
        </h2>
        <p className="mt-5 text-sm text-foreground/55 leading-relaxed">
          Journal dispatches and private trunk-show invitations — never more than four emails a year.
        </p>
        <form className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-0 border border-foreground/20 focus-within:border-[color:var(--gold)] transition-colors max-w-md mx-auto">
          <input
            type="email"
            placeholder="YOUR EMAIL"
            className="flex-1 bg-transparent px-4 py-3.5 text-xs tracking-widest outline-none placeholder:text-foreground/35 text-center sm:text-left"
          />
          <button
            type="submit"
            className="eyebrow text-[10px] text-[color:var(--maroon)] px-6 py-3.5 border-t sm:border-t-0 sm:border-l border-foreground/20 hover:bg-[color:var(--muted)]/50 transition-colors"
          >
            Subscribe →
          </button>
        </form>
        <Link
          to="/bespoke"
          className="mt-8 inline-flex items-center gap-2 eyebrow text-[10px] text-foreground/45 hover:text-[color:var(--maroon)] transition-colors"
        >
          Or book a consultation <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}
