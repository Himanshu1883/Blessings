import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { format } = useCurrency();

  if (isLoading || ordersLoading) {
    return <div className="min-h-[40vh] flex items-center justify-center eyebrow text-[10px]">Loading orders…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="font-serif italic text-3xl mb-4">Your orders</h1>
        <p className="text-sm text-foreground/60">Sign in to view order history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="font-serif italic text-3xl sm:text-4xl mb-10">Order history</h1>
      {orders.length === 0 ? (
        <p className="text-foreground/60">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-foreground/10 p-5 hover:border-foreground/25 transition-colors">
              <Link to="/orders/$id" params={{ id: order.id }} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-lg">{order.orderNumber}</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif tabular-nums">{format(order.total)}</p>
                  <p className="eyebrow text-[9px] mt-1 capitalize">{order.orderStatus}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
