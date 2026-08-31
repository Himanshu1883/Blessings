import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminProductActions({
  onEdit,
  onDelete,
  disabled,
  layout = "stack",
  tone = "light",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  layout?: "stack" | "row";
  tone?: "light" | "onDark";
}) {
  if (!onEdit && !onDelete) return null;

  const chip = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 eyebrow text-[9px] tracking-[0.16em] transition-colors disabled:opacity-50",
    tone === "onDark"
      ? "border border-[color:var(--gold)]/45 bg-black/35 text-[color:var(--gold-soft)] hover:border-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--charcoal)]"
      : "border border-foreground/12 bg-white/95 text-[color:var(--charcoal)] shadow-sm backdrop-blur-sm hover:border-[color:var(--charcoal)] hover:bg-[color:var(--charcoal)] hover:text-[color:var(--ivory)]",
  );

  return (
    <div
      className={cn(
        "flex",
        layout === "stack" ? "flex-col items-end gap-1.5" : "flex-row flex-wrap items-center gap-2",
      )}
    >
      {onEdit && (
        <button
          type="button"
          aria-label="Edit product"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className={chip}
        >
          <Pencil className="size-3" strokeWidth={1.5} />
          Edit
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete product"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            chip,
            "hover:border-[color:var(--maroon)] hover:bg-[color:var(--maroon)] hover:text-[color:var(--ivory)]",
          )}
        >
          <Trash2 className="size-3" strokeWidth={1.5} />
          Delete
        </button>
      )}
    </div>
  );
}
