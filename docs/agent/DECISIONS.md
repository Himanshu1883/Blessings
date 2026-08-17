# Architecture Decisions

## Decision: Separate Express API, not TanStack server functions

### Date
2026

### Decision
Commerce API is a standalone Express app in `server/`. The TanStack Start app is the storefront/admin UI and SSR shell only.

### Reason
Cookie auth, Razorpay webhooks (raw body), GridFS uploads, and Mongo live naturally on a long-running Node API. Lovable/Vite frontend can proxy or rewrite `/api`.

### Consequence
Local dev needs **two** processes. CORS + `CLIENT_URL` must match. `getApiBase()` differs for SSR vs browser vs Vite dev.

### Do Not Change Without Considering
Merging API into Start server functions would break webhook raw-body handling, Railway rewrite, and cookie domain setup.

---

## Decision: JWT in httpOnly cookies, not Authorization header

### Date
2026

### Decision
Access + refresh tokens are cookies. Refresh hash stored on User. `requireAuth` can silently rotate access from refresh.

### Reason
XSS cannot read tokens. Frontend `fetch` uses `credentials: "include"`.

### Consequence
CORS must allow credentials. Cookie domain/`CLIENT_URL` misconfig = “logged out” storefront.

### Do Not Change Without Considering
SPA token-in-localStorage “cleanup” would weaken auth and break `api-client.ts`.

---

## Decision: Prices stored in INR; FX is client-only

### Date
2026

### Decision
Product/order money is INR. `currency.tsx` converts for display with hardcoded rates.

### Reason
Checkout/Razorpay and admin inventory stay on one currency.

### Consequence
Displayed USD/GBP/etc. are approximate. Orders remain INR.

### Do Not Change Without Considering
Do not send converted amounts to Razorpay without a full FX/order-currency design.

---

## Decision: Static catalog fallback on the client

### Date
2026

### Decision
If `/api/categories` or `/api/products` fail, `catalog-api.ts` uses `src/lib/catalog.ts`.

### Reason
Storefront still renders during API outage / local UI-only work.

### Consequence
Fallback categories ignore `showOnNavbar`. Header module cache can show stale/static lists.

### Do Not Change Without Considering
Removing fallback makes the shop empty when API is down.

---

## Decision: Navbar collections via `showOnNavbar`, not listing every category in the nav bar

### Date
2026-08-12

### Decision
Desktop nav shows Shop All + static pages (About, Blog, Bespoke, Contact). Collections appear only inside the Shop All mega menu, from `GET /api/categories/navbar` (`isActive && showOnNavbar`).

### Reason
Match SNITCH-style header; admin controls which collections appear.

### Consequence
Toggling “Show on Navbar” in CategoriesTab is the control. Header does not list category names in the bottom nav.

### Do Not Change Without Considering
Putting every category back in the nav contradicts the intended header UI.

---

## Decision: Lovable Vite config owns plugins

### Date
2026

### Decision
`vite.config.ts` uses `defineConfig` from `@lovable.dev/vite-tanstack-config` only.

### Reason
Duplicate tanstackStart/react/tailwind plugins break the app.

### Consequence
Custom Vite options go under `defineConfig({ vite: { ... } })` (e.g. `/api` proxy).

---

## Decision: Admin is a tabbed shell, not a separate SPA

### Date
2026

### Decision
`/admin/$tab` maps `adminNav.ts` ids to `*Tab.tsx` components. `__root` omits store header on `/admin`.

### Reason
One auth context, one API, one deploy for CMS + store.

### Consequence
Add a tab in `ADMIN_NAV` + `$tab.tsx` switch + `routes/admin.ts` as needed.
