import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrder } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { resolveMediaUrl } from "@/lib/api-client";
import { RequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/orders/$id")({
  component: function OrderDetailRoute() {
    const { id } = Route.useParams();
    return (
      <RequireAuth from={`/orders/${id}`}>
        <OrderDetailPage />
      </RequireAuth>
    );
  },
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useOrder(id);
  const { formatInr } = useCurrency();

  if (isLoading || !order) {
    return <div className="py-24 text-center eyebrow text-[10px]">Loading…</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link to="/profile" hash="orders" className="eyebrow text-[10px] text-foreground/50 hover:text-foreground mb-6 inline-block">
        ← Your orders
      </Link>
      <h1 className="font-serif italic text-3xl">{order.orderNumber}</h1>
      <p className="mt-2 text-sm text-foreground/60 capitalize">
        {order.orderStatus} · {order.paymentMethod} · {order.paymentStatus}
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="eyebrow text-[10px] mb-4">Items</h2>
          <ul className="space-y-4">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-4">
                {item.imageUrl && (
                  <img src={resolveMediaUrl(item.imageUrl) ?? ""} alt="" className="size-16 object-cover" />
                )}
                <div>
                  <p className="font-serif">{item.name}</p>
                  <p className="text-xs text-foreground/50">Size {item.size} × {item.quantity}</p>
                  <p className="text-sm mt-1 tabular-nums">{formatInr(item.lineTotal)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow text-[10px] mb-4">Shipping</h2>
          <p className="text-sm leading-relaxed">
            {order.shippingAddress.name}<br />
            {order.shippingAddress.line1}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
            {order.shippingAddress.phone}
          </p>
          <div className="mt-8 border-t border-foreground/10 pt-6">
            <div className="flex justify-between font-serif text-xl">
              <span>Total</span>
              <span className="tabular-nums">{formatInr(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
