import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
    <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)] sm:p-7">
      <div className="mb-6">
        <h3 className="profile-display text-2xl text-[color:var(--charcoal)]">{SECTION_LABELS[section]}</h3>
        {hint ? <p className="mt-1 text-sm text-foreground/50">{hint}</p> : null}
      </div>
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
          className="rounded-xl font-mono text-xs"
          spellCheck={false}
        />
        {parseError ? <p className="text-xs text-destructive">{parseError}</p> : null}
      </div>
      <div className="mt-6">
        <Button
          onClick={save}
          disabled={hook.saving}
          className="h-11 rounded-lg bg-[color:var(--maroon)] px-6 hover:bg-[color:var(--maroon)]/90"
        >
          {hook.saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save {SECTION_LABELS[section].toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
