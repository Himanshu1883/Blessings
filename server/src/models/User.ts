import mongoose, { Schema, type Document, type Types } from "mongoose";

export type UserRole = "user" | "admin";

export interface IAddress {
  name: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  role: UserRole;
  addresses: IAddress[];
  emailVerified: boolean;
  phoneVerified: boolean;
  refreshTokenHash?: string;
  refreshTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: { type: [addressSchema], default: [] },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);

export function toPublicUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    addresses: user.addresses,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}
