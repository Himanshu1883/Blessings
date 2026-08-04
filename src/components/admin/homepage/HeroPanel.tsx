import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui/AdminCard";
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
    <AdminCard>
      <h3 className="font-serif italic text-lg mb-2">Hero banner</h3>
      <ImageSpecHint width={1920} height={1080} ratio="16:9" />
      <div className="space-y-4 max-w-xl mt-6">
        <div className="space-y-1.5">
          <Label htmlFor="hero-eyebrow">Eyebrow</Label>
          <Input
            id="hero-eyebrow"
            value={form.eyebrow ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-headline">Headline</Label>
          <Input
            id="hero-headline"
            value={form.headline ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-sub">Subheadline</Label>
          <Textarea
            id="hero-sub"
            value={form.subheadline ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))}
            rows={2}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="hero-cta1">Primary CTA</Label>
            <Input
              id="hero-cta1"
              value={form.ctaPrimaryLabel ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaPrimaryLabel: e.target.value }))}
              placeholder="Shop now"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-cta1-href">Primary link</Label>
            <Input
              id="hero-cta1-href"
              value={form.ctaPrimaryHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaPrimaryHref: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-cta2">Secondary CTA</Label>
            <Input
              id="hero-cta2"
              value={form.ctaSecondaryLabel ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaSecondaryLabel: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-cta2-href">Secondary link</Label>
            <Input
              id="hero-cta2-href"
              value={form.ctaSecondaryHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ctaSecondaryHref: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-image">Hero image URL</Label>
          <Input
            id="hero-image"
            value={form.imageUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-video">Hero video URL (optional)</Label>
          <Input
            id="hero-video"
            value={form.videoUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="hero-overlay">Dark overlay on image</Label>
          <Switch
            id="hero-overlay"
            checked={form.showOverlay ?? true}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, showOverlay: checked }))}
          />
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={save} disabled={hook.saving}>
          {hook.saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save hero
        </Button>
      </div>
    </AdminCard>
  );
}
