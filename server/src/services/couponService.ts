import { Types } from "mongoose";
import { Category } from "../models/Category.js";
import { Coupon, toPublicCoupon, type ICoupon, type PublicCoupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/apiResponse.js";
import { sanitizeText } from "../utils/sanitize.js";

export type CartCouponLine = {
  productId: string;
  categoryId?: string;
  categorySlug?: string;
  price: number;
  quantity: number;
};

export type CouponQuote = {
  ok: boolean;
  message: string;
  coupon: PublicCoupon | null;
  eligibleSubtotal: number;
  discount: number;
  autoApplied: boolean;
};

type CouponInput = {
  code: string;
  title?: string;
  description?: string;
  type: "percent" | "flat";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  maxUses?: number;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  autoApply?: boolean;
  visibility?: "public" | "code_only";
  applyTo?: "all" | "categories" | "products";
  categoryIds?: string[];
  productIds?: string[];
  design?: PublicCoupon["design"];
};

function parseIds(ids?: string[]) {
  return (ids ?? [])
    .filter(Boolean)
    .map((id) => new Types.ObjectId(id));
}

async function slugsForCoupon(coupon: ICoupon): Promise<string[]> {
  if (!coupon.categoryIds?.length) return [];
  const cats = await Category.find({ _id: { $in: coupon.categoryIds } }).select("slug").lean();
  return cats.map((c) => c.slug);
}

async function decorate(coupon: ICoupon): Promise<PublicCoupon> {
  return toPublicCoupon(coupon, await slugsForCoupon(coupon));
}

function isLive(coupon: ICoupon, now = new Date()) {
  if (!coupon.isActive) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.expiresAt && coupon.expiresAt < now) return false;
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

export function eligibleSubtotal(coupon: PublicCoupon | ICoupon, lines: CartCouponLine[]) {
  const applyTo = coupon.applyTo ?? "all";
  const productIds = new Set(
    ("productIds" in coupon ? coupon.productIds : []).map((id) => id.toString()),
  );
  const categoryIds = new Set(
    ("categoryIds" in coupon ? coupon.categoryIds : []).map((id) => id.toString()),
  );
  const categorySlugs = new Set("categorySlugs" in coupon ? coupon.categorySlugs ?? [] : []);

  return lines.reduce((sum, line) => {
    const lineTotal = line.price * line.quantity;
    if (applyTo === "all") return sum + lineTotal;
    if (applyTo === "products") {
      return productIds.has(line.productId) ? sum + lineTotal : sum;
    }
    const catMatch =
      (line.categoryId && categoryIds.has(line.categoryId)) ||
      (line.categorySlug && categorySlugs.has(line.categorySlug));
    return catMatch ? sum + lineTotal : sum;
  }, 0);
}

export function discountAmount(coupon: { type: string; value: number; maxDiscount?: number }, eligible: number) {
  if (eligible <= 0) return 0;
  let discount =
    coupon.type === "percent" ? Math.floor((eligible * coupon.value) / 100) : coupon.value;
  const cap = coupon.maxDiscount ?? 0;
  if (cap > 0) discount = Math.min(discount, cap);
  return Math.min(Math.max(0, Math.floor(discount)), eligible);
}

async function userRedemptions(userId: string | undefined, code: string) {
  if (!userId) return 0;
  return Order.countDocuments({
    userId,
    couponCode: code,
    paymentStatus: { $nin: ["failed"] },
    orderStatus: { $nin: ["cancelled"] },
  });
}

export async function listCoupons() {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return Promise.all(coupons.map(decorate));
}

export async function listActivePublicCoupons() {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    visibility: "public",
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  }).sort({ autoApply: -1, value: -1 });
  const live = coupons.filter((c) => isLive(c, now));
  return Promise.all(live.map(decorate));
}

export async function createCoupon(data: CouponInput) {
  const code = data.code.toUpperCase().trim();
  if (data.type === "percent" && data.value > 100) {
    throw new AppError(400, "Percent discount cannot exceed 100");
  }
  const existing = await Coupon.findOne({ code });
  if (existing) throw new AppError(409, "Coupon code already exists");
  const coupon = await Coupon.create({
    code,
    title: sanitizeText(data.title ?? code),
    description: sanitizeText(data.description ?? ""),
    type: data.type,
    value: data.value,
    minOrder: data.minOrder ?? 0,
    maxDiscount: data.maxDiscount ?? 0,
    maxUses: data.maxUses ?? 0,
    perUserLimit: data.perUserLimit ?? 0,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive ?? true,
    autoApply: data.autoApply ?? false,
    visibility: data.visibility ?? "public",
    applyTo: data.applyTo ?? "all",
    categoryIds: parseIds(data.categoryIds),
    productIds: parseIds(data.productIds),
    design: data.design ?? "maroon",
  });
  return decorate(coupon);
}

export async function updateCoupon(id: string, data: Partial<CouponInput> & { isActive?: boolean }) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  if (data.title !== undefined) coupon.title = sanitizeText(data.title);
  if (data.description !== undefined) coupon.description = sanitizeText(data.description);
  if (data.type) coupon.type = data.type;
  if (data.value !== undefined) {
    if ((data.type ?? coupon.type) === "percent" && data.value > 100) {
      throw new AppError(400, "Percent discount cannot exceed 100");
    }
    coupon.value = data.value;
  }
  if (data.minOrder !== undefined) coupon.minOrder = data.minOrder;
  if (data.maxDiscount !== undefined) coupon.maxDiscount = data.maxDiscount;
  if (data.maxUses !== undefined) coupon.maxUses = data.maxUses;
  if (data.perUserLimit !== undefined) coupon.perUserLimit = data.perUserLimit;
  if (data.startsAt !== undefined) coupon.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  if (data.expiresAt !== undefined) coupon.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.isActive !== undefined) coupon.isActive = data.isActive;
  if (data.autoApply !== undefined) coupon.autoApply = data.autoApply;
  if (data.visibility) coupon.visibility = data.visibility;
  if (data.applyTo) coupon.applyTo = data.applyTo;
  if (data.categoryIds) coupon.categoryIds = parseIds(data.categoryIds);
  if (data.productIds) coupon.productIds = parseIds(data.productIds);
  if (data.design) coupon.design = data.design;
  await coupon.save();
  return decorate(coupon);
}

export async function deleteCoupon(id: string) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
}

export async function quoteCoupon(
  lines: CartCouponLine[],
  opts: { code?: string | null; userId?: string; skipAuto?: boolean },
): Promise<CouponQuote> {
  const empty: CouponQuote = {
    ok: false,
    message: "",
    coupon: null,
    eligibleSubtotal: 0,
    discount: 0,
    autoApplied: false,
  };
  if (!lines.length) return { ...empty, message: "Bag is empty" };

  const now = new Date();
  const code = opts.code?.trim().toUpperCase();

  if (code) {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return { ...empty, message: "This coupon code is not valid" };
    const check = await validateForCart(coupon, lines, opts.userId, now);
    if (!check.ok) return { ...empty, message: check.message, coupon: await decorate(coupon) };
    return {
      ok: true,
      message: check.message,
      coupon: await decorate(coupon),
      eligibleSubtotal: check.eligible,
      discount: check.discount,
      autoApplied: false,
    };
  }

  if (opts.skipAuto) {
    return { ...empty, message: "No coupon applied" };
  }

  const publics = await Coupon.find({ isActive: true, autoApply: true, visibility: "public" });
  let best: CouponQuote | null = null;
  for (const coupon of publics) {
    const check = await validateForCart(coupon, lines, opts.userId, now);
    if (!check.ok) continue;
    if (!best || check.discount > best.discount) {
      best = {
        ok: true,
        message: "Auto-applied",
        coupon: await decorate(coupon),
        eligibleSubtotal: check.eligible,
        discount: check.discount,
        autoApplied: true,
      };
    }
  }
  return best ?? { ...empty, message: "No coupon applied" };
}

async function validateForCart(
  coupon: ICoupon,
  lines: CartCouponLine[],
  userId: string | undefined,
  now: Date,
) {
  if (!isLive(coupon, now)) {
    return { ok: false, message: "This coupon is not active", eligible: 0, discount: 0 };
  }
  const decorated = await decorate(coupon);
  const eligible = eligibleSubtotal(decorated, lines);
  if (eligible <= 0) {
    return { ok: false, message: "This coupon does not apply to items in your bag", eligible, discount: 0 };
  }
  if (eligible < coupon.minOrder) {
    const need = coupon.minOrder - eligible;
    return {
      ok: false,
      message: `Add items worth ₹${need} more to use ${coupon.code}`,
      eligible,
      discount: 0,
    };
  }
  if (coupon.perUserLimit > 0) {
    const used = await userRedemptions(userId, coupon.code);
    if (used >= coupon.perUserLimit) {
      return { ok: false, message: "You have already used this coupon", eligible, discount: 0 };
    }
  }
  const discount = discountAmount(coupon, eligible);
  if (discount <= 0) {
    return { ok: false, message: "This coupon has no discount on the current bag", eligible, discount: 0 };
  }
  return { ok: true, message: `${coupon.code} applied`, eligible, discount };
}

export async function incrementCouponUse(code: string | null | undefined) {
  if (!code) return;
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

export async function hydrateCartLines(
  lines: Array<{ productId: string; quantity: number; price?: number }>,
): Promise<CartCouponLine[]> {
  const ids = lines.map((l) => l.productId).filter((id) => Types.ObjectId.isValid(id));
  const products = await Product.find({ _id: { $in: ids } }).select("price categoryId");
  const map = new Map(products.map((p) => [p._id.toString(), p]));
  return lines.flatMap((line) => {
    const product = map.get(line.productId);
    if (!product) return [];
    return [
      {
        productId: line.productId,
        categoryId: product.categoryId.toString(),
        price: product.price,
        quantity: line.quantity,
      },
    ];
  });
}
