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
};

export type ApiProduct = {
  id: string;
  slug: string;
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
    imageUrl: string | null;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  shippingAddress: ApiUser["addresses"][0];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: string;
  orderStatus: string;
  statusHistory: Array<{ status: string; note?: string; at: string }>;
  createdAt: string;
  updatedAt: string;
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

export type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };
