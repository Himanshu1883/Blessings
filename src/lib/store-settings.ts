import { getApiBase } from "./api-client";

export type StoreSettings = {
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

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
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

export function instagramUrlFromHandle(handle: string) {
  const clean = handle.replace(/^@/, "").replace(/\/+$/, "").trim();
  return clean ? `https://www.instagram.com/${clean}/` : "https://www.instagram.com/";
}

export function whatsappUrlFor(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function formatStoreAddress(settings: StoreSettings) {
  return [
    settings.addressLine1,
    settings.addressLine2,
    [settings.city, settings.state, settings.pincode].filter(Boolean).join(", "),
    settings.country,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/settings`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { ...DEFAULT_STORE_SETTINGS };
    const json = (await res.json()) as { success?: boolean; data?: Partial<StoreSettings> };
    return { ...DEFAULT_STORE_SETTINGS, ...(json.data ?? {}) };
  } catch {
    return { ...DEFAULT_STORE_SETTINGS };
  }
}
