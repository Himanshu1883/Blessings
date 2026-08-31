import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api-client";
import type { ApiUser } from "./api-types";

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  googleEnabled: boolean;
  login: (identifier: string, password: string) => Promise<ApiUser>;
  register: (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }) => Promise<ApiUser>;
  completeGoogleSession: (token: string) => Promise<ApiUser>;
  updateAccount: (data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ user: ApiUser; requiresRelogin: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getGoogleLoginUrl: (from?: string) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<ApiUser | null> {
  try {
    return await api.get<ApiUser>("/api/auth/me");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

function applySession(
  queryClient: ReturnType<typeof useQueryClient>,
  user: ApiUser,
) {
  queryClient.setQueryData(["auth", "me"], user);
  void queryClient.invalidateQueries({ queryKey: ["cart"] });
  void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  void queryClient.invalidateQueries({ queryKey: ["orders"] });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const isBrowser = typeof window !== "undefined";

  const { data: user, isPending, isFetching, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchSession,
    enabled: isBrowser,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: providers } = useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () => api.get<{ google: boolean }>("/api/auth/providers"),
    enabled: isBrowser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const login = useCallback(
    async (identifier: string, password: string) => {
      const loggedInUser = await api.post<ApiUser>("/api/auth/login", { identifier, password });
      applySession(queryClient, loggedInUser);
      return loggedInUser;
    },
    [queryClient],
  );

  const register = useCallback(
    async (data: { name: string; email?: string; phone?: string; password: string }) => {
      const created = await api.post<ApiUser>("/api/auth/register", data);
      applySession(queryClient, created);
      return created;
    },
    [queryClient],
  );

  const completeGoogleSession = useCallback(
    async (token: string) => {
      const loggedInUser = await api.post<ApiUser>("/api/auth/google/exchange", { token });
      applySession(queryClient, loggedInUser);
      return loggedInUser;
    },
    [queryClient],
  );

  const updateAccount = useCallback(
    async (data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const result = await api.patch<{ user: ApiUser; requiresRelogin: boolean }>(
        "/api/auth/profile",
        data,
      );
      if (result.requiresRelogin) {
        queryClient.setQueryData(["auth", "me"], null);
        queryClient.removeQueries({ queryKey: ["cart"] });
        queryClient.removeQueries({ queryKey: ["wishlist"] });
        queryClient.removeQueries({ queryKey: ["orders"] });
      } else {
        queryClient.setQueryData(["auth", "me"], result.user);
      }
      return result;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.removeQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["wishlist"] });
      queryClient.removeQueries({ queryKey: ["orders"] });
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getGoogleLoginUrl = useCallback((from = "/") => {
    const params = new URLSearchParams();
    if (from && from !== "/") params.set("from", from);
    const qs = params.toString();
    return qs ? `/api/auth/google?${qs}` : "/api/auth/google";
  }, []);

  const waitingForClientSession = isBrowser && isPending && isFetching;
  const isLoading = !isBrowser || waitingForClientSession;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      googleEnabled: providers?.google === true,
      login,
      register,
      completeGoogleSession,
      updateAccount,
      logout,
      refreshUser,
      getGoogleLoginUrl,
    }),
    [
      user,
      isLoading,
      providers?.google,
      login,
      register,
      completeGoogleSession,
      updateAccount,
      logout,
      refreshUser,
      getGoogleLoginUrl,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
