import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api, resolveMediaUrl } from "@/lib/api-client";
import type { ApiCategory, ApiMedia } from "@/lib/api-types";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get<ApiCategory[]>("/api/admin/categories"),
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.upload<ApiMedia>("/api/admin/media", fd);
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      api.patch<ApiCategory>(`/api/admin/categories/${id}`, { imageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Category image updated");
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      const media = await uploadImage.mutateAsync(file);
      await updateCategory.mutateAsync({ id: uploadTarget, imageId: media.gridFsId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadTarget(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <h1 className="font-serif italic text-3xl mb-8">Categories</h1>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <article key={cat.id} className="border border-foreground/10 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setUploadTarget(cat.id);
                fileRef.current?.click();
              }}
              className="relative w-full aspect-[4/3] group"
            >
              {cat.imageUrl ? (
                <img src={resolveMediaUrl(cat.imageUrl) ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[color:var(--muted)] flex items-center justify-center text-sm text-foreground/40">
                  No image
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[color:var(--ivory)] eyebrow text-[10px]">
                Upload image
              </div>
            </button>
            <div className="p-4">
              <h2 className="font-serif text-lg">{cat.name}</h2>
              <p className="text-xs text-foreground/50 mt-1">{cat.tagline}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
