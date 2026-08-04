import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/lib/currency";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = { api: ReturnType<typeof useAdminApi> };

type CouponForm = {
  code: string;
  type: "percent" | "flat";
  value: string;
  minOrder: string;
  maxUses: string;
  expiresAt: string;
};

const emptyForm = (): CouponForm => ({
  code: "",
  type: "percent",
  value: "",
  minOrder: "0",
  maxUses: "100",
  expiresAt: "",
});

export function CouponsTab({ api }: Props) {
  const { format } = useCurrency();
  const { data, loading, error, reload, createCoupon, updateCoupon, deleteCoupon } = api;

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => data.coupons.filter((c) => c.isActive).length,
    [data.coupons],
  );

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    setSaving(true);
    try {
      await createCoupon({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value) || 0,
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 100,
        expiresAt: form.expiresAt || null,
      });
      toast.success("Coupon created");
      setModalOpen(false);
      setForm(emptyForm());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      await updateCoupon(id, { isActive });
      toast.success(isActive ? "Coupon activated" : "Coupon deactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    try {
      await deleteCoupon(id);
      toast.success("Coupon deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount codes."
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
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
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.coupons.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono font-medium">{c.code}</td>
                  <td>
                    {c.type === "percent" ? `${c.value}%` : format(c.value)}
                  </td>
                  <td className="tabular-nums">{format(c.minOrder)}</td>
                  <td className="tabular-nums">
                    {c.usedCount}/{c.maxUses}
                  </td>
                  <td className="text-muted-foreground">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <Switch
                      checked={c.isActive}
                      disabled={togglingId === c.id}
                      onCheckedChange={(checked) => toggleActive(c.id, checked)}
                    />
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(c.id, c.code)}
                      aria-label="Delete coupon"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
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
        title="Create coupon"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Code</Label>
            <Input
              id="coupon-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="FESTIVE10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as "percent" | "flat" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="flat">Flat amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-value">Value</Label>
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
              <Label htmlFor="coupon-min">Min order (₹)</Label>
              <Input
                id="coupon-min"
                type="number"
                min={0}
                value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-max">Max uses</Label>
              <Input
                id="coupon-max"
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-expires">Expires (optional)</Label>
            <Input
              id="coupon-expires"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
