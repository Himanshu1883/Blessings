import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
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

export function WishlistSheet() {
  const { panel, closePanel, resolveWishlistProducts, removeFromWishlist, addToCart } = useShop();
  const { format } = useCurrency();
  const products = resolveWishlistProducts();
  const open = panel === "wishlist";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closePanel()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md p-0" data-lenis-prevent>
        <SheetHeader className="border-b border-foreground/10 px-6 py-5 text-left">
          <SheetTitle className="font-serif text-2xl italic">Wishlist</SheetTitle>
          <SheetDescription className="eyebrow text-[10px]">
            {products.length === 0 ? "Saved for later" : `${products.length} saved piece${products.length > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        {products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <Heart className="size-10 text-foreground/25" strokeWidth={1.2} />
            <p className="font-serif italic text-xl">Nothing saved yet</p>
            <p className="text-sm text-foreground/60 max-w-xs">Tap the heart on any piece to save it to your wishlist.</p>
            <Button asChild variant="outline" className="mt-2 rounded-none eyebrow text-[10px] tracking-[0.2em]" onClick={closePanel}>
              <Link to="/">Browse collections</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {products.map((product) => (
              <li key={product.id} className="flex gap-4">
                <Link to="/product/$id" params={{ id: product.id }} onClick={closePanel} className="shrink-0">
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
                      <p className="eyebrow text-[9px] text-foreground/50 mt-1">{product.fabric}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      className="p-1 text-foreground/40 hover:text-[color:var(--maroon)] transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--maroon)] tabular-nums">{format(product.price)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-fit rounded-none eyebrow text-[9px] tracking-[0.15em] h-9 gap-2"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingBag className="size-3.5" />
                    Add to bag
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
