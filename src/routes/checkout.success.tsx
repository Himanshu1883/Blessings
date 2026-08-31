import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useOrder } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { loginSearch } from "@/lib/login-search";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>): { order?: string } => ({
    ...(typeof search.order === "string" ? { order: search.order } : {}),
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { order: orderId } = Route.useSearch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: order, isLoading } = useOrder(orderId ?? "");
  const { formatInr } = useCurrency();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  if (authLoading || (orderId && isLoading)) {
    return <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="font-serif italic text-3xl mb-4">Thank you</h1>
        <p className="text-sm text-foreground/60 mb-8">Sign in to see your order.</p>
        <Button asChild className="rounded-none">
          <Link to="/login" search={loginSearch("/profile")}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  const paid = order?.paymentStatus === "paid" || order?.paymentMethod === "cod";

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="eyebrow text-[10px] tracking-[0.2em] text-foreground/45 mb-4">Order placed</p>
      <h1 className="font-serif italic text-3xl sm:text-4xl mb-4">Thank you</h1>
      {order ? (
        <>
          <p className="text-sm text-foreground/60">{order.orderNumber}</p>
          <p className="mt-3 font-serif text-2xl tabular-nums">{formatInr(order.total)}</p>
          <p className="mt-2 text-[11px] text-foreground/45">Charged in Indian Rupees</p>
          {!paid ? (
            <p className="mt-4 text-sm text-amber-800">
              Payment is still confirming. Refresh in a moment, or check Your orders.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-foreground/60">Your order is confirmed.</p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button asChild className="rounded-none min-w-40">
          <Link to="/profile" hash="orders">
            Your orders
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none min-w-40">
          <Link to="/shop/$category" params={{ category: "sherwanis" }}>
            Continue shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
