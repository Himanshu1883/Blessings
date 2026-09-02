import { DEFAULT_STORE_SETTINGS } from "@/lib/store-settings";

/** Fallback storefront contact details. Live values come from admin Settings. */
export const STORE_EMAIL = DEFAULT_STORE_SETTINGS.email;
export const STORE_LANDLINE = DEFAULT_STORE_SETTINGS.landline;
export const STORE_LANDLINE_DISPLAY = DEFAULT_STORE_SETTINGS.landlineDisplay;
export const STORE_HOURS = DEFAULT_STORE_SETTINGS.hours;

/** Fallback until live settings load. Prefer `useStoreSettings().returnsEnabled`. */
export const RETURNS_ENABLED = DEFAULT_STORE_SETTINGS.returnsEnabled;
