import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, PartyPopper, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { RequireAuth } from "@/lib/require-auth";
import { clearOrderSuccess } from "@/lib/checkout-success";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>): { order?: string } => ({
    ...(typeof search.order === "string" ? { order: search.order } : {}),
  }),
  head: () =>
    seoHead({
      title: "Order confirmed",
      description: "Thank you for your order at Blessings The Men's Boutique.",
      path: "/checkout/success",
      noindex: true,
    }),
  component: CheckoutSuccessRoute,
});

function CheckoutSuccessRoute() {
  const { order: orderId } = Route.useSearch();
  return (
    <RequireAuth from="/profile">
      <CheckoutSuccessPage orderId={orderId} />
    </RequireAuth>
  );
}

function CheckoutSuccessPage({ orderId }: { orderId?: string }) {
  const { data: order, isLoading } = useOrder(orderId ?? "");
  const { formatInr } = useCurrency();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  if (!orderId) {
    return <Navigate to="/profile" hash="orders" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">Loading…</div>
    );
  }

  const orderRef = order?.orderNumber || orderId;
  const paid = order?.paymentStatus === "paid" || order?.paymentMethod === "cod";

  return (
    <div className="bg-[color:var(--ivory)]">
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:py-28">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[color:var(--maroon)] text-[color:var(--ivory)]">
          <PartyPopper className="size-7" strokeWidth={1.6} />
        </span>
        <p className="eyebrow mt-6 text-[10px] tracking-[0.28em] text-[color:var(--gold)]">Order confirmed</p>
        <h1 className="profile-display mt-3 text-5xl italic text-[color:var(--maroon)] sm:text-6xl">Hurray!</h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/60">
          Your order is in. We are preparing your piece at the atelier.
        </p>
        <div className="mt-8 rounded-2xl border border-foreground/8 bg-white px-6 py-5 shadow-[0_10px_32px_rgba(40,16,10,0.05)]">
          <p className="eyebrow text-[9px] text-foreground/40">Order ID</p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{orderRef}</p>
          {order ? (
            <p className="mt-2 text-sm tabular-nums text-foreground/55">{formatInr(order.total)}</p>
          ) : null}
          {order && !paid ? (
            <p className="mt-3 text-sm text-amber-800">
              Payment is still confirming. You can follow it under Your orders.
            </p>
          ) : null}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="min-w-44 rounded-full bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
          >
            <Link to="/profile" hash="orders" onClick={clearOrderSuccess}>
              Your orders
              <ArrowRight className="ml-1.5 size-4" strokeWidth={1.75} />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-w-44 rounded-full">
            <Link to="/shop/$category" params={{ category: "sherwanis" }} onClick={clearOrderSuccess}>
              <ShoppingBag className="mr-1.5 size-4" strokeWidth={1.6} />
              Shop more
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
