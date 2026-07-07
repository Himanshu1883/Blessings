import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IMedia extends Document {
  _id: Types.ObjectId;
  gridFsId: Types.ObjectId;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy?: Types.ObjectId;
  alt?: string;
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    gridFsId: { type: Schema.Types.ObjectId, required: true, unique: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    alt: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Media = mongoose.model<IMedia>("Media", mediaSchema);

export function toPublicMedia(media: IMedia) {
  return {
    id: media._id.toString(),
    gridFsId: media.gridFsId.toString(),
    filename: media.filename,
    mimeType: media.mimeType,
    size: media.size,
    alt: media.alt ?? null,
    url: `/api/media/${media.gridFsId.toString()}`,
  };
}
