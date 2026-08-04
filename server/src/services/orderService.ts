import Razorpay from "razorpay";
import crypto from "crypto";
import { Order, toPublicOrder, type OrderStatus } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Return } from "../models/Return.js";
import { getCartForOrder, clearCart } from "./cartService.js";
import { AppError } from "../utils/apiResponse.js";
import { generateOrderNumber, sanitizeText } from "../utils/sanitize.js";
import { env } from "../config/env.js";
import type { IAddress } from "../models/User.js";
import type { PaymentMethod } from "../models/Order.js";

const SHIPPING_FEE = 0;

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Online payments are not configured");
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export async function createOrder(
  userId: string,
  data: {
    shippingAddress: IAddress;
    paymentMethod: PaymentMethod;
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
      imageUrl,
      size: line.size,
      quantity: line.quantity,
      unitPrice: product.price,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal + SHIPPING_FEE;

  const sanitizedAddress: IAddress = {
    name: sanitizeText(data.shippingAddress.name),
    line1: sanitizeText(data.shippingAddress.line1),
    city: sanitizeText(data.shippingAddress.city),
    state: sanitizeText(data.shippingAddress.state),
    pincode: sanitizeText(data.shippingAddress.pincode),
    phone: sanitizeText(data.shippingAddress.phone),
    isDefault: false,
  };

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    items,
    shippingAddress: sanitizedAddress,
    subtotal,
    shippingFee: SHIPPING_FEE,
    total,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentMethod === "cod" ? "pending" : "pending",
    orderStatus: data.paymentMethod === "cod" ? "placed" : "placed",
    statusHistory: [{ status: "placed", at: new Date() }],
  });

  for (const item of items) {
    const product = productMap.get(item.productId.toString());
    if (product) {
      const current = product.stock.get(item.size) ?? 99;
      product.stock.set(item.size, Math.max(0, current - item.quantity));
      await product.save();
    }
  }

  await clearCart(userId);
  return toPublicOrder(order);
}

export async function createRazorpayOrder(orderId: string, userId: string) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");
  if (order.paymentMethod !== "razorpay") throw new AppError(400, "Invalid payment method");
  if (order.paymentStatus === "paid") throw new AppError(400, "Order already paid");

  const razorpay = getRazorpay();
  const rzOrder = await razorpay.orders.create({
    amount: order.total * 100,
    currency: "INR",
    receipt: order.orderNumber,
  });

  order.razorpayOrderId = rzOrder.id;
  await order.save();

  return {
    razorpayOrderId: rzOrder.id,
    amount: order.total * 100,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
    order: toPublicOrder(order),
  };
}

export async function verifyRazorpayPayment(
  orderId: string,
  userId: string,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) {
  if (!env.RAZORPAY_KEY_SECRET) throw new AppError(503, "Payments not configured");

  const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== data.razorpaySignature) {
    throw new AppError(400, "Payment verification failed");
  }

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");

  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.razorpayPaymentId = data.razorpayPaymentId;
  order.razorpaySignature = data.razorpaySignature;
  order.statusHistory.push({ status: "confirmed", note: "Payment received", at: new Date() });
  await order.save();

  return toPublicOrder(order);
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  if (expected !== signature) throw new AppError(400, "Invalid webhook signature");

  const payload = JSON.parse(rawBody.toString());
  if (payload.event === "payment.captured") {
    const payment = payload.payload.payment.entity;
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
      order.razorpayPaymentId = payment.id;
      order.statusHistory.push({ status: "confirmed", note: "Webhook payment", at: new Date() });
      await order.save();
    }
  }
}

export async function listOrders(userId: string, isAdmin = false) {
  const filter = isAdmin ? {} : { userId };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  if (!isAdmin) return orders.map(toPublicOrder);

  const userIds = [...new Set(orders.map((o) => o.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  return orders.map((o) => ({
    ...toPublicOrder(o),
    customerName: userMap.get(o.userId.toString()) ?? "Guest",
  }));
}

export async function getOrder(orderId: string, userId: string, isAdmin = false) {
  const filter = isAdmin ? { _id: orderId } : { _id: orderId, userId };
  const order = await Order.findOne(filter);
  if (!order) throw new AppError(404, "Order not found");
  return toPublicOrder(order);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  order.orderStatus = status;
  order.statusHistory.push({ status, note, at: new Date() });
  await order.save();
  return toPublicOrder(order);
}

export async function updateOrderAdmin(
  orderId: string,
  data: {
    orderStatus?: OrderStatus;
    trackingNumber?: string;
    note?: string;
    cancelAction?: "approve" | "reject";
  },
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  if (data.trackingNumber !== undefined) {
    order.trackingNumber = data.trackingNumber;
  }

  if (data.cancelAction === "approve" && order.orderStatus === "cancel_requested") {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: "Cancel approved", at: new Date() });
  } else if (data.cancelAction === "reject" && order.orderStatus === "cancel_requested") {
    order.orderStatus = "confirmed";
    order.statusHistory.push({ status: "confirmed", note: "Cancel rejected", at: new Date() });
  } else if (data.orderStatus) {
    order.orderStatus = data.orderStatus;
    order.statusHistory.push({ status: data.orderStatus, note: data.note, at: new Date() });
  }

  await order.save();
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
    Return.countDocuments({ status: "pending" }),
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
