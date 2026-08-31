# Conventions

## Frontend

- File routes only under `src/routes/`. Dynamic params: `$id`, `$category`, `$tab`. See `src/routes/README.md`.
- Do not create `src/pages/` or Next.js layouts. Sole shell: `__root.tsx`.
- `routeTree.gen.ts` is generated — never hand-edit.
- Alias: `@/` → `src/`.
- Styling: Tailwind v4 utilities + CSS vars in `src/styles.css` (`--ivory`, `--charcoal`, `--maroon`, `--gold`). `cn()` from `src/lib/utils.ts`.
- UI primitives: shadcn in `src/components/ui/`. Prefer existing sheets/buttons.
- Data: React Query via `api-hooks.ts` / `useAdminApi`. Catalog SSR loaders often call `catalog-api.ts` directly.
- Storefront cart UI state (which panel is open) lives in `ShopProvider`, not URL.
- API: always `credentials: "include"`. Unwrap `{ success, data }` in `api-client.ts`.

## Backend

- Route file mounts in `server/src/index.ts`; business logic in `services/`; schemas in `models/`.
- Validate with Zod (`validateBody` / `validateQuery` / `validateParams`).
- Respond with `sendSuccess(res, data)`. Throw `AppError(status, message)`.
- Auth middleware: `requireAuth`, `requireAdmin`, `attachRefreshedCookie`.
- Razorpay webhook must keep **raw body** (`/api/webhook/razorpay` and `/api/webhooks/razorpay`) — HMAC the utf8 string, never re-JSON-stringify. Missing webhook secret is invalid.
- ESM: import with `.js` extensions in `server/src` (TypeScript nodenext).

## Database

- Mongoose models; prices INR; slugs unique lowercase.
- Media: GridFS ids on Product/Category, served at `/api/media/:fileId`.
- Category navbar: `isActive` and `showOnNavbar`.

## General

- Preserve API contracts (`{ success, data }`, cookie auth) unless the task is to change them.
- Do not duplicate catalog logic: mutate `catalogService`, not a second copy (except the intentional static fallback).
- Do not add Vite plugins already provided by `@lovable.dev/vite-tanstack-config`.
- Frontend `fetchNavbarCategories` caches in-module; a running tab may not see admin navbar flag changes until reload.
