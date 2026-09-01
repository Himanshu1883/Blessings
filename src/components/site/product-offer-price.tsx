import { useCurrency } from "@/lib/currency";
import { useProductOffer } from "@/lib/coupons-context";
import { cn } from "@/lib/utils";

export function ProductOfferPrice({
  product,
  className,
  size = "md",
  showHint = true,
  align = "start",
}: {
  product: { mongoId?: string; id?: string; categorySlug?: string | null; price: number };
  className?: string;
  size?: "sm" | "md" | "lg" | "card";
  showHint?: boolean;
  align?: "start" | "end";
}) {
  const { format } = useCurrency();
  const offer = useProductOffer(product);
  const sale = offer && offer.discount > 0 ? Math.max(0, product.price - offer.discount) : null;

  return (
    <div className={cn("min-w-0", align === "end" && "text-right", className)}>
      {sale != null ? (
        <div
          className={cn(
            "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
            align === "end" && "justify-end",
          )}
        >
          <span
            className={cn(
              "tabular-nums text-foreground/40 line-through decoration-[color:var(--maroon)]/70",
              size === "lg" && "text-base",
              size === "card" && "text-xs lg:text-sm",
              size === "md" && "text-sm",
              size === "sm" && "text-[11px]",
            )}
          >
            {format(product.price)}
          </span>
          <span
            className={cn(
              "profile-display tabular-nums text-[color:var(--maroon)]",
              size === "lg" && "text-2xl",
              size === "card" && "text-[17px] leading-tight lg:text-xl",
              size === "md" && "text-xl",
              size === "sm" && "text-[13px]",
            )}
          >
            {format(sale)}
          </span>
        </div>
      ) : (
        <p
          className={cn(
            "profile-display tabular-nums text-[color:var(--maroon)]",
            size === "lg" && "text-2xl",
            size === "card" && "text-[17px] leading-tight lg:text-xl",
            size === "md" && "text-xl",
            size === "sm" && "text-[13px]",
          )}
        >
          {format(product.price)}
        </p>
      )}
      {offer && showHint ? (
        <p
          className={cn(
            "mt-1 text-[color:var(--maroon)]",
            size === "card" && "text-[11px] leading-snug lg:text-xs",
            size === "lg" && "text-xs",
            size === "md" && "text-[11px]",
            size === "sm" && "text-[8px] leading-tight",
          )}
        >
          {sale != null
            ? `Use ${offer.coupon.code} at checkout to avail this price`
            : `Use ${offer.coupon.code} at checkout · Min ${format(offer.coupon.minOrder)}`}
        </p>
      ) : null}
    </div>
  );
}
