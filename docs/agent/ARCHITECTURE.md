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
| `/api/webhook/razorpay` and `/api/webhooks/razorpay` | `routes/webhooks.ts` | HMAC on **raw body**; no session |

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

Standard Indian merchant checkout (Key ID + Key Secret). Not Partner OAuth / Route.

- Charge is always INR paise (`total × 100`). Display currency (USD/EUR/GBP) is never sent to Razorpay.
- Server re-prices the cart from the DB. Client totals are not trusted.
- Signed-in `POST /api/orders` creates the shop order, then `razorpay.orders.create`. Response includes public `keyId`, `razorpayOrderId`, amount, `currency: "INR"`.
- Browser loads `checkout.razorpay.com/v1/checkout.js` with the public Key ID only. Key Secret and webhook secret never leave the server.
- Checkout handler → `POST /api/orders/:id/verify` (session + HMAC `order_id|payment_id`). Webhook `payment.captured` is the backup. Both call the same idempotent finalize (stock once, one confirmation email).
- Webhook HMAC on the raw body string vs `X-Razorpay-Signature`. Missing webhook secret → 400, do not process. Events: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`.
- Fail closed if keys/secrets are missing. Do not skip HMAC in production.
- Modal dismiss leaves `pending` / `placed`; no stock drop. Thank-you uses `location.replace` (`/checkout/success`).
- COD does not talk to Razorpay; COD is marked paid on Delivered.
- Cancel of a paid online order refunds via the secret key; webhook updates refund status.

## Deployment

- Frontend build: `vite build` (Nitro; Lovable defaults Cloudflare).
- API: Railway (`blessings-production.up.railway.app` in `vercel.json`).
- `VITE_API_URL` used in Vite **dev** only; browser production uses same-origin `/api`.
