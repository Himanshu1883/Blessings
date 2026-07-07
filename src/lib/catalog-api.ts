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

export type StoreProduct = {
  id: string;
  mongoId: string;
  slug: string;
  name: string;
  categorySlug: string;
  fabric: string;
  price: number;
  imageUrl: string;
  description: string;
  isNew?: boolean;
  bestSeller?: boolean;
  sizes: string[];
};

export type StoreCategory = {
  slug: string;
  name: string;
  tagline: string;
  imageUrl: string;
  subCategories: string[];
};

function mapApiProduct(p: ApiProduct): StoreProduct {
  return {
    id: p.slug,
    mongoId: p.id,
    slug: p.slug,
    name: p.name,
    categorySlug: p.categorySlug ?? "",
    fabric: p.fabric,
    price: p.price,
    imageUrl: resolveMediaUrl(p.imageUrl) ?? "",
    description: p.description,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    sizes: p.sizes,
  };
}

function mapStaticProduct(p: StaticProduct): StoreProduct {
  return {
    id: p.id,
    mongoId: p.id,
    slug: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    fabric: p.fabric,
    price: p.price,
    imageUrl: p.image,
    description: p.description,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    sizes: ["S", "M", "L", "XL"],
  };
}

function mapApiCategory(c: ApiCategory): StoreCategory {
  return {
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    imageUrl: resolveMediaUrl(c.imageUrl) ?? "",
    subCategories: c.subCategories,
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

async function safeApiGet<T>(path: string): Promise<T | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, { credentials: "include" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export async function fetchCategories(): Promise<StoreCategory[]> {
  const data = await safeApiGet<ApiCategory[]>("/api/categories");
  if (data?.length) return data.map(mapApiCategory);
  return CATEGORIES.map(mapStaticCategory);
}

export async function fetchCategory(slug: string): Promise<StoreCategory | null> {
  const data = await safeApiGet<ApiCategory>(`/api/categories/${slug}`);
  if (data) return mapApiCategory(data);
  const c = getStaticCategory(slug);
  return c ? mapStaticCategory(c) : null;
}

export async function fetchProducts(category?: string, sort?: string): Promise<StoreProduct[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  const data = await safeApiGet<ApiProduct[]>(`/api/products${qs ? `?${qs}` : ""}`);
  if (data?.length) return data.map(mapApiProduct);
  if (category) return staticProductsByCategory(category).map(mapStaticProduct);
  return PRODUCTS.map(mapStaticProduct);
}

export async function fetchProduct(slug: string): Promise<StoreProduct | null> {
  const data = await safeApiGet<ApiProduct>(`/api/products/${slug}`);
  if (data) return mapApiProduct(data);
  const p = getStaticProduct(slug);
  return p ? mapStaticProduct(p) : null;
}

export async function searchProducts(q: string): Promise<StoreProduct[]> {
  try {
    const products = await api.get<ApiProduct[]>(`/api/products/search?q=${encodeURIComponent(q)}`);
    return products.map(mapApiProduct);
  } catch {
    const lower = q.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.fabric.toLowerCase().includes(lower),
    ).map(mapStaticProduct);
  }
}
