# API Rules

See [backend.md](backend.md) for folder layout. This file covers the HTTP
contract exposed under `/api/v1`.

## Endpoints (current)

| Prefix | Router file | Status |
|---|---|---|
| `/api/v1/auth` | `routes/auth.routes.js` (`sign-up`, `sign-in`, `sign-out`) | implemented |
| `/api/v1/users` | `routes/users.routes.js` | `GET /`, `GET /:id` implemented; create/update/delete are stubs |
| `/api/v1/orders` | `routes/orders.routes.js` | stub only — no controller |
| `/api/v1/categories` | `routes/categories.routes.js` | stub only — no controller |
| `/api/v1/products` | `routes/products.routes.js` | stub only — no controller |

Stub routes return `res.send({ title: '...' })` directly from the router file
— no controller, no DB access, no auth. Don't treat their presence as a sign
the resource is implemented.

## Response shape

Success (`controllers/auth.controller.js`, `controllers/user.controller.js`):

```json
{ "success": true, "message": "...", "data": { } }
```

Errors, always via `next(error)`, formatted by
`middlewares/error.middleware.js` — no `message` key, just `error`, defaulting
to 500 when `error.statusCode` is unset:

```json
{ "success": false, "error": "..." }
```

`middlewares/auth.middleware.js` used to short-circuit with its own
`{ success, message, error }` shape instead of going through the error
handler — fixed 2026-08-11 so all auth failures (missing token, invalid JWT,
user not found) now `throw`/`next(error)` with `statusCode = 401` like
everything else. Keep it that way: prefer throwing with `error.statusCode`
set over responding directly from a controller or middleware.

## Validation

- **No request-validation library** (no Zod/Joi/express-validator) is wired in
  yet — validation currently happens at the Mongoose schema level only
  (`required`, `match`, `minlength`, etc. on the model). Controllers destructure
  `req.body` directly without a pre-check.
- If a route needs validation Mongoose can't express (e.g. cross-field checks),
  flag it rather than silently adding a new validation dependency — this is a
  gap worth a deliberate decision, not a default install.

## Auth handling

- Protect a route by adding `authorise` (`middlewares/auth.middleware.js`) to
  its router chain — it populates `req.user` from the JWT `Authorization:
  Bearer <token>` header.
- Tokens are signed with `JWT_SECRET`/`JWT_EXPIRES_IN` from `config/env.js` via
  `jsonwebtoken`; the `sign-up`/`sign-in` controllers are the only current token
  issuers.
- Rate limiting / bot detection happens ahead of all routes via the global
  Arcjet middleware in `app.js` — don't duplicate rate-limit logic per-route.
