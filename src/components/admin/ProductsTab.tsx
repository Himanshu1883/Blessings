import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileUp, Package, PackageCheck, PackageX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
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
  totalStock,
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
  const { formatInr } = useCurrency();
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, stockFilter, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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
        description="Catalogue, pricing, stock, and images for the storefront."
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 gap-1.5 rounded-lg border-foreground/15 bg-white"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="size-3.5" />
              Import CSV
            </Button>
            <Button
              className="h-10 gap-1.5 rounded-lg bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
              onClick={openCreate}
            >
              <Plus className="size-3.5" />
              Add product
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={String(stockStats.total)}
          icon={<Package className="size-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="In stock"
          value={String(stockStats.inStock)}
          icon={<PackageCheck className="size-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Low stock"
          value={String(stockStats.low)}
          icon={<AlertTriangle className="size-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Out of stock"
          value={String(stockStats.out)}
          icon={<PackageX className="size-4" strokeWidth={1.6} />}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/8 bg-white shadow-[0_8px_28px_rgba(40,16,10,0.04)]">
        <div className="flex flex-col gap-3 border-b border-foreground/8 p-4 sm:flex-row sm:items-center lg:p-5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/35" />
            <Input
              placeholder="Search name, SKU, slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-lg pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-full rounded-lg sm:w-48">
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
            <SelectTrigger className="h-11 w-full rounded-lg sm:w-44">
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

        {filtered.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-16 text-center">
            <Package className="mb-4 size-14 text-foreground/15" strokeWidth={1.1} />
            <p className="text-sm font-medium text-foreground/70">No products found.</p>
            <p className="mt-1 text-xs text-foreground/45">Try another search, or add a new piece.</p>
          </div>
        ) : (
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
                {pageItems.map((p) => {
                  const cat = data.categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={resolveMediaUrl(p.imageUrl) ?? ""}
                              alt=""
                              className="size-12 rounded-lg object-cover bg-muted"
                            />
                          ) : (
                            <div className="size-12 rounded-lg bg-muted" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[color:var(--charcoal)]">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.fabric || p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{p.sku ?? "—"}</td>
                      <td className="text-muted-foreground">{cat?.name ?? p.categorySlug}</td>
                      <td className="tabular-nums">{formatInr(p.price)}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <StockBadge level={stockLevel(p)} />
                          <span className="text-[10px] tabular-nums text-foreground/40">{totalStock(p)} units</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {!p.isActive ? (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                              Inactive
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-800">
                              Live
                            </span>
                          )}
                          {p.isNew ? (
                            <span className="rounded-full bg-[color:var(--gold)]/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--charcoal)]">
                              New
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-9 rounded-lg" onClick={() => openEdit(p)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-lg text-destructive"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>

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
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-lg" onClick={confirmDelete} disabled={deleting}>
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
            <Button variant="outline" className="rounded-lg" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-lg bg-[color:var(--maroon)] hover:bg-[color:var(--maroon)]/90"
              onClick={runImport}
              disabled={importing || csvPreview.length === 0}
            >
              Import {csvPreview.length > 0 ? `(${csvPreview.length} rows)` : ""}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste CSV with headers:{" "}
            <code className="text-xs">name, slug, sku, categorySlug, fabric, price, description</code>
          </p>
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="name,slug,categorySlug,price&#10;Silk Saree,silk-saree,sarees,4999"
            className="rounded-xl font-mono text-xs"
          />
          {csvPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
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
                <p className="px-3 py-2 text-xs text-muted-foreground">+{csvPreview.length - 5} more rows</p>
              )}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
