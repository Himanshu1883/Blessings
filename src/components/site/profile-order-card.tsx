import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { api, resolveMediaUrl } from "@/lib/api-client";
import { useCancelOrder, useStartRazorpay, useRequestReturn } from "@/lib/api-hooks";
import {
  CheckoutDismissedError,
  checkoutPrefill,
  payWithRazorpay,
  replaceWithThankYou,
} from "@/lib/razorpay-checkout";
import { writeCheckoutAddress } from "@/lib/checkout-address";
import { useCurrency } from "@/lib/currency";
import { RETURNS_ENABLED } from "@/lib/store-contact";
import type { ApiOrder } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import {
  TRACK_STEPS,
  hideTrackerRail,
  paymentBadge,
  statusHeadline,
  trackIndex,
  stepTone,
  historyTimeForStep,
  formatTrackTime,
} from "@/lib/order-ui";

const CANCEL_REASONS = [
  { value: "changed_mind", label: "Changed my mind" },
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "delivery_too_slow", label: "Delivery too slow" },
  { value: "found_better_price", label: "Found a better price" },
  { value: "other", label: "Other" },
] as const;

const RETURN_REASONS = [
  { value: "size_fit", label: "Size or fit issue" },
  { value: "damaged", label: "Item arrived damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "quality", label: "Quality not as expected" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
] as const;

function OrderStatusTracker({ order }: { order: ApiOrder }) {
  if (hideTrackerRail(order)) {
    return (
      <div className="border border-[color:var(--maroon)]/30 bg-[color:var(--maroon)]/5 px-4 py-3 text-sm">
        <p className="font-medium text-[color:var(--maroon)]">{statusHeadline(order)}</p>
        {order.cancelReason ? (
          <p className="mt-1 text-xs text-foreground/55">{order.cancelReason}</p>
        ) : null}
      </div>
    );
  }

  const current = trackIndex(order.orderStatus);
  const delivered = order.orderStatus === "delivered";

  return (
    <div>
      <p className="mb-4 font-serif text-lg">{statusHeadline(order)}</p>
      <ol className="space-y-3">
        {TRACK_STEPS.map((step, i) => {
          const tone = stepTone(i, current, delivered);
          const at = formatTrackTime(historyTimeForStep(order, step.key));
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className={cn(
                    "size-2.5 rounded-full shrink-0",
                    tone === "complete" && "bg-[color:var(--gold)]",
                    tone === "current" && "bg-[color:var(--maroon)] ring-2 ring-[color:var(--maroon)]/25",
                    tone === "upcoming" && "bg-foreground/15",
                  )}
                />
                {i < TRACK_STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "mt-1 w-px flex-1 min-h-6",
                      tone === "upcoming" ? "bg-foreground/10" : "bg-[color:var(--gold)]/70",
                    )}
                  />
                ) : null}
              </div>
              <div className="min-w-0 pb-2">
                <p
                  className={cn(
                    "text-sm",
                    tone === "upcoming" ? "text-foreground/35" : "text-foreground",
                    tone === "current" && "font-medium",
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    tone === "upcoming" ? "text-foreground/30" : "text-foreground/50",
                  )}
                >
                  {step.hint}
                  {at && tone !== "upcoming" ? ` · ${at}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ProfileOrderCard({ order }: { order: ApiOrder }) {
  const { formatInr } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cancelOrder = useCancelOrder();
  const requestReturn = useRequestReturn();
  const startRazorpay = useStartRazorpay();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]["value"]>("changed_mind");
  const [note, setNote] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<(typeof RETURN_REASONS)[number]["value"]>("size_fit");
  const [returnNote, setReturnNote] = useState("");
  const [reordering, setReordering] = useState(false);
  const [paying, setPaying] = useState(false);
  const pay = paymentBadge(order);
  const showCodFee = order.paymentMethod === "cod" && order.shippingFee > 0;
  const waitingPay =
    order.paymentMethod === "razorpay" &&
    (order.paymentStatus === "pending" || order.paymentStatus === "failed") &&
    order.orderStatus !== "cancelled" &&
    order.orderStatus !== "cancel_requested";

  const reorder = async () => {
    setReordering(true);
    try {
      for (const item of order.items) {
        await api.post("/api/cart/items", {
          productId: item.productId,
          size: item.size || "M",
          quantity: item.quantity,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.refetchQueries({ queryKey: ["cart"] });
      writeCheckoutAddress({
        name: order.shippingAddress.name,
        line1: order.shippingAddress.line1,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        phone: order.shippingAddress.phone,
      });
      toast.success("Items added to your bag.");
      navigate({ to: "/checkout" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder.");
    } finally {
      setReordering(false);
    }
  };

  const payNow = async () => {
    setPaying(true);
    try {
      const session = await startRazorpay.mutateAsync(order.id);
      await payWithRazorpay({
        session,
        prefill: checkoutPrefill(user ?? {}, {
          name: order.shippingAddress.name,
          phone: order.shippingAddress.phone,
        }),
        description: order.orderNumber,
      });
      replaceWithThankYou(order.id);
    } catch (e) {
      if (e instanceof CheckoutDismissedError) {
        toast.message("Payment not completed. Your order is waiting — no stock was taken.");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Could not start payment.");
    } finally {
      setPaying(false);
    }
  };

  const submitReturn = async () => {
    try {
      await requestReturn.mutateAsync({
        id: order.id,
        reason: returnReason,
        note: returnNote.trim() || undefined,
      });
      toast.success("Return request sent. The atelier will review it.");
      setReturnOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not request return.");
    }
  };

  const submitCancel = async () => {
    try {
      const updated = await cancelOrder.mutateAsync({
        id: order.id,
        reason,
        note: note.trim() || undefined,
      });
      toast.success(
        updated.cancelInstant || updated.orderStatus === "cancelled"
          ? "Order cancelled."
          : "Cancel request sent to the atelier.",
      );
      setCancelOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel.");
    }
  };

  return (
    <article id={`order-${order.id}`} className="scroll-mt-28 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_10px_32px_rgba(40,16,10,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-serif text-lg">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-foreground/50">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-xl tabular-nums">{formatInr(order.total)}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <span
              className={cn(
                "eyebrow px-2 py-1 text-[8px] tracking-[0.14em]",
                pay.tone === "paid" && "border border-emerald-700/30 text-emerald-800",
                pay.tone === "cod" && "border border-foreground/15 text-foreground/70",
                pay.tone === "pending" && "border border-amber-700/30 text-amber-800",
                pay.tone === "failed" && "border border-[color:var(--maroon)]/30 text-[color:var(--maroon)]",
              )}
            >
              {pay.label}
            </span>
            <span className="eyebrow border border-foreground/10 px-2 py-1 text-[8px] tracking-[0.14em] text-foreground/55">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <OrderStatusTracker order={order} />
      </div>

      <ul className="mt-6 space-y-4 border-t border-foreground/10 pt-5">
        {order.items.map((item, i) => (
          <li key={`${item.productId}-${i}`} className="flex gap-4">
            {item.imageUrl ? (
              <img
                src={resolveMediaUrl(item.imageUrl) ?? ""}
                alt=""
                className="size-16 object-cover bg-muted"
              />
            ) : (
              <div className="size-16 bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              {item.slug ? (
                <Link
                  to="/product/$id"
                  params={{ id: item.slug }}
                  className="font-serif text-sm hover:text-[color:var(--maroon)]"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="font-serif text-sm">{item.name}</p>
              )}
              <p className="mt-1 text-xs text-foreground/50">
                Qty {item.quantity}
                {item.size ? ` · Size ${item.size}` : ""}
                {item.color ? ` · ${item.color}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">{formatInr(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-6 border-t border-foreground/10 pt-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow text-[9px] text-foreground/45">Ship to</p>
          <p className="mt-2 text-sm leading-relaxed">
            {order.shippingAddress.name}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.pincode}
          </p>
        </div>
        <div className="space-y-1 text-sm sm:text-right">
          <p className="flex justify-between sm:justify-end sm:gap-8">
            <span className="text-foreground/50">Subtotal</span>
            <span className="tabular-nums">{formatInr(order.subtotal)}</span>
          </p>
          {showCodFee ? (
            <p className="flex justify-between sm:justify-end sm:gap-8">
              <span className="text-foreground/50">COD fee</span>
              <span className="tabular-nums">{formatInr(order.shippingFee)}</span>
            </p>
          ) : order.shippingFee > 0 ? (
            <p className="flex justify-between sm:justify-end sm:gap-8">
              <span className="text-foreground/50">Shipping</span>
              <span className="tabular-nums">{formatInr(order.shippingFee)}</span>
            </p>
          ) : null}
          <p className="flex justify-between font-serif text-base sm:justify-end sm:gap-8">
            <span>Total</span>
            <span className="tabular-nums">{formatInr(order.total)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {waitingPay ? (
          <Button
            type="button"
            className="rounded-none h-10 eyebrow text-[9px] tracking-[0.16em] bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)]"
            onClick={payNow}
            disabled={paying}
          >
            {paying ? "Opening…" : "Pay now"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="rounded-none h-10 eyebrow text-[9px] tracking-[0.16em]"
          onClick={reorder}
          disabled={reordering}
        >
          {reordering ? "Adding…" : "Order again"}
        </Button>
        <Button asChild variant="outline" className="rounded-none h-10 eyebrow text-[9px] tracking-[0.16em]">
          <a href={`/orders/${order.id}/invoice`} target="_blank" rel="noreferrer">
            Invoice PDF
          </a>
        </Button>
        {order.canCancel ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-none h-10 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--maroon)]"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
        ) : null}
        {RETURNS_ENABLED && order.canReturn ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-none h-10 eyebrow text-[9px] tracking-[0.16em]"
            onClick={() => setReturnOpen(true)}
          >
            Request return
          </Button>
        ) : null}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif italic">Cancel {order.orderNumber}</DialogTitle>
            <DialogDescription className="text-sm">
              {order.cancelInstant
                ? "Within about 30 minutes and still confirmed — this cancel is instant."
                : "This will be sent as a request for the atelier to review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="eyebrow text-[9px]">Reason</Label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name={`cancel-${order.id}`}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <Label className="eyebrow text-[9px]">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-none min-h-20"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-none" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button
              className="rounded-none bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
              onClick={submitCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "Sending…" : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {RETURNS_ENABLED ? (
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif italic">Return {order.orderNumber}</DialogTitle>
            <DialogDescription className="text-sm">
              Returns can be requested within 7 days of delivery. The atelier will review and arrange pickup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="eyebrow text-[9px]">Reason</Label>
            <div className="space-y-2">
              {RETURN_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name={`return-${order.id}`}
                    checked={returnReason === r.value}
                    onChange={() => setReturnReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <Label className="eyebrow text-[9px]">Note (optional)</Label>
            <Textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              className="rounded-none min-h-20"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-none" onClick={() => setReturnOpen(false)}>
              Keep order
            </Button>
            <Button
              className="rounded-none bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
              onClick={submitReturn}
              disabled={requestReturn.isPending}
            >
              {requestReturn.isPending ? "Sending…" : "Request return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}
    </article>
  );
}
