export type ApiUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  addresses: Array<{
    name: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }>;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  imageId: string | null;
  imageUrl: string | null;
  subCategories: string[];
  sortOrder: number;
  isActive: boolean;
  showOnNavbar: boolean;
};

export type ApiProduct = {
  id: string;
  slug: string;
  sku?: string | null;
  name: string;
  categoryId: string;
  categorySlug: string | null;
  fabric: string;
  price: number;
  description: string;
  sizes: string[];
  stock: Record<string, number>;
  imageIds: string[];
  imageUrls: string[];
  imageUrl: string | null;
  isNew: boolean;
  bestSeller: boolean;
  isActive: boolean;
  colors?: string[];
  showColorSelector?: boolean;
  showSizeSelector?: boolean;
  videoId?: string | null;
  customFields?: Array<{
    id: string;
    label: string;
    type: string;
    value: unknown;
    showOnProductPage: boolean;
  }>;
};

export type ApiCartLine = {
  line: { productId: string; size: string; quantity: number };
  product: ApiProduct;
};

export type ApiCart = {
  lines: ApiCartLine[];
  subtotal: number;
  itemCount: number;
};

export type ApiOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    slug: string | null;
    imageUrl: string | null;
    size: string;
    color: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  shippingAddress: ApiUser["addresses"][0];
  subtotal: number;
  shippingFee: number;
  discount?: number;
  total: number;
  couponCode?: string | null;
  couponTitle?: string | null;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string | null;
  cancelReason?: string | null;
  cancelRequestedAt?: string | null;
  canCancel: boolean;
  cancelInstant: boolean;
  canReturn?: boolean;
  returnStatus?: string | null;
  customerName?: string;
  statusHistory: Array<{ status: string; note?: string; actor?: string; at: string }>;
  allowedNextStatuses?: string[];
  canAdminCancel?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RazorpayCheckoutSession = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: "INR";
  orderId: string;
};

export type CreateOrderResult = ApiOrder & {
  razorpay: RazorpayCheckoutSession | null;
};

export type ApiUserNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

export type ApiMedia = {
  id: string;
  gridFsId: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string | null;
  url: string;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string; code?: string; data?: unknown };
