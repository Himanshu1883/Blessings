import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HomepageSection } from "@/lib/admin/types";
import type { useHomepageAdmin } from "@/hooks/useHomepageAdmin";

const SECTION_LABELS: Record<HomepageSection, string> = {
  sectionCopy: "Section copy",
  hero: "Hero",
  categories: "Categories",
  fabrics: "Fabrics",
  occasions: "Occasions",
  featured: "Featured products",
  instagram: "Instagram",
  reviews: "Reviews",
};

type Props = {
  section: HomepageSection;
  hook: ReturnType<typeof useHomepageAdmin>;
  hint?: string;
};

export function GenericCmsPanel({ section, hook, hint }: Props) {
  const [jsonText, setJsonText] = useState("{}");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const data = hook.content[section];
    setJsonText(JSON.stringify(data ?? {}, null, 2));
    setParseError(null);
  }, [hook.content, section]);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("JSON must be an object");
      }
      setParseError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setParseError(msg);
      toast.error(msg);
      return;
    }

    try {
      await hook.saveSection(section, parsed);
      toast.success(`${SECTION_LABELS[section]} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <AdminCard>
      <h3 className="font-serif italic text-lg mb-2">{SECTION_LABELS[section]}</h3>
      {hint && <p className="text-sm text-muted-foreground mb-4">{hint}</p>}
      <div className="space-y-2">
        <Label htmlFor={`cms-${section}`}>Section JSON</Label>
        <Textarea
          id={`cms-${section}`}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setParseError(null);
          }}
          rows={16}
          className="font-mono text-xs"
          spellCheck={false}
        />
        {parseError && <p className="text-xs text-destructive">{parseError}</p>}
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={hook.saving}>
          {hook.saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save {SECTION_LABELS[section].toLowerCase()}
        </Button>
      </div>
    </AdminCard>
  );
}
