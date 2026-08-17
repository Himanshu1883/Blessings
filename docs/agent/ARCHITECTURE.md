# Architecture

```
Browser
  ↓
TanStack Start (Vite SSR)     src/routes/*, src/components/*
  ↓  fetch /api  (dev: Vite proxy; prod: Vercel rewrite)
Express API                   server/src/index.ts
  ↓
Routes → Services → Mongoose models / GridFS
  ↓
MongoDB
```

Two processes in local dev: `vite dev` (frontend) + `server` (`tsx watch src/index.ts`, port 4000).

## Boundaries

- **Storefront** (`__root.tsx` non-admin): `AuthProvider` → `CurrencyProvider` → `ShopProvider` → `SiteHeader` + `<Outlet />` + `ShopPanels` + `MobileBottomNav`.
- **Admin** (`pathname.startsWith("/admin")`): no site header/footer; `AdminProtected` + `AdminShell` + tab components.
- **API** is a separate Express app. Frontend never talks to Mongo directly.
- **Static catalog fallback** in `src/lib/catalog.ts` if catalog API is down (storefront only).

## Frontend modules

| Module | Role |
|---|---|
| `src/routes/` | File-based pages (`createFileRoute`) |
| `src/components/site/` | Store chrome (header, footer, sheets) |
| `src/components/admin/` | Admin tabs + shell |
| `src/lib/api-client.ts` | `api.get/post/patch/delete/upload`, cookie credentials, `{ success, data }` unwrap |
| `src/lib/catalog-api.ts` | Catalog fetch + static fallback |
| `src/lib/api-hooks.ts` | React Query for catalog/cart/wishlist/orders |
| `src/hooks/useAdminApi.ts` | Admin dashboard data aggregation |

## API modules (`server/src`)

| Mount | File | Auth |
|---|---|---|
| `/api/health` | `index.ts` | public |
| `/api/auth` | `routes/auth.ts` | mixed; rate-limited 10/min |
| `/api/categories*`, `/api/products*` | `routes/catalog.ts` | public |
| `/api/homepage` | `routes/homepage.ts` | public GET |
| `/api/media/:fileId` | `routes/media.ts` | public stream |
| `/api/cart` | `routes/cart.ts` | `requireAuth` |
| `/api/wishlist` | `routes/wishlist.ts` | `requireAuth` |
| `/api/orders` | `routes/orders.ts` | `requireAuth` |
| `/api/admin` | `routes/admin.ts` | `requireAuth` + `requireAdmin` |
| `/api/webhooks/razorpay` | `routes/webhooks.ts` | signature; **raw body** |

Pattern: route (Zod validate) → service → model. Errors via `AppError` + `errorHandler`. Success: `{ success: true, data }`.

## Auth

- Cookies: access + refresh (`server/src/utils/cookies.ts`).
- `requireAuth`: verify access JWT, else rotate from refresh hash on User.
- `requireAdmin`: `userRole === "admin"`.
- Google: `GOOGLE_CLIENT_*` optional; `authService` + `google-auth-library`.
- Frontend: `GET /api/auth/me` via React Query key `["auth","me"]`.

## Database

Models in `server/src/models/`: User, Category, Product, Cart, Wishlist, Order, Coupon, Return, Notification, HomepageContent, Media.

- Product.price is INR. Stock is `Map<size, qty>`. Images: `imageIds` → GridFS (`db/gridfs.ts`).
- Category.`showOnNavbar` gates `GET /api/categories/navbar`.
- HomepageContent: keyed CMS sections (hero, reviews, copy).

## Payments

Checkout page loads Razorpay.js → `POST /api/orders` → `POST /api/orders/:id/razorpay` → client checkout → `POST /api/orders/:id/verify`. Webhook confirms independently. COD skips Razorpay.

## Deployment

- Frontend build: `vite build` (Nitro; Lovable defaults Cloudflare).
- API: Railway (`blessings-production.up.railway.app` in `vercel.json`).
- `VITE_API_URL` used in Vite **dev** only; browser production uses same-origin `/api`.
