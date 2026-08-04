import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StockBadge } from "@/components/admin/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/api-client";
import {
  countStockLevels,
  filterByStock,
  stockLevel,
  totalStock,
} from "@/lib/admin/productUtils";
import type { StockLevel } from "@/lib/admin/types";
import type { ApiProduct } from "@/lib/api-types";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = { api: ReturnType<typeof useAdminApi> };

type StockDraft = Record<string, Record<string, number>>;

const DEBOUNCE_MS = 600;

export function InventoryTab({ api }: Props) {
  const { data, loading, error, reload, patchStock } = api;
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockLevel>("all");
  const [draft, setDraft] = useState<StockDraft>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const stockStats = useMemo(() => countStockLevels(data.products), [data.products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = filterByStock(data.products, stockFilter);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data.products, search, stockFilter]);

  const getStock = useCallback(
    (product: ApiProduct): Record<string, number> => {
      return draft[product.id] ?? product.stock ?? {};
    },
    [draft],
  );

  const scheduleSave = useCallback(
    (productId: string, stock: Record<string, number>) => {
      if (timers.current[productId]) clearTimeout(timers.current[productId]);
      timers.current[productId] = setTimeout(async () => {
        setSaving((s) => new Set(s).add(productId));
        try {
          await patchStock(productId, stock);
          setDirty((d) => {
            const next = new Set(d);
            next.delete(productId);
            return next;
          });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Stock save failed");
        } finally {
          setSaving((s) => {
            const next = new Set(s);
            next.delete(productId);
            return next;
          });
        }
      }, DEBOUNCE_MS);
    },
    [patchStock],
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const adjustStock = (product: ApiProduct, size: string, delta: number) => {
    const current = { ...getStock(product) };
    current[size] = Math.max(0, (current[size] ?? 0) + delta);
    setDraft((d) => ({ ...d, [product.id]: current }));
    setDirty((prev) => new Set(prev).add(product.id));
    scheduleSave(product.id, current);
  };

  const setStockValue = (product: ApiProduct, size: string, value: number) => {
    const current = { ...getStock(product) };
    current[size] = Math.max(0, value);
    setDraft((d) => ({ ...d, [product.id]: current }));
    setDirty((prev) => new Set(prev).add(product.id));
    scheduleSave(product.id, current);
  };

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Adjust stock levels per size. Changes save automatically."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total products" value={String(stockStats.total)} />
        <StatCard label="In stock" value={String(stockStats.inStock)} />
        <StatCard label="Low stock" value={String(stockStats.low)} />
        <StatCard label="Out of stock" value={String(stockStats.out)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockLevel)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock levels</SelectItem>
            <SelectItem value="in">In stock</SelectItem>
            <SelectItem value="low">Low stock</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminCard padding="none">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Total</th>
                <th>Stock by size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const stock = getStock(product);
                const sizes = product.sizes.length > 0 ? product.sizes : Object.keys(stock);
                const level = stockLevel({ ...product, stock });
                const isDirty = dirty.has(product.id);
                const isSaving = saving.has(product.id);

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={resolveMediaUrl(product.imageUrl) ?? ""}
                            alt=""
                            className="size-10 rounded object-cover border border-border"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.fabric}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StockBadge level={level} />
                    </td>
                    <td className="tabular-nums">{totalStock({ ...product, stock })}</td>
                    <td>
                      <div className="flex flex-wrap gap-3">
                        {sizes.map((size) => (
                          <div key={size} className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground w-6">{size}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => adjustStock(product, size, -1)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              value={stock[size] ?? 0}
                              onChange={(e) =>
                                setStockValue(product, size, Number(e.target.value) || 0)
                              }
                              className="w-14 h-7 text-center text-xs px-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => adjustStock(product, size, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {isSaving && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" />
                          Saving…
                        </span>
                      )}
                      {!isSaving && isDirty && (
                        <span className="text-xs text-accent-foreground">Unsaved</span>
                      )}
                      {!isSaving && !isDirty && (
                        <span className="text-xs text-emerald-deep">Saved</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8">
                    No products match filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
