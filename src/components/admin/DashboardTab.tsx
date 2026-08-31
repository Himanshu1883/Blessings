import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Lightbulb,
  LogOut,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { useAdminApi } from "@/hooks/useAdminApi";

type Props = Pick<ReturnType<typeof useAdminApi>, "data" | "loading" | "error" | "reload">;

const STATUS_LEGEND = [
  { key: "pending", label: "Pending", color: "#E2B93B", statuses: ["placed", "confirmed", "cancel_requested"] },
  { key: "processing", label: "Processing", color: "#5B8DEF", statuses: ["processing"] },
  { key: "shipped", label: "Shipped", color: "#8FCB8F", statuses: ["shipped", "in_transit"] },
  { key: "delivered", label: "Delivered", color: "#2D6A4F", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", color: "#C44536", statuses: ["cancelled", "returned"] },
] as const;

function Sparkline({ values }: { values: number[] }) {
  const pts = values.length >= 2 ? values : [4, 6, 5, 8, 7, 9, 6];
  const max = Math.max(...pts, 1);
  const w = 140;
  const h = 36;
  const d = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 4 - (p / max) * (h - 8);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-8 w-full text-foreground/12" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" points={d} />
    </svg>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  hintPositive,
  spark,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  hintPositive?: boolean;
  spark: number[];
}) {
  return (
    <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)]">
      <div className="flex size-9 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--charcoal)] sm:text-[1.65rem]">{value}</p>
      <p className={cn("mt-1 text-xs", hintPositive === false ? "text-destructive" : "text-emerald-700")}>{hint}</p>
      <Sparkline values={spark} />
    </div>
  );
}

function PeriodChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-foreground/10 bg-[color:var(--ivory)] px-2.5 py-1 text-[11px] text-foreground/60">
      This Week
      <ChevronDown className="size-3" strokeWidth={1.6} />
    </span>
  );
}

export function DashboardTab({ data, loading, error, reload }: Props) {
  const { formatInr } = useCurrency();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const d = data.dashboard;

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const spark = (d?.revenueByDay ?? []).map((x) => x.revenue);
  const weekChange = d?.weekChangePercent ?? 0;
  const statusBreakdown = d?.statusBreakdown ?? {};
  const legend = STATUS_LEGEND.map((row) => ({
    ...row,
    count: row.statuses.reduce((sum, key) => sum + (statusBreakdown[key] ?? 0), 0),
  }));
  const orderTotal = legend.reduce((s, r) => s + r.count, 0);
  const pieData =
    orderTotal > 0 ? legend.filter((r) => r.count > 0) : [{ key: "empty", label: "None", color: "#E8DFD4", count: 1 }];
  const hasRevenue = spark.some((v) => v > 0);
  const recent = d?.recentOrders ?? [];
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="-mt-1">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="profile-display text-4xl text-[color:var(--charcoal)] sm:text-5xl">Dashboard</h1>
          <p className="mt-2 text-sm text-foreground/50">Overview of store performance and recent activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <p className="flex items-center gap-1.5 text-xs text-foreground/50">
            <CalendarDays className="size-3.5" strokeWidth={1.6} />
            {todayLabel}
          </p>
          <Link
            to="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#EDE4D8] px-3 text-xs font-medium text-[color:var(--charcoal)]"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.6} />
            View Store
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-foreground/70 hover:bg-foreground/5"
          >
            <LogOut className="size-3.5" strokeWidth={1.6} />
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Link to="/admin/$tab" params={{ tab: "products" }}>
          <Button className="h-10 gap-1.5 rounded-lg bg-[color:var(--maroon)] px-4 hover:bg-[color:var(--maroon)]/90">
            <Plus className="size-4" strokeWidth={1.75} />
            Add Product
          </Button>
        </Link>
        <Link to="/admin/$tab" params={{ tab: "orders" }}>
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-lg border-foreground/15 bg-white px-4"
          >
            <CalendarDays className="size-4" strokeWidth={1.6} />
            View Orders
          </Button>
        </Link>
      </div>

      {(d?.lowStockCount ?? 0) > 0 && (
        <div className="mt-6 rounded-2xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/8 px-5 py-3 text-sm">
          <span className="font-medium">{d?.lowStockCount} products</span> are low on stock.{" "}
          <Link
            to="/admin/$tab"
            params={{ tab: "inventory" }}
            className="text-[color:var(--maroon)] underline-offset-4 hover:underline"
          >
            Manage inventory →
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<IndianRupee className="size-4" strokeWidth={1.6} />}
          label="Total Revenue"
          value={formatInr(d?.totalRevenue ?? 0)}
          hint={`${weekChange}% vs last week`}
          hintPositive={weekChange >= 0}
          spark={spark}
        />
        <KpiCard
          icon={<ShoppingCart className="size-4" strokeWidth={1.6} />}
          label="Orders This Week"
          value={String(d?.ordersThisWeek ?? 0)}
          hint={`${weekChange}% vs last week`}
          hintPositive={weekChange >= 0}
          spark={spark}
        />
        <KpiCard
          icon={<Package className="size-4" strokeWidth={1.6} />}
          label="Products"
          value={String(d?.productCount ?? 0)}
          hint="Total products"
          hintPositive
          spark={spark}
        />
        <KpiCard
          icon={<TrendingUp className="size-4" strokeWidth={1.6} />}
          label="Today's Sales"
          value={formatInr(d?.todaysSales ?? 0)}
          hint="Paid today"
          hintPositive
          spark={spark}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="profile-display text-2xl text-[color:var(--charcoal)]">7-day revenue</h2>
            <PeriodChip />
          </div>
          {hasRevenue ? (
            <div className="flex h-52 items-end gap-2">
              {(d?.revenueByDay ?? []).map((day) => {
                const max = Math.max(...spark, 1);
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full min-h-1 rounded-t-md bg-[color:var(--maroon)]/80"
                      style={{ height: `${Math.max(6, (day.revenue / max) * 100)}%` }}
                      title={formatInr(day.revenue)}
                    />
                    <span className="text-[9px] text-foreground/40">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <div className="relative mb-4 text-foreground/20">
                <BarChart3 className="size-16" strokeWidth={1.1} />
                <Lightbulb className="absolute -right-1 -top-1 size-5 text-[color:var(--gold)]/70" strokeWidth={1.6} />
              </div>
              <p className="text-sm font-medium text-foreground/70">No revenue data yet.</p>
              <p className="mt-1 max-w-xs text-xs text-foreground/45">
                Your revenue insights will appear here once there is data to show.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="profile-display text-2xl text-[color:var(--charcoal)]">Order status</h2>
            <PeriodChip />
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative size-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={orderTotal > 0 ? 2 : 0}
                    stroke="none"
                  >
                    {pieData.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-semibold tabular-nums">{orderTotal}</p>
                <p className="text-[10px] uppercase tracking-wider text-foreground/40">Orders</p>
              </div>
            </div>
            <ul className="w-full space-y-2.5 text-sm">
              {legend.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-foreground/70">
                    <span className="size-2.5 rounded-full" style={{ background: row.color }} />
                    {row.label}
                  </span>
                  <span className="tabular-nums text-foreground/50">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
          {orderTotal === 0 ? (
            <p className="mt-4 text-center text-xs text-foreground/40">
              No order data yet. Order status will appear here once orders are placed.
            </p>
          ) : null}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-foreground/8 bg-white shadow-[0_8px_28px_rgba(40,16,10,0.04)]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <h2 className="profile-display text-2xl text-[color:var(--charcoal)]">Recent orders</h2>
          <Link
            to="/admin/$tab"
            params={{ tab: "orders" }}
            className="inline-flex items-center gap-0.5 text-sm text-foreground/55 hover:text-[color:var(--maroon)]"
          >
            View all orders
            <ChevronRight className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 pb-12 text-center">
            <ShoppingBag className="mb-4 size-14 text-foreground/15" strokeWidth={1.1} />
            <p className="text-sm font-medium text-foreground/70">No orders found.</p>
            <p className="mt-1 max-w-sm text-xs text-foreground/45">
              When you receive orders, they will show up here.
            </p>
          </div>
        ) : (
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
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium">{o.orderNumber}</td>
                    <td>{o.customerName ?? "—"}</td>
                    <td className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="text-right tabular-nums">{formatInr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
