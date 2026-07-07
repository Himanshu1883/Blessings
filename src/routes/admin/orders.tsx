import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ApiOrder } from "@/lib/api-types";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api.get<ApiOrder[]>("/api/admin/orders"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<ApiOrder>(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order updated");
    },
  });

  return (
    <div>
      <h1 className="font-serif italic text-3xl mb-8">Orders</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-foreground/10 text-left eyebrow text-[10px]">
              <th className="py-3 pr-4">Order</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Payment</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-foreground/5">
                <td className="py-4 pr-4 font-serif">{order.orderNumber}</td>
                <td className="py-4 pr-4 text-foreground/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="py-4 pr-4 tabular-nums">{format(order.total)}</td>
                <td className="py-4 pr-4 capitalize text-foreground/60">{order.paymentMethod}</td>
                <td className="py-4 pr-4">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                    className="bg-transparent border border-foreground/15 px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
