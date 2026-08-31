import type { ApiProduct } from "@/lib/api-types";
import type { StockLevel } from "./types";

const LOW_STOCK_THRESHOLD = 3;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function skuify(name: string): string {
  const slug = slugify(name);
  if (!slug) return "";
  return `BLS-${slug.toUpperCase()}`;
}

export function isAutoSlug(name: string, slug: string) {
  const generated = slugify(name);
  return !slug.trim() || slug === generated;
}

export function isAutoSku(name: string, sku: string) {
  const generated = skuify(name);
  return !sku.trim() || sku === generated;
}

export function totalStock(product: ApiProduct): number {
  return Object.values(product.stock ?? {}).reduce((s, n) => s + n, 0);
}

export function stockLevel(product: ApiProduct): "in" | "low" | "out" {
  const values = Object.values(product.stock ?? {});
  if (values.length === 0 || values.every((q) => q <= 0)) return "out";
  if (values.some((q) => q > 0 && q < LOW_STOCK_THRESHOLD)) return "low";
  return "in";
}

export function filterByStock(products: ApiProduct[], level: StockLevel): ApiProduct[] {
  if (level === "all") return products;
  return products.filter((p) => stockLevel(p) === level);
}

export function countStockLevels(products: ApiProduct[]) {
  let inStock = 0;
  let low = 0;
  let out = 0;
  for (const p of products) {
    const l = stockLevel(p);
    if (l === "in") inStock++;
    else if (l === "low") low++;
    else out++;
  }
  return { total: products.length, inStock, low, out };
}
