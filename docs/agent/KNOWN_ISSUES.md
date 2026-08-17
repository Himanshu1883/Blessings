# Known Issues

## Issue: Header navbar category cache

Status: Open

Impact: After changing `showOnNavbar` or category list in admin, an already-open storefront tab may keep the old mega menu until full reload.

Cause: `site-header.tsx` uses module-level `navbarCategoriesCache` / promise, not React Query `useNavbarCategories`.

Current workaround: Hard refresh the storefront.

Do not accidentally break: Mega menu still depends on `fetchNavbarCategories()`; do not assume React Query invalidation updates the header.

---

## Issue: new_data originals are huge

Status: Mitigated

Impact: Files in `public/new_data` are ~20–29MB JPGs. Seed resizes to max 1600×2200 JPEG before GridFS. Do not upload originals raw.

Do not accidentally break: `server/scripts/seed-new-data.ts` grouping regex `Collection(-N)? (shot).JPG`.

---

## Issue: Catalog static fallback ignores navbar flag

Status: Open

Impact: If the API is down, mega menu shows **all** static `CATEGORIES` from `catalog.ts`, not `showOnNavbar`.

Cause: `fetchNavbarCategories()` fallback is `CATEGORIES.map(mapStaticCategory)` with no flag.

Do not accidentally break: Fallback exists so the shop still renders without Mongo.

---

## Issue: SSR 500 JSON from h3

Status: Mitigated

Impact: Some unhandled Start/h3 errors became `{ unhandled: true, message: "HTTPError" }` instead of HTML.

Cause: h3 swallows throws. `src/server.ts` rewrites those 500 JSON bodies to `renderErrorPage()`.

Do not accidentally break: Do not remove `normalizeCatastrophicSsrResponse` without another error surface.

---

## Issue: Dual mobile navigation

Status: Intentional

Impact: Mobile has header Menu drawer **and** `MobileBottomNav`. Easy to duplicate Search/Cart entry points.

Do not accidentally break: Bottom nav padding (`pb-[62px]`) on `__root` main; header offset `--header-height` on storefront main (skipped on `/` so the hero stays full-bleed); drawer `top-[var(--header-height)]` must stay aligned with header height.

---

## Issue: Journal is not CMS-backed

Status: Open

Impact: `/journal` uses `src/lib/journal-posts.ts`, not Mongo.

Do not accidentally break: Do not assume an admin Journal tab exists.

---

## Issue: Git history vs Lovable

Status: Constraint

Impact: Force-push / rebase of published commits desyncs Lovable.

See `AGENTS.md`.
