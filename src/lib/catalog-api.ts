import { api, getApiBase, resolveMediaUrl } from "./api-client";
import type { ApiCategory, ApiProduct } from "./api-types";
import {
  CATEGORIES,
  PRODUCTS,
  getCategory as getStaticCategory,
  getProduct as getStaticProduct,
  productsByCategory as staticProductsByCategory,
  type Product as StaticProduct,
  type Category as StaticCategory,
} from "./catalog";

function allowStaticFallback() {
  return import.meta.env.DEV === true;
}

export type StoreCustomField = {
  id: string;
  label: string;
  type: string;
  value: unknown;
  showOnProductPage: boolean;
};

export type StoreProduct = {
  id: string;
  mongoId: string;
  slug: string;
  name: string;
  sku?: string | null;
  categorySlug: string;
  fabric: string;
  price: number;
  imageUrl: string;
  imageUrls: string[];
  description: string;
  isNew?: boolean;
  bestSeller?: boolean;
  sizes: string[];
  colors: string[];
  showColorSelector: boolean;
  showSizeSelector: boolean;
  stock: Record<string, number>;
  customFields: StoreCustomField[];
};

export type StoreCategory = {
  slug: string;
  name: string;
  tagline: string;
  imageUrl: string;
  subCategories: string[];
  showOnNavbar?: boolean;
};

function mapApiProduct(p: ApiProduct): StoreProduct {
  const imageUrls = (p.imageUrls ?? [])
    .map((u) => resolveMediaUrl(u) ?? "")
    .filter(Boolean);
  const imageUrl = resolveMediaUrl(p.imageUrl) ?? imageUrls[0] ?? "";
  return {
    id: p.slug,
    mongoId: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku ?? null,
    categorySlug: p.categorySlug ?? "",
    fabric: p.fabric,
    price: p.price,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [],
    description: p.description,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    sizes: p.sizes,
    colors: p.colors ?? [],
    showColorSelector: p.showColorSelector ?? true,
    showSizeSelector: p.showSizeSelector ?? true,
    stock: p.stock ?? {},
    customFields: p.customFields ?? [],
  };
}

export function storeProductFromApi(p: ApiProduct): StoreProduct {
  return mapApiProduct(p);
}

function mapStaticProduct(p: StaticProduct): StoreProduct {
  const sizes = ["S", "M", "L", "XL"];
  return {
    id: p.id,
    mongoId: p.id,
    slug: p.id,
    name: p.name,
    sku: null,
    categorySlug: p.categorySlug,
    fabric: p.fabric,
    price: p.price,
    imageUrl: p.image,
    imageUrls: [p.image],
    description: p.description,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    sizes,
    colors: [],
    showColorSelector: true,
    showSizeSelector: true,
    stock: Object.fromEntries(sizes.map((s) => [s, 8])),
    customFields: [],
  };
}

export function productsInCategory(products: StoreProduct[], slug: string) {
  return products.filter((p) => p.categorySlug === slug && Boolean(p.imageUrl));
}

export function collectionHasProducts(products: StoreProduct[], slug: string) {
  return productsInCategory(products, slug).length > 0;
}

export function productImageForCategory(
  products: StoreProduct[],
  slug: string,
  used: Set<string> = new Set(),
) {
  const ranked = productsInCategory(products, slug).sort(
    (a, b) =>
      Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)) ||
      Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)),
  );
  const pick = ranked.find((p) => !used.has(p.imageUrl)) ?? ranked[0];
  if (!pick) return null;
  used.add(pick.imageUrl);
  return pick.imageUrl;
}

export function sizeStock(product: StoreProduct, size: string): number | null {
  const entries = Object.entries(product.stock ?? {});
  if (entries.length === 0) return null;
  return product.stock[size] ?? 0;
}

export function isSizeInStock(product: StoreProduct, size: string): boolean {
  const qty = sizeStock(product, size);
  return qty === null || qty > 0;
}

export function isProductOutOfStock(product: StoreProduct): boolean {
  const values = Object.values(product.stock ?? {});
  if (values.length === 0) return false;
  return values.every((qty) => qty <= 0);
}

function mapApiCategory(c: ApiCategory): StoreCategory {
  return {
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    imageUrl: resolveMediaUrl(c.imageUrl) ?? "",
    subCategories: c.subCategories,
    showOnNavbar: c.showOnNavbar,
  };
}

function mapStaticCategory(c: StaticCategory): StoreCategory {
  return {
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    imageUrl: c.image,
    subCategories: c.subCategories,
  };
}

async function liveApiGet<T>(path: string): Promise<T | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export async function fetchCategories(): Promise<StoreCategory[]> {
  const data = await liveApiGet<ApiCategory[]>("/api/categories");
  if (data) return data.map(mapApiCategory);
  if (allowStaticFallback()) return CATEGORIES.map(mapStaticCategory);
  return [];
}

export async function fetchNavbarCategories(): Promise<StoreCategory[]> {
  const data = await liveApiGet<ApiCategory[]>("/api/categories/navbar");
  if (data) return data.map(mapApiCategory);
  if (allowStaticFallback()) return CATEGORIES.map(mapStaticCategory);
  return [];
}

export async function fetchCategory(slug: string): Promise<StoreCategory | null> {
  const data = await liveApiGet<ApiCategory>(`/api/categories/${slug}`);
  if (data) return mapApiCategory(data);
  if (!allowStaticFallback()) return null;
  const c = getStaticCategory(slug);
  return c ? mapStaticCategory(c) : null;
}

export async function fetchProducts(category?: string, sort?: string): Promise<StoreProduct[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  const data = await liveApiGet<ApiProduct[]>(`/api/products${qs ? `?${qs}` : ""}`);
  if (data) return data.map(mapApiProduct);
  if (!allowStaticFallback()) return [];
  if (category) return staticProductsByCategory(category).map(mapStaticProduct);
  return PRODUCTS.map(mapStaticProduct);
}

export async function fetchProduct(slug: string): Promise<StoreProduct | null> {
  const data = await liveApiGet<ApiProduct>(`/api/products/${slug}`);
  if (data) return mapApiProduct(data);
  if (!allowStaticFallback()) return null;
  const p = getStaticProduct(slug);
  return p ? mapStaticProduct(p) : null;
}

export async function searchProducts(q: string): Promise<StoreProduct[]> {
  try {
    const products = await api.get<ApiProduct[]>(`/api/products/search?q=${encodeURIComponent(q)}`);
    return products.map(mapApiProduct);
  } catch {
    if (!allowStaticFallback()) return [];
    const lower = q.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.fabric.toLowerCase().includes(lower),
    ).map(mapStaticProduct);
  }
}
