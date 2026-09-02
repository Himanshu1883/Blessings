import mongoose from "mongoose";
import { User, toPublicUser } from "../models/User.js";
import { Order, toPublicOrder } from "../models/Order.js";
import { AppError } from "../utils/apiResponse.js";
import { isPlaceholderEmail } from "../utils/sanitize.js";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  addressCount: number;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function publicEmail(email?: string | null) {
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const users = await User.find()
    .select("+passwordHash +googleId")
    .sort({ createdAt: -1 })
    .lean();

  const stats = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: Date;
  }>([
    {
      $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$orderStatus", "cancelled"] },
                  { $ne: ["$paymentStatus", "failed"] },
                ],
              },
              "$total",
              0,
            ],
          },
        },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);

  const byUser = new Map(stats.map((row) => [row._id.toString(), row]));

  return users.map((user) => {
    const id = user._id.toString();
    const row = byUser.get(id);
    const hasPassword = typeof user.passwordHash === "string" && Boolean(user.passwordHash);
    return {
      id,
      name: user.name,
      email: publicEmail(user.email),
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      hasPassword,
      hasGoogle: Boolean(user.googleId),
      addressCount: user.addresses?.length ?? 0,
      orderCount: row?.orderCount ?? 0,
      totalSpent: row?.totalSpent ?? 0,
      lastOrderAt: row?.lastOrderAt ? row.lastOrderAt.toISOString() : null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString(),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date(user.updatedAt).toISOString(),
    };
  });
}

export async function getAdminUser(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, "Invalid user id");

  const user = await User.findById(id).select("+passwordHash +googleId");
  if (!user) throw new AppError(404, "User not found");

  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });
  const publicUser = toPublicUser(user);
  const counted = orders.filter(
    (o) => o.orderStatus !== "cancelled" && o.paymentStatus !== "failed",
  );

  return {
    ...publicUser,
    addressCount: publicUser.addresses.length,
    orderCount: orders.length,
    totalSpent: counted.reduce((sum, o) => sum + o.total, 0),
    lastOrderAt: orders[0]?.createdAt ? orders[0].createdAt.toISOString() : null,
    orders: orders.map((order) => ({
      ...toPublicOrder(order),
      customerName: user.name,
    })),
  };
}
