import mongoose, { Schema, type Document, type Types } from "mongoose";

export type UserNoticeType =
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "cancel_requested"
  | "order_cancelled"
  | "cancel_rejected"
  | "return_requested"
  | "return_approved"
  | "return_rejected"
  | "return_refunded";

export interface IUserNotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: UserNoticeType;
  title: string;
  message: string;
  orderId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });

export const UserNotification = mongoose.model<IUserNotification>(
  "UserNotification",
  userNotificationSchema,
);

export function toPublicUserNotification(n: IUserNotification) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    orderId: n.orderId?.toString() ?? null,
    read: n.read,
    createdAt: (n.createdAt ?? new Date()).toISOString(),
  };
}
