import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CurrencyCode = "INR" | "USD" | "GBP" | "AED" | "CAD";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  region: string;
  locale: string;
  /** Approximate rate from INR (1 INR = rate CUR). Display only. */
  rate: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: {
    code: "INR",
    symbol: "₹",
    label: "Indian Rupee",
    region: "India",
    locale: "en-IN",
    rate: 1,
  },
  USD: {
    code: "USD",
    symbol: "$",
    label: "US Dollar",
    region: "United States",
    locale: "en-US",
    rate: 0.012,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "British Pound",
    region: "United Kingdom",
    locale: "en-GB",
    rate: 0.0095,
  },
  AED: {
    code: "AED",
    symbol: "Dh",
    label: "UAE Dirham",
    region: "United Arab Emirates",
    locale: "en-AE",
    rate: 0.044,
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    label: "Canadian Dollar",
    region: "Canada",
    locale: "en-CA",
    rate: 0.016,
  },
};

export const CURRENCY_ORDER: CurrencyCode[] = ["INR", "USD", "GBP", "AED", "CAD"];

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (priceInInr: number) => string;
  formatInr: (priceInInr: number) => string;
  info: CurrencyInfo;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CURRENCY_STORAGE_KEY = "blessings.currency";

function isCurrencyCode(value: string | null): value is CurrencyCode {
  return !!value && value in CURRENCIES;
}

export function readStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "INR";
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrencyCode(stored)) return stored;
  } catch {
    /* private mode */
  }
  return "INR";
}

function formatAmount(amount: number, info: CurrencyInfo) {
  const converted = amount * info.rate;
  const digits = info.code === "INR" ? 0 : 2;
  const rounded =
    info.code === "INR" ? Math.round(converted) : Math.round(converted * 100) / 100;
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      currencyDisplay: "symbol",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(rounded);
  } catch {
    return `${info.symbol}${rounded.toLocaleString("en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    })}`;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");

  useEffect(() => {
    setCurrencyState(readStoredCurrency());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CURRENCY_STORAGE_KEY) return;
      if (isCurrencyCode(event.newValue)) setCurrencyState(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const info = CURRENCIES[currency];
    return {
      currency,
      setCurrency,
      info,
      format: (priceInInr: number) => formatAmount(priceInInr, info),
      formatInr: (priceInInr: number) => formatAmount(priceInInr, CURRENCIES.INR),
    };
  }, [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
