# Remaining work — Moss storefront

Written 2026-08-16. Branch `feat/frontend-redesign-foundations`, last commit `657ede0`,
working tree clean, 135 tests passing.

Everything below is already verified — each item was found by an audit, a measurement or a
browser session, not inferred. Nothing here is speculative polish.

## How this runs

Step 0 builds a comparison screen. Step 1 is a session with Slav in front of it. Steps 2
onward are implementation, ordered so the thing most likely to bite comes first. Steps 2
and 4–6 do not depend on the test session and can be pulled forward if the session slips.

> [!note] The `/lab` route was deleted on 2026-08-16, once every panel had been answered.
> It existed for a day. What survives is the Decisions section at the foot of this file — what was
> chosen, and what it beat. The one line of shipped code it needed, `ThemeProvider`'s dev-only
> `?theme=` override, was kept: pinning a route to a theme by URL without writing to `localStorage`
> is useful any time the app is driven or screenshotted, not just by the sweep it was built for.

## Step 0 — the `/lab` comparison screen

A single dev-only route holding every open visual decision side by side, so choices are
made by looking rather than by describing. Guarded by `import.meta.env.DEV`, never
reachable in a production build, and deleted once the decisions are recorded.

Six panels:

| Panel | Compares |
|---|---|
| Hero motion | Ken Burns as shipped (24s infinite) vs. paused off-screen vs. run-once vs. none |
| Hero stats | The placeholder trio vs. claims that are actually true vs. no band at all |
| Theme sweep | All five routes, light and dark, side by side in iframes |
| Motion inventory | Every animation in the app, replayable on demand |
| Touch targets | Current sizes vs. 44px, with the hit area drawn |
| Eyebrow | The shared eyebrow vs. per-route alternatives |

The theme sweep needs one change to shipped code: `ThemeProvider` honours a `?theme=`
query parameter in development only, so an iframe can be pinned to a theme without
touching `localStorage`. That is the only non-throwaway line in the whole step, and it
gets a test.

## Step 1 — the test session

Slav's own three reminders, unchanged from 2026-08-12:

1. **The hero.** He said "test something" and did not say what. It is the one section never
   revisited — still runs Ken Burns `24s infinite` on a full-bleed image whether or not it
   is on screen, still carries the unverified stats band.
2. **The light theme.** A full pass across all five routes. The scrim was retuned for light
   after he called it too pale, but only Story and Contact were ever checked. Products,
   product detail and cart were not.
3. **"Some other animations."** Unrecorded. The motion inventory panel exists so he can
   point at the one he means instead of trying to remember it.

Output: decisions written into this file, and the `/lab` route deleted.

## Step 2 — code-split the routes

All six routes load eagerly in one **147.0 kB** gzipped chunk against a 150 kB landing-page
budget. **~3 kB of headroom.** Every further feature eats into it, so this comes before any
of them. `React.lazy` plus `Suspense`, Home stays eager, measured before and after.

→ `client/src/router.jsx`

## Step 3 — light-theme fixes

Whatever the sweep finds. Unknown size until step 1 runs.

## Step 4 — skip link

There is no skip link before `<main>`, and the nav is 4+ tab stops on every route.

This is also the natural stage-2 benchmark for the five-skill comparison that was abandoned
mid-session on 2026-08-12 and never flagged. It has an objective pass mark and is small
enough to build four times. `21stdev` is unblocked now that the `magic` MCP tools load;
`taste-design` is still dead (Stitch MCP fails its tool fetch). Optional — the skip link
gets built either way.

## Step 5 — touch targets

Drawer Remove at 16px, nav icons at 35px, filter chips at 38px, against a 44px comfortable
minimum. Fixed at the component level, pinned by a test where the size is expressible in a
class rather than in layout.

## Step 6 — responsive images

1400px portraits render at roughly 400px square, so about a third of every photograph is
downloaded and then cropped away. Emit narrower widths from the existing optimiser and wire
`srcset`/`sizes`.

→ `client/scripts/optimise-images.mjs`

## Step 7 — the eyebrow

The same `.eyebrow` treatment fires on all five routes through the shared `PageHeader`.
Called out by `impeccable` as a template tell, and it is structural rather than incidental.
Treatment decided from the `/lab` panel.

## Step 8 — hero stats

`12 Species / 200+ Pieces / 3k Customers`, plus "Ethically foraged" and "UK-wide delivery",
were never confirmed with the client. A dev-only badge marks them, and that badge is
stripped from production — so they are hard to miss in development and impossible to notice
once deployed.

**This blocks deploy.** Either the client supplies real figures or the band is replaced with
claims that are true without them.

→ `client/src/constants/index.js`

## Step 9 — PR #1 description

Still describes the 37-commit state from 2026-08-11. No mention of the accessibility pass,
the `--border-interactive` token contract, the photography work or the theme transition.

## Step 10 — deploy

`vite build` produces a standalone 2.2 MB `dist/`. The mock data layer in
`client/src/lib/api.js` means the storefront runs without the server, so nothing on the
backend blocks this. Netlify, Vercel or Cloudflare Pages.

This is the only step [[NORTH STAR]] actually measures. Everything above it is preparation.

## Bugs found by Slav testing — 2026-08-16

Both were reported from real use, not from a test or an audit.

### The mobile menu had no background

The panel is `position: fixed`, and it sat inside `<header>`, which carries `backdrop-blur-md`.
**A `backdrop-filter` makes an element the containing block for fixed-position descendants**, so
`fixed top-0 bottom-0` resolved against the header's own ~86px box rather than the viewport: the
panel's background was a strip across the top of the screen, and the links rendered below it with
nothing behind them. On a phone that read as "no menu items"; on a tablet as "transparent
background, text blending into the page".

Fixed by rendering the menu as a sibling of the header rather than a child. jsdom has no layout and
cannot catch this, so `Nav.test.jsx` enforces it structurally: the dialog must not be inside a
`<header>`.

### The sort dropdown was unreadable

Native `<select>` popups are painted by the browser from the `<option>` colours, not by the control.
The control was `bg-transparent`, so the options had no background of their own — Chrome drew a
default light list and the inherited near-white `--text` sat on top of it. Only the highlighted row,
which the browser paints itself, was legible.

Fixed in two stages. Giving the options explicit colours made the text readable, but the highlight
bar stayed the operating system's blue, because the browser paints that itself.

`appearance: base-select` (Chromium 135+, wrapped in `@supports`) hands the popup to CSS entirely,
so `::picker(select)` and `option:hover` are stylable. The highlight is now `--accent` on
`--on-accent`, matching the active filter chip on the other side of the same row. Anywhere without
support, the block is inert and the browser keeps drawing its own list — still readable, thanks to
the option colours. No JavaScript and no dependency.

Two things came out of getting there:

1. **A cascade-layer trap.** The option colours were Tailwind `[&>option]:*` utilities, and Tailwind's
   `utilities` layer is declared after `components`. **Layer order is resolved before specificity**,
   so the utility beat the `:hover` rule however specific that rule was made. The fix was to give the
   whole control one owner in `index.css` rather than to fight it.
2. **`:focus-visible`, not `:focus`.** Clicking the control open puts focus on the selected option,
   so with plain `:focus` two rows lit at once and neither could be told from the other.

Verified in a real browser this time — with `base-select` the popup is a DOM element, so it appears
in a screenshot. Checked in both themes.

One follow-on, reported by Slav: the selected value then sat against the **top** of the pill rather
than on its centre line. `base-select` replaces the control with a flex container holding a generated
button for the current value, and its default `align-items` is `normal` — the native control had been
centring it. Fixed with `display: inline-flex; align-items: center` on `.select-themed`; the select
and the filter chips now share a centre line. Taking the popup from the browser means taking over
what it was quietly handling as well.

## Deliberately not in this plan

- **The products controller.** Real backend data would replace `lib/api.js`, but it does not
  block a frontend deploy and it is a larger piece of work than everything above combined.
- **Anything on `server/`.** `products`, `orders` and `categories` are still stub routes.
  Known, recorded, not this session's work.

## Decisions

### Responsive images — 2026-08-16

**Step 6 done.** `vite-imagetools` replaced the photo half of `scripts/optimise-images.mjs`.
Photographs are imported from their `.jpg` masters with a width list — `?w=240;480;960;1400&as=img`
— and the plugin resizes and encodes each width at build time, returning `{ src, srcset, w, h }`.
A new `components/Photo.jsx` spreads that onto the `<img>` and **requires** a `sizes` prop, throwing
in development without one: a missing `sizes` silently reverts the browser to assuming 100vw and
undoes the whole change with no visible symptom.

Measured on the products page, same scroll, real browser:

| Device | Before | After |
|---|---|---|
| Desktop 1440, DPR 1 | 1582 kB | 310 kB |
| Phone 390, DPR 3 | 1582 kB | 876 kB |

Three things found by measuring rather than reasoning:

1. **`mossCreek.webp` was a duplicate.** Byte-for-byte `moss1.jpg` resized to 1600 — confirmed by
   pixel comparison and then again when the rebuilt 1600px variant hashed identically to it. The
   hero imports `moss1` now.
2. **The first `sizes` was wrong.** It described the card, not the photograph, and the card's 12px
   padding was enough to push a 390px phone from 954 device pixels to 1026 — over the 960 rung and
   onto the 1400 file. 83 kB per card, four cards.
3. **`mossDolly` is encoded twice.** It is a hand-cut crop of `mossCloseup.jpg` whose crop box was
   never recorded, so the `.webp` is its only source. Quality raised to 85 to offset the second
   pass; it lands at 151 kB against the 156 kB it cost before.

**Left behind:** roughly 20 `.webp` siblings, plus `brand/hero.webp` and `mossCreek.webp`, are no
longer imported by anything — about 4 MB. `mossCloseup.jpg` must stay; it is `mossDolly`'s master.

### Route code-splitting — 2026-08-16

**Step 2 done, and it does not do what this plan assumed.** First load went 148.13 kB → 146.24 kB
gzipped. **1.9 kB.** The routes were 1–2 kB each because the storefront's own code is only 10 kB of
the total. Measured composition, gzipped: react + react-dom 57.16 (39%), motion 43.90 (30%),
react-router 29.53 (20%), react-icons 5.71 (4%), own code 9.94 (7%). No amount of route-splitting
was going to move a budget spent on framework.

Kept anyway — it stops the bundle growing with each new route and costs nothing.

Uses **react-router's own `lazy`, not `React.lazy`**: it resolves before committing the navigation,
so the page being left stays on screen until the next one is ready. Verified with zero empty frames
sampled across a navigation. But it introduced **612ms of silence** after a click on Slow 4G, so
`components/NavigationProgress.jsx` acknowledges it — three phases, because the two-phase version
slid the bar backwards on arrival, which reads as cancelled.

**The real lever is `motion` at 43.9 kB.** `LazyMotion` could cut roughly 20 kB, but `ProductCard`'s
`layout` prop needs the larger feature set and it means touching every animated component. Not done;
needs a decision.

### Skip link — 2026-08-16

**Step 4 done.** `components/SkipLink.jsx`, first in the DOM, `sr-only` until focused. `<main>` took
`id="main"` and `tabIndex={-1}`.

`sr-only` and not `display: none` — the latter removes an element from the tab order entirely, so a
skip link built that way can never be reached by the one input method it exists for. `tabIndex={-1}`
makes `<main>` focusable by script but not by tabbing; without it the browser scrolls and leaves
focus stranded in the nav.

Positioned below the header, not the top-left corner — pinned there it covered the wordmark.
Verified by pressing keys: Tab shows it, Enter puts focus on `#main`, the next Tab lands inside the
content.

### The Add button — 2026-08-16

Reported by Slav: "it looks blended with the card on both states, hover or not." Measured, the hover
moved the background by **1.13:1** in dark and **1.04:1** in light — no visible change — and at rest
it was a 1px hairline.

**Chosen: `--control`, a mix of the card's own colour with 18% accent, ringed in `--accent`, at
152px.** Rest to hover is now **5.87:1** and **4.98:1**.

Two wrong turns, both worth recording:

1. **The first two rounds forced the fill to clear 3:1 against the card on its own.** That is the
   wrong constraint — the accent ring identifies the control at 8.19:1, which is what WCAG 1.4.11
   asks for. Under the wrong constraint the dark theme has *no legal colour at all*: the band that
   clears 3:1 on the card and 4.5:1 under the label is empty. Slav corrected it.
2. **The lab's live contrast readout printed nonsense** because `getComputedStyle` returns
   `oklab(...)` for a `color-mix`, and the parser read those coordinates as RGB channels. Fixed by
   painting to a 1×1 canvas and reading the pixel back.

`--control` is declared once rather than per theme: `--surface` and `--accent` are both redefined on
the same element that carries `data-theme`, so the mix lifts the card in dark and deepens it in
light on its own. `tokens.test.js` gained an oklab implementation to measure it — sRGB interpolation
gives a different answer — verified against Chrome's own resolution of the same declaration, which
lands on the identical pixel in both themes.

Width chosen over a full-width bar: full width made the button heavier than the photograph, and on a
phone where cards already span the screen it is a very wide bar for a two-letter word.

### Hero — 2026-08-16

**Chosen: the two-shot camera move.** Wide on the creek — moss over rock, running water — then a
cut in to the droplet macro. Both shots are wild moss, so the cut reads as one camera moving
closer rather than as a change of subject. Slav picked the creek as the opening shot; the first
version opened on the studio arrangement, which had nothing to do with where the second shot lands.

Rejected along the way, with reasons:

- **Full bleed on the existing hero crop** — a 1.31:1 photograph in a 2.5:1 band loses the droplet
  entirely. Fixable with an anchored crop, but it never beat the camera move.
- **Soft seam** — too small a change to be worth the code.
- **Lay back** — 22° of rotation as the hero leaves; still reads as almost nothing.
- **21st.dev Zoom Parallax** — opens with the copy on the left and an empty right half until the
  visitor scrolls, and the tiles sit below the fold. Deleted rather than left to cost bundle weight.
  It also shipped with no `prefers-reduced-motion` handling at all, which had to be added.

Two bugs found by measuring rather than looking:

1. **The crossfade never ran.** Motion wrote both plates' opening opacity once and never updated
   it, while driving `scale` on the same elements correctly. On screen this looked like a hero that
   simply goes nowhere. Replaced with a cut, which is the right edit for two shots anyway.
2. **The droplet was anchored at 49% of the frame** — exactly where the copy ends and the scrim
   falls away, so the camera arrived at a subject hidden behind its own scrim. The plate was
   re-cut to put it at 62%.

**Also changed:** "Our process" (`sections/Story.jsx`) now carries the wide arrangement photograph
instead of the creek, which moved to the hero. That suits the copy better — the section is about a
finished piece, not a hillside. Costs 148 kB; `dist/` is 2.2 MB → 2.4 MB.

**Shipped 2026-08-16.** The two-shot is now `sections/Hero.jsx` itself. Every other variant, the
switcher, `src/lab/Hero*.jsx` and the lab's hero-motion panel were deleted, and the Ken Burns
keyframes came out of `index.css` with them — nothing on the page animates forever or off screen
any more.

**Bundle: 2.4 MB → 2.8 MB.** The two plates (`mossCreek` 311 kB, `mossDolly` 152 kB) now ship and
the old `hero.webp` no longer does, for a net +363 kB. This makes **step 6 (`srcset`) matter more
than it did**: a phone is currently downloading a 1600px creek plate to draw it 390px wide.

### Hero stats — 2026-08-16

**Chosen: B, the true claims.** `No water / No light / No upkeep`, now live. The invented figures
are gone from the codebase, and the dev-only "sample data" marker went with them. **Step 8 is
closed and the deploy is no longer blocked by this.**

The duplication problem was resolved the other way round from the way it was found. Looking at the
panel on screen showed that the hero paragraph directly above the band already said *"without
water, light or any attention at all"*, and the footer said *"No watering, no light, no upkeep"* a
third time. Rather than drop the band, the band kept the line and it came out of the other two:

- Hero paragraph is now *"Deep green and soft to the touch — a piece of woodland floor for a wall,
  a shelf, or a desk."*
- Footer is now one sentence, with the care list removed.
- `Hero.test.jsx` pins the paragraph so the duplication cannot creep back in through a copy edit.

Rejected: **A** (invented), **D — the process** (`01 Gathered / 02 Preserved / 03 Arranged`), which
was rejected for a reason that matters more than the band itself — see below.

### ⚠️ The process copy is unverified too — found 2026-08-16

D was drawn from `sections/Story.jsx`, on the assumption that shipped copy had been approved. Slav's
response: *"I don't know how it is gathered or preserved."*

So the Story section is **live right now** claiming the moss is "gathered under licence from managed
Nordic woodland" and "preserved with a plant-based glycerin solution", neither confirmed and neither
marked. "Nordic" carries the same problem and appears in four places: `Hero.jsx`, `Footer.jsx`,
the `Products.jsx` page lead, and `Story.jsx`.

This is the same class of problem as the invented figures, and it was only found because a rejected
option happened to quote it. Tracked as its own task; needs either the client's confirmation or a
rewrite.

### Eyebrow — 2026-08-16

**Chosen: D, a rule instead of a word.** Live. `PageHeader` renders a short accent rule where the
label used to sit, and **the `eyebrow` prop is gone entirely** rather than left accepted-and-ignored,
so a call site that passes one is now dead code instead of a silent reappearance. The four call
sites — Products, Cart twice, Contact — were cleared with it. Step 7 is closed.

The `.eyebrow` class stays: it still carries the hero kicker, the Story section's "Our process", the
404 label, the contact detail labels and the product species line. Those are labels that say
something the heading does not; the template tell was specifically the shared one above every `h1`.

### Touch targets — 2026-08-16

Step 5 done. Everything measured in a real browser before and after, because jsdom has no layout
and a class-name assertion would only prove the class is present, not that the target is 44px.

| Control | Before | After | How |
|---|---|---|---|
| Theme toggle, each half | 32 | 44 | `size-11`, and `SLOT` 18 → 24 so the two tap areas do not overlap |
| Basket, menu, drawer close | 35 | 44 | `p-2` → `size-11 grid place-items-center` |
| Drawer **Remove** | 16 | 44 | `min-h-11` with `-mx-2` absorbing the padding so the row does not shift |
| Filter chips, sort select | 38 | 44 | `min-h-11`, padding kept |
| Quantity stepper | 36 | 44 | `size-9` → `size-11` |
| Product card **Add** | 34 | 44 | `min-h-11` — **not in the original audit**, found by measuring |
| Footer socials | 36 | 36 visual, 44 tappable | `after:-inset-1` overlay; verified with `elementFromPoint` 3px outside the circle |

The basket badge was re-anchored to the icon rather than the button: on a 44px button a corner-pinned
badge floats away from the basket it is counting.

**Deliberately left under 44px:** the nav and footer text links, 17–18px tall. They pass WCAG 2.5.8
through the spacing exception, and it was checked rather than assumed — nav links sit 48px apart
horizontally, footer links 36px centre to centre vertically, against the 24px the exception requires.
