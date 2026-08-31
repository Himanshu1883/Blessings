import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = [10, 20, 50],
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const windowed: number[] = [];
  const windowSize = 5;
  let from = Math.max(1, page - 2);
  const to = Math.min(pageCount, from + windowSize - 1);
  from = Math.max(1, to - windowSize + 1);
  for (let i = from; i <= to; i++) windowed.push(i);

  return (
    <div className="flex flex-col gap-3 border-t border-foreground/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-foreground/50">
        Showing <span className="font-medium text-foreground/70">{start}–{end}</span> of{" "}
        <span className="font-medium text-foreground/70">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSize ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-foreground/12 bg-white px-2 text-xs text-foreground/70"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-foreground/12 bg-white text-foreground/60 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          {windowed.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-xs font-medium",
                n === page
                  ? "bg-[color:var(--maroon)] text-white"
                  : "border border-foreground/12 bg-white text-foreground/70 hover:border-foreground/25",
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-foreground/12 bg-white text-foreground/60 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
