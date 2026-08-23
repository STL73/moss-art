# Moss

A storefront for a preserved-moss decoration business — five routes, a working cart, dual theme,
and a catalogue that is deliberately not real yet.

**Live:** <https://mossart.spireforge.co.uk>

---

> **Status: the storefront is finished and deployed. The API is half-built and is not.**
>
> Everything a visitor touches is real and running. Product data comes from a mock layer behind a
> single module, `client/src/lib/api.js`, which exists so the backend can be wired in without
> touching a component. On the server side `auth` and `user` reach real controllers; `products`,
> `orders` and `categories` are still placeholder routes.
>
> The catalogue copy and photography are placeholder on purpose — the business has not started
> trading, so there is no real stock to photograph. The contact number is from the range Ofcom
> reserves for fiction, and the page carries `noindex` so a shop that has not launched cannot be
> indexed under a brand that has not launched either.

---

## Contents

- [What is here](#what-is-here)
- [Stack](#stack)
- [The storefront](#the-storefront)
- [The data seam](#the-data-seam)
- [The API](#the-api)
- [Running it](#running-it)
- [Tests](#tests)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [What is next](#what-is-next)
- [Licence](#licence)

## What is here

Two independent applications in one repository, each with its own `package.json` and its own
`node_modules`. There is no workspace tooling and no root script that starts both — they are run
separately, on purpose, because they deploy to different places and only one of them is deployed
today.

```text
moss/
├── client/          React storefront — deployed
│   └── src/
│       ├── routes/       one file per route, code-split
│       ├── components/   reusable UI
│       ├── sections/     page sections
│       ├── context/      cart and theme
│       ├── lib/api.js    the single source of product data
│       ├── data/         mock catalogue, shaped like the server's schema
│       └── hooks/
├── server/          Express + Mongoose API — partly built, not deployed
│   ├── models/           user, product, order, category
│   ├── controllers/      auth and user only
│   ├── routes/           five routers at /api/v1/<resource>
│   └── middlewares/      auth, arcjet, error
└── docs/            openapi.yaml, feature notes, plans
```

## Stack

**Client** — React 19, Vite 8, Tailwind CSS v4 (through `@tailwindcss/vite`, so there is no
`tailwind.config.js`), React Router 8, Motion 13, Vitest with Testing Library, `vite-imagetools`
for build-time image processing.

**Server** — Node with Express 4 in ESM, MongoDB through Mongoose, JWT auth with `jsonwebtoken`
and `bcryptjs`, and Arcjet for shield, bot detection and rate limiting.

## The storefront

Five routes plus a 404: home, products, product detail, cart and contact.

- **Products** drives its filter and sort entirely from the URL, so a filtered view is a shareable
  link and the back button behaves the way a browser is supposed to.
- **Cart** lives in Context and persists to `localStorage`, so it survives a reload.
- **Theme** is dark by default with a light toggle, applied before first paint — no flash of the
  wrong theme when a page reloads.
- **Every route is its own chunk.** The router's `lazy` is used rather than `React.lazy`: React's
  version suspends during render, so the page being navigated away from vanishes and a fallback
  takes its place while the chunk downloads. The router's `lazy` loads the chunk first and swaps
  only when it is ready.

Bundle, gzipped, from a clean `npm run build`:

| Chunk | Gzipped |
|---|---|
| Main | 116.78 kB |
| Vendor (`lib`) | 29.55 kB |
| CSS | 7.98 kB |
| Per-route chunks | 0.33 – 1.88 kB |

The budget is 150 kB.

## The data seam

`client/src/lib/api.js` is the only module that knows where product data comes from. Today it reads
a mock array from `client/src/data/products.js`, shaped to mirror the server's `Product` schema, and
applies filtering and sorting the way the real endpoint will. It also imposes a small artificial
latency so the loading skeletons are exercised in development rather than being decorative — the
test environment sets that to zero.

Wiring the real backend means changing that one file to `fetch` from `/api/v1/products`. No
component changes, no test rewrites.

## The API

Present and running locally, but only partly wired:

| Resource | State |
|---|---|
| `auth` | Real controller — `sign-up`, `sign-in`, `sign-out` |
| `users` | Real controller for reads (`GET /` and `GET /:id`, the latter behind auth); create, update and delete are stubs |
| `products` | Stub routes only |
| `orders` | Stub routes only |
| `categories` | Stub routes only |

The four Mongoose models are all defined. The stub routes return a placeholder object so the shape
of the API is visible and mountable while the controllers are written. `docs/openapi.yaml` records
the intended contract.

## Running it

Node 22, pinned by `client/.node-version`. Vite 8 needs 20.19 or newer, and Cloudflare Workers
Builds still defaults to Node 18 — the pin is what stops the deploy failing on a version the build
cannot use.

**Client:**

```bash
cd client
npm install
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # serve the production build
npm run lint
```

**Server:**

```bash
cd server
npm install
# needs a .env with the Mongo connection string, JWT secret and Arcjet key
npm run dev
```

The client does not call the server, so the storefront runs fully on its own.

## Tests

```bash
cd client
npm test             # vitest run
npm run test:watch
```

**196 tests across 33 files**, all passing. They cover the routes, the cart and theme contexts, the
data seam, and the components — plus one that is worth calling out: `src/tokens.test.js` asserts the
colour-contrast contract against `index.css` itself, so a token edit that drops an interactive
border below 3:1 fails the suite rather than shipping.

## Accessibility

Audited against WCAG on 12 August 2026, with four failures found and closed:

- Motion animations that ignored `prefers-reduced-motion`
- A product zoom that only worked with a mouse
- `aria-modal` overlays with no focus trap — now `src/hooks/useFocusTrap.js`
- Interactive borders at roughly a third of the required contrast — now held to 3:1 by the token
  test above

## Deployment

The client deploys to **Cloudflare Workers with static assets**, not Cloudflare Pages. Production
branch `main`, build path `client`, `npm run build` then `npx wrangler deploy`. Every push to `main`
is a release; there is no staging environment and preview builds are switched off.

One setting is load-bearing. Pages used to infer single-page-app routing from the absence of a
top-level `404.html`; **Workers does not.** `client/wrangler.jsonc` sets
`not_found_handling: "single-page-application"` explicitly. Without it, clicking through the app
works fine while every deep link and every shared URL returns a 404 — a failure that survives a
casual smoke test.

## What is next

Port the data layer to **PostgreSQL on Neon with Drizzle**, replacing Mongo. Decided 21 August 2026
after a written comparison — [`docs/database-comparison.md`](docs/database-comparison.md) — and
deliberately deferred rather than started: the storefront being live matters more than the backend
being finished.

## Licence

MIT — see [LICENSE](LICENSE).
