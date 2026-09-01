import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveCoupons } from "@/lib/coupons-context";
import {
  couponAppliesToProduct,
  couponHeadline,
  couponShortRule,
  writeCheckoutCoupon,
  type CouponQuote,
  type StoreCoupon,
} from "@/lib/coupons";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function CheckoutCoupons({
  lines,
  quote,
  quoting,
  appliedCode,
  onApply,
  onClear,
}: {
  lines: Array<{ product: { mongoId?: string; id?: string; categorySlug?: string | null } }>;
  quote: CouponQuote | undefined;
  quoting: boolean;
  appliedCode: string | null;
  onApply: (code: string) => void;
  onClear: () => void;
}) {
  const { format } = useCurrency();
  const coupons = useActiveCoupons();
  const [draft, setDraft] = useState("");

  const visible = useMemo(() => {
    return coupons.filter((coupon) =>
      lines.some(({ product }) => couponAppliesToProduct(coupon, product)),
    );
  }, [coupons, lines]);

  const submit = (code: string) => {
    const next = code.trim().toUpperCase();
    if (!next) {
      toast.error("Enter a coupon code");
      return;
    }
    writeCheckoutCoupon(next);
    onApply(next);
  };

  return (
    <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_10px_32px_rgba(40,16,10,0.05)] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <TicketPercent className="size-4 text-[color:var(--gold)]" strokeWidth={1.6} />
        <h2 className="profile-display text-2xl italic">Coupons</h2>
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="h-11 rounded-lg border-foreground/12 bg-[color:var(--ivory)]/70 uppercase tracking-[0.12em]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(draft);
            }
          }}
        />
        <Button
          type="button"
          className="h-11 rounded-lg bg-[color:var(--charcoal)] px-5 eyebrow text-[10px] tracking-[0.16em] hover:bg-[color:var(--maroon)]"
          disabled={quoting}
          onClick={() => submit(draft)}
        >
          Apply
        </Button>
      </div>

      {quote?.ok && quote.coupon ? (
        <div className="mt-4 rounded-xl border border-emerald-800/20 bg-emerald-50/60 p-3">
          <p className="text-sm text-emerald-900">
            {quote.coupon.code} applied · you save {format(quote.discount)}
            {quote.autoApplied ? " (auto-applied)" : ""}
          </p>
          <button
            type="button"
            className="mt-1 text-[11px] text-emerald-900/70 underline underline-offset-2"
            onClick={() => {
              writeCheckoutCoupon(null);
              onClear();
            }}
          >
            Remove coupon
          </button>
        </div>
      ) : quote && !quote.ok && appliedCode ? (
        <p className="mt-3 text-[12px] text-[color:var(--maroon)]">{quote.message}</p>
      ) : null}

      {visible.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="eyebrow text-[9px] text-foreground/45">Available on this bag</p>
          {visible.map((coupon: StoreCoupon) => {
            const selected = quote?.coupon?.code === coupon.code;
            return (
              <button
                key={coupon.id}
                type="button"
                onClick={() => {
                  setDraft(coupon.code);
                  submit(coupon.code);
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left",
                  selected
                    ? "border-[color:var(--maroon)] bg-[color:var(--maroon)]/[0.04]"
                    : "border-foreground/12 hover:border-foreground/25",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{couponHeadline(coupon)}</span>
                  <span className="mt-0.5 block text-[11px] text-foreground/55">
                    {coupon.title || coupon.code} · {couponShortRule(coupon)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-[color:var(--maroon)]">
                  {coupon.code}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-foreground/45">
          Have a private code? Enter it above. Public offers appear here when they match your bag.
        </p>
      )}
    </section>
  );
}
