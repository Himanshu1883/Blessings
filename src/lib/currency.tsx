import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CurrencyCode = "INR" | "USD" | "GBP" | "AED" | "CAD";

type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Rate from INR base (1 INR = rate CUR). */
  rate: number;
  flag: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", label: "Indian Rupee", rate: 1, flag: "🇮🇳" },
  USD: { code: "USD", symbol: "$", label: "US Dollar", rate: 0.012, flag: "🇺🇸" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound", rate: 0.0095, flag: "🇬🇧" },
  AED: { code: "AED", symbol: "د.إ", label: "UAE Dirham", rate: 0.044, flag: "🇦🇪" },
  CAD: { code: "CAD", symbol: "C$", label: "Canadian Dollar", rate: 0.016, flag: "🇨🇦" },
};

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (priceInInr: number) => string;
  info: CurrencyInfo;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "blessings.currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (stored && stored in CURRENCIES) setCurrencyState(stored);
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, c);
  };

  const value = useMemo<CurrencyContextValue>(() => {
    const info = CURRENCIES[currency];
    return {
      currency,
      setCurrency,
      info,
      format: (priceInInr: number) => {
        const converted = priceInInr * info.rate;
        const rounded =
          currency === "INR"
            ? Math.round(converted)
            : Math.round(converted * 100) / 100;
        return `${info.symbol}${rounded.toLocaleString("en-US", {
          maximumFractionDigits: currency === "INR" ? 0 : 2,
          minimumFractionDigits: currency === "INR" ? 0 : 2,
        })}`;
      },
    };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}