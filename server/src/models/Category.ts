import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  tagline: string;
  imageId?: Types.ObjectId;
  subCategories: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    imageId: { type: Schema.Types.ObjectId },
    subCategories: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);

export function toPublicCategory(cat: ICategory, imageUrl?: string) {
  return {
    id: cat._id.toString(),
    slug: cat.slug,
    name: cat.name,
    tagline: cat.tagline,
    imageId: cat.imageId?.toString() ?? null,
    imageUrl: imageUrl ?? null,
    subCategories: cat.subCategories,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
  };
}
