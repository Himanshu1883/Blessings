import type { ReactNode } from "react";
import { RequireAdmin } from "@/lib/require-auth";

export function AdminProtected({ children }: { children: ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
