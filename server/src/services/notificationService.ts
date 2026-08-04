import { Notification, toPublicNotification } from "../models/Notification.js";

export async function listNotifications() {
  const items = await Notification.find().sort({ sentAt: -1 }).limit(100);
  return items.map(toPublicNotification);
}

export async function createNotification(data: {
  title: string;
  message: string;
  channel?: "push" | "email";
}) {
  const n = await Notification.create({
    title: data.title,
    message: data.message,
    channel: data.channel ?? "push",
    sentAt: new Date(),
  });
  return toPublicNotification(n);
}
