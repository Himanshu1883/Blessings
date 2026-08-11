import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/ui/AdminModal";
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
  emptyForm,
  fromProduct,
  productFormToBody,
  type AdminProduct,
  type ProductForm,
} from "@/lib/admin/product-form";
import { slugify } from "@/lib/admin/productUtils";
import type { ApiCategory, ApiProduct } from "@/lib/api-types";

type ProductEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProduct | null;
  categories: ApiCategory[];
  defaultCategoryId?: string;
  onSave: (id: string | null, body: Record<string, unknown>) => Promise<ApiProduct>;
  uploadMedia: (file: File, alt?: string) => Promise<{ gridFsId: string; url: string }>;
  onSaved?: (product: ApiProduct) => void;
};

export function ProductEditModal({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId = "",
  onSave,
  uploadMedia,
  onSaved,
}: ProductEditModalProps) {
  const [form, setForm] = useState<ProductForm>(emptyForm(defaultCategoryId));
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editingId = product?.id ?? null;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm(fromProduct(product));
      setSlugManual(true);
    } else {
      setForm(emptyForm(defaultCategoryId));
      setSlugManual(false);
    }
  }, [open, product, defaultCategoryId]);

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
    setSaving(true);
    try {
      const updated = await onSave(editingId, productFormToBody(form));
      toast.success(editingId ? "Product updated" : "Product created");
      onSaved?.(updated);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleImages}
      />

      <AdminModal
        open={open}
        onOpenChange={onOpenChange}
        title={editingId ? "Edit product" : "New product"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
                  {categories.map((c) => (
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
    </>
  );
}
