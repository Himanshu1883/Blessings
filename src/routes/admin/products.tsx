import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { api, resolveMediaUrl } from "@/lib/api-client";
import type { ApiProduct, ApiCategory, ApiMedia } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get<ApiProduct[]>("/api/admin/products"),
  });

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

  const updateProduct = useMutation({
    mutationFn: ({ id, imageIds }: { id: string; imageIds: string[] }) =>
      api.patch<ApiProduct>(`/api/admin/products/${id}`, { imageIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Images updated");
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      const media = await uploadImage.mutateAsync(file);
      const product = products.find((p) => p.id === uploadTarget);
      if (!product) return;
      const imageIds = [...product.imageIds, media.gridFsId];
      await updateProduct.mutateAsync({ id: uploadTarget, imageIds });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadTarget(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <h1 className="font-serif italic text-3xl mb-8">Products</h1>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <article key={product.id} className="border border-foreground/10 p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {product.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={resolveMediaUrl(url) ?? ""}
                  alt=""
                  className="aspect-square object-cover bg-[color:var(--muted)]"
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  setUploadTarget(product.id);
                  fileRef.current?.click();
                }}
                className="aspect-square border border-dashed border-foreground/25 flex items-center justify-center text-xs text-foreground/50 hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)]"
              >
                + Upload
              </button>
            </div>
            <h2 className="font-serif text-lg">{product.name}</h2>
            <p className="text-xs text-foreground/50 mt-1">{product.fabric}</p>
            <p className="text-sm mt-2 tabular-nums">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="eyebrow text-[9px] mt-2 capitalize">
              {categories.find((c) => c.id === product.categoryId)?.name ?? product.categorySlug}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
