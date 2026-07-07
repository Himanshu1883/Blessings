import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useCart, useCreateOrder } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { api, resolveMediaUrl } from "@/lib/api-client";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    return {};
  },
  component: CheckoutPage,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: cart } = useCart();
  const { format } = useCurrency();
  const createOrder = useCreateOrder();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [submitting, setSubmitting] = useState(false);

  const defaultAddress = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0];
  const [form, setForm] = useState({
    name: defaultAddress?.name ?? user?.name ?? "",
    line1: defaultAddress?.line1 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    pincode: defaultAddress?.pincode ?? "",
    phone: defaultAddress?.phone ?? user?.phone ?? "",
  });

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="font-serif italic text-3xl mb-4">Checkout</h1>
        <p className="text-sm text-foreground/60 mb-8">Please sign in to complete your order.</p>
        <Button asChild className="rounded-none">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    );
  }

  if (!cart?.lines.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="font-serif italic text-3xl mb-4">Your bag is empty</h1>
        <Button asChild className="rounded-none mt-6">
          <Link to="/shop/$category" params={{ category: "sherwanis" }}>Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        shippingAddress: { ...form, isDefault: false },
        paymentMethod,
      });

      if (paymentMethod === "cod") {
        toast.success("Order placed successfully.");
        window.location.href = `/orders/${order.id}`;
        return;
      }

      const rz = await api.post<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>(`/api/orders/${order.id}/razorpay`);

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error("Payment gateway failed to load.");
        return;
      }

      const rzp = new window.Razorpay({
        key: rz.keyId,
        amount: rz.amount,
        currency: rz.currency,
        name: "Blessings",
        description: order.orderNumber,
        order_id: rz.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await api.post(`/api/orders/${order.id}/verify`, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success("Payment successful.");
          window.location.href = `/orders/${order.id}`;
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="font-serif italic text-3xl sm:text-4xl mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {(["name", "line1", "city", "state", "pincode", "phone"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label className="eyebrow text-[10px] capitalize">{field === "line1" ? "Address" : field}</Label>
              <Input
                required
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="rounded-none"
              />
            </div>
          ))}

          <div className="pt-4 space-y-3">
            <p className="eyebrow text-[10px]">Payment method</p>
            <label className="flex items-center gap-3 border border-foreground/15 p-4 cursor-pointer">
              <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <span className="text-sm">Cash on Delivery</span>
            </label>
            <label className="flex items-center gap-3 border border-foreground/15 p-4 cursor-pointer">
              <input type="radio" name="pay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
              <span className="text-sm">Pay online (Razorpay)</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] h-12 eyebrow text-[10px] tracking-[0.2em]"
          >
            {submitting ? "Processing…" : "Place order"}
          </Button>
        </form>
      </div>

      <div className="border border-foreground/10 p-6 h-fit">
        <h2 className="font-serif italic text-xl mb-6">Order summary</h2>
        <ul className="space-y-4 mb-6">
          {cart.lines.map(({ line, product }) => (
            <li key={`${product.id}-${line.size}`} className="flex gap-4">
              <img src={resolveMediaUrl(product.imageUrl) ?? ""} alt="" className="size-16 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm line-clamp-2">{product.name}</p>
                <p className="text-xs text-foreground/50">Size {line.size} × {line.quantity}</p>
              </div>
              <p className="text-sm tabular-nums">{format(product.price * line.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-foreground/10 pt-4 font-serif text-lg">
          <span>Total</span>
          <span className="tabular-nums">{format(cart.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
