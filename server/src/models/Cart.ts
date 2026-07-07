import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICartLine {
  productId: Types.ObjectId;
  size: string;
  quantity: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  lines: ICartLine[];
  updatedAt: Date;
  createdAt: Date;
}

const cartLineSchema = new Schema<ICartLine>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    lines: { type: [cartLineSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
