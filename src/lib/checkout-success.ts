const PENDING_KEY = "blessings.order-success";

export function markOrderSuccess(orderId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_KEY, orderId);
}

export function hasOrderSuccessToken(orderId: string | undefined) {
  if (typeof window === "undefined" || !orderId) return false;
  return sessionStorage.getItem(PENDING_KEY) === orderId;
}

export function clearOrderSuccess() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
}
