import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

const paddingMap: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function AdminCard({
  children,
  className,
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  padding?: Padding;
}) {
  return (
    <div className={cn("admin-card", paddingMap[padding], className)}>
      {children}
    </div>
  );
}
