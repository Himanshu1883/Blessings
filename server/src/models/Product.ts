import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  categoryId: Types.ObjectId;
  fabric: string;
  price: number;
  description: string;
  sizes: string[];
  stock: Map<string, number>;
  imageIds: Types.ObjectId[];
  isNewProduct: boolean;
  bestSeller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    fabric: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    stock: { type: Map, of: Number, default: {} },
    imageIds: { type: [Schema.Types.ObjectId], default: [] },
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
  return {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    categoryId: product.categoryId.toString(),
    categorySlug: categorySlug ?? null,
    fabric: product.fabric,
    price: product.price,
    description: product.description,
    sizes: product.sizes,
    stock,
    imageIds: product.imageIds.map((id) => id.toString()),
    imageUrls: imageUrls ?? [],
    imageUrl: imageUrls?.[0] ?? null,
    isNew: product.isNewProduct,
    bestSeller: product.bestSeller,
    isActive: product.isActive,
  };
}
