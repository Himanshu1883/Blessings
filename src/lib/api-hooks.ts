import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api-client";
import type { ApiCart, ApiProduct, ApiCategory, ApiOrder } from "./api-types";
import { useAuth } from "./auth-context";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/api/categories"),
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    }) => api.post<ApiOrder>("/api/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
