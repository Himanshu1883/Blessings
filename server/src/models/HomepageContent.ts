import mongoose, { Schema, type Document } from "mongoose";

export interface IHomepageContent extends Document {
  key: string;
  data: Record<string, unknown>;
  updatedAt: Date;
}

const homepageSchema = new Schema<IHomepageContent>(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const HomepageContent = mongoose.model<IHomepageContent>("HomepageContent", homepageSchema);

export async function getHomepageSection(key: string) {
  const doc = await HomepageContent.findOne({ key });
  return doc?.data ?? null;
}

export async function setHomepageSection(key: string, data: Record<string, unknown>) {
  const doc = await HomepageContent.findOneAndUpdate(
    { key },
    { data },
    { upsert: true, new: true },
  );
  return doc.data;
}

export async function getAllHomepageContent() {
  const docs = await HomepageContent.find();
  const result: Record<string, unknown> = {};
  for (const doc of docs) {
    result[doc.key] = doc.data;
  }
  return result;
}
