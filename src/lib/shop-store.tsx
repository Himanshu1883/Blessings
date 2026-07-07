import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCart, useCartMutations, useWishlist, useWishlistMutations } from "@/lib/api-hooks";
import type { ApiProduct } from "@/lib/api-types";
import { resolveMediaUrl } from "@/lib/api-client";

export type ShopPanel = "search" | "cart" | "wishlist" | "account" | null;

type ShopContextValue = {
  panel: ShopPanel;
  cartCount: number;
  wishlistCount: number;
  isAuthenticated: boolean;
  openPanel: (panel: Exclude<ShopPanel, null>) => void;
  closePanel: () => void;
  addToCart: (productId: string, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  resolveCartLines: () => { line: { productId: string; size: string; quantity: number }; product: ApiProduct }[];
  resolveWishlistProducts: () => ApiProduct[];
  cartSubtotal: number;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function requireAuthToast(openPanel: (p: Exclude<ShopPanel, null>) => void) {
  toast.error("Please sign in to continue.");
  openPanel("account");
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ShopPanel>(null);
  const { isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const { data: wishlist = [] } = useWishlist();
  const { addItem, updateItem, removeItem, clear } = useCartMutations();
  const { add: addWishlist, remove: removeWishlist } = useWishlistMutations();

  const openPanel = useCallback((next: Exclude<ShopPanel, null>) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const addToCart = useCallback(
    (productId: string, size = "M", quantity = 1) => {
      if (!isAuthenticated) {
        requireAuthToast(openPanel);
        return;
      }
      addItem.mutate(
        { productId, size, quantity },
        {
          onSuccess: () => setPanel("cart"),
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [isAuthenticated, addItem, openPanel],
  );

  const removeFromCart = useCallback(
    (productId: string, size: string) => {
      if (!isAuthenticated) return;
      removeItem.mutate({ productId, size });
    },
    [isAuthenticated, removeItem],
  );

  const updateCartQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (!isAuthenticated) return;
      updateItem.mutate({ productId, size, quantity });
    },
    [isAuthenticated, updateItem],
  );

  const clearCart = useCallback(() => {
    if (!isAuthenticated) return;
    clear.mutate();
  }, [isAuthenticated, clear]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        requireAuthToast(openPanel);
        return;
      }
      const exists = wishlist.some((p) => p.id === productId);
      if (exists) {
        removeWishlist.mutate(productId);
      } else {
        addWishlist.mutate(productId);
      }
    },
    [isAuthenticated, wishlist, addWishlist, removeWishlist, openPanel],
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((p) => p.id === productId),
    [wishlist],
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) return;
      removeWishlist.mutate(productId);
    },
    [isAuthenticated, removeWishlist],
  );

  const resolveCartLines = useCallback(() => {
    if (!cart?.lines) return [];
    return cart.lines.map((item) => ({
      line: item.line,
      product: {
        ...item.product,
        imageUrl: resolveMediaUrl(item.product.imageUrl),
        imageUrls: item.product.imageUrls.map((u) => resolveMediaUrl(u) ?? u),
      },
    }));
  }, [cart]);

  const resolveWishlistProducts = useCallback(
    () =>
      wishlist.map((p) => ({
        ...p,
        imageUrl: resolveMediaUrl(p.imageUrl),
        imageUrls: p.imageUrls.map((u) => resolveMediaUrl(u) ?? u),
      })),
    [wishlist],
  );

  const cartCount = cart?.itemCount ?? 0;
  const cartSubtotal = cart?.subtotal ?? 0;
  const wishlistCount = wishlist.length;

  const value = useMemo<ShopContextValue>(
    () => ({
      panel,
      cartCount,
      wishlistCount,
      isAuthenticated,
      openPanel,
      closePanel,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      resolveCartLines,
      resolveWishlistProducts,
      cartSubtotal,
    }),
    [
      panel,
      cartCount,
      wishlistCount,
      isAuthenticated,
      openPanel,
      closePanel,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      resolveCartLines,
      resolveWishlistProducts,
      cartSubtotal,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
