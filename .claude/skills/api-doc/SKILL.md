---
name: api-doc
description: Generate or update the OpenAPI spec at docs/openapi.yaml for the server's /api/v1 routes. Use when adding, changing, or implementing an endpoint under server/routes/, or when asked to document the API.
---

Maintain `docs/openapi.yaml` for this project's Express API (`server/`).

Scope: `ARGUMENTS` (if given) names one or more resources (`auth`, `users`, `orders`,
`categories`, `products`). With no arguments, cover all five. Only touch the
`paths` entries for resources in scope — never overwrite unrelated paths already
in `docs/openapi.yaml`.

## Steps

1. If `docs/openapi.yaml` doesn't exist yet, create it from
   [openapi-template.yaml](openapi-template.yaml).
2. For each resource in scope, read `server/routes/<resource>.routes.js` and, if
   it imports one, `server/controllers/<resource>.controller.js`.
3. For each route, tell implemented endpoints apart from stubs:
   - **Implemented**: the router calls an imported controller function.
     Extract method, path (relative to `/api/v1`, matching the mount point in
     `server/app.js`), whether `authorise` is in the middleware chain (add
     `security: [{ bearerAuth: [] }]` if so), request body fields (from
     `req.body` destructuring plus the matching Mongoose model's `required`/
     `enum`/`min`/`max` constraints in `server/models/`), and response shape —
     always `$ref` the shared `SuccessResponse`/`ErrorResponse` schemas from
     the template, never invent a third shape.
   - **Stub**: the router handler is an inline arrow function returning
     `res.send({ title: '...' })` with no controller import for that route.
     Still add a `paths` entry — method, path, the stub's `title` as
     `summary` — but tag it `x-status: stub` and skip request/response
     schemas. Don't guess what an unimplemented endpoint will eventually
     accept or return.
4. Write the merged result back to `docs/openapi.yaml`.
5. Report a short summary: how many endpoints newly documented, how many
   already-stub endpoints found, and any route whose controller status was
   ambiguous.

Endpoint conventions (response envelope, auth handling, error shape) are
documented once in [`.claude/rules/api.md`](../../rules/api.md) — reference it,
don't restate it here.
