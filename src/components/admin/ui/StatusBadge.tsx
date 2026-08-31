import { cn } from "@/lib/utils";
import type { OrderStatus, ReturnStatus } from "@/lib/admin/types";

const orderStyles: Record<string, string> = {
  placed: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-accent/20 text-accent-foreground",
  shipped: "bg-accent/30 text-foreground",
  in_transit: "bg-accent/30 text-foreground",
  delivered: "bg-emerald-deep/15 text-emerald-deep",
  cancel_requested: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
  returned: "bg-muted text-muted-foreground",
};

const ORDER_LABELS: Record<string, string> = {
  placed: "Waiting for payment",
  confirmed: "Confirmed",
  processing: "Packed",
  shipped: "Shipped",
  in_transit: "Out for delivery",
  delivered: "Delivered",
  cancel_requested: "Cancel requested",
  cancelled: "Cancelled",
  returned: "Returned",
};

const returnStyles: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  pickup_scheduled: "bg-muted text-foreground",
  picked_up: "bg-muted text-foreground",
  received: "bg-muted text-foreground",
  refund_initiated: "bg-accent/30 text-foreground",
  refunded: "bg-emerald-deep/15 text-emerald-deep",
  rejected: "bg-destructive/15 text-destructive",
};

const RETURN_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  received: "Received",
  refund_initiated: "Refund initiated",
  refunded: "Refunded",
  rejected: "Rejected",
};

export function StatusBadge({
  status,
  kind = "order",
}: {
  status: string;
  kind?: "order" | "return";
}) {
  const styles = kind === "return" ? returnStyles : orderStyles;
  const label =
    kind === "return"
      ? (RETURN_LABELS[status] ?? status.replace(/_/g, " "))
      : (ORDER_LABELS[status] ?? status.replace(/_/g, " "));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-medium",
        styles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function StockBadge({ level }: { level: "in" | "low" | "out" }) {
  const map = {
    in: "bg-emerald-deep/15 text-emerald-deep",
    low: "bg-accent/25 text-accent-foreground",
    out: "bg-destructive/10 text-destructive",
  };
  const labels = { in: "In stock", low: "Low stock", out: "Out of stock" };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-medium",
        map[level],
      )}
    >
      {labels[level]}
    </span>
  );
}

export type { OrderStatus, ReturnStatus };
