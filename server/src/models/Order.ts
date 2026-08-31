import mongoose, { Schema, type Document, type Types } from "mongoose";
import type { IAddress } from "./User.js";

export type PaymentMethod = "razorpay" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "cancel_requested"
  | "cancelled"
  | "returned";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  slug?: string;
  imageUrl: string | null;
  size: string;
  color?: string;
  quantity: number;
  unitPrice: number;
}

export interface IStatusHistory {
  status: OrderStatus;
  note?: string;
  actor?: string;
  at: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  trackingNumber?: string;
  cancelReason?: string;
  cancelRequestedAt?: Date;
  stockDeducted?: boolean;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String },
    imageUrl: { type: String, default: null },
    size: { type: String, required: true },
    color: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    note: { type: String },
    actor: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["razorpay", "cod"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "in_transit",
        "delivered",
        "cancel_requested",
        "cancelled",
        "returned",
      ],
      default: "placed",
    },
    trackingNumber: { type: String },
    cancelReason: { type: String },
    cancelRequestedAt: { type: Date },
    stockDeducted: { type: Boolean },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
orderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export const Order = mongoose.model<IOrder>("Order", orderSchema);

export function isWaitingForPayment(order: IOrder) {
  return order.paymentMethod === "razorpay" && order.paymentStatus === "pending";
}

export function isFulfillmentLocked(order: IOrder) {
  if (order.paymentStatus === "failed") return true;
  if (["delivered", "cancelled", "returned", "cancel_requested"].includes(order.orderStatus)) {
    return true;
  }
  if (isWaitingForPayment(order)) return true;
  return false;
}

export function getAllowedNextStatuses(order: IOrder): OrderStatus[] {
  if (isFulfillmentLocked(order)) return [];
  const current =
    order.orderStatus === "placed" && order.paymentMethod === "cod" ? "confirmed" : order.orderStatus;
  if (current === "placed") return [];
  if (current === "confirmed") return ["processing", "shipped"];
  if (current === "processing") return ["shipped"];
  if (current === "shipped") return ["in_transit", "delivered"];
  if (current === "in_transit") return ["delivered"];
  return [];
}

export function canAdminDirectCancel(order: IOrder) {
  if (order.paymentStatus === "failed") return false;
  if (["delivered", "cancelled", "returned", "cancel_requested"].includes(order.orderStatus)) {
    return false;
  }
  if (isWaitingForPayment(order)) return false;
  return true;
}

export function wasStockTaken(order: IOrder) {
  if (typeof order.stockDeducted === "boolean") return order.stockDeducted;
  return true;
}

export function canCancelOrder(order: IOrder) {
  const blocked = new Set(["cancelled", "delivered", "returned", "cancel_requested"]);
  if (blocked.has(order.orderStatus)) return { allowed: false, instant: false };
  if (order.paymentStatus === "failed") return { allowed: false, instant: false };

  const early = order.orderStatus === "placed" || order.orderStatus === "confirmed";
  const withinWindow = Date.now() - new Date(order.createdAt).getTime() <= 30 * 60 * 1000;
  if (isWaitingForPayment(order) && order.orderStatus === "placed") {
    return { allowed: true, instant: true };
  }
  if (isWaitingForPayment(order)) {
    return { allowed: false, instant: false };
  }
  const instant = early && withinWindow;
  return { allowed: true, instant };
}

export function toPublicOrder(order: IOrder) {
  const cancel = canCancelOrder(order);
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      slug: item.slug ?? null,
      imageUrl: item.imageUrl,
      size: item.size,
      color: item.color ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })),
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber ?? null,
    cancelReason: order.cancelReason ?? null,
    cancelRequestedAt: order.cancelRequestedAt
      ? order.cancelRequestedAt.toISOString()
      : null,
    canCancel: cancel.allowed,
    cancelInstant: cancel.instant,
    canReturn: false,
    returnStatus: null as string | null,
    statusHistory: order.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      actor: h.actor,
      at: h.at instanceof Date ? h.at.toISOString() : h.at,
    })),
    allowedNextStatuses: getAllowedNextStatuses(order),
    canAdminCancel: canAdminDirectCancel(order),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
