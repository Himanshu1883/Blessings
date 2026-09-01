export type CouponType = "percent" | "flat";
export type CouponApplyTo = "all" | "categories" | "products";
export type CouponVisibility = "public" | "code_only";
export type CouponDesign = "maroon" | "gold" | "charcoal" | "festive" | "ivory";

export const COUPON_DESIGNS: { id: CouponDesign; label: string }[] = [
  { id: "maroon", label: "Maroon ticket" },
  { id: "gold", label: "Gold ticket" },
  { id: "charcoal", label: "Charcoal ticket" },
  { id: "festive", label: "Festive split" },
  { id: "ivory", label: "Ivory outline" },
];

export type StoreCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  autoApply: boolean;
  visibility: CouponVisibility;
  applyTo: CouponApplyTo;
  categoryIds: string[];
  productIds: string[];
  categorySlugs: string[];
  design: CouponDesign;
  createdAt: string;
};

export type CouponQuote = {
  ok: boolean;
  message: string;
  coupon: StoreCoupon | null;
  eligibleSubtotal: number;
  discount: number;
  autoApplied: boolean;
};

export function discountAmount(coupon: Pick<StoreCoupon, "type" | "value" | "maxDiscount">, eligible: number) {
  if (eligible <= 0) return 0;
  let discount =
    coupon.type === "percent" ? Math.floor((eligible * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(Math.max(0, Math.floor(discount)), eligible);
}

export function couponAppliesToProduct(
  coupon: StoreCoupon,
  product: { mongoId?: string; id?: string; categorySlug?: string | null },
) {
  if (coupon.applyTo === "all") return true;
  const productId = product.mongoId || product.id || "";
  if (coupon.applyTo === "products") return coupon.productIds.includes(productId);
  return coupon.categorySlugs.includes(product.categorySlug ?? "");
}

export function productDiscount(coupon: StoreCoupon, price: number) {
  if (price <= 0) return 0;
  if (coupon.minOrder > price) return 0;
  return discountAmount(coupon, price);
}

export function bestCouponForProduct(
  coupons: StoreCoupon[],
  product: { mongoId?: string; id?: string; categorySlug?: string | null; price: number },
) {
  const matches = coupons.filter((coupon) => couponAppliesToProduct(coupon, product));
  if (!matches.length) return null;

  const applicable = matches
    .map((coupon) => ({ coupon, discount: productDiscount(coupon, product.price) }))
    .filter((row) => row.discount > 0)
    .sort((a, b) => b.discount - a.discount);
  if (applicable[0]) return applicable[0];

  let best = matches[0];
  let preview = discountAmount(best, Math.max(product.price, best.minOrder || 1));
  for (const coupon of matches.slice(1)) {
    const next = discountAmount(coupon, Math.max(product.price, coupon.minOrder || 1));
    if (next > preview) {
      best = coupon;
      preview = next;
    }
  }
  return { coupon: best, discount: 0 };
}

export type CouponCartLine = {
  product: { mongoId?: string; id?: string; categorySlug?: string | null; price: number };
  quantity: number;
};

export function eligibleSubtotalClient(coupon: StoreCoupon, lines: CouponCartLine[]) {
  return lines.reduce((sum, { product, quantity }) => {
    if (!couponAppliesToProduct(coupon, product)) return sum;
    return sum + product.price * quantity;
  }, 0);
}

export function quoteCouponLocal(
  coupons: StoreCoupon[],
  lines: CouponCartLine[],
  opts?: { code?: string | null; skipAuto?: boolean },
): CouponQuote {
  const empty: CouponQuote = {
    ok: false,
    message: "No coupon applied",
    coupon: null,
    eligibleSubtotal: 0,
    discount: 0,
    autoApplied: false,
  };
  if (!lines.length) return { ...empty, message: "Bag is empty" };

  const tryCoupon = (coupon: StoreCoupon, autoApplied: boolean): CouponQuote => {
    const eligible = eligibleSubtotalClient(coupon, lines);
    if (eligible <= 0) {
      return { ...empty, coupon, message: "This coupon does not apply to items in your bag" };
    }
    if (eligible < coupon.minOrder) {
      return {
        ...empty,
        coupon,
        eligibleSubtotal: eligible,
        message: `Add items worth ₹${Math.round(coupon.minOrder - eligible).toLocaleString("en-IN")} more to use ${coupon.code}`,
      };
    }
    const discount = discountAmount(coupon, eligible);
    if (discount <= 0) return { ...empty, coupon, eligibleSubtotal: eligible };
    return {
      ok: true,
      message: `${coupon.code} applied`,
      coupon,
      eligibleSubtotal: eligible,
      discount,
      autoApplied,
    };
  };

  const code = opts?.code?.trim().toUpperCase();
  if (code) {
    const coupon = coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) return { ...empty, message: "This coupon code is not valid" };
    return tryCoupon(coupon, false);
  }
  if (opts?.skipAuto) return empty;

  let best: CouponQuote | null = null;
  for (const coupon of coupons.filter((c) => c.autoApply)) {
    const quote = tryCoupon(coupon, true);
    if (!quote.ok) continue;
    if (!best || quote.discount > best.discount) best = quote;
  }
  return best ?? empty;
}

const CHECKOUT_COUPON_KEY = "blessings.checkout-coupon";

export function readCheckoutCoupon() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CHECKOUT_COUPON_KEY);
}

export function writeCheckoutCoupon(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) sessionStorage.setItem(CHECKOUT_COUPON_KEY, code.toUpperCase());
  else sessionStorage.removeItem(CHECKOUT_COUPON_KEY);
}

export function couponHeadline(coupon: StoreCoupon) {
  if (coupon.type === "percent") return `${coupon.value}% OFF`;
  return `₹${Math.round(coupon.value).toLocaleString("en-IN")} OFF`;
}

export function couponShortRule(coupon: StoreCoupon) {
  if (coupon.minOrder > 0) return `Min. order ₹${Math.round(coupon.minOrder).toLocaleString("en-IN")}`;
  if (coupon.maxDiscount > 0 && coupon.type === "percent") {
    return `Max discount ₹${Math.round(coupon.maxDiscount).toLocaleString("en-IN")}`;
  }
  return coupon.autoApply ? "Auto-applied at checkout" : "Enter code at checkout";
}
