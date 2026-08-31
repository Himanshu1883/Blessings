import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="profile-display text-4xl text-[color:var(--charcoal)] sm:text-5xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-foreground/50">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
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
    <div
      className={cn(
        "rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)]",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
          {icon}
        </div>
      ) : null}
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--charcoal)]">{value}</p>
      {trend ? (
        <p className={cn("mt-1 text-xs", trend.positive === false ? "text-destructive" : "text-emerald-700")}>
          {trend.value}
        </p>
      ) : null}
    </div>
  );
}
