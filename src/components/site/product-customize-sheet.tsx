import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/lib/currency";
import type { StoreCustomField, StoreProduct } from "@/lib/catalog-api";
import { isSizeInStock } from "@/lib/catalog-api";
import { cn } from "@/lib/utils";
import { buildCustomOrderMessage, whatsappUrl } from "@/lib/whatsapp";

const COMMON_FABRICS = [
  "Silk",
  "Raw silk",
  "Dupion silk",
  "Velvet",
  "Brocade",
  "Jamewar",
  "Cotton",
  "Linen",
  "Wool blend",
];

const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve", label: "Sleeve" },
  { key: "length", label: "Length" },
] as const;

type Choice = { mode: "listed" | "custom"; listed: string; custom: string };

function emptyChoice(listed = ""): Choice {
  return { mode: listed ? "listed" : "custom", listed, custom: "" };
}

function choiceValue(choice: Choice) {
  if (choice.mode === "custom") return choice.custom.trim();
  return choice.listed.trim();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    const id = key.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(key);
  }
  return out;
}

function listOptions(value: unknown): string[] {
  if (Array.isArray(value)) return unique(value.map((v) => String(v)));
  if (typeof value === "string") {
    return unique(value.split(",").map((s) => s.trim()));
  }
  return [];
}

function fieldDefaultText(field: StoreCustomField) {
  if (typeof field.value === "boolean") return field.value ? "Yes" : "No";
  if (Array.isArray(field.value)) return field.value[0] ? String(field.value[0]) : "";
  if (field.value == null) return "";
  return String(field.value);
}

function customisableFields(product: StoreProduct) {
  return (product.customFields ?? []).filter((field) => {
    if (!field.showOnProductPage) return false;
    if (!field.label?.trim()) return false;
    return !["image", "video", "url"].includes(field.type);
  });
}

export function ProductCustomizeSheet({
  product,
  open,
  onOpenChange,
  initialSize,
  outOfStock,
}: {
  product: StoreProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSize?: string;
  outOfStock?: boolean;
}) {
  const { format } = useCurrency();
  const extraFields = useMemo(() => customisableFields(product), [product]);
  const fabricOptions = useMemo(
    () => unique([product.fabric, ...COMMON_FABRICS]),
    [product.fabric],
  );

  const [size, setSize] = useState<Choice>(emptyChoice(initialSize ?? product.sizes[0] ?? ""));
  const [color, setColor] = useState<Choice>(emptyChoice(product.colors[0] ?? ""));
  const [fabric, setFabric] = useState<Choice>(emptyChoice(product.fabric));
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<string, Choice>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const listedSize = initialSize && product.sizes.includes(initialSize)
      ? initialSize
      : (product.sizes[0] ?? "");
    setSize(emptyChoice(listedSize));
    setColor(emptyChoice(product.colors[0] ?? ""));
    setFabric(emptyChoice(product.fabric));
    setMeasurements({});
    setNotes("");
    const next: Record<string, Choice> = {};
    for (const field of extraFields) {
      const options = listOptions(field.value);
      next[field.id] = emptyChoice(options[0] ?? fieldDefaultText(field));
    }
    setExtras(next);
  }, [open, product.mongoId, product.sizes, product.colors, product.fabric, extraFields, initialSize]);

  const sizeLabel = () => {
    if (size.mode === "custom") {
      const parts = MEASUREMENT_FIELDS.map(({ key, label }) => {
        const v = measurements[key]?.trim();
        return v ? `${label} ${v}"` : null;
      }).filter(Boolean);
      const note = size.custom.trim();
      if (parts.length && note) return `Custom — ${parts.join(", ")} (${note})`;
      if (parts.length) return `Custom — ${parts.join(", ")}`;
      if (note) return `Custom — ${note}`;
      return "";
    }
    return size.listed;
  };

  const send = () => {
    const sizeValue = sizeLabel();
    if (!sizeValue) {
      toast.error("Choose a size or enter custom measurements.");
      return;
    }

    const lines = [
      { label: "Size", value: sizeValue },
      { label: "Color", value: choiceValue(color) },
      { label: "Fabric", value: choiceValue(fabric) },
      ...extraFields.map((field) => ({
        label: field.label,
        value: choiceValue(extras[field.id] ?? emptyChoice()),
      })),
    ];

    const href = whatsappUrl(
      buildCustomOrderMessage({
        productName: product.name,
        productUrl: typeof window !== "undefined" ? window.location.href : undefined,
        sku: product.sku,
        outOfStock,
        lines,
        notes,
      }),
    );
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg"
        data-lenis-prevent
      >
        <SheetHeader className="border-b border-foreground/10 px-5 py-5 text-left sm:px-6">
          <SheetTitle className="font-serif text-2xl italic">Customise this piece</SheetTitle>
          <SheetDescription className="text-sm text-foreground/60">
            Choose from the atelier options or type your own. Custom orders are confirmed on
            WhatsApp.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-6 flex gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className="size-16 shrink-0 object-cover bg-[color:var(--muted)]"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight">{product.name}</p>
              <p className="mt-1 font-serif tabular-nums text-[color:var(--maroon)]">
                {format(product.price)}
              </p>
              {outOfStock ? (
                <p className="mt-1 text-[11px] text-[color:var(--maroon)]">
                  Currently out of stock — made to order.
                </p>
              ) : null}
            </div>
          </div>

          <ChoiceField
            label="Size"
            options={product.sizes}
            choice={size}
            onChange={setSize}
            customPlaceholder="e.g. Made to measure, plus size, kids"
            optionMeta={(opt) =>
              !isSizeInStock(product, opt) ? "Out of stock" : undefined
            }
          />

          {size.mode === "custom" ? (
            <div className="mb-6">
              <p className="eyebrow mb-2 text-[10px] text-foreground/45">Measurements (inches)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.map(({ key, label }) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[11px] text-foreground/50">{label}</span>
                    <Input
                      inputMode="decimal"
                      value={measurements[key] ?? ""}
                      onChange={(e) =>
                        setMeasurements((m) => ({ ...m, [key]: e.target.value }))
                      }
                      placeholder="—"
                      className="h-10 rounded-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <ChoiceField
            label="Color"
            options={product.colors}
            choice={color}
            onChange={setColor}
            customPlaceholder="Describe the colour, embroidery, or contrast"
          />

          <ChoiceField
            label="Fabric"
            options={fabricOptions}
            choice={fabric}
            onChange={setFabric}
            customPlaceholder="e.g. Ivory raw silk with gold zardosi"
          />

          {extraFields.map((field) => {
            const options = listOptions(field.value);
            const isBoolean = field.type === "boolean";
            return (
              <ChoiceField
                key={field.id}
                label={field.label}
                options={isBoolean ? ["Yes", "No"] : options}
                choice={extras[field.id] ?? emptyChoice()}
                onChange={(next) => setExtras((prev) => ({ ...prev, [field.id]: next }))}
                customPlaceholder={`Your ${field.label.toLowerCase()}`}
                hideCustom={isBoolean}
              />
            );
          })}

          <div>
            <p className="eyebrow mb-2 text-[10px]">Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Occasion, date, city, fit preference, or anything the atelier should know."
              className="rounded-none"
            />
          </div>
        </div>

        <div className="border-t border-foreground/10 bg-[color:var(--ivory)] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={send}
            className="flex w-full items-center justify-center gap-2 bg-[color:var(--charcoal)] py-4 eyebrow text-[10px] tracking-[0.18em] text-[color:var(--ivory)] transition-colors hover:bg-[color:var(--maroon)]"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" />
            Send on WhatsApp
          </button>
          <p className="mt-2 text-center text-[11px] text-foreground/45">
            Opens WhatsApp with your selections. No payment is taken here.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChoiceField({
  label,
  options,
  choice,
  onChange,
  customPlaceholder,
  hideCustom = false,
  optionMeta,
}: {
  label: string;
  options: string[];
  choice: Choice;
  onChange: (next: Choice) => void;
  customPlaceholder: string;
  hideCustom?: boolean;
  optionMeta?: (option: string) => string | undefined;
}) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-2 text-[10px]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const meta = optionMeta?.(option);
          const selected = choice.mode === "listed" && choice.listed === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange({ mode: "listed", listed: option, custom: choice.custom })}
              className={cn(
                "border px-3 py-2 text-[12px] transition-colors",
                selected
                  ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-[color:var(--ivory)]"
                  : "border-foreground/15 hover:border-foreground/40",
              )}
            >
              {option}
              {meta ? (
                <span className={cn("ml-1 text-[10px]", selected ? "text-white/70" : "text-foreground/40")}>
                  · {meta}
                </span>
              ) : null}
            </button>
          );
        })}
        {!hideCustom ? (
          <button
            type="button"
            onClick={() =>
              onChange({
                mode: "custom",
                listed: choice.listed,
                custom: choice.custom,
              })
            }
            className={cn(
              "border px-3 py-2 text-[12px] transition-colors",
              choice.mode === "custom"
                ? "border-[color:var(--maroon)] bg-[color:var(--maroon)] text-[color:var(--ivory)]"
                : "border-dashed border-foreground/25 hover:border-[color:var(--maroon)]",
            )}
          >
            Custom
          </button>
        ) : null}
      </div>
      {choice.mode === "custom" && !hideCustom ? (
        <Input
          value={choice.custom}
          onChange={(e) => onChange({ ...choice, mode: "custom", custom: e.target.value })}
          placeholder={customPlaceholder}
          className="mt-2 h-10 rounded-none"
        />
      ) : null}
    </div>
  );
}
