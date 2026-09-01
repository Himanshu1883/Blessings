import Razorpay from "razorpay";
import { Order, toPublicOrder, canCancelOrder, getAllowedNextStatuses, canAdminDirectCancel, wasStockTaken, type OrderStatus } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Return } from "../models/Return.js";
import { getCartForOrder, clearCart } from "./cartService.js";
import { incrementCouponUse, quoteCoupon, type CartCouponLine } from "./couponService.js";
import { AppError } from "../utils/apiResponse.js";
import { generateOrderNumber, sanitizeText, isPlaceholderEmail } from "../utils/sanitize.js";
import { env } from "../config/env.js";
import type { IAddress } from "../models/User.js";
import type { PaymentMethod, IOrder } from "../models/Order.js";
import { noticeTypeForStatus, notifyUser } from "./userNotificationService.js";
import { mailKindForStatus, sendOrderEmail } from "./emailService.js";
import { hmacSha256Hex, inrPaise, timingSafeEqualHex } from "../utils/razorpayCrypto.js";
import { getReturnsByOrderIds, returnStateForOrder } from "./returnService.js";

const SHIPPING_FEE = 0;

async function customerEmail(userId: string) {
  const user = await User.findById(userId);
  const email = user?.email;
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}

async function notifyOrder(order: IOrder, status: string) {
  const notice = noticeTypeForStatus(status);
  const mail = mailKindForStatus(status);
  if (notice) {
    await notifyUser({
      userId: order.userId.toString(),
      type: notice,
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
    });
  }
  if (mail) {
    await sendOrderEmail(await customerEmail(order.userId.toString()), mail, order.orderNumber);
  }
}

async function decrementProductStock(order: IOrder) {
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    const current = product.stock.get(item.size) ?? 99;
    product.stock.set(item.size, Math.max(0, current - item.quantity));
    await product.save();
  }
}

async function claimAndDeductStock(orderId: IOrder["_id"]) {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, stockDeducted: { $ne: true } },
    { $set: { stockDeducted: true } },
    { new: true },
  );
  if (!claimed) return false;
  try {
    await decrementProductStock(claimed);
    return true;
  } catch (err) {
    claimed.stockDeducted = false;
    await claimed.save();
    throw err;
  }
}

async function restoreStock(order: IOrder) {
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

async function applyForwardStatus(order: IOrder, status: OrderStatus, actor: string, note?: string) {
  const allowed = getAllowedNextStatuses(order);
  if (!allowed.includes(status)) {
    throw new AppError(400, "That status step is not allowed from the current order");
  }
  order.orderStatus = status;
  order.statusHistory.push({ status, note: note || actor, actor, at: new Date() });
  if (status === "delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }
  await order.save();
  await notifyOrder(order, status);
  return toPublicOrder(order);
}

function requireRazorpayKeys() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Online payments are not configured");
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
}

function getRazorpay() {
  const { keyId, keySecret } = requireRazorpayKeys();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function checkoutPayload(order: IOrder) {
  const { keyId } = requireRazorpayKeys();
  if (!order.razorpayOrderId) throw new AppError(500, "Missing Razorpay order");
  const amount = inrPaise(order.total);
  if (amount < 100) throw new AppError(400, "Order total must be at least ₹1");
  return {
    keyId,
    razorpayOrderId: order.razorpayOrderId,
    amount,
    currency: "INR" as const,
    orderId: order._id.toString(),
  };
}

async function startRazorpayOrder(order: IOrder) {
  const amount = inrPaise(order.total);
  if (amount < 100) throw new AppError(400, "Order total must be at least ₹1");
  try {
    const razorpay = getRazorpay();
    const rzOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { shopOrderId: order._id.toString() },
    });
    order.razorpayOrderId = rzOrder.id;
    order.paymentStatus = "pending";
    await order.save();
    return checkoutPayload(order);
  } catch (err) {
    if (err instanceof AppError) throw err;
    order.paymentStatus = "failed";
    await order.save();
    throw new AppError(502, "Could not start online payment");
  }
}

function formatInrCharged(total: number) {
  return `₹${Math.round(total).toLocaleString("en-IN")}`;
}

async function redeemCouponOnce(order: IOrder) {
  if (!order.couponCode) return;
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, couponRedeemed: { $ne: true } },
    { $set: { couponRedeemed: true } },
  );
  if (claimed && !claimed.couponCode) return;
  if (claimed) await incrementCouponUse(order.couponCode);
}

async function afterPaidSideEffects(order: IOrder) {
  try {
    await clearCart(order.userId.toString());
  } catch (err) {
    console.error("Could not clear cart after payment:", err);
  }
  await redeemCouponOnce(order);
  void sendOrderEmail(
    await customerEmail(order.userId.toString()),
    "confirmed",
    order.orderNumber,
    formatInrCharged(order.total),
  );
}

async function finalizePaidOrder(
  order: IOrder,
  data: { razorpayPaymentId: string; razorpaySignature?: string },
) {
  let current = await Order.findById(order._id);
  if (!current) throw new AppError(404, "Order not found");

  if (current.paymentStatus === "paid" && current.stockDeducted === true) {
    return toPublicOrder(current);
  }

  if (current.paymentStatus !== "paid") {
    const claimed = await Order.findOneAndUpdate(
      { _id: current._id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          orderStatus: "confirmed",
          razorpayPaymentId: data.razorpayPaymentId,
          ...(data.razorpaySignature ? { razorpaySignature: data.razorpaySignature } : {}),
        },
        $push: {
          statusHistory: {
            status: "confirmed",
            note: "Payment received",
            actor: "system",
            at: new Date(),
          },
        },
      },
      { new: true },
    );
    current = claimed ?? (await Order.findById(order._id));
    if (!current) throw new AppError(404, "Order not found");
    if (current.paymentStatus === "paid" && current.stockDeducted === true) {
      return toPublicOrder(current);
    }
  }

  try {
    const tookStock = await claimAndDeductStock(current._id);
    if (tookStock) {
      const paid = await Order.findById(current._id);
      if (paid) await afterPaidSideEffects(paid);
    }
  } catch {
    await Order.findByIdAndUpdate(current._id, {
      $set: { paymentStatus: "pending", orderStatus: "placed", stockDeducted: false },
    });
    throw new AppError(500, "Could not reserve stock for this payment");
  }

  const result = await Order.findById(current._id);
  if (!result) throw new AppError(404, "Order not found");
  return toPublicOrder(result);
}

async function refundOnlineIfPaid(order: IOrder) {
  if (order.paymentMethod !== "razorpay") return;
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "refunded") return;
  if (!order.razorpayPaymentId) return;
  if (order.paymentStatus === "refunded") return;
  try {
    const razorpay = getRazorpay();
    await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: inrPaise(order.total),
    });
  } catch (err) {
    console.error("Razorpay refund failed:", err);
  }
}

export async function createOrder(
  userId: string,
  data: {
    shippingAddress: IAddress;
    paymentMethod: PaymentMethod;
    couponCode?: string | null;
    skipCoupon?: boolean;
  },
) {
  const cart = await getCartForOrder(userId);
  const products = await Product.find({ _id: { $in: cart.lines.map((l) => l.productId) } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = cart.lines.map((line) => {
    const product = productMap.get(line.productId.toString());
    if (!product) throw new AppError(400, "Product no longer available");
    const stock = product.stock.get(line.size) ?? 99;
    if (line.quantity > stock) {
      throw new AppError(400, `Insufficient stock for ${product.name}`);
    }
    const imageUrl = product.imageIds[0] ? `/api/media/${product.imageIds[0]}` : null;
    return {
      productId: product._id,
      name: product.name,
      slug: product.slug,
      imageUrl,
      size: line.size,
      color: product.colors?.length === 1 ? product.colors[0] : undefined,
      quantity: line.quantity,
      unitPrice: product.price,
    };
  });

  const quoteLines: CartCouponLine[] = items.map((item) => {
    const product = productMap.get(item.productId.toString())!;
    return {
      productId: item.productId.toString(),
      categoryId: product.categoryId.toString(),
      price: item.unitPrice,
      quantity: item.quantity,
    };
  });
  const explicitCode = data.couponCode?.trim();
  const quote =
    data.skipCoupon && !explicitCode
      ? {
          ok: false,
          message: "No coupon applied",
          coupon: null,
          eligibleSubtotal: 0,
          discount: 0,
          autoApplied: false,
        }
      : await quoteCoupon(quoteLines, {
          code: explicitCode || undefined,
          userId,
        });
  if (explicitCode && !quote.ok) {
    throw new AppError(400, quote.message || "Coupon could not be applied");
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = quote.ok ? quote.discount : 0;
  const total = Math.max(0, subtotal - discount) + SHIPPING_FEE;

  const sanitizedAddress: IAddress = {
    name: sanitizeText(data.shippingAddress.name),
    line1: sanitizeText(data.shippingAddress.line1),
    city: sanitizeText(data.shippingAddress.city),
    state: sanitizeText(data.shippingAddress.state),
    pincode: sanitizeText(data.shippingAddress.pincode),
    phone: sanitizeText(data.shippingAddress.phone),
    isDefault: false,
  };

  const now = new Date();
  const isCod = data.paymentMethod === "cod";
  if (!isCod) {
    requireRazorpayKeys();
    if (inrPaise(total) < 100) throw new AppError(400, "Order total must be at least ₹1");
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    items,
    shippingAddress: sanitizedAddress,
    subtotal,
    shippingFee: SHIPPING_FEE,
    discount,
    total,
    couponCode: quote.ok ? quote.coupon?.code ?? null : null,
    couponTitle: quote.ok ? quote.coupon?.title ?? null : null,
    paymentMethod: data.paymentMethod,
    paymentStatus: "pending",
    orderStatus: isCod ? "confirmed" : "placed",
    stockDeducted: isCod,
    statusHistory: isCod
      ? [
          { status: "placed", note: "ordered", actor: "system", at: now },
          { status: "confirmed", note: "COD confirmed", actor: "system", at: now },
        ]
      : [{ status: "placed", note: "ordered", actor: "system", at: now }],
  });

  if (isCod) {
    for (const item of items) {
      const product = productMap.get(item.productId.toString());
      if (product) {
        const current = product.stock.get(item.size) ?? 99;
        product.stock.set(item.size, Math.max(0, current - item.quantity));
        await product.save();
      }
    }
    await clearCart(userId);
    await redeemCouponOnce(order);
    return { ...toPublicOrder(order), razorpay: null };
  }

  const razorpay = await startRazorpayOrder(order);
  return { ...toPublicOrder(order), razorpay };
}

export async function createRazorpayOrder(orderId: string, userId: string) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");
  if (order.paymentMethod !== "razorpay") throw new AppError(400, "Invalid payment method");
  if (order.paymentStatus === "paid") throw new AppError(400, "Order already paid");
  if (order.orderStatus === "cancelled") throw new AppError(400, "Order is cancelled");
  return startRazorpayOrder(order);
}

export async function verifyRazorpayPayment(
  orderId: string,
  userId: string,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) {
  const { keySecret } = requireRazorpayKeys();

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");
  if (order.paymentMethod !== "razorpay") throw new AppError(400, "Invalid payment method");
  if (!order.razorpayOrderId || order.razorpayOrderId !== data.razorpayOrderId) {
    throw new AppError(400, "Payment does not match this order");
  }

  const expected = hmacSha256Hex(keySecret, `${data.razorpayOrderId}|${data.razorpayPaymentId}`);
  if (!timingSafeEqualHex(expected, data.razorpaySignature)) {
    throw new AppError(400, "Payment verification failed");
  }

  return finalizePaidOrder(order, {
    razorpayPaymentId: data.razorpayPaymentId,
    razorpaySignature: data.razorpaySignature,
  });
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError(400, "Invalid webhook");
  }
  const raw = rawBody.toString("utf8");
  const expected = hmacSha256Hex(env.RAZORPAY_WEBHOOK_SECRET, raw);
  if (!timingSafeEqualHex(expected, signature)) {
    throw new AppError(400, "Invalid webhook signature");
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      refund?: { entity?: { payment_id?: string; status?: string } };
    };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    throw new AppError(400, "Invalid webhook");
  }

  if (payload.event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) return;
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (!order) return;
    await finalizePaidOrder(order, { razorpayPaymentId: payment.id ?? "" });
    return;
  }

  if (payload.event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) return;
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "failed";
      await order.save();
    }
    return;
  }

  if (payload.event === "refund.processed") {
    const refund = payload.payload?.refund?.entity;
    if (!refund?.payment_id) return;
    const order = await Order.findOne({ razorpayPaymentId: refund.payment_id });
    if (order && order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
      order.statusHistory.push({
        status: order.orderStatus,
        note: "Refund processed",
        actor: "system",
        at: new Date(),
      });
      await order.save();
    }
    return;
  }

  if (payload.event === "refund.failed") {
    const refund = payload.payload?.refund?.entity;
    if (!refund?.payment_id) return;
    const order = await Order.findOne({ razorpayPaymentId: refund.payment_id });
    if (order) {
      order.statusHistory.push({
        status: order.orderStatus,
        note: "Refund failed",
        actor: "system",
        at: new Date(),
      });
      await order.save();
    }
  }
}

export async function listOrders(userId: string, isAdmin = false) {
  const filter = isAdmin ? {} : { userId };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  const returns = await getReturnsByOrderIds(orders.map((o) => o._id.toString()));
  const latestByOrder = new Map<string, (typeof returns)[number]>();
  for (const r of returns) {
    const key = r.orderId.toString();
    if (!latestByOrder.has(key)) latestByOrder.set(key, r);
  }

  if (!isAdmin) {
    return orders.map((o) => ({
      ...toPublicOrder(o),
      ...returnStateForOrder(o, latestByOrder.get(o._id.toString()) ?? null),
    }));
  }

  const userIds = [...new Set(orders.map((o) => o.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  return orders.map((o) => ({
    ...toPublicOrder(o),
    ...returnStateForOrder(o, latestByOrder.get(o._id.toString()) ?? null),
    customerName: userMap.get(o.userId.toString()) ?? "Guest",
  }));
}

export async function getOrder(orderId: string, userId: string, isAdmin = false) {
  const filter = isAdmin ? { _id: orderId } : { _id: orderId, userId };
  const order = await Order.findOne(filter);
  if (!order) throw new AppError(404, "Order not found");
  const [existing] = await getReturnsByOrderIds([order._id.toString()]);
  return {
    ...toPublicOrder(order),
    ...returnStateForOrder(order, existing ?? null),
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  return applyForwardStatus(order, status, "admin", note);
}

export async function updateOrderAdmin(
  orderId: string,
  data: {
    orderStatus?: OrderStatus;
    trackingNumber?: string;
    note?: string;
    cancelAction?: "approve" | "reject" | "direct";
  },
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  if (data.trackingNumber !== undefined) {
    order.trackingNumber = data.trackingNumber;
  }

  if (data.cancelAction === "approve" && order.orderStatus === "cancel_requested") {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: "Cancel approved", actor: "admin", at: new Date() });
    await restoreStock(order);
    await refundOnlineIfPaid(order);
    await order.save();
    await notifyOrder(order, "cancelled");
    return toPublicOrder(order);
  }
  if (data.cancelAction === "reject" && order.orderStatus === "cancel_requested") {
    order.orderStatus = "confirmed";
    order.statusHistory.push({ status: "confirmed", note: "Cancel rejected", actor: "admin", at: new Date() });
    await order.save();
    await notifyUser({
      userId: order.userId.toString(),
      type: "cancel_rejected",
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
    });
    await sendOrderEmail(
      await customerEmail(order.userId.toString()),
      "cancel_rejected",
      order.orderNumber,
    );
    return toPublicOrder(order);
  }
  if (data.cancelAction === "direct") {
    if (!canAdminDirectCancel(order)) {
      throw new AppError(400, "This order cannot be cancelled");
    }
    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: data.note || "Cancelled by atelier",
      actor: "admin",
      at: new Date(),
    });
    await restoreStock(order);
    await refundOnlineIfPaid(order);
    await order.save();
    await notifyOrder(order, "cancelled");
    return toPublicOrder(order);
  }
  if (data.orderStatus) {
    return applyForwardStatus(order, data.orderStatus, "admin", data.note);
  }

  await order.save();
  return toPublicOrder(order);
}

const CANCEL_REASONS = [
  "changed_mind",
  "ordered_by_mistake",
  "delivery_too_slow",
  "found_better_price",
  "other",
] as const;

export async function cancelOrder(
  orderId: string,
  userId: string,
  data: { reason: (typeof CANCEL_REASONS)[number]; note?: string },
) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");

  const { allowed, instant } = canCancelOrder(order);
  if (!allowed) throw new AppError(400, "This order cannot be cancelled");

  const reasonLabel: Record<(typeof CANCEL_REASONS)[number], string> = {
    changed_mind: "Changed my mind",
    ordered_by_mistake: "Ordered by mistake",
    delivery_too_slow: "Delivery too slow",
    found_better_price: "Found a better price",
    other: data.note?.trim() || "Other",
  };
  const note = [reasonLabel[data.reason], data.note?.trim()].filter(Boolean).join(" — ");

  order.cancelReason = note;
  order.cancelRequestedAt = new Date();

  if (instant) {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note, actor: "customer", at: new Date() });
    await restoreStock(order);
    await refundOnlineIfPaid(order);
    await order.save();
    await notifyOrder(order, "cancelled");
  } else {
    order.orderStatus = "cancel_requested";
    order.statusHistory.push({ status: "cancel_requested", note, actor: "customer", at: new Date() });
    await order.save();
    await notifyOrder(order, "cancel_requested");
  }

  return toPublicOrder(order);
}

export async function getDashboardMetrics() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [
    ordersThisWeek,
    ordersLastWeek,
    productCount,
    todaysSalesAgg,
    revenueAgg,
    recentOrdersRaw,
    statusAgg,
    lowStockProducts,
    pendingOrders,
    pendingReturns,
    revenueByDay,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: weekStart } }),
    Order.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(8),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Product.find({ isActive: true }).limit(200),
    Order.countDocuments({ orderStatus: { $in: ["placed", "confirmed", "processing"] } }),
    Return.countDocuments({ status: { $nin: ["refunded", "rejected"] } }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const lowStockCount = lowStockProducts.filter((p) => {
    for (const [, qty] of p.stock.entries()) {
      if (qty < 3) return true;
    }
    return false;
  }).length;

  const statusBreakdown: Record<string, number> = {};
  for (const row of statusAgg) {
    statusBreakdown[row._id] = row.count;
  }

  const userIds = [...new Set(recentOrdersRaw.map((o) => o.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  const recentOrders = recentOrdersRaw.map((o) => ({
    ...toPublicOrder(o),
    customerName: userMap.get(o.userId.toString()) ?? "Guest",
  }));

  const weekChangePercent =
    ordersLastWeek > 0
      ? Math.round(((ordersThisWeek - ordersLastWeek) / ordersLastWeek) * 100)
      : ordersThisWeek > 0
        ? 100
        : 0;

  return {
    totalRevenue: revenueAgg[0]?.total ?? 0,
    ordersThisWeek,
    ordersLastWeek,
    weekChangePercent,
    productCount,
    todaysSales: todaysSalesAgg[0]?.total ?? 0,
    statusBreakdown,
    revenueByDay: revenueByDay.map((d: { _id: string; revenue: number }) => ({
      date: d._id,
      revenue: d.revenue,
    })),
    recentOrders,
    lowStockCount,
    pendingOrders,
    pendingReturns,
  };
}

export async function getAdminStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [ordersToday, revenueAgg, lowStock] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Product.find({ isActive: true }).limit(100),
  ]);

  const lowStockProducts = lowStock.filter((p) => {
    for (const [, qty] of p.stock.entries()) {
      if (qty < 3) return true;
    }
    return false;
  }).length;

  return {
    ordersToday,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    lowStockCount: lowStockProducts,
  };
}
