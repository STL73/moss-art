# Backend Rules

See [CLAUDE.md](../../CLAUDE.md) for what this project is. This file covers `server/`.

## Stack constraints

- Node + Express 4, ESM throughout (`"type": "module"` in `package.json` — use
  `import`/`export`, never `require`).
- MongoDB via Mongoose — **not** PostgreSQL/SQL despite the Node/Express stack
  default in the global CLAUDE.md. Don't introduce a SQL ORM here.
- Env vars loaded through `config/env.js` (dotenv), reading
  `.env.${NODE_ENV}.local` — both `.env.development.local` and
  `.env.production.local` exist locally and are gitignored. Add new env vars to
  the destructured export list in `config/env.js`, not scattered `process.env`
  reads.
- Arcjet (`@arcjet/node`) provides bot detection + rate limiting, wired globally
  in `app.js` via `arcjetMiddleware` before all routes.

## File layout

```text
server/
├── app.js              # express app, middleware order, route mounting, listen
├── config/
│   ├── env.js           # dotenv loader, single source for process.env reads
│   └── arcjet.js         # arcjet client config
├── database/mongodb.js  # connectToDatabase(), called after app.listen()
├── models/               # mongoose schemas, one per file (user, product, order, category)
├── controllers/          # route handlers, one export per action
├── middlewares/           # auth, arcjet, error
└── routes/                # thin Router files mapping path -> controller
```

## Required patterns

- Routes are versioned and mounted in `app.js` as `/api/v1/<resource>` — add new
  resources the same way (router file in `routes/`, imported and `app.use`'d in
  `app.js`).
- Controllers wrap logic in try/catch and call `next(error)` on failure; never
  respond with an unhandled stack trace. Attach `error.statusCode` before
  throwing so `middlewares/error.middleware.js` can use it.
- Auth: JWT via `jsonwebtoken`, password hashing via `bcryptjs` (`genSalt(10)` +
  `hash`). `middlewares/auth.middleware.js` (`authorise`) expects
  `Authorization: Bearer <token>`, verifies it, loads the user, and sets
  `req.user`.
- Multi-document writes (e.g. `signUp` creating a user) use a Mongoose session +
  transaction (`startSession` / `startTransaction` / `commitTransaction`) —
  follow that pattern for any new controller that touches more than one
  collection or needs atomicity.
- Mongoose schemas define validation (`required`, `minlength`, `match`, etc.)
  directly on the schema — no separate validation library.

## Protected files

- `server/.env.development.local`, `server/.env.production.local` — real
  secrets (DB URI, JWT secret, Arcjet key). Never read these into chat output
  or commit them; they're already gitignored.
- `server/config/env.js` — single choke point for env access; keep it that way
  rather than adding ad hoc `process.env.X` elsewhere.
