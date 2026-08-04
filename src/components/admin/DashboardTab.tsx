import { Link } from "@tanstack/react-router";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = Pick<ReturnType<typeof useAdminApi>, "data" | "loading" | "error" | "reload">;

export function DashboardTab({ data, loading, error, reload }: Props) {
  const { format } = useCurrency();
  const d = data.dashboard;

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const maxRevenue = Math.max(...(d?.revenueByDay.map((x) => x.revenue) ?? [1]), 1);
  const statusTotal = Object.values(d?.statusBreakdown ?? {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of store performance and recent activity."
        actions={
          <>
            <Link to="/admin/products">
              <Button size="sm">Add Product</Button>
            </Link>
            <Link to="/admin/orders">
              <Button size="sm" variant="outline">
                View Orders
              </Button>
            </Link>
          </>
        }
      />

      {(d?.lowStockCount ?? 0) > 0 && (
        <AdminCard className="mb-6 border-accent/40 bg-accent/5" padding="md">
          <p className="text-sm">
            <span className="font-medium">{d?.lowStockCount} products</span> are low on stock.{" "}
            <Link to="/admin/inventory" className="text-primary underline-offset-4 hover:underline">
              Manage inventory →
            </Link>
          </p>
        </AdminCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total revenue"
          value={format(d?.totalRevenue ?? 0)}
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          label="Orders this week"
          value={String(d?.ordersThisWeek ?? 0)}
          icon={<ShoppingCart className="size-4" />}
          trend={{
            value: `${d?.weekChangePercent ?? 0}% vs last week`,
            positive: (d?.weekChangePercent ?? 0) >= 0,
          }}
        />
        <StatCard
          label="Products"
          value={String(d?.productCount ?? 0)}
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Today's sales"
          value={format(d?.todaysSales ?? 0)}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AdminCard padding="md">
          <h3 className="font-serif italic text-lg mb-4">7-day revenue</h3>
          <div className="flex items-end gap-2 h-40">
            {(d?.revenueByDay ?? []).map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80 min-h-[4px] transition-all"
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                  title={format(day.revenue)}
                />
                <span className="text-[9px] text-muted-foreground">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
            {(d?.revenueByDay?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No revenue data yet</p>
            )}
          </div>
        </AdminCard>

        <AdminCard padding="md">
          <h3 className="font-serif italic text-lg mb-4">Order status</h3>
          <div className="space-y-3">
            {Object.entries(d?.statusBreakdown ?? {}).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs mb-1">
                  <StatusBadge status={status} />
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / statusTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <AdminCard padding="none">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-serif italic text-lg">Recent orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(d?.recentOrders ?? []).map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.orderNumber}</td>
                  <td>{o.customerName ?? "—"}</td>
                  <td className="text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge status={o.orderStatus} />
                  </td>
                  <td className="text-right tabular-nums">{format(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
