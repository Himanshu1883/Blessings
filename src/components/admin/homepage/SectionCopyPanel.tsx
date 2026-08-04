import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useHomepageAdmin } from "@/hooks/useHomepageAdmin";

type SectionCopyData = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type Props = {
  hook: ReturnType<typeof useHomepageAdmin>;
};

export function SectionCopyPanel({ hook }: Props) {
  const raw = hook.content.sectionCopy;
  const initial: SectionCopyData =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as SectionCopyData) : {};

  const [form, setForm] = useState<SectionCopyData>(initial);

  useEffect(() => {
    const data =
      hook.content.sectionCopy &&
      typeof hook.content.sectionCopy === "object" &&
      !Array.isArray(hook.content.sectionCopy)
        ? (hook.content.sectionCopy as SectionCopyData)
        : {};
    setForm(data);
  }, [hook.content.sectionCopy]);

  const save = async () => {
    try {
      await hook.saveSection("sectionCopy", form);
      toast.success("Section copy saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <AdminCard>
      <h3 className="font-serif italic text-lg mb-4">Section headings & copy</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Shared eyebrow, title, and subtitle text used across homepage sections.
      </p>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label htmlFor="sc-eyebrow">Eyebrow</Label>
          <Input
            id="sc-eyebrow"
            value={form.eyebrow ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
            placeholder="e.g. New Collection"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-title">Title</Label>
          <Input
            id="sc-title"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-subtitle">Subtitle</Label>
          <Textarea
            id="sc-subtitle"
            value={form.subtitle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sc-cta-label">CTA label</Label>
            <Input
              id="sc-cta-label"
              value={form.ctaLabel ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sc-cta-href">CTA link</Label>
            <Input
              id="sc-cta-href"
              value={form.ctaHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
              placeholder="/shop"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={save} disabled={hook.saving}>
          {hook.saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save section copy
        </Button>
      </div>
    </AdminCard>
  );
}
