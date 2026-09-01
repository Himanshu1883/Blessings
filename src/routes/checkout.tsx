import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CreditCard,
  Headset,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { resolveMediaUrl } from "@/lib/api-client";
import { useCart, useCreateOrder, useOrders, useQuoteCoupon } from "@/lib/api-hooks";
import { CheckoutCoupons } from "@/components/site/checkout-coupons";
import { readCheckoutCoupon, writeCheckoutCoupon } from "@/lib/coupons";
import { readCheckoutAddress } from "@/lib/checkout-address";
import { useCurrency } from "@/lib/currency";
import { RequireAuth } from "@/lib/require-auth";
import { markOrderSuccess } from "@/lib/checkout-success";
import { seoHead } from "@/lib/seo";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import {
  STORE_EMAIL,
  STORE_LANDLINE,
  STORE_LANDLINE_DISPLAY,
  RETURNS_ENABLED,
} from "@/lib/store-contact";
import { cn } from "@/lib/utils";
import {
  CheckoutDismissedError,
  checkoutPrefill,
  payWithRazorpay,
  replaceWithThankYou,
} from "@/lib/razorpay-checkout";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const SUPPORT_EMAIL = STORE_EMAIL;

const fieldClass =
  "h-11 rounded-lg border-foreground/12 bg-[color:var(--ivory)]/70 shadow-none focus-visible:ring-[color:var(--gold)]";

export const Route = createFileRoute("/checkout")({
  head: () => {
    const seo = seoHead({
      title: "Checkout",
      description: "Secure checkout at Blessings The Men's Boutique.",
      path: "/checkout",
      noindex: true,
    });
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap",
        },
      ],
    };
  },
  component: function CheckoutRoute() {
    const childMatches = useChildMatches();
    if (childMatches.length > 0) {
      return <Outlet />;
    }
    return (
      <RequireAuth from="/checkout">
        <CheckoutPage />
      </RequireAuth>
    );
  },
});

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--ivory)] text-[color:var(--gold)]">
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-[12px] font-medium text-foreground/70">
      {children}
      <span className="text-[color:var(--maroon)]"> *</span>
    </Label>
  );
}

function CheckoutPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: cart } = useCart();
  const { data: orders = [] } = useOrders();
  const { format, currency, info } = useCurrency();
  const createOrder = useCreateOrder();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [skipCoupon, setSkipCoupon] = useState(false);

  const lastOrder = orders[0];
  const primed = useRef(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: user?.phone ?? "",
  });

  useEffect(() => {
    const stored = readCheckoutCoupon();
    if (stored) {
      setAppliedCode(stored);
      setSkipCoupon(false);
    }
  }, []);

  const quoteQuery = useQuoteCoupon({
    code: skipCoupon ? null : appliedCode,
    skipAuto: skipCoupon,
    enabled: isAuthenticated && !!cart?.lines.length,
  });

  useEffect(() => {
    if (primed.current) return;
    const stored = readCheckoutAddress();
    if (stored) {
      setForm({
        name: stored.name,
        line1: stored.line1,
        city: stored.city,
        state: stored.state,
        pincode: stored.pincode,
        phone: stored.phone,
      });
      primed.current = true;
      return;
    }
    if (lastOrder?.shippingAddress) {
      const fromOrder = lastOrder.shippingAddress;
      setForm({
        name: fromOrder.name,
        line1: fromOrder.line1,
        city: fromOrder.city,
        state: fromOrder.state,
        pincode: fromOrder.pincode,
        phone: fromOrder.phone,
      });
      primed.current = true;
      return;
    }
    if (user && orders.length === 0) {
      setForm((f) => ({
        ...f,
        name: user.name || f.name,
        phone: user.phone || f.phone,
      }));
    }
  }, [lastOrder, user, orders.length]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">Loading…</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!cart?.lines.length) {
    return (
      <div className="bg-[color:var(--ivory)] px-4 py-24">
        <div className="mx-auto max-w-lg rounded-2xl bg-white px-8 py-12 text-center shadow-[0_10px_32px_rgba(40,16,10,0.06)]">
          <h1 className="profile-display text-3xl italic">Your bag is empty</h1>
          <Button asChild className="mt-8 rounded-full bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90">
            <Link to="/shop/$category" params={{ category: "sherwanis" }}>
              Continue shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const quote = quoteQuery.data;
  const discount = quote?.ok ? quote.discount : 0;
  const payable = Math.max(0, cart.subtotal - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        shippingAddress: { ...form },
        paymentMethod,
        couponCode: skipCoupon ? null : quoteQuery.data?.coupon?.code ?? appliedCode,
        skipCoupon,
      });

      if (paymentMethod === "cod") {
        writeCheckoutCoupon(null);
        markOrderSuccess(order.id);
        window.location.replace(`/checkout/success?order=${encodeURIComponent(order.id)}`);
        return;
      }

      if (!order.razorpay) {
        toast.error("Online payments are not configured.");
        return;
      }

      try {
        await payWithRazorpay({
          session: order.razorpay,
          prefill: checkoutPrefill(user ?? {}, form),
          description: order.orderNumber,
        });
        replaceWithThankYou(order.id);
        writeCheckoutCoupon(null);
      } catch (payErr) {
        if (payErr instanceof CheckoutDismissedError) {
          toast.message("Payment not completed. Your order is waiting — no stock was taken.");
          return;
        }
        throw payErr;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const states = form.state && !INDIAN_STATES.includes(form.state) ? [form.state, ...INDIAN_STATES] : INDIAN_STATES;

  return (
    <div className="bg-[color:var(--ivory)]">
      <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="profile-display text-4xl italic sm:text-5xl">Checkout</h1>
            <p className="mt-2 text-sm text-foreground/50">
              Please fill in your details to complete your order.
            </p>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/45">
            <Lock className="size-3.5" strokeWidth={1.6} />
            Secure Checkout
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="space-y-6">
            <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_10px_32px_rgba(40,16,10,0.05)] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <SectionIcon>
                  <User className="size-4" strokeWidth={1.6} />
                </SectionIcon>
                <h2 className="profile-display text-2xl italic">Delivery details</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Address</FieldLabel>
                  <Input
                    required
                    placeholder="House no., Building, Street, Area"
                    value={form.line1}
                    onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>City</FieldLabel>
                    <Input
                      required
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>State</FieldLabel>
                    <select
                      required
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      className={cn(fieldClass, "w-full appearance-auto border px-3 text-sm")}
                    >
                      <option value="" disabled>
                        Select state
                      </option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Pincode</FieldLabel>
                    <Input
                      required
                      inputMode="numeric"
                      value={form.pincode}
                      onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Phone</FieldLabel>
                    <Input
                      required
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_10px_32px_rgba(40,16,10,0.05)] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <SectionIcon>
                  <CreditCard className="size-4" strokeWidth={1.6} />
                </SectionIcon>
                <h2 className="profile-display text-2xl italic">Payment method</h2>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                    paymentMethod === "cod"
                      ? "border-[color:var(--maroon)] bg-[color:var(--maroon)]/[0.03]"
                      : "border-foreground/12 hover:border-foreground/25",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      paymentMethod === "cod"
                        ? "border-[color:var(--maroon)]"
                        : "border-foreground/30",
                    )}
                  >
                    {paymentMethod === "cod" ? (
                      <span className="size-2 rounded-full bg-[color:var(--maroon)]" />
                    ) : null}
                  </span>
                  <Banknote className="mt-0.5 size-4 shrink-0 text-foreground/45" strokeWidth={1.5} />
                  <span>
                    <span className="block text-sm font-medium">Cash on Delivery</span>
                    <span className="mt-0.5 block text-xs text-foreground/50">
                      Pay in cash when your order is delivered.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                    paymentMethod === "razorpay"
                      ? "border-[color:var(--maroon)] bg-[color:var(--maroon)]/[0.03]"
                      : "border-foreground/12 hover:border-foreground/25",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      paymentMethod === "razorpay"
                        ? "border-[color:var(--maroon)]"
                        : "border-foreground/30",
                    )}
                  >
                    {paymentMethod === "razorpay" ? (
                      <span className="size-2 rounded-full bg-[color:var(--maroon)]" />
                    ) : null}
                  </span>
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-foreground/45" strokeWidth={1.5} />
                  <span>
                    <span className="block text-sm font-medium">Pay online (Razorpay)</span>
                    <span className="mt-0.5 block text-xs text-foreground/50">
                      Pay securely using cards, UPI, net banking and more.
                    </span>
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex h-12 w-full items-center justify-between rounded-lg bg-[color:var(--maroon)] px-5 text-[12px] tracking-[0.22em] text-white transition-colors hover:bg-[color:var(--maroon)]/90 disabled:opacity-60"
              >
                <span>{submitting ? "PROCESSING…" : "PLACE ORDER"}</span>
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-foreground/45">
                <ShieldCheck className="size-3.5" strokeWidth={1.6} />
                Your information is safe and secure with us.
              </p>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-[calc(var(--header-height)+1.25rem)]">
            <CheckoutCoupons
              lines={cart.lines}
              quote={quote}
              quoting={quoteQuery.isFetching}
              appliedCode={appliedCode}
              onApply={(code) => {
                setAppliedCode(code);
                setSkipCoupon(false);
              }}
              onClear={() => {
                setAppliedCode(null);
                setSkipCoupon(true);
              }}
            />
            <section className="overflow-hidden rounded-2xl border border-foreground/8 bg-white shadow-[0_10px_32px_rgba(40,16,10,0.05)]">
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <SectionIcon>
                    <ShoppingBag className="size-4" strokeWidth={1.6} />
                  </SectionIcon>
                  <h2 className="profile-display text-2xl italic">Order summary</h2>
                </div>
                <ul className="space-y-4">
                  {cart.lines.map(({ line, product }) => (
                    <li key={`${product.id}-${line.size}`} className="flex gap-3">
                      <img
                        src={resolveMediaUrl(product.imageUrl) ?? ""}
                        alt=""
                        className="size-14 shrink-0 rounded-md object-cover bg-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm">{product.name}</p>
                        <p className="mt-0.5 text-xs text-foreground/45">
                          Size {line.size} x {line.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm tabular-nums">{format(product.price * line.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 space-y-2 border-t border-dashed border-foreground/15 pt-4 text-sm">
                  <div className="flex justify-between text-foreground/60">
                    <span>Subtotal</span>
                    <span className="tabular-nums text-foreground">{format(cart.subtotal)}</span>
                  </div>
                  {discount > 0 && quote?.coupon ? (
                    <div className="flex justify-between text-emerald-800">
                      <span>Coupon ({quote.coupon.code})</span>
                      <span className="tabular-nums">−{format(discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-foreground/60">
                    <span>Shipping</span>
                    <span className="text-emerald-800">Free</span>
                  </div>
                  <div className="flex justify-between pt-1 font-medium">
                    <span className="profile-display text-xl italic">Total</span>
                    <span className="profile-display text-xl tabular-nums italic">{format(payable)}</span>
                  </div>
                  {currency !== "INR" ? (
                    <p className="pt-1 text-[11px] leading-relaxed text-foreground/45">
                      Shown in {info.label}. You will be charged in Indian Rupees.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-foreground/10 border-t border-foreground/8 bg-[color:var(--ivory)] px-2 py-3 text-center text-[9px] leading-snug tracking-[0.04em] text-foreground/55 sm:text-[10px]">
                <p className="flex flex-col items-center gap-1 px-1">
                  <Lock className="size-3.5 text-[color:var(--gold)]" strokeWidth={1.6} />
                  100% Secure Payments
                </p>
                {RETURNS_ENABLED ? (
                  <p className="flex flex-col items-center gap-1 px-1">
                    <RotateCcw className="size-3.5 text-[color:var(--gold)]" strokeWidth={1.6} />
                    Easy Returns
                  </p>
                ) : (
                  <p className="flex flex-col items-center gap-1 px-1">
                    <BadgeCheck className="size-3.5 text-[color:var(--gold)]" strokeWidth={1.6} />
                    Atelier Quality
                  </p>
                )}
                <p className="flex flex-col items-center gap-1 px-1">
                  <BadgeCheck className="size-3.5 text-[color:var(--gold)]" strokeWidth={1.6} />
                  Genuine Products
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_10px_32px_rgba(40,16,10,0.05)]">
              <div className="flex items-start gap-3">
                <SectionIcon>
                  <Headset className="size-4" strokeWidth={1.6} />
                </SectionIcon>
                <div className="min-w-0 flex-1">
                  <h3 className="profile-display text-xl italic">Need help?</h3>
                  <p className="mt-1 text-xs text-foreground/50">Our support team is here to help you.</p>
                  <p className="mt-3 text-right text-sm">
                    <a href={`tel:${WHATSAPP_DISPLAY.replace(/\s/g, "")}`} className="block hover:text-[color:var(--maroon)]">
                      {WHATSAPP_DISPLAY}
                    </a>
                    <a href={`tel:${STORE_LANDLINE}`} className="mt-0.5 block hover:text-[color:var(--maroon)]">
                      {STORE_LANDLINE_DISPLAY}
                    </a>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-0.5 block text-foreground/60 hover:text-[color:var(--maroon)]">
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}
