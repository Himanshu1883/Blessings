import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { toPublicProduct } from "../models/Product.js";
import { AppError } from "../utils/apiResponse.js";
import type { Types } from "mongoose";

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, lines: [] });
  return cart;
}

async function validateLine(productId: string, size: string, quantity: number) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError(404, "Product not found");
  if (!product.sizes.includes(size)) throw new AppError(400, "Invalid size");
  const stock = product.stock.get(size) ?? 99;
  if (quantity > stock) throw new AppError(400, "Insufficient stock");
  return product;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  const products = await Product.find({ _id: { $in: cart.lines.map((l) => l.productId) } });
  const cats = await Category.find({ _id: { $in: products.map((p) => p.categoryId) } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const catMap = new Map(cats.map((c) => [c._id.toString(), c.slug]));

  const lines = cart.lines.map((line) => {
    const product = productMap.get(line.productId.toString());
    if (!product) return null;
    const imageUrls = product.imageIds.map((id) => `/api/media/${id}`);
    return {
      line: {
        productId: line.productId.toString(),
        size: line.size,
        quantity: line.quantity,
      },
      product: toPublicProduct(product, catMap.get(product.categoryId.toString()), imageUrls),
    };
  }).filter(Boolean);

  const subtotal = lines.reduce((sum, item) => {
    if (!item) return sum;
    return sum + item.product.price * item.line.quantity;
  }, 0);

  return { lines, subtotal, itemCount: cart.lines.reduce((s, l) => s + l.quantity, 0) };
}

export async function addToCart(userId: string, productId: string, size: string, quantity = 1) {
  await validateLine(productId, size, quantity);
  const cart = await getOrCreateCart(userId);
  const idx = cart.lines.findIndex(
    (l) => l.productId.toString() === productId && l.size === size,
  );
  if (idx >= 0) {
    const newQty = cart.lines[idx].quantity + quantity;
    await validateLine(productId, size, newQty);
    cart.lines[idx].quantity = newQty;
  } else {
    cart.lines.push({
      productId: productId as unknown as Types.ObjectId,
      size,
      quantity,
    });
  }
  await cart.save();
  return getCart(userId);
}

export async function updateCartLine(
  userId: string,
  productId: string,
  size: string,
  quantity: number,
) {
  if (quantity < 1) return removeFromCart(userId, productId, size);
  await validateLine(productId, size, quantity);
  const cart = await getOrCreateCart(userId);
  const line = cart.lines.find(
    (l) => l.productId.toString() === productId && l.size === size,
  );
  if (!line) throw new AppError(404, "Cart line not found");
  line.quantity = quantity;
  await cart.save();
  return getCart(userId);
}

export async function removeFromCart(userId: string, productId: string, size: string) {
  const cart = await getOrCreateCart(userId);
  cart.lines = cart.lines.filter(
    (l) => !(l.productId.toString() === productId && l.size === size),
  );
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  cart.lines = [];
  await cart.save();
  return getCart(userId);
}

export async function getCartForOrder(userId: string) {
  const cart = await getOrCreateCart(userId);
  if (cart.lines.length === 0) throw new AppError(400, "Cart is empty");
  return cart;
}
