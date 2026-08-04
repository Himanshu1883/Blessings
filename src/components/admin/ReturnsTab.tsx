import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReturnStatus } from "@/lib/admin/types";
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

type Props = { api: ReturnType<typeof useAdminApi> };

export function ReturnsTab({ api }: Props) {
  const { data, loading, error, reload, updateReturn } = api;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = data.returns.filter((r) => r.status === "pending").length;
    const approved = data.returns.filter((r) => r.status === "approved").length;
    const refunded = data.returns.filter((r) => r.status === "refunded").length;
    return { total: data.returns.length, pending, approved, refunded };
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
      toast.success(`Return ${status.replace(/_/g, " ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Returns"
        description="Review and process customer return requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total returns" value={String(stats.total)} />
        <StatCard label="Pending" value={String(stats.pending)} />
        <StatCard label="Approved" value={String(stats.approved)} />
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
                <th>Product</th>
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
                      <td>{r.productName}</td>
                      <td className="text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <StatusBadge status={r.status} kind="return" />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === r.id}
                                onClick={() => setStatus(r.id, "approved", "Quick approved")}
                              >
                                <Check className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                disabled={updatingId === r.id}
                                onClick={() => setStatus(r.id, "rejected", "Quick rejected")}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}
                          <Select
                            value={r.status}
                            onValueChange={(v) => setStatus(r.id, v as ReturnStatus)}
                            disabled={updatingId === r.id}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RETURN_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-muted/30">
                          <div className="px-4 py-3 space-y-3 text-sm">
                            <p>
                              <span className="text-muted-foreground">Reason:</span> {r.reason}
                            </p>
                            {r.statusHistory.length > 0 && (
                              <div>
                                <p className="eyebrow text-[10px] text-muted-foreground mb-2">History</p>
                                <ul className="space-y-1">
                                  {r.statusHistory.map((h, i) => (
                                    <li key={i} className="flex gap-2 text-xs">
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No returns found
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
