import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { AdminProduct } from "@/lib/admin/product-form";
import type { ApiCategory, ApiProduct } from "@/lib/api-types";

export function useAdminProductCatalog(enabled: boolean) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        api.get<ApiProduct[]>("/api/admin/products"),
        api.get<ApiCategory[]>("/api/admin/categories"),
      ]);
      setProducts(nextProducts as AdminProduct[]);
      setCategories(nextCategories);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin catalog");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setCategories([]);
      setReady(false);
      setError(null);
      return;
    }
    void reload();
  }, [enabled, reload]);

  const updateProduct = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const updated = await api.patch<ApiProduct>(`/api/admin/products/${id}`, body);
      setProducts((prev) => prev.map((p) => (p.id === id ? (updated as AdminProduct) : p)));
      return updated;
    },
    [],
  );

  const createProduct = useCallback(async (body: Record<string, unknown>) => {
    const created = await api.post<ApiProduct>("/api/admin/products", body);
    setProducts((prev) => [...prev, created as AdminProduct]);
    return created;
  }, []);

  const uploadMedia = useCallback(async (file: File, alt?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (alt) form.append("alt", alt);
    return api.upload<{ gridFsId: string; url: string }>("/api/admin/media", form);
  }, []);

  return useMemo(
    () => ({
      products,
      categories,
      loading,
      ready,
      error,
      reload,
      updateProduct,
      createProduct,
      uploadMedia,
    }),
    [products, categories, loading, ready, error, reload, updateProduct, createProduct, uploadMedia],
  );
}
