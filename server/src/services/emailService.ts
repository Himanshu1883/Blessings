import { env } from "../config/env.js";
import { isPlaceholderEmail } from "../utils/sanitize.js";

type OrderMailKind =
  | "confirmed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "cancel_requested"
  | "cancel_rejected"
  | "return_requested"
  | "return_approved"
  | "return_rejected"
  | "return_refunded";

const COPY: Record<OrderMailKind, { subject: string; body: (orderNumber: string, extra?: string) => string }> = {
  confirmed: {
    subject: "Your Blessings order is confirmed",
    body: (n, extra) => `Order ${n} is confirmed.${extra ? ` Total charged: ${extra}.` : ""}`,
  },
  shipped: {
    subject: "Your order is on the way",
    body: (n) => `Order ${n} has been shipped.`,
  },
  out_for_delivery: {
    subject: "Your order is out for delivery",
    body: (n) => `Order ${n} is out for delivery.`,
  },
  delivered: {
    subject: "Your order was delivered",
    body: (n) => `Order ${n} was delivered.`,
  },
  cancelled: {
    subject: "Your order was cancelled",
    body: (n) => `Order ${n} has been cancelled.`,
  },
  cancel_requested: {
    subject: "Cancellation requested",
    body: (n) => `We have received your cancellation request for order ${n}. The atelier will review it shortly.`,
  },
  cancel_rejected: {
    subject: "Your order remains confirmed",
    body: (n) =>
      `The cancellation request for order ${n} was not approved. The order remains confirmed and will continue.`,
  },
  return_requested: {
    subject: "Return request received",
    body: (n) => `We received your return request for order ${n}. The atelier will review it shortly.`,
  },
  return_approved: {
    subject: "Your return was approved",
    body: (n) => `Your return for order ${n} was approved. Pickup will be arranged next.`,
  },
  return_rejected: {
    subject: "Return request declined",
    body: (n) => `The return request for order ${n} was not approved. Write to us if you need help.`,
  },
  return_refunded: {
    subject: "Your return is complete",
    body: (n) => `Order ${n} has been returned. If you paid online, the refund has been issued to the original method.`,
  },
};

export function mailKindForStatus(status: string): OrderMailKind | null {
  if (status === "shipped") return "shipped";
  if (status === "in_transit") return "out_for_delivery";
  if (status === "delivered") return "delivered";
  if (status === "cancelled") return "cancelled";
  if (status === "cancel_requested") return "cancel_requested";
  return null;
}

async function deliver(to: string, subject: string, text: string) {
  const from = env.MAIL_FROM || "Blessings <noreply@blessings.local>";

  if (env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: `<p>${text}</p><p style="color:#888;font-size:12px">Blessings · Delhi atelier</p>`,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend ${res.status}: ${detail}`);
    }
    return;
  }

  console.info(`[mail skipped — set RESEND_API_KEY]\nTo: ${to}\n${subject}\n${text}`);
}

export async function sendOrderEmail(
  to: string | undefined | null,
  kind: OrderMailKind,
  orderNumber: string,
  extra?: string,
) {
  if (!to || isPlaceholderEmail(to)) return;
  const copy = COPY[kind];
  try {
    await deliver(to, copy.subject, copy.body(orderNumber, extra));
  } catch (err) {
    console.error("Order email failed:", err);
  }
}
