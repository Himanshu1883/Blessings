import { useEffect, useRef, useState } from "react";
import { Loader2, Star, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { slugify, skuify, isAutoSlug, isAutoSku } from "@/lib/admin/productUtils";
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
  const [skuManual, setSkuManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editingId = product?.id ?? null;

  useEffect(() => {
    if (!open) return;
    if (product) {
      const next = fromProduct(product);
      const slugAuto = isAutoSlug(product.name, product.slug);
      const skuAuto = isAutoSku(product.name, product.sku ?? "");
      if (slugAuto && !next.slug.trim()) next.slug = slugify(product.name);
      if (skuAuto && !next.sku.trim()) next.sku = skuify(product.name);
      setForm(next);
      setSlugManual(!slugAuto);
      setSkuManual(!skuAuto);
    } else {
      setForm(emptyForm(defaultCategoryId));
      setSlugManual(false);
      setSkuManual(false);
    }
  }, [open, product, defaultCategoryId]);

  const onNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugManual ? f.slug : slugify(name),
      sku: skuManual ? f.sku : skuify(name),
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

  const setPrimary = (index: number) => {
    if (index <= 0) return;
    setForm((f) => {
      const imageIds = [...f.imageIds];
      const imagePreviews = [...f.imagePreviews];
      const [id] = imageIds.splice(index, 1);
      const [preview] = imagePreviews.splice(index, 1);
      if (id) imageIds.unshift(id);
      if (preview) imagePreviews.unshift(preview);
      return { ...f, imageIds, imagePreviews };
    });
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
                placeholder="Generated from name"
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value.trim()) {
                    setSlugManual(false);
                    setForm((f) => ({ ...f, slug: slugify(f.name) }));
                    return;
                  }
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: value }));
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                {slugManual ? "Edited manually." : "Auto-filled from the name. You can change it."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input
                id="prod-sku"
                value={form.sku}
                placeholder="Generated from name"
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value.trim()) {
                    setSkuManual(false);
                    setForm((f) => ({ ...f, sku: skuify(f.name) }));
                    return;
                  }
                  setSkuManual(true);
                  setForm((f) => ({ ...f, sku: value }));
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                {skuManual ? "Edited manually." : "Auto-filled from the name. You can change it."}
              </p>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Images</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  The primary image is the main photo on shop cards and the product page.
                </p>
              </div>
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
            {form.imagePreviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">No images yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.imagePreviews.map((url, i) => {
                  const isPrimary = i === 0;
                  return (
                    <div
                      key={form.imageIds[i] ?? `${url}-${i}`}
                      className={cn(
                        "relative overflow-hidden rounded border bg-muted",
                        isPrimary ? "border-primary ring-1 ring-primary/30" : "border-border",
                      )}
                    >
                      <img
                        src={resolveMediaUrl(url) ?? ""}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/90 text-foreground text-sm leading-none shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                      {isPrimary ? (
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
                          <Star className="size-2.5 fill-current" />
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimary(i)}
                          className="absolute inset-x-1.5 bottom-1.5 inline-flex items-center justify-center gap-1 rounded-sm bg-background/95 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                        >
                          <Star className="size-2.5" />
                          Set as primary
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
