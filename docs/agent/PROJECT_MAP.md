# Project Map

## Purpose

Blessings is a luxury men’s boutique storefront (Delhi atelier: sherwanis, bandhgalas, wedding suits). Customers browse, cart, checkout (Razorpay/COD). Admins manage catalog, homepage CMS, orders, inventory, coupons, returns.

The git repo root is `blessings/` (workspace folder `Blessings/` wraps it).

## Stack

- Frontend: React 19, TanStack Start/Router (file routes), TanStack Query, Tailwind v4, shadcn/Radix, Vite
- Backend: Express 4 API in `server/` (separate Node process, port 4000)
- Database: MongoDB + Mongoose; product/category images in GridFS
- Authentication: httpOnly JWT cookies (access + refresh); Google OAuth optional; roles `user` | `admin`
- Payments: Razorpay (plus COD)
- Infrastructure: Vite SSR (Nitro/Cloudflare default via Lovable config); Vercel rewrites `/api` → Railway (`vercel.json`)
- External: Google Auth, Razorpay, WhatsApp/Instagram links, Lovable

## Repository Structure

| Area | Location | Responsibility |
|---|---|---|
| Storefront UI | `src/routes/`, `src/components/site/` | Pages, header/footer, cart/search sheets, PDP gallery (`product-gallery.tsx`) |
| Admin UI | `src/routes/admin/`, `src/components/admin/` | CMS + ops dashboard |
| Shared UI | `src/components/ui/` | shadcn primitives |
| Frontend API | `src/lib/api-client.ts`, `catalog-api.ts`, `api-hooks.ts`, `homepage-api.ts` | Fetch + Query hooks |
| Client state | `src/lib/auth-context.tsx`, `shop-store.tsx`, `currency.tsx` | Auth, cart panels, FX |
| Static fallback catalog | `src/lib/catalog.ts` | Used if API fails |
| Express API | `server/src/` | Routes → services → models |
| Seed | `server/scripts/seed.ts` | Baseline catalog seed |
| New looks seed | `public/new_data` + `server/scripts/seed-new-data.ts` | Bandhgala / Indo Western / Sherwani / Shirts galleries → Mongo/GridFS. HEIC via `convert-heic.py` |

## Important Entry Points

- Frontend shell: `src/routes/__root.tsx` (header/footer skipped on `/admin`)
- Frontend SSR: `src/server.ts`, `src/start.ts`
- Vite: `vite.config.ts` — proxies `/api` → `localhost:4000`
- API: `server/src/index.ts`
- Admin tabs: `src/routes/admin/$tab.tsx` + `src/components/admin/adminNav.ts`

## Change Routing

| If I need to change... | Start here |
|---|---|
| Header / mega menu | `src/components/site/site-header.tsx` |
| Homepage hero | `src/routes/index.tsx` + `src/lib/homepage-api.ts` |
| Shop listing | `src/routes/shop.$category.tsx` |
| Product page | `src/routes/product.$id.tsx` |
| Cart / wishlist UI | `src/lib/shop-store.tsx`, `src/components/site/cart-sheet.tsx` |
| Checkout / payment | `src/routes/checkout.tsx` → `server/src/services/orderService.ts` |
| Login | `src/routes/login.tsx`, `src/lib/auth-context.tsx` |
| Catalog API | `server/src/routes/catalog.ts` + `catalogService.ts` |
| Navbar categories | `listNavbarCategories()` + Category `showOnNavbar` |
| Admin | `src/routes/admin/$tab.tsx` + matching `*Tab.tsx` |
| DB schema | `server/src/models/` |

## Critical Relationships

- Storefront → `api` (`credentials: include`) → Express `/api/*` → service → Mongo
- `ShopProvider` → `useCart` / `useWishlist` (auth required) → `/api/cart`, `/api/wishlist`
- Checkout → `POST /api/orders` → Razorpay order/verify or COD → Order
- Navbar: `fetchNavbarCategories()` → `GET /api/categories/navbar` (`isActive` + `showOnNavbar`)
- Homepage: loader `fetchHomepageContent()` → `GET /api/homepage`; admin writes `/api/admin/homepage/*`
- Media URLs: `/api/media/:fileId` (GridFS)

## Agent Rules

- Read `docs/agent/` first; inspect only files CHANGE_MAP points to.
- Do not edit `src/routeTree.gen.ts`.
- Do not add duplicate Vite plugins (Lovable config already includes TanStack Start, React, Tailwind).
- Do not force-push / rewrite published git history (Lovable). See `AGENTS.md`.
- Prices are INR in DB; display conversion is client-only (`currency.tsx`).
- After architecture/flow/location changes, update these docs.
