import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, LayoutGrid, Shirt } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCategories, useProducts } from "@/lib/api-hooks";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";
import { resolveMediaUrl } from "@/lib/api-client";

const PAGES = [
  { label: "About the House", to: "/about" as const },
  { label: "Bespoke Tailoring", to: "/bespoke" as const },
  { label: "Book a Consultation", to: "/contact" as const },
  { label: "Journal", to: "/journal" as const },
];

export function SearchDialog() {
  const { panel, closePanel, openPanel } = useShop();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const open = panel === "search";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPanel("search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPanel]);

  const go = (to: "/about" | "/bespoke" | "/contact" | "/journal" | "/product/$id" | "/shop/$category", params?: { id: string } | { category: string }) => {
    closePanel();
    navigate({ to, params } as never);
  };

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && closePanel()}>
      <CommandInput placeholder="Search collections, pieces, pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Products">
          {products.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.fabric} ${p.categorySlug}`}
              onSelect={() => go("/product/$id", { id: p.slug })}
              className="gap-3"
            >
              <img src={resolveMediaUrl(p.imageUrl) ?? ""} alt="" className="size-10 object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.fabric}</p>
              </div>
              <span className="text-xs tabular-nums shrink-0">{format(p.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Collections">
          {categories.map((c) => (
            <CommandItem
              key={c.slug}
              value={c.name}
              onSelect={() => go("/shop/$category", { category: c.slug })}
              className="gap-3"
            >
              <LayoutGrid className="size-4 shrink-0 opacity-50" />
              {c.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)} className="gap-3">
              <FileText className="size-4 shrink-0 opacity-50" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
