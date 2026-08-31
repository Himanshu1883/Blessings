import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { AdminProduct } from "@/lib/admin/product-form";
import type { ApiCategory, ApiProduct } from "@/lib/api-types";

function matchProduct(list: AdminProduct[], id: string, slug?: string) {
  return list.find(
    (p) => p.id === id || (slug && (p.slug === slug || p.id === slug)),
  );
}

export function useAdminProductCatalog(enabled: boolean) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsRef = useRef(products);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  productsRef.current = products;

  const reload = useCallback(async () => {
    if (!enabled) return;
    const run = (async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextProducts, nextCategories] = await Promise.all([
          api.get<ApiProduct[]>("/api/admin/products"),
          api.get<ApiCategory[]>("/api/admin/categories"),
        ]);
        const mapped = nextProducts as AdminProduct[];
        productsRef.current = mapped;
        setProducts(mapped);
        setCategories(nextCategories);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin catalog");
      } finally {
        setLoading(false);
      }
    })();
    loadPromiseRef.current = run;
    await run;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setCategories([]);
      productsRef.current = [];
      setReady(false);
      setError(null);
      loadPromiseRef.current = null;
      return;
    }
    void reload();
  }, [enabled, reload]);

  const ensureProduct = useCallback(
    async (id: string, slug?: string): Promise<AdminProduct> => {
      const cached = matchProduct(productsRef.current, id, slug);
      if (cached) return cached;

      if (loadPromiseRef.current) await loadPromiseRef.current;
      else if (enabled) await reload();

      const afterLoad = matchProduct(productsRef.current, id, slug);
      if (afterLoad) return afterLoad;

      let fetched: AdminProduct | undefined;
      try {
        fetched = (await api.get<ApiProduct>(
          `/api/admin/products/${encodeURIComponent(id)}`,
        )) as AdminProduct;
      } catch {
        if (slug && slug !== id) {
          fetched = (await api.get<ApiProduct>(
            `/api/admin/products/${encodeURIComponent(slug)}`,
          )) as AdminProduct;
        }
      }
      if (!fetched) {
        throw new Error("This product could not be loaded for editing.");
      }

      setProducts((prev) => {
        const next = prev.some((p) => p.id === fetched.id)
          ? prev.map((p) => (p.id === fetched.id ? fetched : p))
          : [...prev, fetched];
        productsRef.current = next;
        return next;
      });
      return fetched;
    },
    [enabled, reload],
  );

  const updateProduct = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const updated = await api.patch<ApiProduct>(`/api/admin/products/${id}`, body);
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? (updated as AdminProduct) : p));
        productsRef.current = next;
        return next;
      });
      return updated;
    },
    [],
  );

  const createProduct = useCallback(async (body: Record<string, unknown>) => {
    const created = await api.post<ApiProduct>("/api/admin/products", body);
    setProducts((prev) => {
      const next = [...prev, created as AdminProduct];
      productsRef.current = next;
      return next;
    });
    return created;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.delete(`/api/admin/products/${id}`);
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      productsRef.current = next;
      return next;
    });
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
      ensureProduct,
      updateProduct,
      createProduct,
      deleteProduct,
      uploadMedia,
    }),
    [
      products,
      categories,
      loading,
      ready,
      error,
      reload,
      ensureProduct,
      updateProduct,
      createProduct,
      deleteProduct,
      uploadMedia,
    ],
  );
}
