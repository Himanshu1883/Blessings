import { useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { resolveMediaUrl } from "@/lib/api-client";
import { slugify } from "@/lib/admin/productUtils";
import type { ApiCategory } from "@/lib/api-types";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = { api: ReturnType<typeof useAdminApi> };

type CategoryForm = {
  name: string;
  slug: string;
  tagline: string;
  subCategories: string;
  sortOrder: string;
  isActive: boolean;
  imageId: string | null;
  imagePreview: string | null;
};

function emptyForm(): CategoryForm {
  return {
    name: "",
    slug: "",
    tagline: "",
    subCategories: "",
    sortOrder: "0",
    isActive: true,
    imageId: null,
    imagePreview: null,
  };
}

function fromCategory(c: ApiCategory): CategoryForm {
  return {
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    subCategories: c.subCategories.join(", "),
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
    imageId: c.imageId,
    imagePreview: c.imageUrl,
  };
}

export function CategoriesTab({ api }: Props) {
  const { data, loading, error, reload, createCategory, updateCategory, deleteCategory, uploadMedia } =
    api;

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const active = data.categories.filter((c) => c.isActive).length;
    return { total: data.categories.length, active };
  }, [data.categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.categories;
    return data.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q),
    );
  }, [data.categories, search]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setSlugManual(false);
    setModalOpen(true);
  };

  const openEdit = (c: ApiCategory) => {
    setEditingId(c.id);
    setForm(fromCategory(c));
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

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadMedia(file, form.name);
      setForm((f) => ({
        ...f,
        imageId: media.gridFsId,
        imagePreview: media.url,
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    const body = {
      ...(editingId ? {} : { slug: form.slug.trim() }),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      subCategories: form.subCategories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      ...(form.imageId ? { imageId: form.imageId } : {}),
    };
    try {
      if (editingId) {
        await updateCategory(editingId, body);
        toast.success("Category updated");
      } else {
        await createCategory(body);
        toast.success("Category created");
      }
      setModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: ApiCategory) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success("Category deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organize products into browsable collections."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5 mr-1.5" />
            Add category
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Total categories" value={String(stats.total)} />
        <StatCard label="Active" value={String(stats.active)} />
      </div>

      <Input
        placeholder="Search categories…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cat) => (
          <AdminCard key={cat.id} padding="none" className="overflow-hidden">
            <div className="aspect-[4/3] bg-muted relative">
              {cat.imageUrl ? (
                <img
                  src={resolveMediaUrl(cat.imageUrl) ?? ""}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
              {!cat.isActive && (
                <span className="absolute top-2 left-2 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] px-2 py-0.5 uppercase">
                  Inactive
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-serif text-lg">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.tagline || cat.slug}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(cat)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No categories found</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImage}
      />

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Edit category" : "New category"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-tagline">Tagline</Label>
            <Input
              id="cat-tagline"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-subs">Sub-categories (comma-separated)</Label>
            <Input
              id="cat-subs"
              value={form.subCategories}
              onChange={(e) => setForm((f) => ({ ...f, subCategories: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input
              id="cat-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Active</Label>
            <Switch
              id="cat-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              {form.imagePreview && (
                <img
                  src={resolveMediaUrl(form.imagePreview) ?? ""}
                  alt=""
                  className="size-20 rounded object-cover border border-border"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : "Upload image"}
              </Button>
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
