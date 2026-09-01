import mongoose, { Schema, type Document, type Types } from "mongoose";

export type CouponType = "percent" | "flat";
export type CouponApplyTo = "all" | "categories" | "products";
export type CouponVisibility = "public" | "code_only";
export type CouponDesign = "maroon" | "gold" | "charcoal" | "festive" | "ivory";

export const COUPON_DESIGNS: CouponDesign[] = ["maroon", "gold", "charcoal", "festive", "ivory"];

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  autoApply: boolean;
  visibility: CouponVisibility;
  applyTo: CouponApplyTo;
  categoryIds: Types.ObjectId[];
  productIds: Types.ObjectId[];
  design: CouponDesign;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    autoApply: { type: Boolean, default: false },
    visibility: { type: String, enum: ["public", "code_only"], default: "public" },
    applyTo: { type: String, enum: ["all", "categories", "products"], default: "all" },
    categoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    design: { type: String, enum: COUPON_DESIGNS, default: "maroon" },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);

export type PublicCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  autoApply: boolean;
  visibility: CouponVisibility;
  applyTo: CouponApplyTo;
  categoryIds: string[];
  productIds: string[];
  categorySlugs: string[];
  design: CouponDesign;
  createdAt: string;
};

export function toPublicCoupon(
  coupon: ICoupon,
  categorySlugs: string[] = [],
): PublicCoupon {
  return {
    id: coupon._id.toString(),
    code: coupon.code,
    title: coupon.title || coupon.code,
    description: coupon.description || "",
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder ?? 0,
    maxDiscount: coupon.maxDiscount ?? 0,
    maxUses: coupon.maxUses ?? 0,
    usedCount: coupon.usedCount ?? 0,
    perUserLimit: coupon.perUserLimit ?? 0,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    autoApply: coupon.autoApply ?? false,
    visibility: coupon.visibility ?? "public",
    applyTo: coupon.applyTo ?? "all",
    categoryIds: (coupon.categoryIds ?? []).map((id) => id.toString()),
    productIds: (coupon.productIds ?? []).map((id) => id.toString()),
    categorySlugs,
    design: coupon.design ?? "maroon",
    createdAt: coupon.createdAt.toISOString(),
  };
}
