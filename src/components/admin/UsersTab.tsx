import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
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
import { api } from "@/lib/api-client";
import { useCurrency } from "@/lib/currency";
import type { AdminUser, AdminUserDetail } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "user" | "admin";
type AuthFilter = "all" | "google" | "password" | "google_password";
type OrderFilter = "all" | "with" | "none";
type SortKey = "newest" | "oldest" | "spent" | "orders" | "name";

function signInLabel(user: Pick<AdminUser, "hasGoogle" | "hasPassword">) {
  if (user.hasGoogle && user.hasPassword) return "Google + password";
  if (user.hasGoogle) return "Google";
  if (user.hasPassword) return "Password";
  return "None";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UsersTab() {
  const { format } = useCurrency();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [authFilter, setAuthFilter] = useState<AuthFilter>("all");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.get<AdminUser[]>("/api/admin/users"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    api
      .get<AdminUserDetail>(`/api/admin/users/${selectedId}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const withOrders = users.filter((u) => u.orderCount > 0).length;
    const spent = users.reduce((s, u) => s + u.totalSpent, 0);
    return { total: users.length, admins, withOrders, spent };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (authFilter === "google" && !u.hasGoogle) return false;
      if (authFilter === "password" && !u.hasPassword) return false;
      if (authFilter === "google_password" && !(u.hasGoogle && u.hasPassword)) return false;
      if (orderFilter === "with" && u.orderCount < 1) return false;
      if (orderFilter === "none" && u.orderCount > 0) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "spent") return b.totalSpent - a.totalSpent;
      if (sort === "orders") return b.orderCount - a.orderCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [users, search, roleFilter, authFilter, orderFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, authFilter, orderFilter, sort, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Every customer and admin account, with orders and contact details."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Accounts" value={String(stats.total)} icon={<Users className="size-4" />} />
        <StatCard label="With orders" value={String(stats.withOrders)} icon={<ShoppingBag className="size-4" />} />
        <StatCard label="Admins" value={String(stats.admins)} icon={<Shield className="size-4" />} />
        <StatCard label="Lifetime spend" value={format(stats.spent)} />
      </div>

      <AdminCard padding="none">
        <div className="flex flex-col gap-3 border-b border-foreground/8 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or phone"
              className="h-10 pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">Customers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={authFilter} onValueChange={(v) => setAuthFilter(v as AuthFilter)}>
            <SelectTrigger className="h-10 w-[170px]">
              <SelectValue placeholder="Sign-in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sign-in</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="password">Password</SelectItem>
              <SelectItem value="google_password">Google + password</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orderFilter} onValueChange={(v) => setOrderFilter(v as OrderFilter)}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="with">Has orders</SelectItem>
              <SelectItem value="none">No orders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="orders">Most orders</SelectItem>
              <SelectItem value="spent">Highest spend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-foreground/8 bg-[color:var(--ivory)] text-[11px] uppercase tracking-[0.12em] text-foreground/45">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Sign-in</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Spend</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-foreground/50">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((user) => (
                  <tr key={user.id} className="border-b border-foreground/6 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatarUrl} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/40">
                            {user.role === "admin" ? "Admin" : "Customer"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      <p className="truncate">{user.email || "—"}</p>
                      <p className="text-xs text-foreground/45">{user.phone || "No phone"}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{signInLabel(user)}</td>
                    <td className="px-4 py-3 tabular-nums">{user.orderCount}</td>
                    <td className="px-4 py-3 tabular-nums">{format(user.totalSpent)}</td>
                    <td className="px-4 py-3 text-foreground/60">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedId(user.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </AdminCard>

      <AdminModal
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={detail?.name ?? "User"}
        size="xl"
      >
        {detailLoading || !detail ? (
          <p className="py-10 text-center text-sm text-foreground/50">Loading account…</p>
        ) : (
          <UserDetail user={detail} format={format} />
        )}
      </AdminModal>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src) {
    return <img src={src} alt="" className="size-9 rounded-full object-cover" />;
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[color:var(--gold)]/15 text-[11px] font-medium text-[color:var(--gold)]">
      {initials}
    </span>
  );
}

function UserDetail({
  user,
  format,
}: {
  user: AdminUserDetail;
  format: (n: number) => string;
}) {
  const [openOrders, setOpenOrders] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Avatar name={user.name} src={user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif italic text-2xl">{user.name}</h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]",
                user.role === "admin"
                  ? "bg-[color:var(--charcoal)] text-white"
                  : "bg-foreground/8 text-foreground/60",
              )}
            >
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/50">Joined {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Orders" value={String(user.orderCount)} />
        <MiniStat label="Spend" value={format(user.totalSpent)} />
        <MiniStat label="Addresses" value={String(user.addresses.length)} />
        <MiniStat label="Last order" value={formatDate(user.lastOrderAt)} />
      </div>

      <section>
        <h4 className="mb-3 text-[11px] uppercase tracking-[0.16em] text-foreground/40">Personal details</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow icon={<Mail className="size-3.5" />} label="Email" value={user.email ?? "—"} hint={user.emailVerified ? "Verified" : "Unverified"} />
          <DetailRow icon={<Phone className="size-3.5" />} label="Phone" value={user.phone ?? "—"} hint={user.phoneVerified ? "Verified" : "Unverified"} />
          <DetailRow icon={<Shield className="size-3.5" />} label="Sign-in" value={signInLabel(user)} />
          <DetailRow icon={<Users className="size-3.5" />} label="Account id" value={user.id} />
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-[11px] uppercase tracking-[0.16em] text-foreground/40">Addresses</h4>
        {user.addresses.length === 0 ? (
          <p className="text-sm text-foreground/50">No saved addresses.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {user.addresses.map((address, i) => (
              <div key={`${address.line1}-${i}`} className="rounded-xl border border-foreground/10 p-4 text-sm">
                <p className="mb-1 flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5 text-[color:var(--gold)]" />
                  {address.name}
                  {address.isDefault ? (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">Default</span>
                  ) : null}
                </p>
                <p className="text-foreground/65">{address.line1}</p>
                <p className="text-foreground/65">
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p className="mt-1 text-foreground/50">{address.phone}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setOpenOrders((v) => !v)}
          className="mb-3 flex w-full items-center justify-between text-[11px] uppercase tracking-[0.16em] text-foreground/40"
        >
          Orders ({user.orders.length})
          <ChevronDown className={cn("size-4 transition-transform", openOrders && "rotate-180")} />
        </button>
        {openOrders ? (
          user.orders.length === 0 ? (
            <p className="text-sm text-foreground/50">No orders yet.</p>
          ) : (
            <div className="divide-y divide-foreground/8 rounded-xl border border-foreground/10">
              {user.orders.map((order) => (
                <div key={order.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{order.orderNumber}</p>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">
                    {formatDate(order.createdAt)} · {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground/70">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.productId}-${item.size}`}>
                        {item.quantity}× {item.name} · {item.size}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm tabular-nums">{format(order.total)}</p>
                </div>
              ))}
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/8 bg-[color:var(--ivory)] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  hint,
}: {
  children: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-foreground/8 px-3 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground/40">
        {icon}
        {label}
      </p>
      <p className="break-all text-sm">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-foreground/45">{hint}</p> : null}
    </div>
  );
}
