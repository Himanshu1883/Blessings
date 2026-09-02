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
  Users,
  type LucideIcon,
} from "lucide-react";

/** Toggle admin sections without removing their tab implementations. */
export const ADMIN_HOMEPAGE_ENABLED = false;
export const ADMIN_MARKETING_ENABLED = false;

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
  | "settings"
  | "users";

export type AdminNavItem = {
  id: AdminTabId;
  label: string;
  path: `/admin/${AdminTabId}`;
  icon: LucideIcon;
  badgeKey?: "pendingOrders" | "pendingReturns" | "lowStock";
};

const ALL_TABS: AdminTabId[] = [
  "dashboard",
  "homepage",
  "products",
  "orders",
  "inventory",
  "categories",
  "coupons",
  "marketing",
  "returns",
  "settings",
  "users",
];

export function getAdminNav(returnsEnabled = RETURNS_ENABLED): AdminNavItem[] {
  return [
    { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ...(ADMIN_HOMEPAGE_ENABLED
      ? [{ id: "homepage" as const, label: "Homepage", path: "/admin/homepage" as const, icon: Home }]
      : []),
    { id: "products", label: "Products", path: "/admin/products", icon: Package },
    { id: "orders", label: "Orders", path: "/admin/orders", icon: ShoppingCart, badgeKey: "pendingOrders" },
    { id: "users", label: "Users", path: "/admin/users", icon: Users },
    { id: "inventory", label: "Inventory", path: "/admin/inventory", icon: Warehouse, badgeKey: "lowStock" },
    { id: "categories", label: "Categories", path: "/admin/categories", icon: FolderTree },
    { id: "coupons", label: "Coupons", path: "/admin/coupons", icon: Ticket },
    ...(ADMIN_MARKETING_ENABLED
      ? [{ id: "marketing" as const, label: "Marketing", path: "/admin/marketing" as const, icon: Megaphone }]
      : []),
    ...(returnsEnabled
      ? [
          {
            id: "returns" as const,
            label: "Returns",
            path: "/admin/returns" as const,
            icon: RotateCcw,
            badgeKey: "pendingReturns" as const,
          },
        ]
      : []),
    { id: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
  ];
}

export const ADMIN_NAV: AdminNavItem[] = getAdminNav();

export function isValidAdminTab(tab: string): tab is AdminTabId {
  return (ALL_TABS as string[]).includes(tab);
}

export function tabLabel(tab: AdminTabId): string {
  return getAdminNav(true).find((n) => n.id === tab)?.label ?? "Dashboard";
}
