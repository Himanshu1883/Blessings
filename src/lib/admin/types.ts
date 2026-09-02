import type { ApiCategory, ApiOrder, ApiProduct } from "@/lib/api-types";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "cancel_requested"
  | "cancelled"
  | "returned";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "pickup_scheduled"
  | "picked_up"
  | "received"
  | "refund_initiated"
  | "refunded"
  | "rejected";

import type { StoreCoupon } from "@/lib/coupons";

export type AdminCoupon = StoreCoupon;

export type AdminReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  productName: string;
  reason: string;
  status: ReturnStatus;
  statusHistory: Array<{ status: ReturnStatus; note?: string; at: string }>;
  createdAt: string;
  items?: Array<{ name: string; size: string; quantity: number; lineTotal: number }>;
  pickupAddress: {
    name: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  } | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  total: number | null;
  allowedNextStatuses: ReturnStatus[];
  stockRestored: boolean;
};

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  channel: "push" | "email";
  sentAt: string;
  meta?: Record<string, unknown>;
};

export type AdminOrder = ApiOrder & {
  trackingNumber?: string | null;
  cancelReason?: string | null;
  customerName?: string;
  allowedNextStatuses?: string[];
  canAdminCancel?: boolean;
  canReturn?: boolean;
  returnStatus?: string | null;
};

export type DashboardMetrics = {
  totalRevenue: number;
  ordersThisWeek: number;
  ordersLastWeek: number;
  weekChangePercent: number;
  productCount: number;
  todaysSales: number;
  statusBreakdown: Record<string, number>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  recentOrders: AdminOrder[];
  lowStockCount: number;
  pendingOrders: number;
  pendingReturns: number;
};

export type AdminUser = {
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

export type AdminUserDetail = AdminUser & {
  addresses: Array<{
    name: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }>;
  orders: AdminOrder[];
};

export type AdminData = {
  products: ApiProduct[];
  categories: ApiCategory[];
  orders: AdminOrder[];
  coupons: AdminCoupon[];
  returns: AdminReturn[];
  notifications: AdminNotification[];
  dashboard: DashboardMetrics | null;
};

export type StockLevel = "all" | "in" | "low" | "out";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "list"
  | "url"
  | "image"
  | "video";

export type ProductCustomField = {
  id: string;
  label: string;
  type: CustomFieldType;
  value: string | number | boolean | string[];
  showOnProductPage: boolean;
};

export type HomepageSection =
  | "sectionCopy"
  | "hero"
  | "categories"
  | "fabrics"
  | "occasions"
  | "featured"
  | "instagram"
  | "reviews";

export type HomepageContent = Record<string, unknown>;
