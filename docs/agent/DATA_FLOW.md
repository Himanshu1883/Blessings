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
checkout.tsx
→ useCreateOrder → POST /api/orders { shippingAddress, paymentMethod }
→ orderService.createOrder (from server cart, snapshot items, totals)
if razorpay:
  POST /api/orders/:id/razorpay
  Razorpay.js checkout
  POST /api/orders/:id/verify
  (webhook POST /api/webhooks/razorpay as backup)
→ Order paid / COD placed
→ /orders or /orders/$id
```

## Currency display

```
price (INR in DB)
→ useCurrency().format
→ localStorage blessings.currency
```

No server conversion. Hardcoded rates in `currency.tsx`.

## Admin mutation (example: category)

```
CategoriesTab
→ useAdminApi / api.patch
→ PATCH /api/admin/categories/:id
→ catalogService.updateCategory
→ Category
```

All `/api/admin/*` require admin JWT.
