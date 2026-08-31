import { useState } from "react";
import {
  CalendarDays,
  Camera,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Layers,
  MessageSquareQuote,
  Star,
  Type,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { GenericCmsPanel } from "@/components/admin/homepage/GenericCmsPanel";
import { HeroPanel } from "@/components/admin/homepage/HeroPanel";
import { SectionCopyPanel } from "@/components/admin/homepage/SectionCopyPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomepageSection } from "@/lib/admin/types";
import { useHomepageAdmin } from "@/hooks/useHomepageAdmin";

const SECTIONS: Array<{
  id: HomepageSection | "sectionCopy" | "hero";
  label: string;
  hint: string;
  icon: typeof ImageIcon;
}> = [
  { id: "hero", label: "Hero", hint: "Banner, headline, CTAs", icon: ImageIcon },
  { id: "sectionCopy", label: "Copy", hint: "Shared titles & intro", icon: Type },
  { id: "categories", label: "Categories", hint: "Shop-by-category tiles", icon: LayoutGrid },
  { id: "fabrics", label: "Fabrics", hint: "Fabric swatches", icon: Layers },
  { id: "occasions", label: "Occasions", hint: "Occasion cards", icon: CalendarDays },
  { id: "featured", label: "Featured", hint: "Curated products", icon: Star },
  { id: "instagram", label: "Instagram", hint: "Social strip", icon: Camera },
  { id: "reviews", label: "Reviews", hint: "Customer quotes", icon: MessageSquareQuote },
];

const GENERIC_HINTS: Partial<Record<HomepageSection, string>> = {
  categories: "Array of { slug, title, imageUrl } objects for category tiles.",
  fabrics: "Array of { name, imageUrl, href } fabric swatches.",
  occasions: "Array of { title, subtitle, imageUrl, href } occasion cards.",
  featured: "{ productIds: string[], title?: string } for curated products.",
  instagram: "{ handle: string, postUrls: string[] } for the Instagram strip.",
  reviews: "Array of { author, rating, text, date } customer reviews.",
};

export function HomepageTab() {
  const hook = useHomepageAdmin();
  const [active, setActive] = useState<HomepageSection | "sectionCopy" | "hero">("hero");
  const current = SECTIONS.find((s) => s.id === active);

  if (hook.loading) return <AdminSkeleton />;
  if (hook.error) return <AdminErrorState message={hook.error} onRetry={hook.reload} />;

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Edit the storefront: hero, copy, and each homepage block."
        actions={
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" className="h-10 gap-1.5 rounded-lg border-foreground/15 bg-white">
              <ExternalLink className="size-3.5" />
              View storefront
            </Button>
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex min-w-[9.5rem] items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors lg:min-w-0",
                  on
                    ? "border-[color:var(--maroon)]/30 bg-white shadow-[0_8px_28px_rgba(40,16,10,0.05)]"
                    : "border-transparent bg-white/60 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    on ? "bg-[color:var(--maroon)] text-white" : "bg-[color:var(--gold)]/15 text-[color:var(--gold)]",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-[color:var(--charcoal)]">{s.label}</span>
                  <span className="mt-0.5 hidden text-[11px] text-foreground/45 lg:block">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div>
          {current ? (
            <p className="mb-4 text-xs text-foreground/45 lg:hidden">
              Editing <span className="font-medium text-foreground/70">{current.label}</span>
            </p>
          ) : null}
          {active === "sectionCopy" && <SectionCopyPanel hook={hook} />}
          {active === "hero" && <HeroPanel hook={hook} />}
          {active !== "sectionCopy" && active !== "hero" && (
            <GenericCmsPanel section={active} hook={hook} hint={GENERIC_HINTS[active]} />
          )}
        </div>
      </div>
    </div>
  );
}
