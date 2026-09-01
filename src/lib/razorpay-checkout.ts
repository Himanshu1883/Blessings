import { api } from "./api-client";
import type { ApiOrder, RazorpayCheckoutSession } from "./api-types";
import { displayEmail, normalizeIndianMobile } from "./format-contact";
import { markOrderSuccess } from "./checkout-success";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export class CheckoutDismissedError extends Error {
  constructor() {
    super("Payment window closed");
    this.name = "CheckoutDismissedError";
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function checkoutPrefill(user: { name?: string | null; email?: string | null; phone?: string | null }, form?: { name?: string; phone?: string }) {
  const phone = form?.phone || user.phone || "";
  const digits = normalizeIndianMobile(phone);
  return {
    name: form?.name || user.name || undefined,
    email: displayEmail(user.email) ?? undefined,
    contact: digits.length === 10 ? digits : undefined,
  };
}

function assertLiveSession(session: RazorpayCheckoutSession) {
  if (!session.keyId || !session.razorpayOrderId || !session.orderId) {
    throw new Error("Online payments are not configured");
  }
  if (session.currency !== "INR") {
    throw new Error("Online payments must be charged in INR");
  }
  if (!Number.isFinite(session.amount) || session.amount < 100) {
    throw new Error("Order total must be at least ₹1");
  }
}

export async function payWithRazorpay(opts: {
  session: RazorpayCheckoutSession;
  prefill: { name?: string; email?: string; contact?: string };
  description?: string;
}): Promise<ApiOrder> {
  assertLiveSession(opts.session);

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Payment gateway failed to load.");
  }

  const response = await new Promise<RazorpayHandlerResponse>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: opts.session.keyId,
      amount: opts.session.amount,
      currency: "INR",
      name: "Blessings",
      description: opts.description,
      order_id: opts.session.razorpayOrderId,
      prefill: opts.prefill,
      theme: { color: "#5c1a1a" },
      handler: (payload: RazorpayHandlerResponse) => resolve(payload),
      modal: {
        ondismiss: () => reject(new CheckoutDismissedError()),
      },
    });
    rzp.open();
  });

  return api.post<ApiOrder>(`/api/orders/${opts.session.orderId}/verify`, {
    razorpayOrderId: response.razorpay_order_id,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpaySignature: response.razorpay_signature,
  });
}

export function replaceWithThankYou(orderId: string) {
  markOrderSuccess(orderId);
  window.location.replace(`/checkout/success?order=${encodeURIComponent(orderId)}`);
}
