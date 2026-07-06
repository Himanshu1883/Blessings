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
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { useCurrency } from "@/lib/currency";
import { useShop } from "@/lib/shop-store";

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
          {PRODUCTS.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.fabric} ${p.categorySlug}`}
              onSelect={() => go("/product/$id", { id: p.id })}
              className="gap-3"
            >
              <img src={p.image} alt="" className="size-10 object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.fabric}</p>
              </div>
              <span className="text-xs tabular-nums text-[color:var(--maroon)]">{format(p.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Collections">
          {CATEGORIES.map((c) => (
            <CommandItem
              key={c.slug}
              value={c.name}
              onSelect={() => go("/shop/$category", { category: c.slug })}
            >
              <LayoutGrid className="opacity-60" />
              {c.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <FileText className="opacity-60" />
              {p.label}
            </CommandItem>
          ))}
          <CommandItem value="Shop all sherwanis" onSelect={() => go("/shop/$category", { category: "sherwanis" })}>
            <Shirt className="opacity-60" />
            Shop all Sherwanis
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
