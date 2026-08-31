import Razorpay from "razorpay";
import { Return, toPublicReturn, getAllowedReturnNext, isOpenReturn, isReturnWindowOpen, type ReturnStatus } from "../models/Return.js";
import { Order, wasStockTaken, type IOrder } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/apiResponse.js";
import { sanitizeText, isPlaceholderEmail } from "../utils/sanitize.js";
import { env } from "../config/env.js";
import { inrPaise } from "../utils/razorpayCrypto.js";
import { notifyUser } from "./userNotificationService.js";
import { sendOrderEmail } from "./emailService.js";

const RETURN_REASONS = [
  "size_fit",
  "damaged",
  "wrong_item",
  "quality",
  "changed_mind",
  "other",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

const REASON_LABEL: Record<ReturnReason, string> = {
  size_fit: "Size or fit issue",
  damaged: "Item arrived damaged",
  wrong_item: "Wrong item received",
  quality: "Quality not as expected",
  changed_mind: "Changed my mind",
  other: "Other",
};

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Online payments are not configured");
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

async function customerEmail(userId: string) {
  const user = await User.findById(userId);
  const email = user?.email;
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}

async function notifyReturn(order: IOrder, kind: "return_requested" | "return_approved" | "return_rejected" | "return_refunded") {
  await notifyUser({
    userId: order.userId.toString(),
    type: kind,
    orderNumber: order.orderNumber,
    orderId: order._id.toString(),
  });
  await sendOrderEmail(await customerEmail(order.userId.toString()), kind, order.orderNumber);
}

async function restockOrder(order: IOrder) {
  if (!wasStockTaken(order)) return;
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    const current = product.stock.get(item.size) ?? 0;
    product.stock.set(item.size, current + item.quantity);
    await product.save();
  }
  order.stockDeducted = false;
}

function alreadyRefundedMessage(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /already refunded|fully refunded|refund.*processed/i.test(msg);
}

async function refundPaidOnline(order: IOrder) {
  if (order.paymentMethod !== "razorpay") return;
  if (order.paymentStatus === "refunded") return;
  if (order.paymentStatus !== "paid") return;
  if (!order.razorpayPaymentId) {
    throw new AppError(400, "No Razorpay payment on this order to refund");
  }
  try {
    const razorpay = getRazorpay();
    await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: inrPaise(order.total),
    });
  } catch (err) {
    if (alreadyRefundedMessage(err)) {
      order.paymentStatus = "refunded";
      return;
    }
    console.error("Return Razorpay refund failed:", err);
    throw new AppError(502, "Razorpay refund failed. Try again or refund from the Razorpay dashboard.");
  }
  order.paymentStatus = "refunded";
}

function productSummary(order: IOrder) {
  return order.items.map((i) => `${i.name} (${i.size} × ${i.quantity})`).join(", ");
}

function publicWithOrder(ret: InstanceType<typeof Return>, order?: IOrder | null) {
  if (!order) return toPublicReturn(ret);
  return toPublicReturn(ret, {
    items: order.items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
    })),
    pickupAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    total: order.total,
  });
}

export async function listReturns() {
  const returns = await Return.find().sort({ createdAt: -1 });
  const orderIds = [...new Set(returns.map((r) => r.orderId.toString()))];
  const orders = await Order.find({ _id: { $in: orderIds } });
  const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
  return returns.map((r) => publicWithOrder(r, orderMap.get(r.orderId.toString())));
}

export async function getReturnsByOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return Return.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 });
}

export function canRequestReturn(order: IOrder, existing?: { status: ReturnStatus } | null) {
  if (order.orderStatus !== "delivered") return false;
  if (!isReturnWindowOpen(order)) return false;
  if (existing && isOpenReturn(existing.status)) return false;
  if (existing?.status === "refunded") return false;
  return true;
}

export function returnStateForOrder(order: IOrder, existing?: { status: ReturnStatus } | null) {
  return {
    canReturn: canRequestReturn(order, existing),
    returnStatus: existing?.status ?? null,
  };
}

async function createReturnForOrder(
  order: IOrder,
  data: { reason: ReturnReason; note?: string },
  actor: "customer" | "admin",
) {
  const existing = await Return.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  if (!canRequestReturn(order, existing)) {
    if (order.orderStatus !== "delivered") {
      throw new AppError(400, "Only delivered orders can be returned");
    }
    if (existing && isOpenReturn(existing.status)) {
      throw new AppError(400, "A return is already in progress for this order");
    }
    if (existing?.status === "refunded") {
      throw new AppError(400, "This order has already been returned");
    }
    throw new AppError(400, "The 7-day return window has closed");
  }

  const user = await User.findById(order.userId);
  const reasonLabel = data.reason === "other" && data.note?.trim()
    ? data.note.trim()
    : REASON_LABEL[data.reason];
  const reason = [reasonLabel, data.note?.trim() && data.reason !== "other" ? data.note.trim() : ""]
    .filter(Boolean)
    .join(" — ");

  const ret = await Return.create({
    orderId: order._id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    customerName: user?.name || order.shippingAddress.name,
    productName: productSummary(order),
    reason: sanitizeText(reason) || REASON_LABEL[data.reason],
    status: "pending",
    statusHistory: [{ status: "pending", note: actor === "admin" ? "Opened by atelier" : undefined, at: new Date() }],
    stockRestored: false,
    paymentMethod: order.paymentMethod,
  });

  await notifyReturn(order, "return_requested");
  return publicWithOrder(ret, order);
}

export async function requestReturn(
  orderId: string,
  userId: string,
  data: { reason: ReturnReason; note?: string },
) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");
  return createReturnForOrder(order, data, "customer");
}

export async function createAdminReturn(orderId: string, data: { reason: ReturnReason; note?: string }) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  return createReturnForOrder(order, data, "admin");
}

export async function updateReturnStatus(id: string, status: ReturnStatus, note?: string) {
  const ret = await Return.findById(id);
  if (!ret) throw new AppError(404, "Return not found");

  const order = await Order.findById(ret.orderId);
  if (!order) throw new AppError(404, "Order not found");

  const allowed = getAllowedReturnNext(ret.status, order.paymentMethod);
  if (!allowed.includes(status)) {
    throw new AppError(400, "That return step is not allowed from the current status");
  }

  if (status === "received" && !ret.stockRestored) {
    await restockOrder(order);
    ret.stockRestored = true;
    await order.save();
  }

  if (status === "refund_initiated") {
    if (!ret.stockRestored) {
      await restockOrder(order);
      ret.stockRestored = true;
    }
    await refundPaidOnline(order);
    ret.status = "refund_initiated";
    ret.statusHistory.push({ status: "refund_initiated", note, at: new Date() });
    ret.status = "refunded";
    ret.statusHistory.push({ status: "refunded", note: note || "Refund issued", at: new Date() });
    order.orderStatus = "returned";
    order.statusHistory.push({ status: "returned", note: "Return refunded", actor: "admin", at: new Date() });
    await order.save();
    await ret.save();
    await notifyReturn(order, "return_refunded");
    return publicWithOrder(ret, order);
  }

  if (status === "refunded") {
    if (!ret.stockRestored) {
      await restockOrder(order);
      ret.stockRestored = true;
    }
    if (order.paymentMethod === "razorpay" && order.paymentStatus === "paid") {
      await refundPaidOnline(order);
    }
    order.orderStatus = "returned";
    if (order.paymentStatus === "paid" && order.paymentMethod === "cod") {
      order.paymentStatus = "refunded";
    }
    order.statusHistory.push({ status: "returned", note: note || "Return completed", actor: "admin", at: new Date() });
    await order.save();
    ret.status = "refunded";
    ret.statusHistory.push({ status: "refunded", note, at: new Date() });
    await ret.save();
    await notifyReturn(order, "return_refunded");
    return publicWithOrder(ret, order);
  }

  ret.status = status;
  ret.statusHistory.push({ status, note, at: new Date() });
  await ret.save();

  if (status === "approved") await notifyReturn(order, "return_approved");
  if (status === "rejected") await notifyReturn(order, "return_rejected");

  return publicWithOrder(ret, order);
}
