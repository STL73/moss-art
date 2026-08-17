# Testing Rules

## Test runner

**Vitest for both `client/` and `server/`** — `npm test` runs the suite once,
`npm run test:watch` runs it in watch mode, in each app's own directory.

- `client/vite.config.js` carries the Vitest `test` block (`environment:
  'jsdom'`, `setupFiles: './src/test/setup.js'`, `globals: true`) — no
  separate `vitest.config.js` needed there since Vite already owns the
  transform pipeline.
- `server/vitest.config.js` is standalone (`environment: 'node'`,
  `globals: true`) — the server has no Vite build to piggyback on.
- Chosen over Jest because the server is ESM-native (`"type": "module"`) and
  Vitest handles that without extra flags, where Jest's ESM support still
  needs `--experimental-vm-modules`.

## File location

Co-located with the source file: `Thing.jsx` → `Thing.test.jsx`,
`thing.middleware.js` → `thing.middleware.test.js`. No top-level `tests/`
folder. See `server/middlewares/error.middleware.test.js` and
`client/src/components/Button.test.jsx` for the pattern.

## Mocking strategy

- **Mongoose models**: prefer `mongodb-memory-server` (installed as a server
  devDependency) over mocking the model — it spins up a real in-memory
  `mongod`, so tests exercise actual schema validation, unique indexes, and
  query behavior instead of a hand-rolled mock that can drift from reality.
  No test uses this yet; wire it up via a `beforeAll`/`afterAll` connect/
  disconnect when the first controller/model test needs a real DB.
- **Arcjet middleware**: not yet addressed — no test exercises `app.js`'s
  request pipeline yet. When one does, mock `@arcjet/node`'s client rather
  than hitting the real Arcjet API from tests.
- **HTTP-level server tests** (hitting Express routes end-to-end): use
  `supertest` (installed as a server devDependency). Not yet used — the first
  test (`error.middleware.test.js`) calls the middleware directly with mocked
  `req`/`res`/`next` rather than going through the full app.
- **Client**: `@testing-library/react` + `@testing-library/jest-dom` +
  `@testing-library/user-event` are installed. Render components, query by
  role/text, avoid testing implementation details.

## Coverage requirement

Not formally enforced by a config threshold yet (no `coverage` block in
either Vitest config). The global testing rule
(`~/.claude/rules/common/testing.md`) sets an 80% target — treat that as the
working goal until a `vitest --coverage` gate is actually wired into a
project script or CI.
