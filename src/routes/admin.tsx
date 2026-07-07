import { createFileRoute, Link, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const links = [
  { to: "/admin" as const, label: "Dashboard" },
  { to: "/admin/products" as const, label: "Products" },
  { to: "/admin/categories" as const, label: "Categories" },
  { to: "/admin/orders" as const, label: "Orders" },
];

function AdminLayout() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">Loading…</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 bg-[color:var(--charcoal)] text-[color:var(--ivory)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="font-serif italic text-xl">Blessings Admin</Link>
          <Link to="/" className="eyebrow text-[10px] hover:text-[color:var(--gold)]">← Storefront</Link>
        </div>
        <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 flex gap-6 overflow-x-auto pb-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="eyebrow text-[10px] whitespace-nowrap opacity-70 hover:opacity-100 data-[status=active]:opacity-100 data-[status=active]:border-b data-[status=active]:border-[color:var(--gold)] pb-1"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
