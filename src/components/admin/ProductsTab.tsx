import { useMemo, useState } from "react";
import { FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StockBadge } from "@/components/admin/ui/StatusBadge";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/admin/productUtils";
import type { AdminProduct } from "@/lib/admin/product-form";
import { useCurrency } from "@/lib/currency";
import type { StockLevel } from "@/lib/admin/types";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = { api: ReturnType<typeof useAdminApi> };

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? "";
    });
    return row;
  });
}

export function ProductsTab({ api }: Props) {
  const { format } = useCurrency();
  const {
    data,
    loading,
    error,
    reload,
    createProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    uploadMedia,
  } = api;

  const products = data.products as AdminProduct[];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockLevel>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

  const stockStats = useMemo(() => countStockLevels(products), [products]);

  const filtered = useMemo((): AdminProduct[] => {
    const q = search.trim().toLowerCase();
    let list: AdminProduct[] = filterByStock(products, stockFilter);
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, search, categoryFilter, stockFilter]);

  const csvPreview = useMemo(() => parseCsv(csvText), [csvText]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const defaultCategoryId = data.categories[0]?.id ?? "";

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const runImport = async () => {
    if (csvPreview.length === 0) {
      toast.error("Paste valid CSV with header row");
      return;
    }
    setImporting(true);
    try {
      const result = await importProducts(csvPreview);
      toast.success(`Imported ${result.created} products`, {
        description: result.errors.length ? `${result.errors.length} skipped` : undefined,
      });
      if (result.errors.length) console.warn(result.errors);
      setImportOpen(false);
      setCsvText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage catalogue, pricing, stock, and images."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="size-3.5 mr-1.5" />
              Import CSV
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5 mr-1.5" />
              Add product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total products" value={String(stockStats.total)} />
        <StatCard label="In stock" value={String(stockStats.inStock)} />
        <StatCard label="Low stock" value={String(stockStats.low)} />
        <StatCard label="Out of stock" value={String(stockStats.out)} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <Input
          placeholder="Search name, SKU, slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {data.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockLevel)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
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
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = data.categories.find((c) => c.id === p.categoryId);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.imageUrl && (
                          <img
                            src={resolveMediaUrl(p.imageUrl) ?? ""}
                            alt=""
                            className="size-10 rounded object-cover border border-border"
                          />
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.fabric}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{p.sku ?? "—"}</td>
                    <td className="text-muted-foreground">{cat?.name ?? p.categorySlug}</td>
                    <td className="tabular-nums">{format(p.price)}</td>
                    <td>
                      <StockBadge level={stockLevel(p)} />
                    </td>
                    <td>
                      {!p.isActive && (
                        <span className="text-[10px] uppercase text-destructive">Inactive</span>
                      )}
                      {p.isNew && (
                        <span className="text-[10px] uppercase text-primary ml-1">New</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <ProductEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editingProduct}
        categories={data.categories}
        defaultCategoryId={defaultCategoryId}
        onSave={async (id, body) => {
          if (id) return updateProduct(id, body);
          return createProduct(body);
        }}
        uploadMedia={uploadMedia}
      />

      <AdminModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete product"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
      </AdminModal>

      <AdminModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import products from CSV"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runImport} disabled={importing || csvPreview.length === 0}>
              Import {csvPreview.length > 0 ? `(${csvPreview.length} rows)` : ""}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste CSV with headers: <code className="text-xs">name, slug, sku, categorySlug, fabric, price, description</code>
          </p>
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="name,slug,categorySlug,price&#10;Silk Saree,silk-saree,sarees,4999"
            className="font-mono text-xs"
          />
          {csvPreview.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="admin-table text-xs">
                <thead>
                  <tr>
                    {Object.keys(csvPreview[0]).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 5 && (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  +{csvPreview.length - 5} more rows
                </p>
              )}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
