import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { StoreCoupon } from "@/lib/coupons";
import { bestCouponForProduct } from "@/lib/coupons";

const CouponsContext = createContext<StoreCoupon[]>([]);

export function CouponsProvider({ children }: { children: ReactNode }) {
  const { data = [] } = useQuery({
    queryKey: ["coupons", "active"],
    queryFn: () => api.get<StoreCoupon[]>("/api/coupons/active"),
    staleTime: 30_000,
  });

  return <CouponsContext.Provider value={data}>{children}</CouponsContext.Provider>;
}

export function useActiveCoupons() {
  return useContext(CouponsContext);
}

export function useProductOffer(product: { mongoId?: string; id?: string; categorySlug?: string | null; price: number }) {
  const coupons = useActiveCoupons();
  return bestCouponForProduct(coupons, product);
}
