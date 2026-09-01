import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api-client";
import type { CouponQuote } from "./coupons";
import type { ApiCart, ApiProduct, ApiCategory, ApiOrder, ApiUserNotification, CreateOrderResult, RazorpayCheckoutSession } from "./api-types";
import { useAuth } from "./auth-context";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/api/categories"),
    staleTime: 0,
  });
}

export function useNavbarCategories() {
  return useQuery({
    queryKey: ["navbar-categories"],
    queryFn: () => api.get<ApiCategory[]>("/api/categories/navbar"),
    staleTime: 0,
  });
}

export function useProducts(category?: string, sort?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return useQuery({
    queryKey: ["products", category, sort],
    queryFn: () => api.get<ApiProduct[]>(`/api/products${qs ? `?${qs}` : ""}`),
    staleTime: 0,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<ApiProduct>(`/api/products/${slug}`),
    enabled: !!slug,
  });
}

export function useSearchProducts(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get<ApiProduct[]>(`/api/products/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });
}

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<ApiCart>("/api/cart"),
    enabled: isAuthenticated,
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: (data: { productId: string; size: string; quantity?: number }) =>
      api.post<ApiCart>("/api/cart/items", data),
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: (data: { productId: string; size: string; quantity: number }) =>
      api.patch<ApiCart>("/api/cart/items", data),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (data: { productId: string; size: string }) =>
      api.delete<ApiCart>("/api/cart/items", data),
    onSuccess: invalidate,
  });

  const clear = useMutation({
    mutationFn: () => api.delete<ApiCart>("/api/cart"),
    onSuccess: invalidate,
  });

  return { addItem, updateItem, removeItem, clear };
}

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api.get<ApiProduct[]>("/api/wishlist"),
    enabled: isAuthenticated,
  });
}

export function useWishlistMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  const add = useMutation({
    mutationFn: (productId: string) => api.post<ApiProduct[]>(`/api/wishlist/${productId}`),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (productId: string) => api.delete<ApiProduct[]>(`/api/wishlist/${productId}`),
    onSuccess: invalidate,
  });

  return { add, remove };
}

export function useOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<ApiOrder[]>("/api/orders"),
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<ApiOrder>(`/api/orders/${id}`),
    enabled: isAuthenticated && !!id,
  });
}

export function useQuoteCoupon(opts: { code?: string | null; skipAuto?: boolean; enabled?: boolean }) {
  return useQuery({
    queryKey: ["coupon-quote", opts.code ?? "", Boolean(opts.skipAuto)],
    queryFn: () =>
      api.post<CouponQuote>("/api/coupons/quote", {
        code: opts.skipAuto ? undefined : opts.code || undefined,
        skipAuto: opts.skipAuto,
      }),
    enabled: opts.enabled !== false,
    staleTime: 4_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      shippingAddress: {
        name: string;
        line1: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
      };
      paymentMethod: "razorpay" | "cod";
      couponCode?: string | null;
      skipCoupon?: boolean;
    }) => api.post<CreateOrderResult>("/api/orders", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      if (!result.razorpay) {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    },
  });
}

export function useStartRazorpay() {
  return useMutation({
    mutationFn: (orderId: string) => api.post<RazorpayCheckoutSession>(`/api/orders/${orderId}/razorpay`),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      reason: "changed_mind" | "ordered_by_mistake" | "delivery_too_slow" | "found_better_price" | "other";
      note?: string;
    }) => api.post<ApiOrder>(`/api/orders/${data.id}/cancel`, { reason: data.reason, note: data.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["account-notifications"] });
    },
  });
}

export function useRequestReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      reason: "size_fit" | "damaged" | "wrong_item" | "quality" | "changed_mind" | "other";
      note?: string;
    }) => api.post(`/api/orders/${data.id}/return`, { reason: data.reason, note: data.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["account-notifications"] });
    },
  });
}

export function useAccountNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["account-notifications"],
    queryFn: () => api.get<ApiUserNotification[]>("/api/account/notifications"),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<ApiUserNotification[]>("/api/account/notifications/read-all"),
    onSuccess: (data) => {
      queryClient.setQueryData(["account-notifications"], data);
    },
  });
}
