import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import catSherwani from "@/assets/cat-sherwani.jpg";
import catBandhgala from "@/assets/cat-bandhgala.jpg";
import catIndowestern from "@/assets/cat-indowestern.jpg";
import catGroom from "@/assets/cat-groom.jpg";
import catAccessories from "@/assets/cat-accessories.jpg";

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  subCategories: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "sherwanis",
    name: "Sherwanis",
    tagline: "Handcrafted heirloom silhouettes for the modern groom.",
    image: catSherwani,
    subCategories: ["Silk & Zardosi", "Velvet Heritage", "Pastel Groom", "Floral Embroidered", "Ivory Classic"],
  },
  {
    slug: "bandhgalas",
    name: "Bandhgalas",
    tagline: "Structured tailoring, mandarin collars, evening sovereignty.",
    image: catBandhgala,
    subCategories: ["Classic Black", "Emerald Velvet", "Prince Coats", "Nehru Jackets"],
  },
  {
    slug: "wedding-suits",
    name: "Wedding Suits",
    tagline: "Italian construction, Indian soul.",
    image: catGroom,
    subCategories: ["Three-Piece", "Tuxedos", "Ivory Suits", "Charcoal Formal"],
  },
  {
    slug: "indo-western",
    name: "Indo-Western",
    tagline: "Draped kurtas, layered jackets, contemporary silhouettes.",
    image: catIndowestern,
    subCategories: ["Draped Kurtas", "Asymmetric Sets", "Jacket Kurtas", "Cowl Pants"],
  },
  {
    slug: "occasion-kurtas",
    name: "Occasion Kurtas",
    tagline: "Silk kurta sets for every celebration.",
    image: product1,
    subCategories: ["Chikankari", "Silk Sets", "Bandi Jackets", "Angrakha"],
  },
  {
    slug: "accessories",
    name: "Accessories",
    tagline: "Finishing details — safas, stoles, brooches.",
    image: catAccessories,
    subCategories: ["Safa Turbans", "Stoles", "Brooches", "Pocket Squares", "Mojaris"],
  },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export type Product = {
  id: string;
  name: string;
  categorySlug: string;
  fabric: string;
  price: number; // INR
  image: string;
  description: string;
  isNew?: boolean;
  bestSeller?: boolean;
};

export const PRODUCTS: Product[] = [
  {
    id: "the-rosewood-sherwani",
    name: "The Rosewood Sherwani",
    categorySlug: "sherwanis",
    fabric: "Rose Silk & Zardosi",
    price: 74000,
    image: product1,
    description:
      "A blush pink silk sherwani hand-embroidered with pearl and zardosi motifs. Cut on the Delhi last with a slim, tailored silhouette. Paired with a matching safa and long pearl mala.",
    isNew: true,
    bestSeller: true,
  },
  {
    id: "royal-emerald-bandhgala",
    name: "Royal Emerald Bandhgala",
    categorySlug: "bandhgalas",
    fabric: "Pure Italian Velvet",
    price: 118000,
    image: product2,
    description:
      "Deep emerald Italian velvet, structured shoulder line, hand-cast antique gold buttons. Reception ready — dinner ready — future heirloom.",
    isNew: true,
    bestSeller: true,
  },
  {
    id: "heritage-ivory-suit",
    name: "Heritage Ivory Wedding Suit",
    categorySlug: "wedding-suits",
    fabric: "Raw Ivory Silk",
    price: 185000,
    image: product3,
    description:
      "A three-piece ivory silk suit with tonal embroidery along the placket. Constructed with full canvas — the drape softens over years, the shape never does.",
    bestSeller: true,
  },
  {
    id: "midnight-zardosi-kurta",
    name: "Midnight Zardosi Kurta",
    categorySlug: "occasion-kurtas",
    fabric: "Midnight Blue Silk",
    price: 42000,
    image: product4,
    description:
      "Deep midnight blue silk kurta with intricate zardosi work at the collar and yoke. Cocktail-hour tailoring for the modern gentleman.",
    isNew: true,
  },
  {
    id: "imperial-maroon-sherwani",
    name: "The Imperial Maroon Sherwani",
    categorySlug: "sherwanis",
    fabric: "Velvet, Gold Thread",
    price: 240000,
    image: catGroom,
    description:
      "Our signature groom sherwani — deep maroon velvet with hand-crafted gold zardosi from collar to hem. Includes safa, stole and churidar.",
    bestSeller: true,
  },
  {
    id: "onyx-bandhgala",
    name: "The Onyx Bandhgala",
    categorySlug: "bandhgalas",
    fabric: "Onyx Wool Blend",
    price: 96000,
    image: catBandhgala,
    description:
      "A jet-black bandhgala with subtle collar embroidery and antique gold buttons. Understated masculine luxury.",
  },
  {
    id: "atelier-drape-kurta",
    name: "Atelier Drape Set",
    categorySlug: "indo-western",
    fabric: "Ivory Cotton Silk",
    price: 58000,
    image: catIndowestern,
    description:
      "An ivory drape kurta with tailored trousers and a taupe overcoat. A contemporary silhouette for engagements and receptions.",
    isNew: true,
  },
  {
    id: "atelier-sherwani-ivory",
    name: "The Atelier Sherwani",
    categorySlug: "sherwanis",
    fabric: "Ivory Silk",
    price: 88000,
    image: catSherwani,
    description:
      "An ivory silk sherwani with pearl and thread work along the placket. A modern take on the classic wedding silhouette.",
    bestSeller: true,
  },
];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
export function productsByCategory(slug: string) {
  return PRODUCTS.filter((p) => p.categorySlug === slug);
}