import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CouponTicket } from "@/components/site/coupon-ticket";
import { useCurrency } from "@/lib/currency";
import {
  COUPON_DESIGNS,
  couponHeadline,
  type CouponApplyTo,
  type CouponDesign,
  type CouponType,
  type CouponVisibility,
  type StoreCoupon,
} from "@/lib/coupons";
import type { useAdminApi } from "@/hooks/useAdminApi";
import { cn } from "@/lib/utils";

type Props = { api: ReturnType<typeof useAdminApi> };

type CouponForm = {
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: string;
  minOrder: string;
  maxDiscount: string;
  maxUses: string;
  perUserLimit: string;
  startsAt: string;
  expiresAt: string;
  autoApply: boolean;
  visibility: CouponVisibility;
  applyTo: CouponApplyTo;
  categoryIds: string[];
  productIds: string[];
  design: CouponDesign;
  isActive: boolean;
};

const emptyForm = (): CouponForm => ({
  code: "",
  title: "",
  description: "",
  type: "percent",
  value: "10",
  minOrder: "0",
  maxDiscount: "0",
  maxUses: "0",
  perUserLimit: "0",
  startsAt: "",
  expiresAt: "",
  autoApply: false,
  visibility: "public",
  applyTo: "all",
  categoryIds: [],
  productIds: [],
  design: "maroon",
  isActive: true,
});

function fromCoupon(c: StoreCoupon): CouponForm {
  return {
    code: c.code,
    title: c.title,
    description: c.description,
    type: c.type,
    value: String(c.value),
    minOrder: String(c.minOrder),
    maxDiscount: String(c.maxDiscount),
    maxUses: String(c.maxUses),
    perUserLimit: String(c.perUserLimit),
    startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "",
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
    autoApply: c.autoApply,
    visibility: c.visibility,
    applyTo: c.applyTo,
    categoryIds: c.categoryIds ?? [],
    productIds: c.productIds ?? [],
    design: c.design,
    isActive: c.isActive,
  };
}

function toBody(form: CouponForm) {
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim() || form.code.trim().toUpperCase(),
    description: form.description.trim(),
    type: form.type,
    value: Number(form.value) || 0,
    minOrder: Number(form.minOrder) || 0,
    maxDiscount: Number(form.maxDiscount) || 0,
    maxUses: Number(form.maxUses) || 0,
    perUserLimit: Number(form.perUserLimit) || 0,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
    autoApply: form.visibility === "code_only" ? false : form.autoApply,
    visibility: form.visibility,
    applyTo: form.applyTo,
    categoryIds: form.categoryIds,
    productIds: form.productIds,
    design: form.design,
    isActive: form.isActive,
  };
}

export function CouponsTab({ api }: Props) {
  const { format } = useCurrency();
  const { data, loading, error, reload, createCoupon, updateCoupon, deleteCoupon } = api;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StoreCoupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const activeCount = useMemo(
    () => data.coupons.filter((c) => c.isActive).length,
    [data.coupons],
  );

  const previewCoupon: StoreCoupon = {
    id: editing?.id ?? "preview",
    code: form.code || "CODE",
    title: form.title || "Offer title",
    description: form.description,
    type: form.type,
    value: Number(form.value) || 0,
    minOrder: Number(form.minOrder) || 0,
    maxDiscount: Number(form.maxDiscount) || 0,
    maxUses: Number(form.maxUses) || 0,
    usedCount: editing?.usedCount ?? 0,
    perUserLimit: Number(form.perUserLimit) || 0,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
    isActive: form.isActive,
    autoApply: form.autoApply,
    visibility: form.visibility,
    applyTo: form.applyTo,
    categoryIds: form.categoryIds,
    productIds: form.productIds,
    categorySlugs: [],
    design: form.design,
    createdAt: new Date().toISOString(),
  };

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return data.products
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [data.products, productQuery]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (coupon: StoreCoupon) => {
    setEditing(coupon);
    setForm(fromCoupon(coupon));
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    setSaving(true);
    try {
      const body = toBody(form);
      if (editing) {
        const { code: _code, ...rest } = body;
        await updateCoupon(editing.id, rest);
        toast.success("Coupon updated");
      } else {
        await createCoupon(body);
        toast.success("Coupon created");
      }
      setModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: StoreCoupon, isActive: boolean) => {
    try {
      await updateCoupon(coupon.id, { isActive });
      toast.success(isActive ? "Coupon activated" : "Coupon deactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const remove = async (coupon: StoreCoupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await deleteCoupon(coupon.id);
      toast.success("Coupon deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleId = (key: "categoryIds" | "productIds", id: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  };

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Design offers, choose which products they apply to, and preview the ticket customers will see."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5 mr-1.5" />
            New coupon
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground mb-6">
        {data.coupons.length} coupons · {activeCount} active
      </p>

      <AdminCard padding="none">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Applies</th>
                <th>Cart rules</th>
                <th>Uses</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="max-w-[220px]">
                      <CouponTicket coupon={c} compact />
                    </div>
                  </td>
                  <td className="text-sm">
                    <p className="font-medium capitalize">{c.applyTo}</p>
                    <p className="text-muted-foreground">
                      {c.visibility === "code_only" ? "Code only" : "Shown on store"}
                      {c.autoApply ? " · Auto-apply" : ""}
                    </p>
                  </td>
                  <td className="text-sm tabular-nums">
                    <p>{couponHeadline(c)}</p>
                    <p className="text-muted-foreground">Min {format(c.minOrder)}</p>
                    {c.maxDiscount > 0 ? <p className="text-muted-foreground">Cap {format(c.maxDiscount)}</p> : null}
                  </td>
                  <td className="tabular-nums text-sm">
                    {c.usedCount}/{c.maxUses || "∞"}
                  </td>
                  <td>
                    <Switch checked={c.isActive} onCheckedChange={(checked) => toggleActive(c, checked)} />
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Edit coupon">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(c)}
                        aria-label="Delete coupon"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8">
                    No coupons yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? `Edit ${editing.code}` : "Create coupon"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  disabled={!!editing}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="FESTIVE10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-title">Title</Label>
                <Input
                  id="coupon-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Wedding season offer"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-desc">Description</Label>
              <Textarea
                id="coupon-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown on the coupon ticket and checkout."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CouponType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="flat">Flat amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-value">{form.type === "percent" ? "Percent" : "Amount (₹)"}</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-min">Min cart (₹)</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-cap">Max discount (₹)</Label>
                <Input
                  id="coupon-cap"
                  type="number"
                  min={0}
                  value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">0 = no cap. Used with percent offers.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-max">Global uses</Label>
                <Input
                  id="coupon-max"
                  type="number"
                  min={0}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">0 = unlimited</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-user">Per customer</Label>
                <Input
                  id="coupon-user"
                  type="number"
                  min={0}
                  value={form.perUserLimit}
                  onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">0 = unlimited</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Expires</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <Label>Applies to</Label>
              <Select value={form.applyTo} onValueChange={(v) => setForm((f) => ({ ...f, applyTo: v as CouponApplyTo }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="categories">Chosen categories</SelectItem>
                  <SelectItem value="products">Chosen products</SelectItem>
                </SelectContent>
              </Select>
              {form.applyTo === "categories" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleId("categoryIds", cat.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        form.categoryIds.includes(cat.id)
                          ? "border-[color:var(--maroon)] bg-[color:var(--maroon)] text-white"
                          : "border-border",
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
              {form.applyTo === "products" && (
                <div className="space-y-2 pt-1">
                  <Input
                    placeholder="Search products"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(p.id)}
                          onChange={() => toggleId("productIds", p.id)}
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                  {form.productIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {data.products
                        .filter((p) => form.productIds.includes(p.id))
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleId("productIds", p.id)}
                            className="rounded-full bg-[color:var(--maroon)] px-2 py-0.5 text-[11px] text-white"
                          >
                            {p.name} ×
                          </button>
                        ))}
                    </div>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">{form.productIds.length} products selected</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-[11px] text-muted-foreground">Customers can use this coupon</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Auto-apply</p>
                  <p className="text-[11px] text-muted-foreground">Applied at checkout when eligible</p>
                </div>
                <Switch
                  checked={form.autoApply && form.visibility === "public"}
                  disabled={form.visibility === "code_only"}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, autoApply: checked }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) => setForm((f) => ({ ...f, visibility: v as CouponVisibility }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Show on store (PDP, cards, checkout)</SelectItem>
                    <SelectItem value="code_only">Separate / code only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ticket design</Label>
            <div className="space-y-2">
              {COUPON_DESIGNS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, design: d.id }))}
                  className={cn("w-full text-left", form.design === d.id && "opacity-100")}
                >
                  <CouponTicket coupon={{ ...previewCoupon, design: d.id }} compact selected={form.design === d.id} />
                  <p className="mt-1 text-[11px] text-muted-foreground">{d.label}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Checkout preview: “Use {previewCoupon.code} to avail {couponHeadline(previewCoupon)}.”
            </p>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
