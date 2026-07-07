import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { format } = useCurrency();
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () =>
      api.get<{ ordersToday: number; totalRevenue: number; lowStockCount: number }>("/api/admin/stats"),
  });

  return (
    <div>
      <h1 className="font-serif italic text-3xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Orders today" value={String(stats?.ordersToday ?? 0)} />
        <StatCard label="Total revenue" value={format(stats?.totalRevenue ?? 0)} />
        <StatCard label="Low stock items" value={String(stats?.lowStockCount ?? 0)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/10 p-6">
      <p className="eyebrow text-[10px] text-foreground/50">{label}</p>
      <p className="font-serif text-2xl mt-2 tabular-nums">{value}</p>
    </div>
  );
}
