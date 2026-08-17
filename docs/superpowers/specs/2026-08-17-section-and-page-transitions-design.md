# Section and page transitions

**Date:** 2026-08-17
**Branch:** `feat/frontend-redesign-foundations`
**Status:** approved, not yet implemented

## The problem

Clicking a link on this site produces nothing. The page you were on disappears and the next one is
simply there. Every component on the site now has a considered motion state — the droplet under the
active nav link, the inchworm tab in the filter bar, the halo on a product card, the drawer sliding
in — and then the largest change the interface ever makes, replacing the entire page, happens with
no transition at all.

Two smaller gaps sit alongside it. The home page's `FeaturedProducts` and `Story` sections are fully
formed before you reach them, so scrolling reveals nothing. And clicking a product card throws away
the one piece of continuity the interaction has: the photograph you clicked is the same photograph
that opens the detail page, and nothing connects them.

## What ships

1. **Route transitions** on all fifteen navigation links.
2. **Scroll reveals** on the home page's two sections — `FeaturedProducts` and `Story`. Nowhere
   else: the inner routes are short and task-focused, and a reveal in front of a cart delays
   something a person is trying to read.
3. **A shared-element morph** from a product card's photograph into the product detail page's
   photograph.
4. **A dev-only intensity switcher**, so the loudness gets chosen by looking rather than by
   describing. It is deleted once the choice is made.

## Mechanism

**Route changes and the shared element use the View Transitions API**, driven by react-router's own
`viewTransition` prop. **The section reveals use Motion's `whileInView`.**

They are different problems. A route change is a whole-document swap the browser can snapshot for
free; a section reveal is one element reacting to scroll, which is what Motion is for and which
costs nothing extra because Motion is already in the bundle at 43.9 kB.

Both APIs were verified against the installed `react-router@8.3` rather than assumed:
`viewTransition?: boolean` on `LinkProps` and `NavLinkProps`, and `useViewTransitionState` in the
package's exports.

### Why not `AnimatePresence` for the routes

Two reasons, both from findings already recorded in this repo.

`router.jsx` uses react-router's `lazy`, which resolves a route's chunk **before** it commits the
navigation — the page you are leaving stays on screen until the page you are going to is ready. That
wait already exists and already cost 612ms on Slow 4G, which is why `NavigationProgress` was built.
An `AnimatePresence` with `mode="wait"` charges an exit animation on top of it.

And the cross-route shared element would need `layoutId`, which is exactly what broke twice against
the header's `backdrop-blur`: a `backdrop-filter` creates a containing block, so Motion's layout
projection measured its delta against the wrong origin. Both the filter bar and the nav droplet
ended up measuring offsets directly instead. The browser's own view transition does not have this
problem, because it snapshots against the viewport.

### Browser support needs no fallback

Chrome and Edge 111+, Safari 18+, Firefox 144+. Where `document.startViewTransition` is missing,
react-router runs the navigation normally — which is the behaviour the site has today. Nothing
degrades; the transition is simply absent.

## Intensity as data

`src/lib/motion.js` holds three presets. Each is a duration, a travel distance and an easing curve.
No stagger: a product grid that deals itself out card by card makes a page feel slower than it is,
and the grid is the only place a stagger would have applied.

| Preset | Duration | Shift | Character |
| --- | --- | --- | --- |
| `quiet` | 180ms | 10px | Noticeable as smoothness, not as an effect. **Ships as the default.** |
| `deliberate` | 320ms | 24px | Visible direction; a reader registers a designed transition. |
| `cinematic` | 520ms | 40px | The hero's camera language applied to the page. |

Applying a preset writes CSS custom properties — `--motion-duration`, `--motion-shift`,
`--motion-ease` — onto the document element. The view-transition rules read them from CSS, and
`Reveal` reads the same preset object from JS. One switch moves both, and neither can drift from the
other.

Custom properties reach the view-transition pseudo-elements because that tree is rooted at the
document element and inherits from it.

## Files

### New

- `src/lib/motion.js` — the three presets, and `applyMotionPreset(name)` which writes the custom
  properties. Pure data plus one DOM write.
- `src/components/Reveal.jsx` — a `motion.div` with `whileInView`, `once: true`, and travel taken
  from the active preset. One place, so the pattern cannot fork.
- `src/hooks/useMotionPreset.js` — dev-only preset state, persisted to `localStorage`.
- `src/components/MotionPresetSwitcher.jsx` — the switcher. `import.meta.env.DEV`-guarded so it
  tree-shakes out of the production build, exactly as `PaletteSwitcher` and `VariantSwitcher` did.

### Changed

- `src/index.css` — `::view-transition-old(root)` / `::view-transition-new(root)` rules, the
  `product-photo` group rule, and both inside the existing `prefers-reduced-motion` guard.
- `viewTransition` on every navigation link — **eleven direct** `Link`/`NavLink` sites in `Nav.jsx`,
  `Footer.jsx`, `ProductCard.jsx`, `Cart.jsx`, `NotFound.jsx`, `ProductDetail.jsx`,
  `FeaturedProducts.jsx` and `Story.jsx`, plus **four** that route through `Button as={Link}` in
  `CartDrawer.jsx`, `Cart.jsx` and `Hero.jsx`. `Button.jsx` itself needs no change: it spreads the
  rest of its props onto the component it renders, so the flag passes straight through.
  `SkipLink.jsx` is a plain same-page anchor and is deliberately left alone.
- `src/components/ProductCard.jsx` — `useViewTransitionState` decides whether this card's photograph
  carries the shared name, and a `sharePhoto` prop lets a caller refuse it.
- `src/components/Gallery.jsx` — an optional `viewTransitionName`, merged into the inline style the
  main photograph already carries for its zoom origin.
- `src/routes/ProductDetail.jsx` — the matching name on the gallery, and `sharePhoto={false}` on the
  related products.
- `src/context/ThemeContext.jsx` — marks the root element during a theme swap. Route changes animate
  the same two pseudo-elements the theme swap does, and the two want different motion, so the CSS
  needs to tell them apart. Without this, tuning the page transition would silently retune the
  approved 340ms theme crossfade.
- `src/sections/FeaturedProducts.jsx`, `src/sections/Story.jsx` — wrapped in `Reveal`.
- `src/layouts/RootLayout.jsx` — mounts the dev-only switcher.
- `src/test/setup.js` — an `IntersectionObserver` stub.

## The real trap: duplicate names

Two elements carrying the same `view-transition-name` at the same time abort the entire transition,
and they do it silently — the page simply changes with no animation and no error a user would see.
There are two ways to hit it here, and the second was only found by reading react-router's source
during planning.

**One: the cart drawer.** It renders a `Photo` per cart line. Naming every card's photograph by slug
would break the transition for anyone who added a product to the basket and then clicked that
product's card — a state a customer reaches in two clicks.

**Two: related products.** `ProductDetail` renders `ProductCard`s below the gallery.
`useViewTransitionState(to)` returns true when `to` matches the next location **or the current one**
(`lib/dom/lib.js:1261`) — the "or current" clause is what makes the morph run in reverse when going
back to the grid. But it means that clicking a related product names the gallery, which matches the
current location, *and* the related card, which matches the next one. Two named elements on the
outgoing page.

**The fix, in two parts:**

- Only the card the transition involves is named, decided by
  `useViewTransitionState({ pathname: '/products/' + slug, search })`. Every other card returns
  false, and cart-drawer thumbnails are never named at all.
- `ProductCard` takes a `sharePhoto` prop, default `true`, which `ProductDetail` sets to `false` on
  its related products. That leaves the gallery as the only named element on that page, and the
  result is a photograph morphing into a photograph — the hero image swapping in place, which is
  the right transition between two products anyway.

## Reduced motion

Already covered on both sides and neither needs new machinery. `MotionConfig reducedMotion="user"`
in `RootLayout` governs everything Motion drives, including `Reveal`. The `prefers-reduced-motion`
block in `index.css` governs the CSS, and the new view-transition rules go inside it.

## Testing

- `src/lib/motion.test.js` — every preset carries the same keys; `applyMotionPreset` writes the
  three custom properties onto the document element.
- `src/components/Reveal.test.jsx` — renders its children, and passes `once: true` so a section
  cannot re-animate every time it scrolls past.
- `src/components/ProductCard.test.jsx` — the photograph carries the shared name when a transition
  targets this card's slug, and carries no name otherwise. This is the duplicate-name guard, so it
  is the test that matters most.
- The existing **178 tests stay green**, lint stays clean, and the production build stays inside the
  150 kB budget. It should not move at all: the view transitions add no JavaScript, and `Reveal`
  imports from a library already in the bundle.

`src/test/setup.js` currently imports `@testing-library/jest-dom` and nothing else. jsdom has no
`IntersectionObserver`, which `whileInView` requires, so the stub goes there — the same shape as the
`ResizeObserver` guard the nav droplet needed.

## What cannot be settled by reading

Three things get verified in a real browser, not asserted:

1. **The reverse direction.** Going from the detail page back to the grid should morph the
   photograph back into its card. Whether `useViewTransitionState` reports true on the grid side of
   that navigation needs checking, not assuming.
2. **The outgoing snapshot's scroll offset.** A view transition snapshots the old page while
   react-router restores scroll on commit; the two can disagree and show the outgoing page at the
   wrong offset.
3. **Safari against Chrome** on the shared element specifically.

## After the choice

Once a preset is picked: the switcher, the hook and the two losing presets are deleted, and the
winner's numbers become constants in `src/lib/motion.js`. Same lifecycle as `/lab`, `PaletteSwitcher`
and the variant switch — built to make a decision, deleted once the decision exists.

## Out of scope

- The cinematic four-beat hero and its WebGL displacement warp. Still blocked on two photographs and
  a ~150 kB three.js budget the site does not have.
- `LazyMotion`. It could cut roughly 20 kB from Motion but needs every animated component touched,
  and it is a bundle decision rather than a design one.
- Transitions on the inner routes' own content. Decided against above.
