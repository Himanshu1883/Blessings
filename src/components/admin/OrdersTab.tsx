import { Fragment, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/api-client";
import { useCurrency } from "@/lib/currency";
import { useStoreSettings } from "@/lib/store-settings-context";
import type { AdminOrder } from "@/lib/admin/types";
import type { OrderStatus } from "@/components/admin/ui/StatusBadge";
import type { useAdminApi } from "@/hooks/useAdminApi";
import { ADMIN_NEXT_LABELS, adminNextStatuses, adminCanDirectCancel } from "@/lib/order-ui";

const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "in_transit",
  "delivered",
  "cancel_requested",
  "cancelled",
  "returned",
];

const FILTER_LABELS: Record<string, string> = {
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

const RETURN_REASONS = [
  { value: "size_fit", label: "Size or fit issue" },
  { value: "damaged", label: "Item arrived damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "quality", label: "Quality not as expected" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
] as const;

type Props = { api: ReturnType<typeof useAdminApi> };

export function OrdersTab({ api }: Props) {
  const { format } = useCurrency();
  const { returnsEnabled } = useStoreSettings();
  const { data, loading, error, reload, updateOrder, updateOrderStatus, createReturn } = api;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "razorpay" | "cod">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<AdminOrder | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [returnOrder, setReturnOrder] = useState<AdminOrder | null>(null);
  const [returnReason, setReturnReason] = useState<(typeof RETURN_REASONS)[number]["value"]>("size_fit");
  const [returnNote, setReturnNote] = useState("");
  const [startingReturn, setStartingReturn] = useState(false);

  const stats = useMemo(() => {
    const pending = data.orders.filter((o) =>
      ["placed", "confirmed", "processing"].includes(o.orderStatus),
    ).length;
    const revenue = data.orders.reduce((s, o) => s + o.total, 0);
    return { total: data.orders.length, pending, revenue };
  }, [data.orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        o.shippingAddress.name.toLowerCase().includes(q)
      );
    });
  }, [data.orders, search, statusFilter, paymentFilter]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const getTracking = (o: AdminOrder) =>
    trackingDraft[o.id] ?? o.trackingNumber ?? "";

  const saveTracking = async (o: AdminOrder) => {
    setSavingTracking(o.id);
    try {
      await updateOrder(o.id, { trackingNumber: getTracking(o) });
      toast.success("Tracking saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingTracking(null);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDirectCancel = async (o: AdminOrder) => {
    try {
      await updateOrder(o.id, { cancelAction: "direct" });
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  const handleCancelAction = async (o: AdminOrder, action: "approve" | "reject") => {
    try {
      await updateOrder(o.id, { cancelAction: action });
      toast.success(action === "approve" ? "Cancellation approved" : "Cancellation rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const submitReturn = async () => {
    if (!returnOrder) return;
    setStartingReturn(true);
    try {
      await createReturn(returnOrder.id, returnReason, returnNote.trim() || undefined);
      toast.success("Return opened — process it in Returns");
      setReturnOrder(null);
      setReturnNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start return");
    } finally {
      setStartingReturn(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const paymentBadge = (status: string, method: string) => {
    const paid = status === "paid" || status === "captured";
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium ${
          paid ? "bg-emerald-deep/15 text-emerald-deep" : "bg-accent/20 text-accent-foreground"
        }`}
      >
        {paid ? "Paid" : status} · {method}
      </span>
    );
  };

  return (
    <div>
      <AdminPageHeader title="Orders" description="Manage orders, tracking, and fulfilment." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total orders" value={String(stats.total)} />
        <StatCard label="Pending fulfilment" value={String(stats.pending)} />
        <StatCard label="Order value" value={format(stats.revenue)} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <Input
          placeholder="Search order #, customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {FILTER_LABELS[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={paymentFilter}
          onValueChange={(v) => setPaymentFilter(v as "all" | "razorpay" | "cod")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="razorpay">Razorpay</SelectItem>
            <SelectItem value="cod">COD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminCard padding="none">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-8" />
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const isOpen = expanded === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="font-medium">{o.orderNumber}</td>
                      <td>{o.customerName ?? o.shippingAddress.name}</td>
                      <td className="text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td>{paymentBadge(o.paymentStatus, o.paymentMethod)}</td>
                      <td>
                        <StatusBadge status={o.orderStatus} />
                      </td>
                      <td className="text-right tabular-nums">{format(o.total)}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-muted/30">
                          <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                            <div>
                              <p className="eyebrow text-[10px] text-muted-foreground mb-2">Line items</p>
                              <ul className="space-y-2">
                                {o.items.map((item, i) => (
                                  <li key={i} className="flex items-center gap-3">
                                    {item.imageUrl && (
                                      <img
                                        src={resolveMediaUrl(item.imageUrl) ?? ""}
                                        alt=""
                                        className="size-10 rounded object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{item.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.size} × {item.quantity}
                                      </p>
                                    </div>
                                    <span className="tabular-nums">{format(item.lineTotal)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="eyebrow text-[10px] text-muted-foreground mb-2">Shipping address</p>
                                <p>{o.shippingAddress.name}</p>
                                <p className="text-muted-foreground">{o.shippingAddress.line1}</p>
                                <p className="text-muted-foreground">
                                  {o.shippingAddress.city}, {o.shippingAddress.state}{" "}
                                  {o.shippingAddress.pincode}
                                </p>
                                <p className="text-muted-foreground">{o.shippingAddress.phone}</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`track-${o.id}`}>Tracking number</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`track-${o.id}`}
                                    value={getTracking(o)}
                                    onChange={(e) =>
                                      setTrackingDraft((d) => ({ ...d, [o.id]: e.target.value }))
                                    }
                                    placeholder="AWB / tracking ID"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={savingTracking === o.id}
                                    onClick={() => saveTracking(o)}
                                  >
                                    {savingTracking === o.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      "Save"
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Next status</Label>
                                {o.orderStatus === "cancel_requested" ? (
                                  <p className="text-xs text-muted-foreground">
                                    Status is locked while a cancel request is under review.
                                  </p>
                                ) : (o.allowedNextStatuses ?? adminNextStatuses(o)).length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    No further status steps. Fulfilment is locked for this order.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {(o.allowedNextStatuses ?? adminNextStatuses(o)).map((s) => (
                                      <Button
                                        key={s}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => changeStatus(o.id, s)}
                                      >
                                        Mark {ADMIN_NEXT_LABELS[s] ?? s}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {(o.canAdminCancel ?? adminCanDirectCancel(o)) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDirectCancel(o)}
                                >
                                  Cancel order
                                </Button>
                              ) : null}
                              {o.orderStatus === "cancel_requested" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancelAction(o, "approve")}
                                  >
                                    Approve cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelAction(o, "reject")}
                                  >
                                    Reject cancel
                                  </Button>
                                  {o.cancelReason && (
                                    <p className="text-xs text-muted-foreground self-center">
                                      Reason: {o.cancelReason}
                                    </p>
                                  )}
                                </div>
                              )}
                              {returnsEnabled && o.returnStatus ? (
                                <p className="text-xs text-muted-foreground">
                                  Return: <StatusBadge status={o.returnStatus} kind="return" />
                                </p>
                              ) : null}
                              {returnsEnabled && o.canReturn ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReturnOrder(o);
                                    setReturnReason("size_fit");
                                    setReturnNote("");
                                  }}
                                >
                                  Start return
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInvoiceOrder(o)}
                              >
                                <Printer className="size-3.5 mr-1.5" />
                                Print invoice
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminModal
        open={!!invoiceOrder}
        onOpenChange={(open) => !open && setInvoiceOrder(null)}
        title={`Invoice ${invoiceOrder?.orderNumber ?? ""}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setInvoiceOrder(null)}>
              Close
            </Button>
            <Button onClick={printInvoice}>
              <Printer className="size-4 mr-2" />
              Print
            </Button>
          </>
        }
      >
        {invoiceOrder && (
          <div ref={invoiceRef} className="print-invoice space-y-4 text-sm">
            <div className="text-center border-b border-border pb-4">
              <h2 className="font-serif italic text-2xl">Blessings</h2>
              <p className="text-muted-foreground">Tax Invoice</p>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Bill to</p>
                <p>{invoiceOrder.shippingAddress.name}</p>
                <p className="text-muted-foreground">{invoiceOrder.shippingAddress.line1}</p>
                <p className="text-muted-foreground">
                  {invoiceOrder.shippingAddress.city}, {invoiceOrder.shippingAddress.pincode}
                </p>
              </div>
              <div className="text-right">
                <p>
                  <span className="text-muted-foreground">Order:</span> {invoiceOrder.orderNumber}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceOrder.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2">
                      {item.name} ({item.size})
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2 tabular-nums">{format(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1">
              <p>Subtotal: {format(invoiceOrder.subtotal)}</p>
              {(invoiceOrder.discount ?? 0) > 0 ? (
                <p>
                  Coupon{invoiceOrder.couponCode ? ` (${invoiceOrder.couponCode})` : ""}: −
                  {format(invoiceOrder.discount ?? 0)}
                </p>
              ) : null}
              <p>Shipping: {format(invoiceOrder.shippingFee)}</p>
              <p className="font-serif text-lg">Total: {format(invoiceOrder.total)}</p>
            </div>
          </div>
        )}
      </AdminModal>

      {returnsEnabled ? (
      <AdminModal
        open={!!returnOrder}
        onOpenChange={(open) => !open && setReturnOrder(null)}
        title={`Return ${returnOrder?.orderNumber ?? ""}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReturnOrder(null)}>
              Cancel
            </Button>
            <Button onClick={submitReturn} disabled={startingReturn}>
              {startingReturn ? "Opening…" : "Start return"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Opens a pending return for this delivered order. Process pickup, restock, and refund on the Returns tab.
          </p>
          <Label>Reason</Label>
          <div className="space-y-2">
            {RETURN_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="admin-return-reason"
                  checked={returnReason === r.value}
                  onChange={() => setReturnReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
          <Label>Note (optional)</Label>
          <Textarea
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
            className="min-h-20"
          />
        </div>
      </AdminModal>
      ) : null}
    </div>
  );
}
