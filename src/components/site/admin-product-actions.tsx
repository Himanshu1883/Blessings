import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const chip =
  "inline-flex h-8 items-center gap-1.5 border border-foreground/12 bg-[color:var(--ivory)]/95 px-2.5 backdrop-blur-sm eyebrow text-[9px] tracking-[0.16em] text-[color:var(--charcoal)] transition-colors disabled:opacity-50";

export function AdminProductActions({
  onEdit,
  onDelete,
  disabled,
  layout = "stack",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  layout?: "stack" | "row";
}) {
  if (!onEdit && !onDelete) return null;

  return (
    <div
      className={cn(
        "flex",
        layout === "stack" ? "flex-col items-end gap-1.5" : "flex-row items-center gap-2",
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
          className={cn(chip, "hover:border-[color:var(--charcoal)] hover:bg-[color:var(--charcoal)] hover:text-[color:var(--ivory)]")}
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
          className={cn(chip, "hover:border-[color:var(--maroon)] hover:bg-[color:var(--maroon)] hover:text-[color:var(--ivory)]")}
        >
          <Trash2 className="size-3" strokeWidth={1.5} />
          Delete
        </button>
      )}
    </div>
  );
}
