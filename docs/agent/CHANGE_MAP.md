# Change Map

Inspect **Primary** first. Do not scan the repo.

## UI (storefront)

| Request | Primary | Related |
|---|---|---|
| Header / navbar / mega menu | `src/components/site/site-header.tsx` | `currency-switcher.tsx`; `catalog-api.ts` `fetchNavbarCategories`; Category `showOnNavbar` |
| Footer | `src/components/site/site-footer.tsx` | |
| Homepage / hero / banners | `src/routes/index.tsx` | `homepage-api.ts`, admin HomepageTab. Extra storefront blocks: `ExploreMenswear`, `ShopByOccasion`, `RelatedLooks` |
| Shop grid / filters | `src/routes/shop.$category.tsx` | `catalog-api.ts`; product cards `product-card.tsx` (mobile compact mockup) |
| Product PDP | `src/routes/product.$id.tsx` | `product-gallery.tsx` (viewport-capped gallery, hover/pinch zoom, lightbox); `catalog-api.ts` `imageUrls[]`; `shop-store.tsx` addToCart |
| Search overlay | `src/components/site/search-dialog.tsx` | `shop-store` panel `"search"` |
| Cart drawer | `src/components/site/cart-sheet.tsx` | `shop-store.tsx`, `api-hooks.ts` |
| Wishlist | `src/components/site/wishlist-sheet.tsx` | |
| Account sheet | `src/components/site/account-sheet.tsx` | `auth-context.tsx` |
| Customer profile | `src/routes/profile.tsx` | `profile-member-card.tsx`, `profile-order-card.tsx`, `profile-notifications.tsx`, `profile-recent-carousel.tsx`; invoice `orders.$id.invoice.tsx` |
| Mobile bottom nav | `src/components/site/mobile-bottom-nav.tsx` | |
| WhatsApp / Instagram | `whatsapp-link.tsx`, `instagram-link.tsx` | `src/lib/whatsapp.ts`, `social.ts` |
| About / Bespoke / Contact / Journal | `src/routes/{about,bespoke,contact,journal}.tsx` | `journal-posts.ts` (static) |
| Theme / CSS vars | `src/styles.css` | |
| Root chrome (when header shows) | `src/routes/__root.tsx` | `styles.css` `--header-height`; storefront `<main>` uses `pt-[var(--header-height)]` except homepage `/` |

## Auth / account

| Request | Primary | Related |
|---|---|---|
| Login / signup UI | `src/routes/login.tsx`, `signup.tsx` | `auth-page-layout.tsx` |
| Auth state | `src/lib/auth-context.tsx` | `POST/GET /api/auth/*` |
| JWT / cookies | `server/src/middleware/auth.ts` | `utils/tokens.ts`, `utils/cookies.ts` |
| Auth business logic | `server/src/services/authService.ts` | `routes/auth.ts`, `models/User.ts` |
| Admin gate | `src/components/admin/AdminProtected.tsx` | `requireAdmin` |

## Checkout / orders

| Request | Primary | Related |
|---|---|---|
| Checkout page | `src/routes/checkout.tsx` | `razorpay-checkout.ts`, thank-you `checkout.success.tsx`, `useCreateOrder` |
| Order list / detail | `src/routes/orders.tsx`, `orders.$id.tsx` | Profile Pay now: `profile-order-card.tsx` |
| Order / Razorpay logic | `server/src/services/orderService.ts` | `routes/orders.ts`, `routes/webhooks.ts`, `utils/razorpayCrypto.ts`, `emailService.ts` |
| Order schema | `server/src/models/Order.ts` | Fulfilment: confirmed → packed (`processing`) → shipped → out for delivery (`in_transit`) → delivered. Admin next-step only. |
| Returns | `ReturnsTab.tsx` | `returnService.ts`; customer `POST /api/orders/:id/return`; admin `POST /api/admin/returns`; next-step only |
| Coupons | `server/src/services/couponService.ts` | admin `CouponsTab.tsx` |

## Catalog / media

| Request | Primary | Related |
|---|---|---|
| Public catalog API | `server/src/routes/catalog.ts` | `services/catalogService.ts` |
| Product schema | `server/src/models/Product.ts` | |
| Category / navbar flag | `server/src/models/Category.ts` | `listNavbarCategories()` |
| Static fallback products | `src/lib/catalog.ts` | `catalog-api.ts` |
| Image upload / stream | `server/src/services/mediaService.ts` | `routes/media.ts`, `db/gridfs.ts` |
| Seed data | `server/scripts/seed.ts`, `seed-data.ts` | `seed-new-data.ts` — catalog looks from `public/new_data` (`npm run seed:new-data`) |

## Admin

| Request | Primary | Related |
|---|---|---|
| Admin nav / tabs | `src/components/admin/adminNav.ts` | `src/routes/admin/$tab.tsx` |
| Admin API client | `src/hooks/useAdminApi.ts` | `server/src/routes/admin.ts` |
| Products admin | `ProductsTab.tsx`, `ProductEditModal.tsx` | pagination `AdminPagination.tsx`; `useAdminProductCatalog.ts` |
| Categories admin | `CategoriesTab.tsx` | |
| Homepage CMS | `HomepageTab.tsx` + `homepage/*Panel.tsx` | section nav + hero preview; `homepageService.ts` |
| Inventory | `InventoryTab.tsx` | `patchProductStock` |
| Dashboard stats | `DashboardTab.tsx` | `getDashboardMetrics` |
| Orders admin | `OrdersTab.tsx` | next-status buttons, cancel approve/reject/direct, start return |
| Returns admin | `ReturnsTab.tsx` | `returnService.ts`; customer `POST /api/orders/:id/return`; admin `POST /api/admin/returns` |
| Admin login page | `src/routes/admin/login.tsx` | |

## Database / env / deploy

| Request | Primary | Related |
|---|---|---|
| Add model field | matching file in `server/src/models/` | service + `api-types.ts` + admin form |
| Env vars | `server/src/config/env.ts` | |
| API CORS / port | `server/src/index.ts` | `CLIENT_URL` |
| Dev `/api` proxy | `vite.config.ts` | |
| Prod API host | `vercel.json` | |
| Seed admin user | `ADMIN_SEED_*` in env + seed script | |

## Business logic

| Request | Primary | Related |
|---|---|---|
| Cart calculations | `cartService.ts` + `shop-store` `cartSubtotal` | `guest-cart.ts` (local bag until login) |
| Checkout totals / shipping | `orderService.createOrder` | |
| Currency display | `src/lib/currency.tsx` | `currency-switcher.tsx` in header; localStorage `blessings.currency` |
| Navbar which collections | `showOnNavbar` + `listNavbarCategories` | `site-header.tsx` |
