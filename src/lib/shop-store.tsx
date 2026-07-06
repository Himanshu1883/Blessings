import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct, type Product } from "@/lib/catalog";

export type CartLine = {
  productId: string;
  size: string;
  quantity: number;
};

export type Account = {
  name: string;
  email: string;
};

export type ShopPanel = "search" | "cart" | "wishlist" | "account" | null;

type ShopContextValue = {
  cart: CartLine[];
  wishlist: string[];
  account: Account | null;
  panel: ShopPanel;
  cartCount: number;
  wishlistCount: number;
  openPanel: (panel: Exclude<ShopPanel, null>) => void;
  closePanel: () => void;
  addToCart: (productId: string, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  signIn: (account: Account) => void;
  signOut: () => void;
  resolveCartLines: () => { line: CartLine; product: Product }[];
  resolveWishlistProducts: () => Product[];
};

const CART_KEY = "blessings.cart";
const WISHLIST_KEY = "blessings.wishlist";
const ACCOUNT_KEY = "blessings.account";

const ShopContext = createContext<ShopContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [panel, setPanel] = useState<ShopPanel>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(loadJson<CartLine[]>(CART_KEY, []));
    setWishlist(loadJson<string[]>(WISHLIST_KEY, []));
    setAccount(loadJson<Account | null>(ACCOUNT_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (account) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    else window.localStorage.removeItem(ACCOUNT_KEY);
  }, [account, hydrated]);

  const openPanel = useCallback((next: Exclude<ShopPanel, null>) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const addToCart = useCallback((productId: string, size = "M", quantity = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.size === size);
      if (idx === -1) return [...prev, { productId, size, quantity }];
      return prev.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + quantity } : l));
    });
    setPanel("cart");
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
  }, []);

  const updateCartQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId && l.size === size ? { ...l, quantity } : l)),
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  }, []);

  const signIn = useCallback((next: Account) => {
    setAccount(next);
    setPanel("account");
  }, []);

  const signOut = useCallback(() => setAccount(null), []);

  const resolveCartLines = useCallback(
    () =>
      cart
        .map((line) => {
          const product = getProduct(line.productId);
          return product ? { line, product } : null;
        })
        .filter((x): x is { line: CartLine; product: Product } => x !== null),
    [cart],
  );

  const resolveWishlistProducts = useCallback(
    () =>
      wishlist
        .map((id) => getProduct(id))
        .filter((p): p is Product => p !== undefined),
    [wishlist],
  );

  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.quantity, 0), [cart]);
  const wishlistCount = wishlist.length;

  const value = useMemo<ShopContextValue>(
    () => ({
      cart,
      wishlist,
      account,
      panel,
      cartCount,
      wishlistCount,
      openPanel,
      closePanel,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      signIn,
      signOut,
      resolveCartLines,
      resolveWishlistProducts,
    }),
    [
      cart,
      wishlist,
      account,
      panel,
      cartCount,
      wishlistCount,
      openPanel,
      closePanel,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      signIn,
      signOut,
      resolveCartLines,
      resolveWishlistProducts,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
