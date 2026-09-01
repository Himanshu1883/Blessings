import { Link } from "@tanstack/react-router";
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons/site-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductOfferPrice } from "@/components/site/product-offer-price";
import { useActiveCoupons } from "@/lib/coupons-context";
import {
  couponAppliesToProduct,
  couponHeadline,
  quoteCouponLocal,
  writeCheckoutCoupon,
} from "@/lib/coupons";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";

export function CartSheet() {
  const { panel, closePanel, resolveCartLines, updateCartQuantity, removeFromCart, clearCart, cartSubtotal } = useShop();
  const { format } = useCurrency();
  const coupons = useActiveCoupons();
  const lines = resolveCartLines();
  const subtotal = cartSubtotal || lines.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);
  const open = panel === "cart";
  const quote = quoteCouponLocal(
    coupons,
    lines.map(({ line, product }) => ({ product, quantity: line.quantity })),
  );
  const matching = coupons.filter((coupon) =>
    lines.some(({ product }) => couponAppliesToProduct(coupon, product)),
  );
  const payable = Math.max(0, subtotal - (quote.ok ? quote.discount : 0));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closePanel()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md p-0" data-lenis-prevent>
        <SheetHeader className="border-b border-foreground/10 px-6 py-5 text-left">
          <SheetTitle className="font-serif text-2xl italic">Your Bag</SheetTitle>
          <SheetDescription className="eyebrow text-[10px]">
            {lines.length === 0 ? "No pieces yet" : `${lines.length} piece${lines.length > 1 ? "s" : ""} selected`}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <BagIcon className="size-10 text-foreground/25" />
            <p className="font-serif italic text-xl">Your bag is empty</p>
            <p className="text-sm text-foreground/60 max-w-xs">Explore our collections and add statement pieces to your bag.</p>
            <Button asChild variant="outline" className="mt-2 rounded-none eyebrow text-[10px] tracking-[0.2em]" onClick={closePanel}>
              <Link to="/shop/$category" params={{ category: "sherwanis" }}>Shop Sherwanis</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {lines.map(({ line, product }) => (
                <li key={`${product.id}-${line.size}`} className="flex gap-4">
                  <Link
                    to="/product/$id"
                    params={{ id: product.slug }}
                    onClick={closePanel}
                    className="shrink-0"
                  >
                    <img src={product.imageUrl ?? ""} alt={product.name} className="size-24 object-cover bg-[color:var(--muted)]" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/product/$id"
                          params={{ id: product.slug }}
                          onClick={closePanel}
                          className="font-serif text-base leading-tight hover:text-[color:var(--maroon)] transition-colors line-clamp-2"
                        >
                          {product.name}
                        </Link>
                        <p className="eyebrow text-[9px] text-foreground/50 mt-1">Size {line.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id, line.size)}
                        className="p-1 text-foreground/40 hover:text-[color:var(--maroon)] transition-colors"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                    <ProductOfferPrice product={product} size="sm" className="mt-2" />
                    <div className="mt-auto pt-3 flex items-center gap-3">
                      <div className="inline-flex items-center border border-foreground/15">
                        <button
                          type="button"
                          className="p-2 hover:bg-[color:var(--muted)] transition-colors"
                          onClick={() => updateCartQuantity(product.id, line.size, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          className="p-2 hover:bg-[color:var(--muted)] transition-colors"
                          onClick={() => updateCartQuantity(product.id, line.size, line.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {matching.length > 0 ? (
                <li className="space-y-2 border-t border-dashed border-foreground/15 pt-4">
                  <p className="eyebrow text-[9px] text-foreground/45">Use at checkout</p>
                  {matching.slice(0, 3).map((coupon) => (
                    <button
                      key={coupon.id}
                      type="button"
                      onClick={() => {
                        writeCheckoutCoupon(coupon.code);
                        toast.success(`${coupon.code} ready at checkout`);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-foreground/12 px-3 py-2 text-left hover:border-[color:var(--maroon)]/40"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm">{couponHeadline(coupon)}</span>
                        <span className="mt-0.5 block text-[11px] text-foreground/50">{coupon.title || coupon.code}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-[color:var(--maroon)]">
                        {coupon.code}
                      </span>
                    </button>
                  ))}
                </li>
              ) : null}
            </ul>
            <div className="border-t border-foreground/10 px-6 py-5 space-y-4 bg-[color:var(--muted)]/30">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[10px]">Subtotal</span>
                <span className="font-serif text-xl tabular-nums">{format(subtotal)}</span>
              </div>
              {quote.ok ? (
                <div className="flex items-center justify-between text-sm text-emerald-800">
                  <span>{quote.coupon?.code} {quote.autoApplied ? "(auto)" : ""}</span>
                  <span className="tabular-nums">−{format(quote.discount)}</span>
                </div>
              ) : quote.coupon && quote.message ? (
                <p className="text-[11px] text-[color:var(--maroon)]">{quote.message}</p>
              ) : null}
              {quote.ok ? (
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-[10px]">To pay</span>
                  <span className="font-serif text-xl tabular-nums">{format(payable)}</span>
                </div>
              ) : null}
              <p className="text-[11px] text-foreground/50">Shipping & duties calculated at checkout.</p>
              <Button
                asChild
                className="w-full rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.2em] h-12"
              >
                <Link to="/checkout" onClick={closePanel}>
                  Proceed to Checkout
                </Link>
              </Button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full eyebrow text-[9px] text-foreground/45 hover:text-[color:var(--maroon)] transition-colors"
              >
                Clear bag
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
