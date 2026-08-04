import { useMemo, useRef, useState } from "react";
import { FileUp, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StockBadge } from "@/components/admin/ui/StatusBadge";
import { ProductCustomFieldsEditor } from "@/components/admin/ProductCustomFieldsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  slugify,
  stockLevel,
} from "@/lib/admin/productUtils";
import { useCurrency } from "@/lib/currency";
import type { ProductCustomField, StockLevel } from "@/lib/admin/types";
import type { ApiProduct } from "@/lib/api-types";
import type { useAdminApi } from "@/hooks/useAdminApi";

type AdminProduct = ApiProduct & {
  sku?: string | null;
  customFields?: ProductCustomField[];
};

type Props = { api: ReturnType<typeof useAdminApi> };

type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  price: string;
  categoryId: string;
  fabric: string;
  description: string;
  sizesText: string;
  stock: Record<string, number>;
  imageIds: string[];
  imagePreviews: string[];
  isNew: boolean;
  bestSeller: boolean;
  isActive: boolean;
  customFields: ProductCustomField[];
};

function emptyForm(categoryId = ""): ProductForm {
  return {
    name: "",
    slug: "",
    sku: "",
    price: "",
    categoryId,
    fabric: "",
    description: "",
    sizesText: "S, M, L, XL",
    stock: { S: 0, M: 0, L: 0, XL: 0 },
    imageIds: [],
    imagePreviews: [],
    isNew: false,
    bestSeller: false,
    isActive: true,
    customFields: [],
  };
}

function fromProduct(p: AdminProduct): ProductForm {
  const sizes = p.sizes.length > 0 ? p.sizes : Object.keys(p.stock ?? {});
  const stock: Record<string, number> = {};
  for (const s of sizes) stock[s] = p.stock?.[s] ?? 0;
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    price: String(p.price),
    categoryId: p.categoryId,
    fabric: p.fabric,
    description: p.description,
    sizesText: sizes.join(", "),
    stock,
    imageIds: [...p.imageIds],
    imagePreviews: [...p.imageUrls],
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    isActive: p.isActive,
    customFields: p.customFields ?? [],
  };
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

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
    setEditingId(null);
    setForm(emptyForm(defaultCategoryId));
    setSlugManual(false);
    setModalOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setForm(fromProduct(p));
    setSlugManual(true);
    setModalOpen(true);
  };

  const onNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugManual ? f.slug : slugify(name),
    }));
  };

  const onSizesChange = (sizesText: string) => {
    const sizes = sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((f) => {
      const stock = { ...f.stock };
      for (const s of sizes) {
        if (stock[s] === undefined) stock[s] = 0;
      }
      for (const key of Object.keys(stock)) {
        if (!sizes.includes(key)) delete stock[key];
      }
      return { ...f, sizesText, stock };
    });
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newIds = [...form.imageIds];
      const newPreviews = [...form.imagePreviews];
      for (const file of Array.from(files)) {
        const media = await uploadMedia(file, form.name);
        newIds.push(media.gridFsId);
        newPreviews.push(media.url);
      }
      setForm((f) => ({ ...f, imageIds: newIds, imagePreviews: newPreviews }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({
      ...f,
      imageIds: f.imageIds.filter((_, i) => i !== index),
      imagePreviews: f.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.categoryId) {
      toast.error("Name, slug, and category are required");
      return;
    }
    const sizes = form.sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim() || undefined,
      categoryId: form.categoryId,
      fabric: form.fabric.trim(),
      price: Number(form.price) || 0,
      description: form.description.trim(),
      sizes,
      stock: form.stock,
      imageIds: form.imageIds,
      customFields: form.customFields,
      isNew: form.isNew,
      bestSeller: form.bestSeller,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, body);
        toast.success("Product updated");
      } else {
        await createProduct(body);
        toast.success("Product created");
      }
      setModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
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

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleImages}
      />

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Edit product" : "New product"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save product
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Name</Label>
              <Input id="prod-name" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-slug">Slug</Label>
              <Input
                id="prod-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input
                id="prod-sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Price (₹)</Label>
              <Input
                id="prod-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-fabric">Fabric</Label>
              <Input
                id="prod-fabric"
                value={form.fabric}
                onChange={(e) => setForm((f) => ({ ...f, fabric: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">Description</Label>
            <Textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-sizes">Sizes (comma-separated)</Label>
            <Input
              id="prod-sizes"
              value={form.sizesText}
              onChange={(e) => onSizesChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Stock per size</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.sizesText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((size) => (
                  <div key={size} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{size}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.stock[size] ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stock: { ...f.stock, [size]: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="prod-new"
                checked={form.isNew}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isNew: checked }))}
              />
              <Label htmlFor="prod-new">New arrival</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="prod-bestseller"
                checked={form.bestSeller}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, bestSeller: checked }))}
              />
              <Label htmlFor="prod-bestseller">Best seller</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="prod-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
              <Label htmlFor="prod-active">Active</Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="size-3.5 mr-1" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.imagePreviews.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={resolveMediaUrl(url) ?? ""}
                    alt=""
                    className="size-20 rounded object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ProductCustomFieldsEditor
            fields={form.customFields}
            onChange={(customFields) => setForm((f) => ({ ...f, customFields }))}
          />
        </div>
      </AdminModal>

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
              {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
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
              {importing && <Loader2 className="size-4 mr-2 animate-spin" />}
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
