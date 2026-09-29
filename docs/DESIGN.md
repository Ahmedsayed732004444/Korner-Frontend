# Korner Web — Design Brief & Design System

The single source of truth for how the Korner storefront looks and behaves. Every page and component follows this file; when something here changes, the tokens in `src/shared/styles/_tokens.scss` change with it.

Process for every part we build: **Analyze → Extract → Establish → Design → Validate → Iterate.**

---

## 1. Product & UX context

**Product type.** Korner is an Egyptian online store for apparel, shoes and perfume. The site is Arabic-first with an English version. Guests can buy without an account.

**What the backend gives us** (`https://korner.runasp.net`, Swagger at `/swagger`):
- **Catalog:** size × color variants, and on-demand items with a lead time.
- **Payment:** online only through Paymob (card, and wallet later). There is **no cash on delivery**.
- **Shipping:** a fee and delivery days per governorate, plus a free-shipping threshold.
- **Orders:** tracked by order number + phone. Returns are requested through WhatsApp/email within 14 days.
- **Sign-in:** Google, or email + password.
- **Maintenance mode:** blocks checkout only; browsing keeps working.

**Target users.** Egyptian shoppers, mostly on phones (mobile is the primary layout), in Arabic. Many are on mobile data behind shared IPs, and many buy as guests.

**Personas**
| Persona | Context | Needs | Fears |
|---|---|---|---|
| **Omar, 24, Cairo** | Comes from an Instagram ad on his phone and buys sneakers | Find his size fast and pay in under 2 minutes | "Is my size in stock?", "Will it arrive?" |
| **Mona, 32, Alexandria** | Buys perfume gifts and clothes for the family, as a guest | Clear delivery date and an easy return | Hidden fees, wrong size, card safety |
| **Returning customer** | Signed in with Google | Track orders, reorder, saved addresses | Losing an order they placed as a guest |

**User goals:** find a product → choose color/size → know the final price and delivery date → pay safely → track the order.

**Click budget: payment in 5 clicks or fewer** (a product rule, checked on every page we build)

| # | Fast path ("Buy now") | Cart path |
|---|---|---|
| 1 | Product card | Product card |
| 2 | Size (color is pre-selected) | Size |
| 3 | **Buy now** → checkout | Add to cart → cart drawer opens |
| 4 | Governorate (the address is typed, not clicked) | **Checkout** in the drawer |
| 5 | **Pay** → Paymob | **Pay** → Paymob |

Rules that keep it true:
- Sign-in is **never** required; guest checkout is the default.
- The first available color is pre-selected, and a single size is pre-selected.
- Checkout is one page, and signed-in customers get their saved address filled in.
- The cart opens as a drawer, not a page.
- Nothing (prompts, pop-ups) appears on checkout and payment pages.

**Sign-in prompt (first visit only)**
- **When:** 2.5 s after the first page load of a first visit, for signed-out visitors only.
  - Never on `/checkout*`, `/login`, `/register`, `/auth/*` or `/oauth/*`.
  - It's remembered in `localStorage`, so it doesn't come back.
- **What:** Google One Tap, top-right. The backend verifies Google's ID token at `POST auth/google`.
  - If the browser can't show One Tap (no Google session, blocked), a small card with Google's own button appears in the same corner.
  - The card doesn't appear if the visitor closed One Tap themselves.
- **After sign-in:** the guest cart is merged into the account cart (`cart/merge`), so nothing in the cart is lost.
- **Setup:** Google Console → the OAuth client → **Authorized JavaScript origins** must list every storefront origin (`http://localhost:5173` in development, plus the production domain).

**Key user flows**
1. **Buy (guest):** Home/Category → Product → pick color → pick size → Add to cart → Cart (pick governorate → see shipping and delivery) → Checkout form → Paymob → `/checkout/result` (polls payment status) → Track order.
2. **Find:** Search or Category → filter (size, color, price, brand, availability) → sort → Product.
3. **Track / cancel:** `/orders/track?number=` + phone → status timeline → cancel (only while Pending/Confirmed).
4. **Account:** Google or email sign-in → My orders (guest orders with the same email appear automatically) → addresses → language.
5. **Recover:** payment failed → retry payment from the result page; cart issue (price changed / out of stock) → acknowledge or remove.

**Information architecture (routes)**
| Route | Page | Backend |
|---|---|---|
| `/` | Home | `banners`, `categories`, `products` |
| `/c/:slug` | Category | `categories/{slug}`, `products`, `products/facets` |
| `/shop` | All products | `products`, `products/facets` |
| `/search?q=` | Search results | `products?SearchValue=` |
| `/p/:slug` | Product | `products/{slug}` |
| `/cart` | Cart | `cart`, `shipping/governorates` |
| `/checkout` | Checkout | `checkout`, `orders/{n}/payments` |
| `/checkout/result` | Payment result | `orders/{n}/payment-status` |
| `/orders/track` | Track order | `orders/track`, `orders/{n}/cancel` |
| `/login`, `/register` | Sign in / up | `auth/*` |
| `/auth/emailConfirmation` | Confirm email (link in email) | `auth/confirm-email` |
| `/auth/forgetPassword` | Reset password (link in email) | `auth/reset-password` |
| `/oauth/callback` | Google result (tokens in `#fragment`) | — |
| `/account/*` | Orders, order details, addresses, settings | `account/*` |
| `/pages/:type` | Terms, privacy, shipping, returns, about, FAQ | `pages/{type}` |
| `*` | 404 | — |

The routes marked "link in email" or "redirect" must never change; the backend builds them.

**Functional requirements for the UI**
- **Prices:** come in piasters; show them in EGP (`150 ج.م` / `EGP 150`). Never compute totals on the client, the server is the source of truth.
- **Availability:** never show stock numbers, only "available / sold out / ships in N days".
- **Cart issues:** show the server's per-line issues (price changed, not enough stock, sold out, unavailable) and block checkout until they're fixed.
- **Maintenance:** a site-wide banner, and the checkout button disabled with the store's message.

**UX requirements**
- A product page answers **price, sizes in stock, delivery date, return policy** above the fold on mobile.
- The shipping fee and the amount left to free shipping are visible before checkout.
- Every server error shows a human message in the current language, plus a way forward.

## 2. Visual references

- **Primary reference:** the *Male Fashion* template by Colorlib (`Templet-Backend/malefashion-master`). Colorlib's free license requires keeping their credit link in the footer unless we buy a license.
- **What we keep:**
  - a calm off-white hero (`#f3f2ee`);
  - square, editorial product cards on a light-grey image background;
  - black primary buttons with wide letter spacing (Latin only);
  - red used sparingly for accents (active nav underline, sale, the logo dot);
  - generous whitespace, a centered section title, and a product grid of 4 columns on desktop.
- **Problems found in the template (checked with real device emulation at 390 px, `scripts/snap.mjs`):**
  - The layout itself fits phones.
  - The mobile menu and sliders depend on jQuery, and there is no Arabic/RTL support.
  - Letter spacing is applied to all uppercase text, which breaks Arabic.
  - Gray body text sits on a gray hero.
  - Tiny touch targets (color dots, the quantity spinner).
- **What we drop:** the blog, Instagram feed, "deal of the week" countdown, star ratings/reviews, wishlist/compare and coupons. Korner's backend doesn't have them.
- **UX patterns borrowed from big Egyptian stores (Noon, Namshi, H&M Egypt):**
  - a sticky add-to-cart bar on mobile product pages;
  - a filter drawer on mobile;
  - the governorate picker in the cart;
  - an order timeline.

## 3. Design system — color

Semantic tokens only; components never use raw hex values.

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#111111` | Primary buttons, headings, active states |
| `--color-primary-hover` | `#333333` | Hover on primary |
| `--color-accent` | `#e53637` | Sale badge, active nav underline, logo dot. **Never** for errors or primary CTAs |
| `--color-accent-soft` | `#fdecec` | Sale badge background on light surfaces |
| `--color-bg` | `#ffffff` | Page |
| `--color-bg-muted` | `#f3f2ee` | Hero, breadcrumb band, product details top |
| `--color-surface` | `#ffffff` | Cards, drawers, dialogs |
| `--color-surface-muted` | `#f5f5f5` | Product image background, table headers |
| `--color-text` | `#111111` | Headings and main text |
| `--color-text-muted` | `#5c5c5c` | Body copy and secondary text (6.6:1 on white) |
| `--color-text-subtle` | `#767676` | Hints and meta (4.5:1 on white, the minimum; not for long text) |
| `--color-text-inverse` | `#ffffff` | On primary/dark |
| `--color-border` | `#e5e5e5` | Dividers, cards |
| `--color-border-strong` | `#b7b7b7` | Inputs |
| `--color-success` / `-soft` | `#1e7b45` / `#e8f5ee` | Paid, delivered, saved |
| `--color-warning` / `-soft` | `#9a5b00` / `#fdf3e1` | Price changed, low stock, pending |
| `--color-error` / `-soft` | `#b42318` / `#fdecea` | Validation, failed payment. Darker than the accent so the two are never confused |
| `--color-info` / `-soft` | `#1d5fa8` / `#e8f0fa` | Neutral notices, maintenance |
| `--color-focus` | `#1d5fa8` | Focus ring (visible on white, black and muted backgrounds) |

States never rely on color alone: errors and warnings always come with an icon and text.

## 4. Typography

- **Families:**
  - Arabic: **Cairo** (Egyptian-made, geometric, pairs with Nunito's shapes).
  - Latin: **Nunito Sans**, the template's font.
  - Both are self-hosted with `@fontsource` (no Google CDN). `:lang(ar)` switches the stack.
- **Scale (rem, base 16 px):** `12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48`.
  - Mobile uses the first seven sizes; 36/48 are desktop hero only (they scale with `clamp()`).
- **Weights:** 400 body · 600 labels and buttons · 700 headings · 800 hero.
- **Line heights:**
  - Latin: 1.25 headings, 1.6 body.
  - **Arabic: 1.4 headings, 1.8 body.** Arabic needs taller lines.
- **Letter spacing:** `0.12em` on Latin uppercase labels and buttons only. **Always `0` in Arabic**, because spacing breaks letter joining.
- **Hierarchy:**
  - One `h1` per page (the page title or product name).
  - `h2` for sections (the centered section title).
  - `h3` for cards.
  - Prices use weight 700 and a tabular number font.

## 5. Layout system

- **Mobile-first.**
- **Breakpoints:**

  | Name | Min width | What changes |
  |---|---|---|
  | `sm` | 576 px | Two-column product grid |
  | `md` | 768 px | Tablet |
  | `lg` | 992 px | Desktop header; the filter sidebar replaces the drawer |
  | `xl` | 1200 px | Wide container |

- **Container:** max 1200 px, with a side gutter of 16 px (mobile) / 24 px (≥ md).
- **Grid:** CSS grid.
  - Product grid columns: 2 (mobile) · 3 (md) · 4 (lg).
  - Page shells: 12 columns on desktop, with the sidebar as 3 of them.
- **Spacing scale (4 px base):** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.
  - Sections are 48 px apart on mobile and 96 px on desktop.
  - Card gaps are 16 / 24 px.
- **Direction:** all layout uses **CSS logical properties** (`margin-inline-start`, `inset-inline-end`, `text-align: start`), so one stylesheet serves both RTL and LTR. Arrow icons flip in RTL.

## 6. Visual styling

- **Radius:** square, editorial brand style: `0` for buttons, cards and images; `2px` for inputs; `999px` for color swatches, badges-as-pills and the cart count.
- **Elevation:** almost flat.
  - `--shadow-sm`: sticky header and bars.
  - `--shadow-md`: dropdowns and popovers.
  - `--shadow-lg`: drawers and dialogs.
- **Borders:** 1 px `--color-border`. Inputs use `--color-border-strong`, and 2 px focus rings.
- **Icons:** `lucide-react`, 20 px stroke 1.75 by default (24 px in the header). Directional icons are mirrored in RTL.
- **Images:**
  - Product photos on `--color-surface-muted` with `object-fit: contain`.
  - Aspect ratio 4:5 for products and 16:9 / 3:4 for banners (desktop / mobile).
  - Always `alt` text in the current language and lazy loading, except the first hero image.
- **Illustrations:** none. Empty states use a large outline icon plus text.

## 7. Components (inventory)

Every component lives in exactly one place: `shared/ui` if it has no store knowledge, otherwise the feature that owns it.

**shared/ui:**
- Button (primary, secondary/outline, ghost, link; sizes sm/md/lg; icon-only)
- IconButton, Input, Textarea, Select, Checkbox, Radio, RadioGroup, SwatchPicker (color), SizePicker, QuantityInput
- Badge, Alert, Spinner, Skeleton, EmptyState
- Dialog, Drawer, Tabs, Accordion, Tooltip, Pagination, Breadcrumb, SectionTitle, Price

**Layout (app):** TopBar, Header/Navbar, MobileMenu (drawer), SearchOverlay, Footer, MaintenanceBanner.

**Features:**
- catalog: ProductCard, ProductGrid, FilterSidebar/FilterDrawer, ProductGallery, VariantPicker
- cart: CartLine, CartSummary, ShippingEstimator, AddToCart
- checkout: CheckoutForm, OrderSummary
- orders: OrderTimeline
- …and the rest.

## 8. Component states (required for every interactive component)

| State | Rule |
|---|---|
| Default | As designed |
| Hover | Pointer devices only (`@media (hover: hover)`); 150 ms transition |
| Focus | `:focus-visible` ring, 2 px `--color-focus` + 2 px offset. Never removed |
| Active | Slight darken / 1 px press |
| Disabled | 45% opacity, `cursor: not-allowed`, `aria-disabled`; tooltip or text explains why when it's not obvious (e.g. "Store in maintenance") |
| Loading | Keeps its width, shows a spinner, `aria-busy`, and blocks double submit |
| Error | Red border + icon + message under the field (`aria-invalid`, `aria-describedby`) |
| Success | Green icon/border only after a user action (saved, copied, paid) |
| Empty | Icon + one sentence + a way forward (e.g. empty cart → "Browse new arrivals") |

The Style Guide page (`/styleguide`, development only; `?lang=en` switches language) shows every component in every state, in both languages. We validate there before building pages.

- **Visual check:** run `node scripts/snap.mjs <url> <out.png> 390 844`. It emulates a real phone, because headless Chrome's own window can't go below about 500 px. It also lists any element wider than the screen.

## 9. UX principles (how we apply them)

- **Visual hierarchy:** one primary CTA per screen (black button); everything else is secondary/ghost.
- **Consistency:**
  - same component = same behavior everywhere;
  - the same price format everywhere, through `<Price>`;
  - the same error text from one map of backend error codes.
- **Usability:** labels always visible, never placeholder-only. Numeric keyboards for phone and quantity. Autofill attributes on checkout.
- **Accessibility:**
  - WCAG 2.2 AA: contrast ≥ 4.5:1 for text;
  - full keyboard use with focus trapping in dialogs and drawers, and a "skip to content" link;
  - `lang` and `dir` on `<html>`;
  - `prefers-reduced-motion` respected.
- **Feedback:** every action answers within 100 ms (a pressed state, then loading), and success is confirmed. The mini-cart count updates immediately.
- **Error prevention:**
  - disable impossible choices (sold-out sizes are struck through, not hidden);
  - confirm destructive actions (cancel order);
  - `CheckoutKey` prevents double orders.
- **Error recovery:** a failed payment keeps the order and offers "Try again". Validation keeps what the user typed.
- **Affordance & discoverability:** buttons look like buttons, and links are underlined in body text. Filters show counts and an active-filter chip bar.
- **Progressive disclosure:** size chart and perfume notes in tabs/accordions, advanced filters collapsed, account extras behind the account menu.
- **Cognitive load:** checkout is one page with 3 short groups (contact → address → payment), and guest checkout is the default.

## 10. Responsive design

| Area | Mobile (< 768) | Tablet (768–991) | Desktop (≥ 992) |
|---|---|---|---|
| Header | Logo + search + cart; menu in a drawer from the start side | Same as mobile | Full navbar + account + language |
| Product grid | 2 columns | 3 columns | 4 columns |
| Filters | Bottom-sheet drawer with an "Apply" button | Drawer | Sidebar |
| Product page | Gallery swipe → info → sticky add-to-cart bar | 2 columns | Gallery + info, 7/5 |
| Cart | Stacked line cards | Table | Table + summary column |
| Checkout | Single column, summary collapsible at top | Single column | Form + sticky summary |

**Touch targets:** at least 44 × 44 px, including the color swatches, size chips and quantity buttons, even when the visual is smaller.

## 11. Page template (filled in per page before we build it)

For each page we write:
- purpose;
- primary CTA and secondary actions;
- required content in priority order;
- form structure (if any);
- table structure / data density (if any);
- interaction requirements;
- the loading, empty and error states.

## 12. Brand

- **Name:** Korner (كورنر). **Logo:** temporary text logo "Korner" plus a red square dot (from the template), until the real logo arrives. It lives in one place: `shared/ui/Logo`.
- **Personality:** modern, confident, local, honest. Fashion-forward without being luxury-cold.
- **Tone of voice:**
  - Arabic: short, friendly Egyptian Arabic, like the backend emails («طلبك اتأكد»).
  - English: plain and warm.
  - Never blame the customer in error messages.

---

## Architecture rules (UI vs data layer)

```
app/  →  pages/  →  features/  →  shared/        (imports only point right)
```
- **UI** (`shared/ui`, `features/*/components`, `pages`) receives data via props and emits events. It never imports `fetch`/`http` and never reads auth tokens.
  - Money stays in integer piasters end to end, exactly as the API sends it. Only `<Price>` turns it into text, so no floating-point value ever reaches a total.
- **Data layer** (`shared/api` and `features/*/api`) holds:
  - the HTTP client with the JWT and refresh interceptor;
  - the generated API types;
  - the TanStack Query hooks, query keys and mappers (DTO → view model).

  This is the only code that talks to the backend.
- **Features** don't import other features; the pages compose them. Each feature exposes a public `index.ts`.
- **Shared things** move to `shared/` on their third use (Rule of Three), not earlier.

---

## Built so far (kept in sync with the code)

**Home page** (`/`): hero slider (`GET banners`, no autoplay), trust strip, category tiles (`GET categories`), and a product section with three tabs (best sellers / new arrivals / on sale, each one request, only the open tab is fetched).
- **Product card** (`features/catalog`): one link covers the whole card. The badge shows either "Sold out" or "-X%". Price shows the compare-at price struck through only while the product is on sale. Up to 4 color dots, then "+N". Images sit on a muted 4:5 frame with `object-fit: contain`.
- **Hero on phones:** the photo is on top and the text below it, so the text never covers the model. On desktop the text sits on the photo's empty half, pinned to the physical left in both languages.
- Every list has four states: loading (skeletons), failed (message + retry), empty, and data.
