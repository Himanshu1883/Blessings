const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 30 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use JPG, PNG, or WebP";
  if (file.size > IMAGE_MAX) return "Image must be under 5MB";
  return null;
}

export function validateVideoFile(file: File): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return "Use MP4 or WebM";
  if (file.size > VIDEO_MAX) return "Video must be under 30MB";
  return null;
}

export function validateMediaFile(file: File, kind: "image" | "video"): string | null {
  return kind === "image" ? validateImageFile(file) : validateVideoFile(file);
}
