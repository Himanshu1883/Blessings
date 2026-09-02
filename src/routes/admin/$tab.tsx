import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AdminProtected } from "@/components/admin/AdminProtected";
import { AdminShell } from "@/components/admin/ui/AdminShell";
import { isValidAdminTab, ADMIN_HOMEPAGE_ENABLED, ADMIN_MARKETING_ENABLED, type AdminTabId } from "@/components/admin/adminNav";
import { useStoreSettings } from "@/lib/store-settings-context";
import { useAdminApi } from "@/hooks/useAdminApi";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { InventoryTab } from "@/components/admin/InventoryTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { CouponsTab } from "@/components/admin/CouponsTab";
import { ReturnsTab } from "@/components/admin/ReturnsTab";
import { MarketingTab } from "@/components/admin/MarketingTab";
import { HomepageTab } from "@/components/admin/HomepageTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { UsersTab } from "@/components/admin/UsersTab";

export const Route = createFileRoute("/admin/$tab")({
  component: AdminPage,
});

function AdminPage() {
  const { tab } = Route.useParams();
  const { returnsEnabled } = useStoreSettings();
  const activeTab: AdminTabId = isValidAdminTab(tab) ? tab : "dashboard";

  if (tab === "returns" && !returnsEnabled) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if ((tab === "homepage" && !ADMIN_HOMEPAGE_ENABLED) || (tab === "marketing" && !ADMIN_MARKETING_ENABLED)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isValidAdminTab(tab)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminProtected>
      <AdminPageContent activeTab={activeTab} />
    </AdminProtected>
  );
}

function AdminPageContent({ activeTab }: { activeTab: AdminTabId }) {
  const api = useAdminApi();
  const badges = {
    pendingOrders: api.data.dashboard?.pendingOrders,
    pendingReturns: api.data.dashboard?.pendingReturns,
    lowStock: api.data.dashboard?.lowStockCount,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab data={api.data} loading={api.loading} error={api.error} reload={api.reload} />;
      case "products":
        return <ProductsTab api={api} />;
      case "orders":
        return <OrdersTab api={api} />;
      case "inventory":
        return <InventoryTab api={api} />;
      case "categories":
        return <CategoriesTab api={api} />;
      case "coupons":
        return <CouponsTab api={api} />;
      case "returns":
        return <ReturnsTab api={api} />;
      case "marketing":
        return <MarketingTab api={api} />;
      case "homepage":
        return <HomepageTab />;
      case "settings":
        return <SettingsTab />;
      case "users":
        return <UsersTab />;
      default:
        return null;
    }
  };

  return (
    <AdminShell activeTab={activeTab} badges={badges}>
      {renderTab()}
    </AdminShell>
  );
}
