import {
  DEFAULT_STORE_SETTINGS,
  StoreSettings,
  toPublicSettings,
  type StoreSettingsPayload,
} from "../models/StoreSettings.js";
import { AppError } from "../utils/apiResponse.js";
import { isEmail, sanitizeText } from "../utils/sanitize.js";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeWhatsappNumber(raw: string) {
  let digits = digitsOnly(raw);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 10 || digits.length > 15) {
    throw new AppError(400, "Enter a valid WhatsApp number with country code");
  }
  return digits;
}

export function formatWhatsappDisplay(number: string) {
  const digits = digitsOnly(number);
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `+${digits}`;
}

function formatLandlineDisplay(raw: string) {
  const digits = digitsOnly(raw);
  if (digits.length === 11 && digits.startsWith("011")) {
    return `011 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw.trim();
}

function cleanHandle(raw: string) {
  return sanitizeText(raw).replace(/^@/, "").replace(/\/+$/, "").trim();
}

export async function getStoreSettings(): Promise<StoreSettingsPayload> {
  const doc = await StoreSettings.findOne({ key: "store" });
  if (!doc) return { ...DEFAULT_STORE_SETTINGS };
  return toPublicSettings(doc);
}

export async function updateStoreSettings(
  patch: Partial<StoreSettingsPayload>,
): Promise<StoreSettingsPayload> {
  const current = await getStoreSettings();
  const next: StoreSettingsPayload = { ...current, ...patch };

  next.storeName = sanitizeText(next.storeName);
  next.brandName = sanitizeText(next.brandName);
  next.tagline = sanitizeText(next.tagline);
  next.email = sanitizeText(next.email);
  next.hours = sanitizeText(next.hours);
  next.addressLine1 = sanitizeText(next.addressLine1);
  next.addressLine2 = sanitizeText(next.addressLine2);
  next.city = sanitizeText(next.city);
  next.state = sanitizeText(next.state);
  next.pincode = sanitizeText(next.pincode);
  next.country = sanitizeText(next.country);
  next.shippingNote = sanitizeText(next.shippingNote);
  next.instagramHandle = cleanHandle(next.instagramHandle);

  if (next.storeName.length < 2) throw new AppError(400, "Store name is required");
  if (next.brandName.length < 2) throw new AppError(400, "Brand name is required");
  if (!isEmail(next.email)) throw new AppError(400, "Enter a valid store email");

  if (patch.whatsappNumber !== undefined || !next.whatsappNumber) {
    next.whatsappNumber = normalizeWhatsappNumber(next.whatsappNumber || next.whatsappDisplay);
  } else {
    next.whatsappNumber = digitsOnly(next.whatsappNumber);
  }

  if (patch.whatsappDisplay !== undefined && patch.whatsappDisplay.trim()) {
    next.whatsappDisplay = sanitizeText(patch.whatsappDisplay);
  } else {
    next.whatsappDisplay = formatWhatsappDisplay(next.whatsappNumber);
  }

  next.landline = digitsOnly(next.landline);
  if (patch.landlineDisplay !== undefined && patch.landlineDisplay.trim()) {
    next.landlineDisplay = sanitizeText(patch.landlineDisplay);
  } else {
    next.landlineDisplay = formatLandlineDisplay(next.landline);
  }

  next.shippingFee = Math.max(0, Number(next.shippingFee) || 0);
  next.returnsEnabled = Boolean(next.returnsEnabled);

  const doc = await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { ...next, key: "store" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return toPublicSettings(doc);
}
