import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageSpecHint } from "@/components/admin/homepage/ImageSpecHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { useHomepageAdmin } from "@/hooks/useHomepageAdmin";

type HeroData = {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  imageUrl?: string;
  videoUrl?: string;
  showOverlay?: boolean;
};

type Props = {
  hook: ReturnType<typeof useHomepageAdmin>;
};

export function HeroPanel({ hook }: Props) {
  const [form, setForm] = useState<HeroData>({});

  useEffect(() => {
    const raw = hook.content.hero;
    const data =
      raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as HeroData) : {};
    setForm(data);
  }, [hook.content.hero]);

  const save = async () => {
    try {
      await hook.saveSection("hero", form);
      toast.success("Hero section saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-[0_8px_28px_rgba(40,16,10,0.04)] sm:p-7">
      <div className="mb-6">
        <h3 className="profile-display text-2xl text-[color:var(--charcoal)]">Hero banner</h3>
        <p className="mt-1 text-sm text-foreground/50">First impression on the storefront. Headline, media, and buttons.</p>
      </div>
      <ImageSpecHint width={1920} height={1080} ratio="16:9" />

      <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hero-eyebrow">Eyebrow</Label>
            <Input
              id="hero-eyebrow"
              value={form.eyebrow ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-headline">Headline</Label>
            <Input
              id="hero-headline"
              value={form.headline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-sub">Subheadline</Label>
            <Textarea
              id="hero-sub"
              value={form.subheadline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))}
              rows={2}
              className="rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta1">Primary CTA</Label>
              <Input
                id="hero-cta1"
                value={form.ctaPrimaryLabel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ctaPrimaryLabel: e.target.value }))}
                placeholder="Shop now"
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta1-href">Primary link</Label>
              <Input
                id="hero-cta1-href"
                value={form.ctaPrimaryHref ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ctaPrimaryHref: e.target.value }))}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta2">Secondary CTA</Label>
              <Input
                id="hero-cta2"
                value={form.ctaSecondaryLabel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ctaSecondaryLabel: e.target.value }))}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta2-href">Secondary link</Label>
              <Input
                id="hero-cta2-href"
                value={form.ctaSecondaryHref ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ctaSecondaryHref: e.target.value }))}
                className="h-11 rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-image">Hero image URL</Label>
            <Input
              id="hero-image"
              value={form.imageUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-video">Hero video URL (optional)</Label>
            <Input
              id="hero-video"
              value={form.videoUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-foreground/8 px-4 py-3">
            <Label htmlFor="hero-overlay">Dark overlay on image</Label>
            <Switch
              id="hero-overlay"
              checked={form.showOverlay ?? true}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, showOverlay: checked }))}
            />
          </div>
        </div>

        <aside>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/40">Preview</p>
          <div className="overflow-hidden rounded-2xl border border-foreground/8 bg-[color:var(--charcoal)]">
            <div className="relative aspect-[16/10]">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#3d1a16] to-[#1a0908]" />
              )}
              {(form.showOverlay ?? true) ? (
                <div className="absolute inset-0 bg-black/45" />
              ) : null}
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                {form.eyebrow ? (
                  <p className="text-[8px] uppercase tracking-[0.22em] text-[color:var(--gold)]">{form.eyebrow}</p>
                ) : null}
                <p className="profile-display mt-1 line-clamp-3 text-lg text-white">
                  {form.headline || "Headline"}
                </p>
                {form.subheadline ? (
                  <p className="mt-1 line-clamp-2 text-[10px] text-white/70">{form.subheadline}</p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <Button
          onClick={save}
          disabled={hook.saving}
          className="h-11 rounded-lg bg-[color:var(--maroon)] px-6 hover:bg-[color:var(--maroon)]/90"
        >
          {hook.saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save hero
        </Button>
      </div>
    </div>
  );
}
