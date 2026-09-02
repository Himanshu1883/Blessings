import mongoose, { Schema, type Document } from "mongoose";

export type StoreSettingsPayload = {
  storeName: string;
  brandName: string;
  tagline: string;
  email: string;
  landline: string;
  landlineDisplay: string;
  hours: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  instagramHandle: string;
  shippingFee: number;
  shippingNote: string;
  returnsEnabled: boolean;
};

export const DEFAULT_STORE_SETTINGS: StoreSettingsPayload = {
  storeName: "Blessings The Men's Boutique",
  brandName: "Blessings",
  tagline: "The Men's Boutique",
  email: "Blessingsthemensboutique@gmail.com",
  landline: "01144461432",
  landlineDisplay: "011 4446 1432",
  hours: "11:30 AM — 9:30 PM, Monday — Saturday",
  addressLine1: "South Extension",
  addressLine2: "",
  city: "New Delhi",
  state: "Delhi",
  pincode: "110049",
  country: "India",
  whatsappNumber: "918860306034",
  whatsappDisplay: "+91 88603 06034",
  instagramHandle: "blessingsthemensboutique",
  shippingFee: 0,
  shippingNote: "Complimentary worldwide shipping on every Blessings order.",
  returnsEnabled: false,
};

export interface IStoreSettings extends Document, StoreSettingsPayload {
  key: string;
  updatedAt: Date;
}

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    storeName: { type: String, required: true },
    brandName: { type: String, required: true },
    tagline: { type: String, default: "" },
    email: { type: String, required: true },
    landline: { type: String, default: "" },
    landlineDisplay: { type: String, default: "" },
    hours: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
    whatsappNumber: { type: String, required: true },
    whatsappDisplay: { type: String, default: "" },
    instagramHandle: { type: String, default: "" },
    shippingFee: { type: Number, default: 0, min: 0 },
    shippingNote: { type: String, default: "" },
    returnsEnabled: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const StoreSettings = mongoose.model<IStoreSettings>("StoreSettings", storeSettingsSchema);

export function toPublicSettings(doc: IStoreSettings | StoreSettingsPayload): StoreSettingsPayload {
  return {
    storeName: doc.storeName,
    brandName: doc.brandName,
    tagline: doc.tagline,
    email: doc.email,
    landline: doc.landline,
    landlineDisplay: doc.landlineDisplay,
    hours: doc.hours,
    addressLine1: doc.addressLine1,
    addressLine2: doc.addressLine2,
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    country: doc.country,
    whatsappNumber: doc.whatsappNumber,
    whatsappDisplay: doc.whatsappDisplay,
    instagramHandle: doc.instagramHandle,
    shippingFee: Number(doc.shippingFee) || 0,
    shippingNote: doc.shippingNote,
    returnsEnabled: Boolean(doc.returnsEnabled),
  };
}
