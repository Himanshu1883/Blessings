import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_STORE_SETTINGS,
  fetchStoreSettings,
  instagramUrlFromHandle,
  whatsappUrlFor,
  type StoreSettings,
} from "@/lib/store-settings";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";

type StoreSettingsContextValue = StoreSettings & {
  loading: boolean;
  instagramUrl: string;
  whatsappUrl: (message?: string) => string;
  messages: typeof WHATSAPP_MESSAGES;
};

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  ...DEFAULT_STORE_SETTINGS,
  loading: true,
  instagramUrl: instagramUrlFromHandle(DEFAULT_STORE_SETTINGS.instagramHandle),
  whatsappUrl: (message) => whatsappUrlFor(DEFAULT_STORE_SETTINGS.whatsappNumber, message),
  messages: WHATSAPP_MESSAGES,
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const settings = data ?? DEFAULT_STORE_SETTINGS;
  const value: StoreSettingsContextValue = {
    ...settings,
    loading: isPending && !data,
    instagramUrl: instagramUrlFromHandle(settings.instagramHandle),
    whatsappUrl: (message) => whatsappUrlFor(settings.whatsappNumber, message),
    messages: WHATSAPP_MESSAGES,
  };

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
