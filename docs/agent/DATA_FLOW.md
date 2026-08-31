# Data Flow

## Catalog browse

```
Shop / header
→ fetchNavbarCategories / fetchProducts / fetchCategories  (catalog-api.ts)
→ GET /api/categories/navbar | /api/categories | /api/products
→ catalogService
→ Category / Product (+ GridFS image URLs)
→ UI
```

If API fails, `catalog-api.ts` maps static `CATEGORIES` / `PRODUCTS` from `catalog.ts`. Header caches navbar categories in a module-level variable.

Navbar filter: `Category.find({ isActive: true, showOnNavbar: true })`.

## Homepage

```
index.tsx loader
→ fetchHomepageContent() + fetchProducts + fetchCategories
→ GET /api/homepage
→ homepageService
→ HomepageContent
```

Admin: HomepageTab → `useHomepageAdmin` → `/api/admin/homepage/:section`.

## Auth (email/password)

```
LoginForm
→ auth-context.login
→ POST /api/auth/login  { identifier, password }
→ authService.loginUser (bcrypt, set cookies)
→ GET /api/auth/me on later loads
→ AuthProvider user / isAdmin
```

Cart/wishlist: guest cart is local (`guest-cart.ts` / `shop-store`); wishlist still requires login. Checkout requires `isAuthenticated` (login `from=/checkout`); guest lines merge into the server cart after sign-in.

## Cart

```
addToCart (shop-store)
→ if guest: localStorage blessings.guest-cart
→ if signed in: POST /api/cart/items → cartService
→ CartSheet / header CART (n)
```

On login, guest lines are POSTed into the user cart then cleared.

## Checkout

```
Signed-in checkout, method = online
→ POST /api/orders (session)
    → re-price cart from DB (INR)
    → insert shop Order: placed / pending
    → Razorpay orders.create (INR paise)
    → save razorpayOrderId
    → return keyId + rzp order id + amount
→ Browser Checkout.js (public Key ID only)
→ handler POST /api/orders/:id/verify (session + HMAC order_id|payment_id)
  AND/OR webhook POST /api/webhook/razorpay (raw-body HMAC)
→ finalize once: paid + confirmed + stock + confirmation email (₹)
→ /checkout/success (history.replace so Back cannot pay again)

COD: confirmed immediately, stock taken, cart cleared, payment pending until delivered.
If Razorpay orders.create fails: shop order marked failed; no success.
If customer closes the modal: order stays pending; no stock drop.
```

## Currency display

```
price (INR in DB)
→ useCurrency().format
→ localStorage blessings.currency
```

No server conversion. Hardcoded rates in `currency.tsx`.

## Customer profile

```
/profile (signed-in customers only; admins → /admin/dashboard)
→ GET /api/auth/me
→ GET /api/orders (own orders)
→ GET /api/account/notifications
→ localStorage blessings_recently_viewed (PDP only)

Edit details → PATCH /api/auth/profile
  email/password change → cookies cleared, re-login

Cancel → POST /api/orders/:id/cancel (instant if < ~30 min and still confirmed)
Return → POST /api/orders/:id/return (delivered, within 7 days)
Reorder → POST /api/cart/items then /checkout (address prefill)
Invoice → /orders/$id/invoice
```

## Fulfilment

```
Admin OrdersTab next-step only
→ PATCH /api/admin/orders/:id/status
→ confirmed → processing (Packed, no notify/email)
         → shipped (notify + email)
         → in_transit (Out for delivery, notify + email)
         → delivered (notify + email; COD payment → paid; no stock change)
Skip packed or last-mile is allowed. No backwards. Unpaid Razorpay is locked.

Cancel request → approve (cancelled + restock + Razorpay refund if paid online) or reject (back to confirmed)

Returns (7 days after delivery)
→ Customer profile Request return, or admin OrdersTab Start return
→ POST /api/orders/:id/return or POST /api/admin/returns
→ Return pending
Admin ReturnsTab next-step only
→ pending → approved | rejected
→ approved → pickup_scheduled → picked_up → received (restock)
→ received → Issue refund (Razorpay paid: refund + order returned) or Complete return (COD: order returned)
Customer email + in-app notice on request / approve / reject / refunded
```

## Admin mutation (example: category)

```
CategoriesTab
→ useAdminApi / api.patch
→ PATCH /api/admin/categories/:id
→ catalogService.updateCategory
→ Category
```

All `/api/admin/*` require admin JWT.
