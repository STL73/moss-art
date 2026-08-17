# Deployment Rules

No production deployment exists yet. `server/.env.production.local` exists
locally but nothing currently reads it in a deployed environment.

When deployed, document here:

- Hosting platform for `client/` (static build via `vite build`) and `server/`
  (needs a persistent Node process)
- Production `DB_URI` (MongoDB) provisioning — Atlas vs. self-hosted
- Which env vars from `config/env.js` must be set in the hosting platform
  (`PORT`, `NODE_ENV`, `DB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ARCJET_KEY`,
  `ARCJET_ENV`)
- Build/deploy commands once a platform is chosen
