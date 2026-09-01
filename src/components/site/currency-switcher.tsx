import { Check } from "lucide-react";
import { ChevronDownIcon } from "@/components/icons/site-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CURRENCIES,
  CURRENCY_ORDER,
  useCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import { cn } from "@/lib/utils";

type Variant = "nav" | "compact" | "drawer" | "mobile";

export function CurrencySwitcher({
  variant = "nav",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { currency, setCurrency, info } = useCurrency();

  if (variant === "drawer") {
    return (
      <div className={className}>
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[color:var(--charcoal)]/45 mb-3">
          Currency
        </p>
        <ul className="divide-y divide-black/8 border border-black/10">
          {CURRENCY_ORDER.map((code) => (
            <li key={code}>
              <CurrencyRow
                code={code}
                selected={currency === code}
                onSelect={setCurrency}
              />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--charcoal)]/45">
          Prices are shown for reference. You are charged in Indian Rupees at checkout.
        </p>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Currency, ${info.label}. Change currency.`}
          className={cn(
            "inline-flex items-center gap-1.5 min-h-11 transition-opacity hover:opacity-70 outline-none group data-[state=open]:opacity-70",
            variant === "nav" &&
              "text-[11px] font-medium tracking-[0.14em] uppercase text-[color:var(--charcoal)]",
            variant === "compact" &&
              "text-[11px] font-medium tracking-[0.14em] uppercase text-[color:var(--charcoal)] px-1",
            variant === "mobile" &&
              "min-h-10 min-w-8 shrink-0 px-1 text-[11px] font-medium tracking-[0.04em] text-[color:var(--charcoal)]",
            className,
          )}
        >
          <span className="tabular-nums sm:hidden" suppressHydrationWarning>
            {info.symbol}
          </span>
          <span className="hidden tabular-nums sm:inline" suppressHydrationWarning>
            {currency}
          </span>
          <ChevronDownIcon className="size-2.5 opacity-45 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        data-lenis-prevent
        className="z-[80] w-72 rounded-none border-black/10 bg-white p-0 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
      >
        <DropdownMenuLabel className="px-4 pt-3.5 pb-2 font-normal">
          <span className="block text-[10px] font-medium tracking-[0.2em] uppercase text-[color:var(--charcoal)]/45">
            Shop in
          </span>
        </DropdownMenuLabel>
        {CURRENCY_ORDER.map((code) => {
          const item = CURRENCIES[code];
          const selected = currency === code;
          return (
            <DropdownMenuItem
              key={code}
              onSelect={() => setCurrency(code)}
              className={cn(
                "mx-1.5 mb-0.5 flex w-[calc(100%-0.75rem)] cursor-pointer items-center gap-3 rounded-none px-2.5 py-2.5 focus:bg-[color:var(--ivory)] focus:text-[color:var(--charcoal)]",
                selected && "bg-[color:var(--ivory)]",
              )}
            >
              <CurrencyRowInner code={code} selected={selected} />
              <span className="sr-only">
                {item.label}, {item.region}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="bg-black/8" />
        <p className="px-4 py-3 text-[11px] leading-relaxed text-[color:var(--charcoal)]/45">
          Approximate display rates. Checkout is charged in INR.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CurrencyRow({
  code,
  selected,
  onSelect,
}: {
  code: CurrencyCode;
  selected: boolean;
  onSelect: (code: CurrencyCode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
        selected ? "bg-[color:var(--ivory)]" : "hover:bg-[color:var(--ivory)]/70",
      )}
    >
      <CurrencyRowInner code={code} selected={selected} />
    </button>
  );
}

function CurrencyRowInner({ code, selected }: { code: CurrencyCode; selected: boolean }) {
  const item = CURRENCIES[code];
  return (
    <>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center border text-[13px] tabular-nums",
          selected
            ? "border-[color:var(--gold)] text-[color:var(--maroon)]"
            : "border-black/10 text-[color:var(--charcoal)]",
        )}
      >
        {item.symbol}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium tracking-[0.04em] text-[color:var(--charcoal)]">
          {item.code}
        </span>
        <span className="block text-[11px] text-[color:var(--charcoal)]/50">{item.region}</span>
      </span>
      {selected ? (
        <Check className="size-4 shrink-0 text-[color:var(--gold)]" strokeWidth={1.75} />
      ) : (
        <span className="size-4 shrink-0" />
      )}
    </>
  );
}
