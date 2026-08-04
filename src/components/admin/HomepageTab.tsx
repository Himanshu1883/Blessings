import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { GenericCmsPanel } from "@/components/admin/homepage/GenericCmsPanel";
import { HeroPanel } from "@/components/admin/homepage/HeroPanel";
import { SectionCopyPanel } from "@/components/admin/homepage/SectionCopyPanel";
import { cn } from "@/lib/utils";
import type { HomepageSection } from "@/lib/admin/types";
import { useHomepageAdmin } from "@/hooks/useHomepageAdmin";

const SECTIONS: Array<{ id: HomepageSection | "sectionCopy" | "hero"; label: string }> = [
  { id: "sectionCopy", label: "Copy" },
  { id: "hero", label: "Hero" },
  { id: "categories", label: "Categories" },
  { id: "fabrics", label: "Fabrics" },
  { id: "occasions", label: "Occasions" },
  { id: "featured", label: "Featured" },
  { id: "instagram", label: "Instagram" },
  { id: "reviews", label: "Reviews" },
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

  if (hook.loading) return <AdminSkeleton />;
  if (hook.error) return <AdminErrorState message={hook.error} onRetry={hook.reload} />;

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Edit hero, section copy, and CMS blocks for the storefront homepage."
      />

      <nav className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {active === "sectionCopy" && <SectionCopyPanel hook={hook} />}
      {active === "hero" && <HeroPanel hook={hook} />}
      {active !== "sectionCopy" && active !== "hero" && (
        <GenericCmsPanel
          section={active}
          hook={hook}
          hint={GENERIC_HINTS[active]}
        />
      )}
    </div>
  );
}
