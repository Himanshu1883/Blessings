import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOrder } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { resolveMediaUrl } from "@/lib/api-client";
import { RequireAuth } from "@/lib/require-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/orders/$id/invoice")({
  component: function OrderInvoiceRoute() {
    const { id } = Route.useParams();
    return (
      <RequireAuth from={`/orders/${id}/invoice`}>
        <OrderInvoicePage />
      </RequireAuth>
    );
  },
});

function OrderInvoicePage() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useOrder(id);
  const { formatInr } = useCurrency();

  useEffect(() => {
    document.title = order ? `Invoice ${order.orderNumber}` : "Invoice";
  }, [order]);

  if (isLoading) {
    return <div className="py-24 text-center eyebrow text-[10px]">Loading invoice…</div>;
  }

  if (!order) {
    return <div className="py-24 text-center">Invoice not found.</div>;
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12 print:px-0 print:py-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link to="/profile" className="eyebrow text-[10px] text-foreground/50 hover:text-foreground">
          ← Profile
        </Link>
        <Button type="button" className="rounded-none" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <article className="border border-foreground/15 p-8 print:border-0">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif italic text-3xl">Blessings</p>
            <p className="mt-2 text-xs text-foreground/50">Men&apos;s couture</p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-[10px]">Invoice</p>
            <p className="mt-1 font-serif text-xl">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-foreground/50">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 text-sm">
          <div>
            <p className="eyebrow text-[9px] text-foreground/45">Bill / ship to</p>
            <p className="mt-2 leading-relaxed">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow text-[9px] text-foreground/45">Payment</p>
            <p className="mt-2 capitalize">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"} · {order.paymentStatus}
            </p>
            <p className="mt-1 capitalize text-foreground/55">{order.orderStatus.replace(/_/g, " ")}</p>
          </div>
        </div>

        <table className="mt-10 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/15">
              <th className="py-2 font-normal eyebrow text-[9px]">Item</th>
              <th className="py-2 font-normal eyebrow text-[9px]">Qty</th>
              <th className="py-2 font-normal eyebrow text-[9px] text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-foreground/8">
                <td className="py-3">
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <img src={resolveMediaUrl(item.imageUrl) ?? ""} alt="" className="size-12 object-cover print:hidden" />
                    ) : null}
                    <div>
                      <p>{item.name}</p>
                      <p className="text-xs text-foreground/45">
                        Size {item.size}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatInr(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-foreground/50">Subtotal</span>
            <span className="tabular-nums">{formatInr(order.subtotal)}</span>
          </p>
          {order.shippingFee > 0 ? (
            <p className="flex justify-between">
              <span className="text-foreground/50">
                {order.paymentMethod === "cod" ? "COD fee" : "Shipping"}
              </span>
              <span className="tabular-nums">{formatInr(order.shippingFee)}</span>
            </p>
          ) : null}
          {(order.discount ?? 0) > 0 ? (
            <p className="flex justify-between">
              <span className="text-foreground/50">
                Coupon{order.couponCode ? ` (${order.couponCode})` : ""}
              </span>
              <span className="tabular-nums">−{formatInr(order.discount ?? 0)}</span>
            </p>
          ) : null}
          <p className="flex justify-between border-t border-foreground/15 pt-2 font-serif text-lg">
            <span>Total</span>
            <span className="tabular-nums">{formatInr(order.total)}</span>
          </p>
        </div>
      </article>
    </div>
  );
}
