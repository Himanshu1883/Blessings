import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";

export function CartSheet() {
  const { panel, closePanel, resolveCartLines, updateCartQuantity, removeFromCart, clearCart } = useShop();
  const { format } = useCurrency();
  const lines = resolveCartLines();
  const subtotal = lines.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);
  const open = panel === "cart";

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
            <ShoppingBag className="size-10 text-foreground/25" strokeWidth={1.2} />
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
                    params={{ id: product.id }}
                    onClick={closePanel}
                    className="shrink-0"
                  >
                    <img src={product.image} alt={product.name} className="size-24 object-cover bg-[color:var(--muted)]" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/product/$id"
                          params={{ id: product.id }}
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
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--maroon)] tabular-nums">{format(product.price)}</p>
                    <div className="mt-auto pt-3 flex items-center gap-3">
                      <div className="inline-flex items-center border border-foreground/15">
                        <button
                          type="button"
                          className="p-2 hover:bg-[color:var(--muted)] transition-colors"
                          onClick={() => updateCartQuantity(product.id, line.size, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          className="p-2 hover:bg-[color:var(--muted)] transition-colors"
                          onClick={() => updateCartQuantity(product.id, line.size, line.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-foreground/10 px-6 py-5 space-y-4 bg-[color:var(--muted)]/30">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[10px]">Subtotal</span>
                <span className="font-serif text-xl tabular-nums">{format(subtotal)}</span>
              </div>
              <p className="text-[11px] text-foreground/50">Shipping & duties calculated at checkout.</p>
              <Button
                className="w-full rounded-none bg-[color:var(--charcoal)] hover:bg-[color:var(--maroon)] eyebrow text-[10px] tracking-[0.2em] h-12"
                onClick={() => {
                  toast.success("Concierge will contact you to complete your order.");
                  clearCart();
                  closePanel();
                }}
              >
                Proceed to Checkout
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
