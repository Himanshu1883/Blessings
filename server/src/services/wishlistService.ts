import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { toPublicProduct } from "../models/Product.js";
import { AppError } from "../utils/apiResponse.js";
import type { Types } from "mongoose";

async function getOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) wishlist = await Wishlist.create({ userId, productIds: [] });
  return wishlist;
}

export async function getWishlist(userId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  const products = await Product.find({ _id: { $in: wishlist.productIds }, isActive: true });
  const cats = await Category.find({ _id: { $in: products.map((p) => p.categoryId) } });
  const catMap = new Map(cats.map((c) => [c._id.toString(), c.slug]));
  return products.map((p) => {
    const imageUrls = p.imageIds.map((id) => `/api/media/${id}`);
    return toPublicProduct(p, catMap.get(p.categoryId.toString()), imageUrls);
  });
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError(404, "Product not found");
  const wishlist = await getOrCreateWishlist(userId);
  if (!wishlist.productIds.some((id) => id.toString() === productId)) {
    wishlist.productIds.push(productId as unknown as Types.ObjectId);
    await wishlist.save();
  }
  return getWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.productIds = wishlist.productIds.filter((id) => id.toString() !== productId);
  await wishlist.save();
  return getWishlist(userId);
}

export async function isInWishlist(userId: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  return wishlist.productIds.some((id) => id.toString() === productId);
}
