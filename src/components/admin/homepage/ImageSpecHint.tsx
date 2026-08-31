import { Info } from "lucide-react";

type Props = {
  width: number;
  height: number;
  ratio?: string;
  format?: string;
};

export function ImageSpecHint({ width, height, ratio, format = "JPG, PNG, or WebP" }: Props) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[color:var(--ivory)] px-3 py-2.5 text-xs text-foreground/55">
      <Info className="mt-0.5 size-3.5 shrink-0 text-[color:var(--gold)]" />
      <span>
        Recommended: <strong className="text-foreground/80">{width}×{height}px</strong>
        {ratio ? ` (${ratio})` : ""} · {format} · Max 5 MB
      </span>
    </p>
  );
}
