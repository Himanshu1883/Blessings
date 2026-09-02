import { DEFAULT_STORE_SETTINGS, instagramUrlFromHandle } from "@/lib/store-settings";

export const INSTAGRAM_HANDLE = DEFAULT_STORE_SETTINGS.instagramHandle;
export const INSTAGRAM_URL = instagramUrlFromHandle(INSTAGRAM_HANDLE);

export const INSTAGRAM_REELS = [
  "/reels/reel-1.mp4",
  "/reels/reel-2.mp4",
  "/reels/reel-3.mp4",
  "/reels/reel-4.mp4",
  "/reels/reel-5.mp4",
  "/reels/reel-6.mp4",
] as const;
