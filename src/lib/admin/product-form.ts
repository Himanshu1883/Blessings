import type { ProductCustomField } from "@/lib/admin/types";
import type { ApiProduct } from "@/lib/api-types";

export type AdminProduct = ApiProduct & {
  sku?: string | null;
  customFields?: ProductCustomField[];
};

export type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  price: string;
  categoryId: string;
  fabric: string;
  description: string;
  sizesText: string;
  colorsText: string;
  stock: Record<string, number>;
  imageIds: string[];
  imagePreviews: string[];
  isNew: boolean;
  bestSeller: boolean;
  isActive: boolean;
  customFields: ProductCustomField[];
};

export function emptyForm(categoryId = ""): ProductForm {
  return {
    name: "",
    slug: "",
    sku: "",
    price: "",
    categoryId,
    fabric: "",
    description: "",
    sizesText: "S, M, L, XL",
    colorsText: "",
    stock: { S: 0, M: 0, L: 0, XL: 0 },
    imageIds: [],
    imagePreviews: [],
    isNew: false,
    bestSeller: false,
    isActive: true,
    customFields: [],
  };
}

export function fromProduct(p: AdminProduct): ProductForm {
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
    colorsText: (p.colors ?? []).join(", "),
    stock,
    imageIds: [...p.imageIds],
    imagePreviews: [...p.imageUrls],
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    isActive: p.isActive,
    customFields: p.customFields ?? [],
  };
}

export function productFormToBody(form: ProductForm): Record<string, unknown> {
  const sizes = form.sizesText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim() || undefined,
    categoryId: form.categoryId,
    fabric: form.fabric.trim(),
    price: Number(form.price) || 0,
    description: form.description.trim(),
    sizes,
    colors: form.colorsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    stock: form.stock,
    imageIds: form.imageIds,
    customFields: form.customFields,
    isNew: form.isNew,
    bestSeller: form.bestSeller,
    isActive: form.isActive,
  };
}
