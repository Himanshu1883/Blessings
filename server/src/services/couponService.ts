import { Coupon, toPublicCoupon } from "../models/Coupon.js";
import { AppError } from "../utils/apiResponse.js";
import { sanitizeText } from "../utils/sanitize.js";

export async function listCoupons() {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return coupons.map(toPublicCoupon);
}

export async function createCoupon(data: {
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder?: number;
  maxUses?: number;
  expiresAt?: string | null;
}) {
  const code = data.code.toUpperCase().trim();
  const existing = await Coupon.findOne({ code });
  if (existing) throw new AppError(409, "Coupon code already exists");
  const coupon = await Coupon.create({
    code,
    type: data.type,
    value: data.value,
    minOrder: data.minOrder ?? 0,
    maxUses: data.maxUses ?? 0,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  });
  return toPublicCoupon(coupon);
}

export async function updateCoupon(
  id: string,
  data: Partial<{
    type: "percent" | "flat";
    value: number;
    minOrder: number;
    maxUses: number;
    expiresAt: string | null;
    isActive: boolean;
  }>,
) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  if (data.type) coupon.type = data.type;
  if (data.value !== undefined) coupon.value = data.value;
  if (data.minOrder !== undefined) coupon.minOrder = data.minOrder;
  if (data.maxUses !== undefined) coupon.maxUses = data.maxUses;
  if (data.expiresAt !== undefined) {
    coupon.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }
  if (data.isActive !== undefined) coupon.isActive = data.isActive;
  await coupon.save();
  return toPublicCoupon(coupon);
}

export async function deleteCoupon(id: string) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
}
