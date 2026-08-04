import mongoose, { Schema, type Document, type Types } from "mongoose";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "list"
  | "url"
  | "image"
  | "video";

export interface IProductCustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  value: unknown;
  showOnProductPage: boolean;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  slug: string;
  sku?: string;
  name: string;
  categoryId: Types.ObjectId;
  fabric: string;
  price: number;
  description: string;
  sizes: string[];
  colors: string[];
  showColorSelector: boolean;
  showSizeSelector: boolean;
  stock: Map<string, number>;
  imageIds: Types.ObjectId[];
  videoId?: Types.ObjectId;
  customFields: IProductCustomField[];
  isNewProduct: boolean;
  bestSeller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, sparse: true, unique: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    fabric: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    colors: { type: [String], default: [] },
    showColorSelector: { type: Boolean, default: true },
    showSizeSelector: { type: Boolean, default: true },
    stock: { type: Map, of: Number, default: {} },
    imageIds: { type: [Schema.Types.ObjectId], default: [] },
    videoId: { type: Schema.Types.ObjectId },
    customFields: {
      type: [
        {
          id: String,
          label: String,
          type: String,
          value: Schema.Types.Mixed,
          showOnProductPage: Boolean,
        },
      ],
      default: [],
    },
    isNewProduct: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ categoryId: 1, isActive: 1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);

export function toPublicProduct(
  product: IProduct,
  categorySlug?: string,
  imageUrls?: string[],
) {
  const stock: Record<string, number> = {};
  if (product.stock) {
    for (const [k, v] of product.stock.entries()) {
      stock[k] = v;
    }
  }
  // Handle both populated (Document) and non-populated (ObjectId) categoryId
  const catId = product.categoryId as unknown;
  const categoryId =
    catId && typeof catId === "object" && "_id" in catId
      ? (catId as { _id: Types.ObjectId })._id.toString()
      : String(catId);
  return {
    id: product._id.toString(),
    slug: product.slug,
    sku: product.sku ?? null,
    name: product.name,
    categoryId,
    categorySlug: categorySlug ?? null,
    fabric: product.fabric,
    price: product.price,
    description: product.description,
    sizes: product.sizes,
    colors: product.colors ?? [],
    showColorSelector: product.showColorSelector ?? true,
    showSizeSelector: product.showSizeSelector ?? true,
    stock,
    imageIds: product.imageIds.map((id) => id.toString()),
    imageUrls: imageUrls ?? [],
    imageUrl: imageUrls?.[0] ?? null,
    videoId: product.videoId?.toString() ?? null,
    customFields: product.customFields ?? [],
    isNew: product.isNewProduct,
    bestSeller: product.bestSeller,
    isActive: product.isActive,
  };
}
