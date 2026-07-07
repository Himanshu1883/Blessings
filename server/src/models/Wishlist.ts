import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  updatedAt: Date;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true },
);

export const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
