import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { ApiCategory, ApiProduct } from "@/lib/api-types";
import type {
  AdminCoupon,
  AdminData,
  AdminNotification,
  AdminOrder,
  AdminReturn,
  DashboardMetrics,
} from "@/lib/admin/types";

type AdminApiState = {
  data: AdminData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createProduct: (body: Record<string, unknown>) => Promise<ApiProduct>;
  updateProduct: (id: string, body: Record<string, unknown>) => Promise<ApiProduct>;
  deleteProduct: (id: string) => Promise<void>;
  patchStock: (id: string, stock: Record<string, number>) => Promise<ApiProduct>;
  importProducts: (rows: Array<Record<string, string>>) => Promise<{ created: number; errors: string[] }>;
  createCategory: (body: Record<string, unknown>) => Promise<ApiCategory>;
  updateCategory: (id: string, body: Record<string, unknown>) => Promise<ApiCategory>;
  deleteCategory: (id: string) => Promise<void>;
  updateOrder: (id: string, body: Record<string, unknown>) => Promise<AdminOrder>;
  updateOrderStatus: (id: string, status: string, note?: string) => Promise<AdminOrder>;
  createCoupon: (body: Record<string, unknown>) => Promise<AdminCoupon>;
  updateCoupon: (id: string, body: Record<string, unknown>) => Promise<AdminCoupon>;
  deleteCoupon: (id: string) => Promise<void>;
  updateReturn: (id: string, status: string, note?: string) => Promise<AdminReturn>;
  createReturn: (orderId: string, reason: string, note?: string) => Promise<AdminReturn>;
  sendNotification: (body: { title: string; message: string; channel?: string }) => Promise<AdminNotification>;
  uploadMedia: (file: File, alt?: string) => Promise<{ gridFsId: string; url: string }>;
};

const emptyData: AdminData = {
  products: [],
  categories: [],
  orders: [],
  coupons: [],
  returns: [],
  notifications: [],
  dashboard: null,
};

export function useAdminApi(): AdminApiState {
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, products, categories, orders, coupons, returns, notifications] =
        await Promise.all([
          api.get<DashboardMetrics>("/api/admin/dashboard"),
          api.get<ApiProduct[]>("/api/admin/products"),
          api.get<ApiCategory[]>("/api/admin/categories"),
          api.get<AdminOrder[]>("/api/admin/orders"),
          api.get<AdminCoupon[]>("/api/admin/coupons"),
          api.get<AdminReturn[]>("/api/admin/returns"),
          api.get<AdminNotification[]>("/api/admin/notifications"),
        ]);
      setData({ dashboard, products, categories, orders, coupons, returns, notifications });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const result = await fn();
      await reload();
      return result;
    },
    [reload],
  );

  return useMemo(
    () => ({
      data,
      loading,
      error,
      reload,
      createProduct: (body) => mutate(() => api.post<ApiProduct>("/api/admin/products", body)),
      updateProduct: (id, body) => mutate(() => api.patch<ApiProduct>(`/api/admin/products/${id}`, body)),
      deleteProduct: (id) => mutate(() => api.delete(`/api/admin/products/${id}`)),
      patchStock: (id, stock) =>
        mutate(() => api.patch<ApiProduct>(`/api/admin/products/${id}/stock`, { stock })),
      importProducts: (rows) =>
        mutate(() => api.post<{ created: number; errors: string[] }>("/api/admin/products/import", { rows })),
      createCategory: (body) => mutate(() => api.post<ApiCategory>("/api/admin/categories", body)),
      updateCategory: (id, body) =>
        mutate(() => api.patch<ApiCategory>(`/api/admin/categories/${id}`, body)),
      deleteCategory: (id) => mutate(() => api.delete(`/api/admin/categories/${id}`)),
      updateOrder: (id, body) => mutate(() => api.patch<AdminOrder>(`/api/admin/orders/${id}`, body)),
      updateOrderStatus: (id, status, note) =>
        mutate(() => api.patch<AdminOrder>(`/api/admin/orders/${id}/status`, { status, note })),
      createCoupon: (body) => mutate(() => api.post<AdminCoupon>("/api/admin/coupons", body)),
      updateCoupon: (id, body) => mutate(() => api.patch<AdminCoupon>(`/api/admin/coupons/${id}`, body)),
      deleteCoupon: (id) => mutate(() => api.delete(`/api/admin/coupons/${id}`)),
      updateReturn: (id, status, note) =>
        mutate(() => api.patch<AdminReturn>(`/api/admin/returns/${id}`, { status, note })),
      createReturn: (orderId, reason, note) =>
        mutate(() => api.post<AdminReturn>("/api/admin/returns", { orderId, reason, note })),
      sendNotification: (body) =>
        mutate(() => api.post<AdminNotification>("/api/admin/notifications", body)),
      uploadMedia: async (file, alt) => {
        const form = new FormData();
        form.append("file", file);
        if (alt) form.append("alt", alt);
        const media = await api.upload<{ gridFsId: string; url: string }>("/api/admin/media", form);
        return media;
      },
    }),
    [data, loading, error, reload, mutate],
  );
}
