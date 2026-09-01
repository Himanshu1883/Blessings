import { RETURNS_ENABLED } from "@/lib/store-contact";
import {
  LayoutDashboard,
  Home,
  Package,
  ShoppingCart,
  Warehouse,
  FolderTree,
  Ticket,
  Megaphone,
  RotateCcw,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AdminTabId =
  | "dashboard"
  | "homepage"
  | "products"
  | "orders"
  | "inventory"
  | "categories"
  | "coupons"
  | "marketing"
  | "returns"
  | "settings";

export type AdminNavItem = {
  id: AdminTabId;
  label: string;
  path: `/admin/${AdminTabId}`;
  icon: LucideIcon;
  badgeKey?: "pendingOrders" | "pendingReturns" | "lowStock";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "homepage", label: "Homepage", path: "/admin/homepage", icon: Home },
  { id: "products", label: "Products", path: "/admin/products", icon: Package },
  { id: "orders", label: "Orders", path: "/admin/orders", icon: ShoppingCart, badgeKey: "pendingOrders" },
  { id: "inventory", label: "Inventory", path: "/admin/inventory", icon: Warehouse, badgeKey: "lowStock" },
  { id: "categories", label: "Categories", path: "/admin/categories", icon: FolderTree },
  { id: "coupons", label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { id: "marketing", label: "Marketing", path: "/admin/marketing", icon: Megaphone },
  ...(RETURNS_ENABLED
    ? [{ id: "returns" as const, label: "Returns", path: "/admin/returns" as const, icon: RotateCcw, badgeKey: "pendingReturns" as const }]
    : []),
  { id: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
];

export const ADMIN_TABS: AdminTabId[] = ADMIN_NAV.map((item) => item.id);

export function isValidAdminTab(tab: string): tab is AdminTabId {
  return (ADMIN_TABS as string[]).includes(tab);
}

export function tabLabel(tab: AdminTabId): string {
  return ADMIN_NAV.find((n) => n.id === tab)?.label ?? "Dashboard";
}
