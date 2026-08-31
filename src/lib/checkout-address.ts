export const CHECKOUT_ADDRESS_KEY = "blessings.checkout-address";

export type CheckoutAddress = {
  name: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export function writeCheckoutAddress(address: CheckoutAddress) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(address));
}

export function readCheckoutAddress(): CheckoutAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_ADDRESS_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CHECKOUT_ADDRESS_KEY);
    return JSON.parse(raw) as CheckoutAddress;
  } catch {
    return null;
  }
}
