import { cn } from "@/lib/utils";
import { couponHeadline, couponShortRule, type CouponDesign, type StoreCoupon } from "@/lib/coupons";

const DESIGNS: Record<
  CouponDesign,
  { wrap: string; notch: string; code: string; accent: string }
> = {
  maroon: {
    wrap: "bg-[color:var(--maroon)] text-[color:var(--ivory)]",
    notch: "bg-[color:var(--ivory)]",
    code: "bg-black/20",
    accent: "border-white/25",
  },
  gold: {
    wrap: "bg-[color:var(--gold)] text-[color:var(--charcoal)]",
    notch: "bg-[color:var(--ivory)]",
    code: "bg-black/10",
    accent: "border-[color:var(--charcoal)]/15",
  },
  charcoal: {
    wrap: "bg-[color:var(--charcoal)] text-[color:var(--ivory)]",
    notch: "bg-[color:var(--ivory)]",
    code: "bg-white/10",
    accent: "border-white/15",
  },
  festive: {
    wrap: "bg-[linear-gradient(120deg,var(--maroon)_0%,var(--maroon)_58%,var(--gold)_58%,var(--gold)_100%)] text-white",
    notch: "bg-[color:var(--ivory)]",
    code: "bg-black/20",
    accent: "border-white/20",
  },
  ivory: {
    wrap: "bg-[color:var(--ivory)] text-[color:var(--charcoal)] border border-dashed border-[color:var(--maroon)]",
    notch: "bg-white",
    code: "bg-[color:var(--maroon)]/10 text-[color:var(--maroon)]",
    accent: "border-[color:var(--maroon)]/20",
  },
};

export function CouponTicket({
  coupon,
  compact = false,
  size,
  onSelect,
  selected = false,
}: {
  coupon: Pick<
    StoreCoupon,
    "code" | "title" | "description" | "type" | "value" | "minOrder" | "maxDiscount" | "autoApply" | "design"
  >;
  compact?: boolean;
  size?: "full" | "compact" | "micro";
  onSelect?: () => void;
  selected?: boolean;
}) {
  const scale = size ?? (compact ? "compact" : "full");
  const design = DESIGNS[coupon.design] ?? DESIGNS.maroon;
  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        design.wrap,
        selected && "ring-2 ring-[color:var(--gold)] ring-offset-2",
        scale === "micro" ? "px-2.5 py-1.5" : scale === "compact" ? "px-3 py-2.5" : "px-4 py-3.5",
      )}
    >
      <span className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full", design.notch, scale === "micro" ? "size-3" : "size-4")} />
      <span className={cn("absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full", design.notch, scale === "micro" ? "size-3" : "size-4")} />
      <div className="flex items-center justify-between gap-2 pl-1 pr-1">
        <div className="min-w-0">
          <p className={cn("font-serif leading-none", scale === "full" ? "text-2xl" : scale === "compact" ? "text-lg" : "text-sm")}>
            {couponHeadline(coupon as StoreCoupon)}
          </p>
          {scale !== "micro" ? (
            <p className={cn("mt-1 truncate", scale === "compact" ? "text-[10px] opacity-80" : "text-xs opacity-85")}>
              {coupon.title || coupon.code}
            </p>
          ) : null}
          {scale === "full" && coupon.description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] opacity-75">{coupon.description}</p>
          ) : null}
          {scale !== "micro" ? (
            <p className={cn("mt-1 opacity-70", scale === "compact" ? "text-[9px]" : "text-[10px]")}>
              {couponShortRule(coupon as StoreCoupon)}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md font-mono font-semibold tracking-[0.14em]",
            design.code,
            scale === "micro" ? "px-1.5 py-0.5 text-[9px]" : scale === "compact" ? "px-2 py-1 text-[10px]" : "px-2 py-1 text-xs",
          )}
        >
          {coupon.code}
        </span>
      </div>
      {scale !== "micro" ? <div className={cn("mt-2 border-t border-dashed", design.accent)} /> : null}
    </div>
  );

  if (!onSelect) return inner;
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      {inner}
    </button>
  );
}
