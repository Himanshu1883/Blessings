import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCart, useCartMutations, useWishlist, useWishlistMutations } from "@/lib/api-hooks";
import type { ApiProduct } from "@/lib/api-types";
import { api, resolveMediaUrl } from "@/lib/api-client";
import {
  addGuestCartLine,
  readGuestCart,
  removeGuestCartLine,
  updateGuestCartLine,
  writeGuestCart,
  type GuestCartLine,
} from "@/lib/guest-cart";
import {
  readGuestWishlist,
  removeGuestWishlistId,
  toggleGuestWishlist,
  writeGuestWishlist,
} from "@/lib/guest-wishlist";

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

function withMedia(product: ApiProduct): ApiProduct {
  return {
    ...product,
    imageUrl: resolveMediaUrl(product.imageUrl),
    imageUrls: (product.imageUrls ?? []).map((u) => resolveMediaUrl(u) ?? u),
  };
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ShopPanel>(null);
  const [guestLines, setGuestLines] = useState<GuestCartLine[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const mergedGuestCart = useRef(false);
  const mergedGuestWishlist = useRef(false);
  const { isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const { data: wishlist = [] } = useWishlist();
  const { addItem, updateItem, removeItem, clear } = useCartMutations();
  const { add: addWishlist, remove: removeWishlist } = useWishlistMutations();

  const { data: catalogProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ApiProduct[]>("/api/products"),
    enabled: !isAuthenticated && (guestLines.length > 0 || guestWishlist.length > 0),
    staleTime: 60_000,
  });

  useEffect(() => {
    setGuestLines(readGuestCart());
    setGuestWishlist(readGuestWishlist());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      mergedGuestCart.current = false;
      return;
    }
    if (mergedGuestCart.current) return;
    const pending = readGuestCart();
    if (pending.length === 0) {
      mergedGuestCart.current = true;
      return;
    }
    mergedGuestCart.current = true;
    void (async () => {
      try {
        for (const line of pending) {
          await addItem.mutateAsync(line);
        }
        writeGuestCart([]);
        setGuestLines([]);
      } catch (e) {
        mergedGuestCart.current = false;
        toast.error(e instanceof Error ? e.message : "Could not save your bag.");
      }
    })();
  }, [isAuthenticated, addItem]);

  useEffect(() => {
    if (!isAuthenticated) {
      mergedGuestWishlist.current = false;
      return;
    }
    if (mergedGuestWishlist.current) return;
    const pending = readGuestWishlist();
    if (pending.length === 0) {
      mergedGuestWishlist.current = true;
      return;
    }
    mergedGuestWishlist.current = true;
    void (async () => {
      try {
        for (const productId of pending) {
          await addWishlist.mutateAsync(productId);
        }
        writeGuestWishlist([]);
        setGuestWishlist([]);
      } catch (e) {
        mergedGuestWishlist.current = false;
        toast.error(e instanceof Error ? e.message : "Could not save your wishlist.");
      }
    })();
  }, [isAuthenticated, addWishlist]);

  const persistGuest = useCallback((next: GuestCartLine[]) => {
    writeGuestCart(next);
    setGuestLines(next);
  }, []);

  const persistGuestSaved = useCallback((next: string[]) => {
    writeGuestWishlist(next);
    setGuestWishlist(next);
  }, []);

  const openPanel = useCallback((next: Exclude<ShopPanel, null>) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const addToCart = useCallback(
    (productId: string, size = "M", quantity = 1) => {
      if (!isAuthenticated) {
        persistGuest(addGuestCartLine(guestLines, productId, size, quantity));
        setPanel("cart");
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
    [isAuthenticated, addItem, guestLines, persistGuest],
  );

  const removeFromCart = useCallback(
    (productId: string, size: string) => {
      if (!isAuthenticated) {
        persistGuest(removeGuestCartLine(guestLines, productId, size));
        return;
      }
      removeItem.mutate({ productId, size });
    },
    [isAuthenticated, removeItem, guestLines, persistGuest],
  );

  const updateCartQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (!isAuthenticated) {
        persistGuest(updateGuestCartLine(guestLines, productId, size, quantity));
        return;
      }
      updateItem.mutate({ productId, size, quantity });
    },
    [isAuthenticated, updateItem, guestLines, persistGuest],
  );

  const clearCart = useCallback(() => {
    if (!isAuthenticated) {
      persistGuest([]);
      return;
    }
    clear.mutate();
  }, [isAuthenticated, clear, persistGuest]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        persistGuestSaved(toggleGuestWishlist(guestWishlist, productId));
        return;
      }
      const exists = wishlist.some((p) => p.id === productId);
      if (exists) {
        removeWishlist.mutate(productId);
      } else {
        addWishlist.mutate(productId);
      }
    },
    [isAuthenticated, wishlist, addWishlist, removeWishlist, guestWishlist, persistGuestSaved],
  );

  const isInWishlist = useCallback(
    (productId: string) =>
      isAuthenticated
        ? wishlist.some((p) => p.id === productId)
        : guestWishlist.includes(productId),
    [isAuthenticated, wishlist, guestWishlist],
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        persistGuestSaved(removeGuestWishlistId(guestWishlist, productId));
        return;
      }
      removeWishlist.mutate(productId);
    },
    [isAuthenticated, removeWishlist, guestWishlist, persistGuestSaved],
  );

  const resolveCartLines = useCallback(() => {
    if (isAuthenticated) {
      if (!cart?.lines) return [];
      return cart.lines.map((item) => ({
        line: item.line,
        product: withMedia(item.product),
      }));
    }

    return guestLines.flatMap((line) => {
      const product = catalogProducts.find((p) => p.id === line.productId);
      if (!product) return [];
      return [{ line, product: withMedia(product) }];
    });
  }, [isAuthenticated, cart, guestLines, catalogProducts]);

  const resolveWishlistProducts = useCallback(() => {
    if (isAuthenticated) return wishlist.map((p) => withMedia(p));
    return guestWishlist.flatMap((id) => {
      const product = catalogProducts.find((p) => p.id === id);
      if (!product) return [];
      return [withMedia(product)];
    });
  }, [isAuthenticated, wishlist, guestWishlist, catalogProducts]);

  const resolvedGuestLines = isAuthenticated ? [] : resolveCartLines();
  const cartCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = isAuthenticated
    ? (cart?.subtotal ?? 0)
    : resolvedGuestLines.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);
  const wishlistCount = isAuthenticated ? wishlist.length : guestWishlist.length;

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
