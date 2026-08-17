# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Moss — a full-stack e-commerce site for a moss decorations client. Two independent apps live in this
repo: `client/` (React storefront) and `server/` (Express/MongoDB API). There is no shared
package/workspace tooling — each has its own `package.json` and `node_modules`, and each is run
separately.

## Tech Stack

- **Client:** React 19, Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config.js`),
  ESLint flat config
- **Server:** Node.js, Express 4 (ESM, `"type": "module"`), MongoDB via Mongoose, JWT auth
  (`jsonwebtoken` + `bcryptjs`), Arcjet for shield/bot-detection/rate-limiting

## Folder Structure

```text
moss/
├── client/                # React storefront (Vite)
│   └── src/
│       ├── components/    # reusable UI (ProductCard, Nav, Button, ...)
│       ├── sections/      # page sections composed in App.jsx (Hero, Services, ...)
│       ├── constants/
│       └── assets/        # icons/ and images/, each with a barrel index.js
└── server/                 # Express API
    ├── app.js               # entry point: middleware + route mounting + listen
    ├── config/              # env.js (dotenv loader), arcjet.js
    ├── database/mongodb.js  # connectToDatabase()
    ├── models/              # user, product, order, category (Mongoose schemas)
    ├── controllers/         # auth, user — only these two are implemented
    ├── middlewares/         # auth, arcjet, error
    └── routes/               # one router per resource, mounted at /api/v1/<resource>
```

Full conventions per area live in `.claude/rules/{frontend,backend,api}.md` — see Rules below.

## Active Feature

@docs/current-feature.md

## Build Commands

Run client and server independently — there is no root-level script that starts both.

Client (from `client/`):

```bash
npm run dev       # Vite dev server
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview a production build
```

Server (from `server/`):

```bash
npm run dev    # nodemon, auto-restart
npm start      # plain `node app.js`
```

Both apps run on Vitest — `npm test` (single run) or `npm run test:watch`
from `client/` or `server/` (see [testing.md](.claude/rules/testing.md)).

## Environment Variables

Server reads `.env.${NODE_ENV}.local` (`server/config/env.js`, via dotenv). Both
`.env.development.local` and `.env.production.local` exist locally and are gitignored:

- `PORT`, `NODE_ENV`
- `DB_URI` — MongoDB connection string; `database/mongodb.js` throws on startup if unset
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `ARCJET_KEY`, `ARCJET_ENV`

## Architecture notes

- **Only `auth` and `user` are wired to real controllers.** The `products`, `orders`, and
  `categories` routers (`server/routes/*.routes.js`) currently return placeholder stub responses
  (`res.send({ title: '...' })`) with no controller and no DB access behind them. Don't assume a
  resource is implemented just because its route file exists.
- Error handling is centralized in `server/middlewares/error.middleware.js`, which special-cases
  Mongoose `CastError` (404), duplicate-key `11000` (400), and `ValidationError` (400), defaulting
  to 500 for anything else. Controllers just set `error.statusCode` on a thrown/passed `Error` and
  call `next(error)`.
- `signUp` (`auth.controller.js`) is the only controller using a Mongoose session + transaction —
  follow that pattern for any new controller that writes to more than one collection.
- Arcjet (`config/arcjet.js`) combines `shield`, `detectBot`, and a token-bucket rate limit (5
  tokens/10s, capacity 10), applied globally in `app.js` ahead of every route.

## Rules

- [frontend.md](.claude/rules/frontend.md)
- [backend.md](.claude/rules/backend.md)
- [api.md](.claude/rules/api.md)
- [testing.md](.claude/rules/testing.md)
- [deployment.md](.claude/rules/deployment.md)

## Notes

- `client/README.md` is the unmodified Vite template README, not project-specific.
- Root `README.md` is a one-line stub (`# Moss`).
