import {
  UserNotification,
  toPublicUserNotification,
  type UserNoticeType,
} from "../models/UserNotification.js";

const COPY: Record<UserNoticeType, { title: string; message: (orderNumber: string) => string }> = {
  order_shipped: {
    title: "Order shipped",
    message: (n) => `Order ${n} has been shipped.`,
  },
  order_out_for_delivery: {
    title: "Out for delivery",
    message: (n) => `Order ${n} is out for delivery.`,
  },
  order_delivered: {
    title: "Delivered",
    message: (n) => `Order ${n} was delivered.`,
  },
  cancel_requested: {
    title: "Cancellation requested",
    message: (n) => `Your cancellation request for order ${n} is under review.`,
  },
  order_cancelled: {
    title: "Order cancelled",
    message: (n) => `Order ${n} has been cancelled.`,
  },
  cancel_rejected: {
    title: "Cancellation declined",
    message: (n) => `The cancellation request for order ${n} was not approved. The order remains confirmed.`,
  },
  return_requested: {
    title: "Return requested",
    message: (n) => `We received your return request for order ${n}. The atelier will review it shortly.`,
  },
  return_approved: {
    title: "Return approved",
    message: (n) => `Your return for order ${n} was approved. Pickup will be arranged next.`,
  },
  return_rejected: {
    title: "Return declined",
    message: (n) => `The return request for order ${n} was not approved.`,
  },
  return_refunded: {
    title: "Return completed",
    message: (n) => `Order ${n} has been returned and your refund has been processed.`,
  },
};

export async function notifyUser(data: {
  userId: string;
  type: UserNoticeType;
  orderNumber: string;
  orderId: string;
}) {
  const copy = COPY[data.type];
  const n = await UserNotification.create({
    userId: data.userId,
    type: data.type,
    title: copy.title,
    message: copy.message(data.orderNumber),
    orderId: data.orderId,
    read: false,
  });
  return toPublicUserNotification(n);
}

export async function listUserNotifications(userId: string) {
  const items = await UserNotification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return items.map(toPublicUserNotification);
}

export async function markAllNotificationsRead(userId: string) {
  await UserNotification.updateMany({ userId, read: false }, { $set: { read: true } });
  return listUserNotifications(userId);
}

export function noticeTypeForStatus(status: string): UserNoticeType | null {
  if (status === "shipped") return "order_shipped";
  if (status === "in_transit") return "order_out_for_delivery";
  if (status === "delivered") return "order_delivered";
  if (status === "cancel_requested") return "cancel_requested";
  if (status === "cancelled") return "order_cancelled";
  return null;
}
