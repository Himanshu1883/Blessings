import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminCard } from "./AdminCard";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <AdminCard className={cn("flex flex-col gap-2", className)} padding="md">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-[10px] text-muted-foreground">{label}</p>
        {icon && <span className="text-primary opacity-80">{icon}</span>}
      </div>
      <p className="font-serif text-2xl tabular-nums">{value}</p>
      {trend && (
        <p
          className={cn(
            "text-xs",
            trend.positive ? "text-emerald-deep" : "text-destructive",
          )}
        >
          {trend.value}
        </p>
      )}
    </AdminCard>
  );
}
