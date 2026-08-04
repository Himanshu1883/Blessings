import craftImg from "@/assets/craft.jpg";
import bespokeImg from "@/assets/bespoke.jpg";
import { CATEGORIES } from "@/lib/catalog";

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  readTime: string;
  date: string;
  author: string;
  image: string;
  featured?: boolean;
};

export const JOURNAL_POSTS: JournalPost[] = [
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
