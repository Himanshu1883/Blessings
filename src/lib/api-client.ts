import type { ApiResponse } from "./api-types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBase(): string {
  if (typeof window !== "undefined") return "";

  const explicit = process.env.API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  if (import.meta.env.PROD) return "https://blessings-production.up.railway.app";

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  return "http://localhost:4000";
}

function liveFetchInit(extra?: RequestInit): RequestInit {
  return {
    credentials: "include",
    ...extra,
    cache: extra?.cache ?? "no-store",
    headers: {
      ...(extra?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...extra?.headers,
    },
  };
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/assets")) return url;
  const base = getApiBase();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

const AUTH_SKIP_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/google/token",
  "/api/auth/google/exchange",
]);

let refreshInFlight: Promise<boolean> | null = null;

function shouldAttemptRefresh(path: string) {
  const pathname = path.split("?")[0] ?? path;
  return !AUTH_SKIP_REFRESH.has(pathname);
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      await apiFetch("/api/auth/refresh", { method: "POST" }, { skipAuthRefresh: true });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  extra?: { skipAuthRefresh?: boolean },
): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, liveFetchInit(options));

  if (
    res.status === 401 &&
    !extra?.skipAuthRefresh &&
    shouldAttemptRefresh(path)
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiFetch<T>(path, options, { skipAuthRefresh: true });
    }
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T> & {
    message?: string;
    code?: string;
    data?: unknown;
  };

  if (!res.ok || json.success === false) {
    throw new ApiError(res.status, json.message ?? "Request failed", json.code, json.data);
  }

  return (json as { success: true; data: T }).data;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: "POST", body: formData }),
};
