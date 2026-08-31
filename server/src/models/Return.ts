import mongoose, { Schema, type Document, type Types } from "mongoose";
import type { IOrder } from "./Order.js";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "pickup_scheduled"
  | "picked_up"
  | "received"
  | "refund_initiated"
  | "refunded"
  | "rejected";

export const RETURN_STATUSES: ReturnStatus[] = [
  "pending",
  "approved",
  "pickup_scheduled",
  "picked_up",
  "received",
  "refund_initiated",
  "refunded",
  "rejected",
];

export const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface IReturnStatusHistory {
  status: ReturnStatus;
  note?: string;
  at: Date;
}

export interface IReturn extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  orderNumber: string;
  customerName: string;
  productName: string;
  reason: string;
  status: ReturnStatus;
  statusHistory: IReturnStatusHistory[];
  stockRestored: boolean;
  paymentMethod?: "razorpay" | "cod";
  createdAt: Date;
  updatedAt: Date;
}

const returnSchema = new Schema<IReturn>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    productName: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: RETURN_STATUSES,
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    stockRestored: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["razorpay", "cod"] },
  },
  { timestamps: true },
);

export const Return = mongoose.model<IReturn>("Return", returnSchema);

export function deliveredAt(order: IOrder): Date | null {
  if (order.orderStatus !== "delivered" && order.orderStatus !== "returned") return null;
  const row = [...order.statusHistory].reverse().find((h) => h.status === "delivered");
  return row?.at ?? order.updatedAt;
}

export function isReturnWindowOpen(order: IOrder) {
  const at = deliveredAt(order);
  if (!at) return false;
  return Date.now() - at.getTime() <= RETURN_WINDOW_MS;
}

export function isOpenReturn(status: ReturnStatus) {
  return status !== "rejected" && status !== "refunded";
}

export function getAllowedReturnNext(
  status: ReturnStatus,
  paymentMethod?: "razorpay" | "cod" | string,
): ReturnStatus[] {
  if (status === "pending") return ["approved", "rejected"];
  if (status === "approved") return ["pickup_scheduled"];
  if (status === "pickup_scheduled") return ["picked_up"];
  if (status === "picked_up") return ["received"];
  if (status === "received") {
    if (paymentMethod === "razorpay") return ["refund_initiated"];
    return ["refunded"];
  }
  if (status === "refund_initiated") return ["refunded"];
  return [];
}

export function toPublicReturn(
  ret: IReturn,
  extras?: {
    items?: Array<{
      name: string;
      size: string;
      quantity: number;
      lineTotal: number;
    }>;
    pickupAddress?: IOrder["shippingAddress"];
    paymentMethod?: string;
    paymentStatus?: string;
    total?: number;
  },
) {
  const paymentMethod = extras?.paymentMethod ?? ret.paymentMethod;
  return {
    id: ret._id.toString(),
    orderId: ret.orderId.toString(),
    orderNumber: ret.orderNumber,
    userId: ret.userId.toString(),
    customerName: ret.customerName,
    productName: ret.productName,
    reason: ret.reason,
    status: ret.status,
    statusHistory: ret.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      at: h.at instanceof Date ? h.at.toISOString() : h.at,
    })),
    createdAt: ret.createdAt.toISOString(),
    items: extras?.items ?? [],
    pickupAddress: extras?.pickupAddress ?? null,
    paymentMethod: paymentMethod ?? null,
    paymentStatus: extras?.paymentStatus ?? null,
    total: extras?.total ?? null,
    allowedNextStatuses: getAllowedReturnNext(ret.status, paymentMethod),
    stockRestored: Boolean(ret.stockRestored),
  };
}
