export function loginSearch(
  from: string,
  extra?: { identifier?: string; auth?: string },
) {
  return {
    from: safeStoreFrom(from),
    ...(extra?.identifier ? { identifier: extra.identifier } : {}),
    ...(extra?.auth ? { auth: extra.auth } : {}),
  };
}

export function safeStoreFrom(from: string) {
  if (!from.startsWith("/") || from.startsWith("//") || from.startsWith("/admin")) return "/";
  if (from.startsWith("/checkout/success")) return "/profile";
  return from;
}
