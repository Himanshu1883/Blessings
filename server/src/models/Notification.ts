import mongoose, { Schema, type Document, type Types } from "mongoose";

export type NotificationChannel = "push" | "email";

export interface INotification extends Document {
  _id: Types.ObjectId;
  title: string;
  message: string;
  channel: NotificationChannel;
  sentAt: Date;
  meta?: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ["push", "email"], default: "push" },
    sentAt: { type: Date, default: Date.now },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export function toPublicNotification(n: INotification) {
  return {
    id: n._id.toString(),
    title: n.title,
    message: n.message,
    channel: n.channel,
    sentAt: n.sentAt.toISOString(),
    meta: n.meta,
  };
}
