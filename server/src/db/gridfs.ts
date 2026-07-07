import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

const BUCKET_NAME = "blessings_media";

let bucket: GridFSBucket | null = null;

export function getGridFsBucket(): GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB not connected");
    bucket = new GridFSBucket(db as unknown as import("mongodb").Db, {
      bucketName: BUCKET_NAME,
    });
  }
  return bucket;
}

export async function uploadToGridFs(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, unknown>,
): Promise<ObjectId> {
  const gfs = getGridFsBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = gfs.openUploadStream(filename, {
      metadata: { contentType, ...metadata },
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id as ObjectId));
    uploadStream.end(buffer);
  });
}

export function openGridFsDownloadStream(fileId: string) {
  const gfs = getGridFsBucket();
  return gfs.openDownloadStream(new ObjectId(fileId));
}

export async function deleteFromGridFs(fileId: string): Promise<void> {
  const gfs = getGridFsBucket();
  await gfs.delete(new ObjectId(fileId));
}
