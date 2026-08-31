export function loginSearch(
  from: string,
  extra?: { identifier?: string; auth?: string },
) {
  return {
    from,
    ...(extra?.identifier ? { identifier: extra.identifier } : {}),
    ...(extra?.auth ? { auth: extra.auth } : {}),
  };
}
