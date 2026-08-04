import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "pickup_scheduled"
  | "picked_up"
  | "received"
  | "refund_initiated"
  | "refunded"
  | "rejected";

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
  createdAt: Date;
  updatedAt: Date;
}

const returnSchema = new Schema<IReturn>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    productName: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "pickup_scheduled",
        "picked_up",
        "received",
        "refund_initiated",
        "refunded",
        "rejected",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Return = mongoose.model<IReturn>("Return", returnSchema);

export function toPublicReturn(ret: IReturn) {
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
      at: h.at.toISOString(),
    })),
    createdAt: ret.createdAt.toISOString(),
  };
}
