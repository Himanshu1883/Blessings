import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldType, ProductCustomField } from "@/lib/admin/types";

const FIELD_TYPES: CustomFieldType[] = [
  "text",
  "textarea",
  "number",
  "boolean",
  "list",
  "url",
  "image",
  "video",
];

function defaultValueForType(type: CustomFieldType): ProductCustomField["value"] {
  if (type === "number") return 0;
  if (type === "boolean") return false;
  if (type === "list") return [] as string[];
  return "";
}

function newField(): ProductCustomField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "text",
    value: "",
    showOnProductPage: true,
  };
}

type Props = {
  fields: ProductCustomField[];
  onChange: (fields: ProductCustomField[]) => void;
};

export function ProductCustomFieldsEditor({ fields, onChange }: Props) {
  const update = (id: string, patch: Partial<ProductCustomField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const copy = [...fields];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };

  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));

  const onTypeChange = (id: string, type: CustomFieldType) => {
    update(id, { type, value: defaultValueForType(type) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Custom fields</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...fields, newField()])}>
          <Plus className="size-3.5 mr-1" />
          Add field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No custom fields yet.</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
          <div className="flex items-start justify-between gap-2">
            <p className="eyebrow text-[10px] text-muted-foreground">Field {index + 1}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move up"
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move down"
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                onClick={() => remove(field.id)}
                aria-label="Remove field"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`cf-label-${field.id}`}>Label</Label>
              <Input
                id={`cf-label-${field.id}`}
                value={field.label}
                onChange={(e) => update(field.id, { label: e.target.value })}
                placeholder="Field label"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={field.type} onValueChange={(v) => onTypeChange(field.id, v as CustomFieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Value</Label>
            {field.type === "textarea" ? (
              <Textarea
                value={String(field.value)}
                onChange={(e) => update(field.id, { value: e.target.value })}
                rows={3}
              />
            ) : field.type === "boolean" ? (
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => update(field.id, { value: checked })}
                />
                <span className="text-sm text-muted-foreground">{field.value ? "Yes" : "No"}</span>
              </div>
            ) : field.type === "list" ? (
              <Input
                value={Array.isArray(field.value) ? field.value.join(", ") : String(field.value)}
                onChange={(e) =>
                  update(field.id, {
                    value: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Comma-separated values"
              />
            ) : (
              <Input
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                value={String(field.value)}
                onChange={(e) =>
                  update(field.id, {
                    value: field.type === "number" ? Number(e.target.value) : e.target.value,
                  })
                }
                placeholder={
                  field.type === "image"
                    ? "Image URL"
                    : field.type === "video"
                      ? "Video URL"
                      : field.type === "url"
                        ? "https://"
                        : "Value"
                }
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`cf-show-${field.id}`} className="text-sm">
              Show on product page
            </Label>
            <Switch
              id={`cf-show-${field.id}`}
              checked={field.showOnProductPage}
              onCheckedChange={(checked) => update(field.id, { showOnProductPage: checked })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
