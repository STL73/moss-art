# Current Feature

## Status

In Progress

## Goals

Close out the frontend redesign branch and get the storefront to a public URL.

The plan, and every decision made against it, lives in
[docs/plans/2026-08-16-remaining-work.md](plans/2026-08-16-remaining-work.md). Read that first —
it carries the reasoning, not just the outcome.

## Where things stand

**178 tests**, lint clean, production build green at 116.63 kB gzipped. Committed but **not yet
pushed** as of 2026-08-17.

`feat/frontend-redesign-foundations` is ahead of `main`, and
[PR #1](https://github.com/STL73/Moss/pull/1) is open with a full description.

Done 2026-08-17:

- **Eighteen products across six categories**, three in each. Every one has a photograph of a made
  object. `wreaths` is back and `letters-signs` is new; the footer offers all six.
- **The photography is generated**, from `docs/product-image-prompts.md` through Cloudflare
  Workers AI. `npm run images:generate` renders the pack; `node scripts/contact-sheet.mjs` composes
  all eighteen into one sheet, which is the only way the consistency problem is visible.
- **Finnish product names are gone.** Kivi, Metsä, Rauha, Lampi, Aurora and Talvi meant nothing to
  a shopper. Names now describe what is in the frame and match the filename. Four files were
  renamed with them — `paleBowl`→`ceramicBowl`, `fernFrame`→`oakFrame` (no fern, ever),
  `mossLetter`→`mossLetterM`, `mossWord`→`mossSign`. The sign spelled KOTI and now spells HOME.
- **The Nordic palette ships**, measured out of `ceramicBowl.jpg` rather than designed, replacing
  the sage-green scheme. Dark accent is the ice-blue moss from that photograph; the light ground is
  the same blue at 16% saturation, well below the near-white the web defaults to. Chosen against
  four other candidates behind a temporary switcher, now deleted.
- **`--accent` and `--accent-strong` are split.** `--accent` is rendered as text, which caps how
  light it can be; a hover border wants the opposite. Trying to satisfy both had collapsed the chip
  hover to 1.01:1. Now 2.16× in light, 2.35× in dark.
- **Light-theme text read pale at nearly 13:1.** Cause was `-webkit-font-smoothing: antialiased` on
  the whole body — right for light-on-dark, wrong for dark-on-light. Now scoped to dark.
- **The cart drawer had no empty state.** The basket icon opens it unconditionally, so clicking it
  with nothing in the basket showed a blank panel, a £0.00 subtotal and a button to `/cart`, which
  is also empty — a dead end one click from every page. Fixed in `352bc69`, with the mark drawing
  itself above the message.
- **The light theme is swept.** Slav reviewed the cart drawer, products and product detail in light
  and passed all three. Open since 2026-08-12 — it is the reason `/lab` was built, and it got
  skipped on the day. Nothing left to check here.
- **Three design questions settled, no code needed.** The **cart drawer keeps `--surface`** rather
  than matching the page ground: the palette carries depth as a ladder (`--bg` ground, `--surface`
  on it, `--raised` above that), and in light the ground and the panel are only 1.16:1 apart in
  luminance, so their separation is hue — a blue panel on a blue page under a black scrim would read
  as murky, not layered. **No tooltips**, on the photographs or anywhere else: hover-only content
  does not exist on a phone, so either the information matters and cannot hide behind hover, or it
  does not and should not be on the page. The card's Add button is already the correct pattern —
  hover reveals emphasis, never content, with `[@media(hover:none)]` as the escape. **No new
  modals**: the drawer and the mobile menu earn theirs as overlay surfaces with focus traps, and
  nothing left is a task that must be finished or abandoned before anything else can happen. In
  particular, no confirm-before-remove (undo beats confirm) and no quick-view modal, which would
  duplicate the detail route and break the linkability the breadcrumb work exists to protect.
- **The theme icons idle** when active. The sun turns once every 40s with alternate rays retracting
  to a quarter and trading; the moon's shadow crosses the disc in one direction and wraps, which is
  the full run of phases. Only the theme in use animates — the other is an offer, not a state.

### The component redesigns shipped

`ProductCard`, `Button`, `FilterBar` and `CartDrawer` were each redesigned on 2026-08-17 and put
behind a dev-only A/B switch so they could be judged on the real site rather than in isolation.
Slav approved all four; the switch, the dispatchers and `useVariant` are deleted, and the
redesigned versions are now simply the components.

What shipped:

- **ProductCard** — photograph flush to the card edges, name in the display serif with the price
  larger again in `--accent`, Add revealed on hover (and permanently visible on touch, where there
  is no hover to wait for), and a 2px accent halo that fades in on hover. No stock messaging:
  nothing is held in stock, so scarcity would have been a lie.
- **Button** — a real press state. It previously declared `transition-[...transform]` and never
  animated one, so a click produced no feedback at all.
- **FilterBar** — browser tabs. The active tab's fill spans the whole tab with rounded top corners,
  sitting on the rule, and travels as an inchworm: left and right edges on separate springs, so the
  leading edge sets off first and the shape stretches in transit.
- **CartDrawer** — quantity steppers, per-line totals instead of leaving "2 × £85.00" for the
  reader to multiply, a delivery line so the subtotal is not mistaken for the final number, and a
  bin icon rather than the X that already means "dismiss the panel".
- **Nav** — a droplet under the active link. The droplet from the logo, not the logo: the mark is
  already in that bar beside the wordmark, and a logo says "this is us", not "you are here".

There was a wrong turn on the way: `5f363b0` deleted all of it after a misread, and it was restored
from `7c08763` and `264fefa`. Those two commits are the reference if any detail needs recovering.

Three findings from that round are worth keeping whatever happens to the designs:

- **`layoutId` cannot deform.** It moves one rigid box between two measured positions. Anything that
  should change shape in transit has to animate its edges independently.
- **`backdrop-filter` breaks Motion's layout projection.** The header has `backdrop-blur-md`, which
  creates a containing block, so `layoutId` measured its delta against the wrong origin and jumped.
  Measuring offsets directly is what both the filter bar and the nav droplet ended up doing.
- **`overflow-hidden` clips a glow.** A hover halo drawn outside a card's box is invisible if the
  card clips. Put the clip on the child that needs it.

Done 2026-08-16:

- **The hero is a two-shot camera move** — wide on the creek, cut at 45%, push in to the droplet.
- **Hero stats, eyebrow, touch targets** — invented figures replaced with true claims, the shared
  eyebrow replaced with a rule, 44px targets across nav, drawer, chips, stepper and cards.
- **Two bugs Slav found** — the mobile menu had no background (`backdrop-filter` on an ancestor was
  capturing the fixed panel), and the sort dropdown was unreadable (now `appearance: base-select`).
- **Responsive images.** `vite-imagetools` emits a width ladder per photograph; `Photo.jsx` wires
  `srcset`/`sizes` and throws in dev without a `sizes`. Products page: **1582 kB → 310 kB** on a
  1440 desktop, **→ 876 kB** on a DPR-3 phone.
- **Route code-splitting.** Saves only **1.9 kB** — the budget is 93% framework — but it stops the
  bundle growing per route. Added `NavigationProgress.jsx`, because the split introduced 612ms of
  silence after a link click on Slow 4G.
- **Skip link.** `SkipLink.jsx` before the nav; `<main>` is `id="main" tabIndex={-1}`.
- **The Add button** was moving by 1.13:1 in dark and 1.04:1 in light — no visible change. New
  `--control` token; now 5.87:1 and 4.98:1. `tokens.test.js` gained an oklab implementation to
  measure a `color-mix`.
- **Footer** carries a Spireforge credit, mark and word in one anchor, linking to spireforge.co.uk.
- **Images renamed and culled.** Named for what is in the frame; 30 unused files deleted,
  **60 MB → 17 MB**.
- **Catalogue cut to six products**, every one showing a made object rather than scenery. Joki
  Stones, Havu Wreath and the `wreaths` category are out until there is photography for them.

## Still open

Slav chose **build first, deploy after** on 2026-08-17, so the deploy now sits behind the visual
work rather than in front of it.

1. ~~**Section and page transitions**~~ — **built in full on 2026-08-17 and reverted the same day**
   in `00bda7a`. The mechanism worked and was measured; what never arrived was a visible difference,
   at any of the three intensities that were put behind a dev-only switcher to choose between. The
   spec and the plan survive, so picking this up is a revert-of-the-revert rather than a rewrite —
   but **read the revert commit message first**, it carries two defects that cost most of the
   session: translating the root snapshot drags the header and footer with it (identical on every
   route, so it reads as the window jumping), and excluding them with bare `header`/`footer`
   selectors kills every transition on an inner route, because `PageHeader` renders a second
   `<header>` and a duplicate `view-transition-name` aborts the transition silently. An aborted
   transition is indistinguishable from a finished one in a screenshot; `document.getAnimations()`
   during the transition returns `[]` and is the only check that tells them apart.
   → `docs/superpowers/plans/2026-08-17-section-and-page-transitions.md`
2. **The cinematic hero.** Four beats — aerial over moss, dive, through water, the droplet — with a
   WebGL displacement warp on the dive. Needs two new photographs. **A literal flythrough is a
   video shot**: three.js is ~150 kB gzipped against a 115 kB budget, and no video-generation MCP is
   installed.
3. **Merge PR #1 into `main`**, then **deploy to Cloudflare Pages** — root directory `client`, build
   `npm run build`, output `dist`. No `_redirects` needed: Pages auto-detects an SPA when there is
   no top-level `404.html`. Verify a deep link on the live URL. Use `moss.spireforge.co.uk` or the
   free `*.pages.dev`.

Two shots to redo on a fresh neuron allocation:

- **`mossSign.jpg`** — letterforms are crude next to `mossLetterM.jpg`.
- **`mossTiles.jpg`** — the cream tile is right; the three green ones read as conifer fronds.

Smaller, decided but not done:

- **The cart toast has no undo.** Adding a product confirms, removing one says nothing. That
  asymmetry is defensible on its own — an add changes a number in the header you cannot see, while a
  removal happens in front of you — so what is missing is **Undo, not a message**. It has to restore
  the item *and* its previous quantity, and the stepper stepping down to zero has to go through the
  same path. Two things change with it: the 2.6s auto-dismiss (a button that vanishes in under three
  seconds cannot be reached by keyboard) and `role="status"`, which announces politely and is wrong
  for something actionable. Position moves to **bottom-centre** at the same time — `bottom-6 left-6`
  exists only to dodge `BackToTop` at `bottom-6 right-6`, and an action belongs in the thumb zone.
  Roughly an hour with tests. → `client/src/components/Toast.jsx`, `context/CartContext.jsx`
- **`motion` is 43.9 kB gzipped**, 30% of the JS budget. `LazyMotion` could cut ~20 kB but needs
  every animated component touched. Undecided.
- **Remove the `noindex`** in `client/index.html` on the day the shop is real. It is not a
  `robots.txt` Disallow on purpose — a disallow stops the crawl, so the tag never gets read.

## Not blockers

The placeholder copy in `Story.jsx` — "gathered under licence", "plant-based glycerin", "Nordic" —
is **placeholder, not a risk**. Slav confirmed 2026-08-16: the business has not started, the moss
will come from a supplier whose process he does not know, and this repo is practice. Real copy,
photography and any UI changes follow once trading begins. The contact phone and email are
deliberate placeholders too — the phone is from the range Ofcom reserves for fiction.

## What the image model taught us

All of it is written up in `docs/product-image-prompts.md`, but the expensive one is worth
repeating: **the house-style block must never outweigh the subject line.** A 350-word material
description placed before the subject cost eleven of eighteen images their object entirely — no
glass sphere, no frame, no letters, just a mound of moss on a table. Flat sheet moss was dropped as
a primary material for the same class of reason: the model cannot tell "a fine even mat" from a
lawn.

## History

- 2026-08-17 — eighteen products generated and wired in, Finnish names dropped, four files renamed,
  the Nordic palette built from a photograph, accent tokens split, and a font-smoothing bug found
  behind a complaint that light text "looked pale". Roughly 9,800 of the day's 10,000 free neurons
  spent across three full passes and two rounds of fixes.
- 2026-08-16 — plan written, `/lab` built and consumed then deleted; hero, stats, eyebrow, touch
  targets, two bug fixes, responsive images, code-splitting, skip link, the Add button, the footer
  credit and the image cull all landed. The repo was deleted and recreated to purge a real phone
  number and two photographs of real people from public history — see the brain page.
