import { INSTAGRAM_URL } from "@/lib/social";
import { STORE_EMAIL, STORE_LANDLINE } from "@/lib/store-contact";

export const SITE_NAME = "Blessings The Men's Boutique";
export const BRAND_NAME = "Blessings";
export const BRAND_TAGLINE = "The Men's Boutique";
export const BRAND_LOGO = "/logo-blessings.png";
export const OG_IMAGE = "/og-image.jpg";

export const DEFAULT_TITLE =
  "Blessings | Men's Boutique — Bespoke Sherwanis, Bandhgalas & Wedding Suits";
export const DEFAULT_DESCRIPTION =
  "Haute-couture menswear from our Delhi atelier. Handcrafted sherwanis, bandhgalas, wedding suits and statement pieces for grooms worldwide — UK, USA, UAE, Canada.";

export function getSiteUrl() {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  return "https://blessings-phi.vercel.app";
}

export function absoluteUrl(path = "/") {
  if (!path) return getSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function seoHead({
  title,
  description,
  path,
  image,
  noindex,
  type = "website",
  jsonLd,
}: SeoInput) {
  const url = absoluteUrl(path);
  const shareImage = absoluteUrl(image || OG_IMAGE);
  const fullTitle = title.includes("Blessings") ? title : `${title} — ${SITE_NAME}`;
  const desc = clip(description || DEFAULT_DESCRIPTION);

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: desc },
      { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large" },
      { name: "author", content: SITE_NAME },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_IN" },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: desc },
      { property: "og:image", content: shareImage },
      { property: "og:image:alt", content: `${BRAND_NAME} — ${BRAND_TAGLINE}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: desc },
      { name: "twitter:image", content: shareImage },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(jsonLd),
          },
        ]
      : undefined,
  };
}

export function organizationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ClothingStore",
        "@id": `${site}/#store`,
        name: SITE_NAME,
        alternateName: BRAND_NAME,
        url: site,
        logo: absoluteUrl(BRAND_LOGO),
        image: absoluteUrl(OG_IMAGE),
        description: DEFAULT_DESCRIPTION,
        email: STORE_EMAIL,
        telephone: `+91-${STORE_LANDLINE}`,
        sameAs: [INSTAGRAM_URL],
        areaServed: ["IN", "GB", "US", "AE", "CA"],
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: site,
        name: SITE_NAME,
        publisher: { "@id": `${site}/#store` },
      },
    ],
  };
}
