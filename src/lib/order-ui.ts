import type { ApiOrder } from "./api-types";

export const TRACK_STEPS = [
  { key: "placed", label: "Ordered", hint: "We received it" },
  { key: "confirmed", label: "Confirmed", hint: "Payment verified / order confirmed" },
  { key: "processing", label: "Packed", hint: "Being prepared" },
  { key: "shipped", label: "Shipped", hint: "On the way" },
  { key: "in_transit", label: "Out for delivery", hint: "Courier today" },
  { key: "delivered", label: "Delivered", hint: "Done" },
] as const;

const STEP_KEYS = TRACK_STEPS.map((s) => s.key);

export function trackIndex(status: string) {
  if (status === "delivered") return 5;
  if (status === "in_transit") return 4;
  if (status === "shipped") return 3;
  if (status === "processing") return 2;
  if (status === "confirmed") return 1;
  if (status === "placed") return 0;
  return 0;
}

export type StepTone = "complete" | "current" | "upcoming";

export function stepTone(index: number, currentIndex: number, delivered: boolean): StepTone {
  if (delivered) return "complete";
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function historyTimeForStep(order: ApiOrder, stepKey: string): string | undefined {
  if (stepKey === "placed") {
    const row = order.statusHistory.find((h) => h.status === "placed");
    return row?.at ?? order.createdAt;
  }
  const row = [...order.statusHistory].find((h) => h.status === stepKey);
  return row?.at;
}

export function hideTrackerRail(order: ApiOrder) {
  return (
    order.orderStatus === "cancelled" ||
    order.orderStatus === "cancel_requested" ||
    order.orderStatus === "returned" ||
    order.paymentStatus === "failed"
  );
}

export function isTerminalFailure(order: ApiOrder) {
  return hideTrackerRail(order);
}

export function cancelledAt(order: ApiOrder): string | undefined {
  const row = [...order.statusHistory].reverse().find((h) => h.status === "cancelled");
  return row?.at ?? order.updatedAt;
}

export function formatTrackTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusHeadline(order: ApiOrder) {
  if (order.paymentStatus === "failed") return "Order failed";
  if (order.orderStatus === "cancelled") {
    const when = formatTrackTime(cancelledAt(order));
    return when ? `Cancelled · ${when}` : "Cancelled";
  }
  if (order.orderStatus === "returned") return "Returned";
  if (order.returnStatus === "rejected") return "Delivered";
  if (order.returnStatus && order.returnStatus !== "refunded") {
    if (order.returnStatus === "pending") return "Return requested — under review";
    if (order.returnStatus === "approved") return "Return approved — pickup next";
    return `Return in progress · ${order.returnStatus.replace(/_/g, " ")}`;
  }
  if (order.orderStatus === "cancel_requested") return "Cancellation requested — under review";
  if (order.orderStatus === "delivered") return "Delivered";
  if (order.orderStatus === "in_transit") return "Out for delivery";
  if (order.orderStatus === "processing") return "Packed";
  if (order.orderStatus === "placed") return "Ordered";
  if (order.orderStatus === "confirmed") return "Confirmed";
  return order.orderStatus.replace(/_/g, " ");
}

export function paymentBadge(order: ApiOrder) {
  if (order.paymentStatus === "paid") return { label: "Paid", tone: "paid" as const };
  if (order.paymentStatus === "failed") return { label: "Failed", tone: "failed" as const };
  if (order.paymentStatus === "refunded") return { label: "Refunded", tone: "pending" as const };
  if (order.paymentMethod === "cod") return { label: "COD", tone: "cod" as const };
  return { label: "Pending", tone: "pending" as const };
}

export function adminNextStatuses(order: {
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
}): string[] {
  if (order.paymentStatus === "failed") return [];
  if (["delivered", "cancelled", "returned", "cancel_requested"].includes(order.orderStatus)) {
    return [];
  }
  if (order.paymentMethod === "razorpay" && order.paymentStatus === "pending") return [];
  const current =
    order.orderStatus === "placed" && order.paymentMethod === "cod" ? "confirmed" : order.orderStatus;
  if (current === "placed") return [];
  if (current === "confirmed") return ["processing", "shipped"];
  if (current === "processing") return ["shipped"];
  if (current === "shipped") return ["in_transit", "delivered"];
  if (current === "in_transit") return ["delivered"];
  return [];
}

export function adminCanDirectCancel(order: {
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  if (order.paymentStatus === "failed") return false;
  if (["delivered", "cancelled", "returned", "cancel_requested"].includes(order.orderStatus)) {
    return false;
  }
  if (order.paymentMethod === "razorpay" && order.paymentStatus === "pending") return false;
  return true;
}

export const ADMIN_NEXT_LABELS: Record<string, string> = {
  processing: "Packed",
  shipped: "Shipped",
  in_transit: "Out for delivery",
  delivered: "Delivered",
};

export function adminStatusLabel(status: string) {
  if (status === "placed") return "Waiting for payment";
  if (status === "processing") return "Packed";
  if (status === "in_transit") return "Out for delivery";
  if (status === "cancel_requested") return "Cancel requested";
  return status.replace(/_/g, " ");
}

export { STEP_KEYS };
