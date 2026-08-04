const STORAGE_KEY = "blessings_recently_viewed";
const MAX_ITEMS = 6;

export type RecentProduct = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

export function addRecentlyViewed(product: RecentProduct) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewed().filter((p) => p.slug !== product.slug);
    const next = [product, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("recently-viewed-updated"));
  } catch {
    /* ignore storage errors */
  }
}

export function getRecentlyViewed(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProduct[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}
