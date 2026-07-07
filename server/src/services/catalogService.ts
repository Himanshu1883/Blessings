import { Category, toPublicCategory } from "../models/Category.js";
import { Product, toPublicProduct } from "../models/Product.js";
import { AppError } from "../utils/apiResponse.js";
import { sanitizeText, escapeRegex } from "../utils/sanitize.js";
import type { Types } from "mongoose";

export function buildImageUrl(gridFsId: string | undefined, reqBase: string) {
  if (!gridFsId) return null;
  return `${reqBase}/api/media/${gridFsId.toString()}`;
}

export async function listCategories(activeOnly = true) {
  const filter = activeOnly ? { isActive: true } : {};
  const cats = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  return cats.map((c) =>
    toPublicCategory(c, c.imageId ? `/api/media/${c.imageId}` : undefined),
  );
}

export async function getCategoryBySlug(slug: string) {
  const cat = await Category.findOne({ slug, isActive: true });
  if (!cat) throw new AppError(404, "Category not found");
  return toPublicCategory(cat, cat.imageId ? `/api/media/${cat.imageId}` : undefined);
}

export async function listProducts(query: {
  category?: string;
  sort?: string;
  q?: string;
  activeOnly?: boolean;
}) {
  const filter: Record<string, unknown> = query.activeOnly !== false ? { isActive: true } : {};

  if (query.category) {
    const cat = await Category.findOne({ slug: query.category });
    if (!cat) return [];
    filter.categoryId = cat._id;
  }

  if (query.q) {
    filter.$text = { $search: sanitizeText(query.q) };
  }

  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (query.sort === "price-asc") sort = { price: 1 };
  if (query.sort === "price-desc") sort = { price: -1 };
  if (query.sort === "new") sort = { isNewProduct: -1, createdAt: -1 };

  const products = await Product.find(filter).sort(sort).populate("categoryId");
  const cats = await Category.find({ _id: { $in: products.map((p) => p.categoryId) } });
  const catMap = new Map(cats.map((c) => [c._id.toString(), c.slug]));

  return products.map((p) => {
    const imageUrls = p.imageIds.map((id) => `/api/media/${id}`);
    return toPublicProduct(p, catMap.get(p.categoryId.toString()), imageUrls);
  });
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true });
  if (!product) throw new AppError(404, "Product not found");
  const cat = await Category.findById(product.categoryId);
  const imageUrls = product.imageIds.map((id) => `/api/media/${id}`);
  return toPublicProduct(product, cat?.slug, imageUrls);
}

export async function getProductById(id: string) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, "Product not found");
  const cat = await Category.findById(product.categoryId);
  const imageUrls = product.imageIds.map((id) => `/api/media/${id}`);
  return toPublicProduct(product, cat?.slug, imageUrls);
}

export async function createCategory(data: {
  slug: string;
  name: string;
  tagline?: string;
  imageId?: string;
  subCategories?: string[];
  sortOrder?: number;
}) {
  const existing = await Category.findOne({ slug: data.slug.toLowerCase() });
  if (existing) throw new AppError(409, "Category slug already exists");
  const cat = await Category.create({
    slug: data.slug.toLowerCase(),
    name: sanitizeText(data.name),
    tagline: data.tagline ? sanitizeText(data.tagline) : "",
    imageId: data.imageId,
    subCategories: data.subCategories?.map(sanitizeText) ?? [],
    sortOrder: data.sortOrder ?? 0,
  });
  return toPublicCategory(cat, cat.imageId ? `/api/media/${cat.imageId}` : undefined);
}

export async function updateCategory(id: string, data: Partial<{
  name: string;
  tagline: string;
  imageId: string;
  subCategories: string[];
  sortOrder: number;
  isActive: boolean;
}>) {
  const cat = await Category.findById(id);
  if (!cat) throw new AppError(404, "Category not found");
  if (data.name) cat.name = sanitizeText(data.name);
  if (data.tagline !== undefined) cat.tagline = sanitizeText(data.tagline);
  if (data.imageId !== undefined) cat.imageId = data.imageId as unknown as Types.ObjectId;
  if (data.subCategories) cat.subCategories = data.subCategories.map(sanitizeText);
  if (data.sortOrder !== undefined) cat.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) cat.isActive = data.isActive;
  await cat.save();
  return toPublicCategory(cat, cat.imageId ? `/api/media/${cat.imageId}` : undefined);
}

export async function createProduct(data: {
  slug: string;
  name: string;
  categoryId: string;
  fabric?: string;
  price: number;
  description?: string;
  sizes?: string[];
  stock?: Record<string, number>;
  imageIds?: string[];
  isNew?: boolean;
  bestSeller?: boolean;
}) {
  const cat = await Category.findById(data.categoryId);
  if (!cat) throw new AppError(400, "Invalid category");

  const product = await Product.create({
    slug: data.slug.toLowerCase(),
    name: sanitizeText(data.name),
    categoryId: data.categoryId,
    fabric: data.fabric ? sanitizeText(data.fabric) : "",
    price: data.price,
    description: data.description ? sanitizeText(data.description) : "",
    sizes: data.sizes ?? ["S", "M", "L", "XL"],
    stock: data.stock ?? {},
    imageIds: data.imageIds ?? [],
    isNewProduct: data.isNew ?? false,
    bestSeller: data.bestSeller ?? false,
  });
  const imageUrls = product.imageIds.map((id) => `/api/media/${id}`);
  return toPublicProduct(product, cat.slug, imageUrls);
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  categoryId: string;
  fabric: string;
  price: number;
  description: string;
  sizes: string[];
  stock: Record<string, number>;
  imageIds: string[];
  isNew: boolean;
  bestSeller: boolean;
  isActive: boolean;
}>) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, "Product not found");

  if (data.name) product.name = sanitizeText(data.name);
  if (data.categoryId) product.categoryId = data.categoryId as unknown as Types.ObjectId;
  if (data.fabric !== undefined) product.fabric = sanitizeText(data.fabric);
  if (data.price !== undefined) product.price = data.price;
  if (data.description !== undefined) product.description = sanitizeText(data.description);
  if (data.sizes) product.sizes = data.sizes;
  if (data.stock) product.stock = new Map(Object.entries(data.stock));
  if (data.imageIds) product.imageIds = data.imageIds as unknown as Types.ObjectId[];
  if (data.isNew !== undefined) product.isNewProduct = data.isNew;
  if (data.bestSeller !== undefined) product.bestSeller = data.bestSeller;
  if (data.isActive !== undefined) product.isActive = data.isActive;

  await product.save();
  const cat = await Category.findById(product.categoryId);
  const imageUrls = product.imageIds.map((id) => `/api/media/${id}`);
  return toPublicProduct(product, cat?.slug, imageUrls);
}

export async function deleteProduct(id: string) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError(404, "Product not found");
}

export async function searchProducts(q: string) {
  const regex = new RegExp(escapeRegex(sanitizeText(q)), "i");
  const products = await Product.find({
    isActive: true,
    $or: [{ name: regex }, { description: regex }, { fabric: regex }],
  }).limit(20);
  const cats = await Category.find({ _id: { $in: products.map((p) => p.categoryId) } });
  const catMap = new Map(cats.map((c) => [c._id.toString(), c.slug]));
  return products.map((p) => {
    const imageUrls = p.imageIds.map((id) => `/api/media/${id}`);
    return toPublicProduct(p, catMap.get(p.categoryId.toString()), imageUrls);
  });
}
