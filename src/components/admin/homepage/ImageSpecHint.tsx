import { Info } from "lucide-react";

type Props = {
  width: number;
  height: number;
  ratio?: string;
  format?: string;
};

export function ImageSpecHint({ width, height, ratio, format = "JPG, PNG, or WebP" }: Props) {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
      <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
      <span>
        Recommended: <strong>{width}×{height}px</strong>
        {ratio ? ` (${ratio})` : ""} · {format} · Max 5 MB
      </span>
    </p>
  );
}
