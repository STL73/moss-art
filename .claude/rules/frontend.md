# Frontend Rules

See [CLAUDE.md](../../CLAUDE.md) for what this project is. This file covers `client/`.

## Stack constraints

- React 19 + Vite 8, plain `.jsx` — **not TypeScript.** The global TypeScript rules
  (`~/.claude/rules/typescript/*`) do not apply here: no `interface`/`type` props, no
  Zod, no `.tsx`. Follow the plain-JS patterns already in `src/`, don't introduce TS
  tooling unmentioned by the user.
- Tailwind CSS v4 via `@tailwindcss/vite` (`vite.config.js`) — there is no
  `tailwind.config.js`; v4 is config-file-optional and this project doesn't have one.
  Don't add one without reason.
- ESLint flat config (`eslint.config.js`) — run `npm run lint` from `client/`.

## File layout

```text
client/src/
├── components/   # small reusable UI pieces (Button, ProductCard, Nav, ...)
├── sections/     # page-level sections composed from components (Hero, Services, ...)
│   └── index.js  # barrel export, re-exported into App.jsx
├── constants/    # static data/config
├── assets/
│   ├── icons/index.js   # barrel export for icon imports
│   └── images/index.js  # barrel export for image imports
├── App.jsx       # composes sections in page order
└── main.jsx      # React root mount
```

`sections/index.js` and `assets/*/index.js` are barrel files — new sections or
assets should be added there, not imported by deep path elsewhere.

## Required patterns

- Function components, props destructured directly in the parameter list (see
  `components/ProductCard.jsx`) — no `PropTypes`, no prop-type comments.
- Tailwind utility classes directly in JSX `className`; no CSS Modules, no
  styled-components.
- Sections are composed top-to-bottom in `App.jsx` inside `<section>` wrappers —
  keep that composition pattern when adding a new section rather than nesting
  inside an existing one.

## Naming

- Components and section files: PascalCase (`ProductCard.jsx`, `Hero.jsx`).
- Everything else (hooks, utils, constants files): camelCase.

## Protected files

- `client/vite.config.js` — plugin wiring (React + Tailwind); don't hand-roll a
  Tailwind config alongside it without discussion.
- `client/src/assets/**` — real product photography for the Moss Decorations
  client; don't delete/replace without confirming with Slav.
