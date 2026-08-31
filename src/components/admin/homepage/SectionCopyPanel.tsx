import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  const [form, setForm] = useState<SectionCopyData>({});

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
    <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)] sm:p-7">
      <div className="mb-6">
        <h3 className="profile-display text-2xl text-[color:var(--charcoal)]">Section headings & copy</h3>
        <p className="mt-1 text-sm text-foreground/50">
          Shared eyebrow, title, and subtitle used across homepage sections.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sc-eyebrow">Eyebrow</Label>
          <Input
            id="sc-eyebrow"
            value={form.eyebrow ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
            placeholder="e.g. New Collection"
            className="h-11 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-title">Title</Label>
          <Input
            id="sc-title"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="h-11 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-subtitle">Subtitle</Label>
          <Textarea
            id="sc-subtitle"
            value={form.subtitle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            rows={3}
            className="rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sc-cta-label">CTA label</Label>
            <Input
              id="sc-cta-label"
              value={form.ctaLabel ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sc-cta-href">CTA link</Label>
            <Input
              id="sc-cta-href"
              value={form.ctaHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
              placeholder="/shop"
              className="h-11 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          onClick={save}
          disabled={hook.saving}
          className="h-11 rounded-lg bg-[color:var(--maroon)] px-6 hover:bg-[color:var(--maroon)]/90"
        >
          {hook.saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save section copy
        </Button>
      </div>
    </div>
  );
}
