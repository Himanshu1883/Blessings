import { uploadToGridFs, openGridFsDownloadStream } from "../db/gridfs.js";
import { Media, toPublicMedia } from "../models/Media.js";
import { AppError } from "../utils/apiResponse.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export function validateImageFile(file: Express.Multer.File) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw new AppError(400, "Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new AppError(400, "Image must be under 5MB");
  }
}

export async function uploadMedia(file: Express.Multer.File, uploadedBy?: string, alt?: string) {
  validateImageFile(file);
  const gridFsId = await uploadToGridFs(file.buffer, file.originalname, file.mimetype, {
    uploadedBy,
  });
  const media = await Media.create({
    gridFsId,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy,
    alt,
  });
  return toPublicMedia(media);
}

export function streamMedia(fileId: string) {
  try {
    return openGridFsDownloadStream(fileId);
  } catch {
    throw new AppError(404, "Media not found");
  }
}

export async function getMediaMeta(fileId: string) {
  const media = await Media.findOne({ gridFsId: fileId });
  if (!media) throw new AppError(404, "Media not found");
  return toPublicMedia(media);
}

export function mediaUrl(gridFsId: string, baseUrl = ""): string {
  return `${baseUrl}/api/media/${gridFsId}`;
}
