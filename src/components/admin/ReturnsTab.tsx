import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
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
import { useCurrency } from "@/lib/currency";
import type { AdminReturn, ReturnStatus } from "@/lib/admin/types";
import type { useAdminApi } from "@/hooks/useAdminApi";

const RETURN_STATUSES: ReturnStatus[] = [
  "pending",
  "approved",
  "pickup_scheduled",
  "picked_up",
  "received",
  "refund_initiated",
  "refunded",
  "rejected",
];

const NEXT_LABELS: Record<string, string> = {
  approved: "Approve",
  rejected: "Reject",
  pickup_scheduled: "Schedule pickup",
  picked_up: "Mark picked up",
  received: "Mark received (restock)",
  refund_initiated: "Issue refund",
  refunded: "Complete return",
};

type Props = { api: ReturnType<typeof useAdminApi> };

export function ReturnsTab({ api }: Props) {
  const { format } = useCurrency();
  const { data, loading, error, reload, updateReturn } = api;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const pending = data.returns.filter((r) => r.status === "pending").length;
    const inProgress = data.returns.filter((r) =>
      ["approved", "pickup_scheduled", "picked_up", "received", "refund_initiated"].includes(r.status),
    ).length;
    const refunded = data.returns.filter((r) => r.status === "refunded").length;
    return { total: data.returns.length, pending, inProgress, refunded };
  }, [data.returns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.returns.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    });
  }, [data.returns, search, statusFilter]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const setStatus = async (id: string, status: ReturnStatus, note?: string) => {
    setUpdatingId(id);
    try {
      await updateReturn(id, status, note);
      toast.success(`Return ${NEXT_LABELS[status]?.toLowerCase() ?? status.replace(/_/g, " ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const nextButtons = (r: AdminReturn) => {
    const next = r.allowedNextStatuses ?? [];
    if (next.length === 0) {
      return <p className="text-xs text-muted-foreground">No further steps.</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {next.map((s) =>
          s === "rejected" ? (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={updatingId === r.id}
              onClick={() => setStatus(r.id, "rejected", rejectNote[r.id]?.trim() || "Rejected")}
            >
              <X className="size-3.5 mr-1" />
              Reject
            </Button>
          ) : (
            <Button
              key={s}
              size="sm"
              variant={s === "approved" || s === "refunded" || s === "refund_initiated" ? "default" : "outline"}
              disabled={updatingId === r.id}
              onClick={() => setStatus(r.id, s)}
            >
              {s === "approved" ? <Check className="size-3.5 mr-1" /> : null}
              {NEXT_LABELS[s] ?? s.replace(/_/g, " ")}
            </Button>
          ),
        )}
      </div>
    );
  };

  return (
    <div>
      <AdminPageHeader
        title="Returns"
        description="Approve requests, arrange pickup, restock, and issue refunds."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total returns" value={String(stats.total)} />
        <StatCard label="Pending review" value={String(stats.pending)} />
        <StatCard label="In progress" value={String(stats.inProgress)} />
        <StatCard label="Refunded" value={String(stats.refunded)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search order, customer, product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReturnStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {RETURN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AdminCard padding="none">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-8" />
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : r.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                        >
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="font-medium">{r.orderNumber}</td>
                      <td>{r.customerName}</td>
                      <td className="max-w-[220px] truncate">{r.productName}</td>
                      <td className="text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <StatusBadge status={r.status} kind="return" />
                      </td>
                      <td>{nextButtons(r)}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-muted/30">
                          <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <p>
                                <span className="text-muted-foreground">Reason:</span> {r.reason}
                              </p>
                              {(r.items?.length ?? 0) > 0 && (
                                <div>
                                  <p className="eyebrow text-[10px] text-muted-foreground mb-2">Items</p>
                                  <ul className="space-y-1">
                                    {(r.items ?? []).map((item, i) => (
                                      <li key={i} className="flex justify-between gap-3">
                                        <span>
                                          {item.name} · {item.size} × {item.quantity}
                                        </span>
                                        <span className="tabular-nums">{format(item.lineTotal)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {r.total != null && (
                                    <p className="mt-2 font-medium tabular-nums">Total {format(r.total)}</p>
                                  )}
                                </div>
                              )}
                              {r.pickupAddress && (
                                <div>
                                  <p className="eyebrow text-[10px] text-muted-foreground mb-2">Pickup address</p>
                                  <p>{r.pickupAddress.name}</p>
                                  <p className="text-muted-foreground">{r.pickupAddress.line1}</p>
                                  <p className="text-muted-foreground">
                                    {r.pickupAddress.city}, {r.pickupAddress.state} {r.pickupAddress.pincode}
                                  </p>
                                  <p className="text-muted-foreground">{r.pickupAddress.phone}</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {r.paymentMethod === "cod" ? "Cash on delivery" : "Online"}
                                {r.paymentStatus ? ` · ${r.paymentStatus}` : ""}
                                {r.stockRestored ? " · Stock restored" : ""}
                              </p>
                            </div>
                            <div className="space-y-3">
                              {r.status === "pending" && (
                                <div className="space-y-2">
                                  <p className="eyebrow text-[10px] text-muted-foreground">Reject note (optional)</p>
                                  <Textarea
                                    value={rejectNote[r.id] ?? ""}
                                    onChange={(e) =>
                                      setRejectNote((n) => ({ ...n, [r.id]: e.target.value }))
                                    }
                                    className="min-h-16"
                                    placeholder="Reason shown in history"
                                  />
                                </div>
                              )}
                              {r.statusHistory.length > 0 && (
                                <div>
                                  <p className="eyebrow text-[10px] text-muted-foreground mb-2">History</p>
                                  <ul className="space-y-1">
                                    {r.statusHistory.map((h, i) => (
                                      <li key={i} className="flex flex-wrap gap-2 text-xs items-center">
                                        <StatusBadge status={h.status} kind="return" />
                                        <span className="text-muted-foreground">
                                          {new Date(h.at).toLocaleString()}
                                        </span>
                                        {h.note && <span>— {h.note}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No returns yet. Customers can request a return within 7 days of delivery, or start one from a delivered order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
