import { getApiBase } from "./api-client";
import type { HomepageContent } from "./admin/types";

export async function fetchHomepageContent(): Promise<HomepageContent> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/homepage`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { success?: boolean; data?: HomepageContent };
    return json.data ?? {};
  } catch {
    return {};
  }
}
