# Moss frontend redesign — design

## Status

Approved 2026-08-11. Supersedes the existing single-page client.

## Problem

`client/` is a single-page marketing site built on static mock data. It has no
router, no API calls, no cart, and no product pages. A UI/UX audit on
2026-08-11 also found broken mobile navigation, keyboard-inaccessible product
cards, duplicate React keys, and a stylesheet importing four font families
while using two.

The site needs to become a real storefront with a distinct visual identity, and
the backend it will eventually talk to is not built yet.

## Scope

This cycle covers the frontend only, running on mock data. Backend controllers
and API wiring are separate cycles.

In scope — four routes:

- `/` — home
- `/products` — listing with category filter and sort
- `/products/:slug` — product detail
- `/cart` — cart page

Out of scope, deliberately deferred:

- Authentication pages (sign in, sign up)
- Account area and order history
- Checkout and payment
- Real API integration
- A HyperFrames-generated hero video
- Server folder renames (`middlewares/`, `database/`)

These are additive later. The structure below is built to accommodate them
without rework.

## Architecture

### Routing

React Router with a layout route. `RootLayout` renders `Nav`, an `Outlet` for
the active route, `Footer`, and the globally-mounted `CartDrawer`. The drawer
lives outside the outlet so it survives navigation.

Adding a route later means one entry in the router and one file in `routes/`.

### Product identity

Routes use a slug (`/products/lampi-jar`), never a Mongo ObjectId. Ids in URLs
leak database internals and are poor for SEO.

### State

Cart state uses React Context with `useReducer` — no external state library.
The same pattern serves auth state later.

Cart persists to `localStorage`, rehydrating on mount. Actions: `ADD_ITEM`,
`REMOVE_ITEM`, `SET_QUANTITY`, `CLEAR`.

Theme state uses a separate context, persisting the user's choice and falling
back to `prefers-color-scheme`, with dark as the final fallback. The choice is
applied before first paint to avoid a flash of the wrong theme.

### Data access

All product reads go through `lib/api.js`. Today it returns mock data from
`data/products.js` behind an artificial delay so loading states are real. When
the backend exists, only this file changes.

```js
export const getProducts = async () => { /* mock now, fetch later */ };
export const getProduct = async (slug) => { /* ... */ };
```

Components never import mock data directly.

## Folder structure

```text
client/src/
├── routes/       Home, Products, ProductDetail, Cart, NotFound
├── layouts/      RootLayout
├── sections/     home-page sections only (Hero, FeaturedProducts, Story)
├── components/   shared UI used on 2+ pages
├── context/      CartContext, ThemeContext
├── hooks/        useLocalStorage, useReducedMotion, useMediaQuery
├── lib/          api.js
├── utils/        formatPrice, slugify
├── data/         products.js (mock; deleted when the API lands)
├── constants/    nav, footer and social config (permanent)
├── assets/
│   ├── brand/    logo and brand imagery
│   └── images/   product photography
└── test/         Vitest setup
```

Boundary rules:

- Used on two or more pages → `components/`
- Used once, on one page → `sections/`
- Calls other hooks → `hooks/`; pure function → `utils/`

### Renames from the current structure

| Current | New | Reason |
| --- | --- | --- |
| `assets/icons/` | `assets/brand/` | Holds branding PNGs, not icons |
| `assets/icons/icons8-moss-*.png` | `public/` | Favicons need fixed URLs |
| `constants/index.js` (products) | `data/products.js` | Mock data has a different lifespan to config |

`public/` also gains `favicon.ico` and `robots.txt`; it is currently empty.

## Design system

### Palette — Scandinavian Moss

The interface is desaturated so product photography is the only saturated
element on screen. Interface greens are pale and lichen-like, never emerald.

Dark, the default:

| Token | Value |
| --- | --- |
| `bg` | `#121815` |
| `surface` | `#1a221e` |
| `border` | `#2e3833` |
| `accent` | `#a3bfa8` |
| `stone` | `#5c6b61` |
| `text` | `#e8ebe6` |
| `text-muted` | `#9aa89e` |

Light, via toggle:

| Token | Value |
| --- | --- |
| `bg` | `#f4f2ed` |
| `surface` | `#fbfaf7` |
| `border` | `#dfe0d9` |
| `accent` | `#4a5f50` |
| `stone` | `#8a9689` |
| `text` | `#1c221e` |
| `text-muted` | `#5f6b63` |

Light is a separate design, not an inversion — warm birch paper rather than
white, and greens go darker rather than lighter so they hold contrast. Both
themes redefine the same token names, so components never branch on theme.

Verified contrast: accent on dark base ≈ 8.9:1, accent on light base ≈ 6.8:1,
white on `#35473b` ≈ 9.7:1. All clear WCAG AA.

### Typography

Fraunces for display, Inter for body and all UI. Fraunces has the organic
irregularity that suits a living material; Inter is more legible at small sizes
and handles price numerals cleanly.

`index.css` is rebuilt: the unused Playfair and Poppins imports and the
duplicate Palanquin import are removed, and the `--font-size-*` tokens — which
currently use Tailwind v3 array syntax inside a v4 `@theme` block and therefore
do nothing — are replaced with a `clamp()`-based modular scale.

### Motion

Restrained and purposeful. Cards lift 6px on hover over roughly 280ms with
`cubic-bezier(.16,1,.3,1)`. Only `transform`, `opacity`, `background` and
`box-shadow` animate. No rotation, scale bounce, or sheen effects.

Hero combines a slow Ken Burns drift while in view with scroll parallax as the
user moves past. Both are CSS and cost no additional page weight.

Every animation is gated behind `prefers-reduced-motion`.

Animation library: Motion (formerly Framer Motion) v13.1.0, already installed
and smoke-tested against React 19. Chosen over GSAP because `layout` handles
the filter grid reflow automatically and `AnimatePresence` handles the cart
drawer and route transitions — both of which are meaningfully more work in
GSAP. GSAP's advantage is scroll choreography, which this project needs little
of.

## Brand assets

### Logo

A new SVG mark replaces the existing PNG: a glass bowl drawn as a circle with
a 90° section removed at the top right, a moss cushion seated on the inner
base, and a water droplet in the mouth of the opening. The vessel signals
decoration rather than botany, and the form matches the glass-bowl products
that lead the range. The ragged crown derives from the moss surface in
`Design-10.png`.

```svg
<svg viewBox="0 0 32 32" fill="none">
  <path d="M26.2 16.5 A10.2 10.2 0 1 1 16 6.3"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 18 Q9.9 13.8 11.9 15.9 Q13.2 12 15.2 15 Q16.8 11.4 18.8 14.8
           Q20.6 13 21.9 16.4 Q22.7 15.4 23 18 Q23.9 19.4 24.14 21
           A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z" fill="currentColor"/>
  <circle cx="21.6" cy="9.6" r="2" fill="currentColor" opacity=".85"/>
</svg>
```

The moss base uses the glass circle's inner radius, 9.3 against the outer
10.2, so it meets the stroke exactly at any size. Everything is drawn in
`currentColor`, so one file serves both themes.

Ships as three artefacts:

- `components/Logo.jsx` — the mark, accepting a size prop
- `public/favicon.svg` — adapts to browser chrome in either theme
- `public/apple-touch-icon.png` at 180px — iOS does not support SVG favicons

At 16px the crown simplifies from six peaks to three; six become unreadable at
that size.

This also fixes a performance bug. `assets/icons/index.js` exports
`headerLogo` from `Design-10.png`, so the Nav and Footer currently render a
**7MB macro photograph** as a 64px circular logo, on every route. That is
almost certainly the heaviest single cost on the page, and it explains why the
logo reads as an unidentifiable green smear — a photograph has no silhouette
at 64px. The SVG mark replaces it at 417 bytes.

`header-logo.png` (a mossy stone illustration) is orphaned — nothing imports
it. Both `icons8-moss-color-*.png` files are retired too: beyond being raster
and unable to recolour, they are third-party clip art whose free licence
requires visible attribution.

### Hero image

`Design-10.png` becomes the hero image, carrying the Ken Burns drift and
scroll parallax described under Motion. At 2749×2097 it has ample resolution
for a 15% zoom, its dark right-hand falloff gives the headline somewhere to
sit, and the water droplet provides a natural focal point.

It must be converted to WebP or AVIF at roughly 2000px wide before use. At
7MB it is currently larger than most complete web pages; converted, it should
land near 300KB with no visible difference on screen.

## Features

### Cart drawer and toast

Adding to cart slides a panel in from the right and shows a brief confirmation
toast, rather than navigating away. `/cart` remains a real page for the full
view. The drawer traps focus, closes on Escape or scrim click, and announces
changes via a live region.

### Product gallery with zoom

Product detail has a main image with a thumbnail strip. Clicking the main image
zooms; moving the cursor pans. Keyboard users can change thumbnails via arrow
keys.

### Animated filter and sort

Listing filters by the six categories already defined in the server's
`Category` schema, plus price sorting. Items reflow using Motion's `layout`
prop rather than snapping.

### Skeleton loading

Shimmer placeholders while `lib/api.js` resolves. Largely invisible on mock
data, but correct groundwork for real network latency.

## Data shape

Mock products mirror the server's `Product` schema so the eventual swap is
clean:

```js
{
  id, slug, name, species, description,
  price,          // pence, formatted by utils/formatPrice
  images: [],
  category, stock, isAvailable
}
```

Prices are stored as integers in pence and formatted for display, avoiding
floating-point rounding on totals.

### Backend dependencies

Two fields the frontend needs do not exist in the current `Product` schema and
must be added during the backend cycle, or the API swap will silently drop
them:

- `slug` — unique-indexed, used for product URLs
- `species` — the Latin binomial shown as a card subtitle

## Rebuild approach

All `.jsx` components and `index.css` are written fresh against the new design
system. Product photography, the logo, and existing copy text are retained.

Rewriting rather than refactoring means the audit's findings — decorative
hamburger menu, `div onClick` cards, duplicate React keys, the broken
`fullWidth` template-literal bug — do not need separate fixes. They simply do
not exist in the new code.

## Accessibility

Requirements, not aspirations:

- Mobile navigation works. The current hamburger is decorative; the replacement
  opens a real drawer with focus trap and Escape to close.
- Product cards are `<Link>` elements, keyboard and screen-reader reachable.
- The theme toggle is a real `<button>` with an `aria-label`.
- All interactive elements have visible `:focus-visible` styles.
- Images carry meaningful `alt` text.
- Colour is never the sole indicator of state.

## Testing

Vitest with Testing Library, already configured. Coverage targets the logic
most likely to break:

- `CartContext` — add, remove, quantity changes, totals, localStorage round-trip
- `formatPrice` — pure function, straightforward unit tests
- `CartDrawer` — opens on add, closes on scrim click, traps focus
- `FilterBar` — filtering narrows the rendered set
- `ThemeContext` — persists choice, respects system preference

`MotionSmoke.test.jsx` is deleted once real animated components carry their own
coverage.

## Design references

Google Stitch generated four concept screens under project
`16157512428974937562`: homepage, collection listing, and two product detail
variations. **Product detail variant A is the chosen composition.** These are
layout references only — their CSS is not used, as the theme implementation
was inverted on one screen and inconsistent across screens.

Adopted from them: the asymmetric hero with the photograph bleeding off the
right edge; the eyebrow → serif headline → italic accent word pattern reused as
a page header across routes; two-tone serif statistics; the filter bar layout;
the card structure with name and price on one line above a Latin species
subtitle; Nordic product naming; and outlined rather than filled Add buttons in
grids.

## Risks

Product photography is 5–13MB per image, far outside a sensible budget. The
hero image has a conversion plan (see Brand assets), but the remaining product
photographs do not. This does not block the redesign; it will dominate load
time if left unaddressed and must be handled before any deployment.

The logo's open quarter can read as a loading spinner at a glance. The moss
filling the base mitigates this, but it is worth watching once the mark is in
context in the navigation bar.
