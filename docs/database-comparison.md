# Databases, platforms and ORMs — and what each of Slav's projects should use

> Written 2026-08-21. Part 1 is the general comparison. Part 2 applies it to every project in
> `STL73/*` plus the ones that live only in the brain vault.
>
> This document lives in the Moss repo because that is where the branch was cut, but it is
> cross-project. If it turns out to be worth keeping, `evolving-brain/7 - Resources/` is its
> natural long-term home.

---

## Part 0 — How to actually choose

Most "Postgres vs Mongo" arguments are fought on the wrong ground. The questions that actually
decide it, in the order they decide it:

1. **Where does the code run?** This kills more options than anything else. A Cloudflare Worker
   cannot open a raw TCP socket to a database, so the runtime you deploy to can eliminate an
   entire engine before you have looked at a single query. This is the deciding factor for Moss —
   see Part 2.
2. **Is any of the data money, or does anything depend on two writes both happening?** If yes,
   you want real transactions and real constraints, and you want them enforced by the database
   rather than by whichever application code happens to be talking to it today.
3. **How many ways will you need to read it?** Data read along one axis suits a document store.
   Data read along five axes — by customer, by date, by status, by product, by total — wants a
   relational engine and indexes, because a document store makes you either duplicate it or
   `$lookup` it back together.
4. **How much does it cost when nobody is using it?** For a portfolio of unlaunched projects this
   is close to the whole game. Scale-to-zero is worth more than raw performance.
5. **What does it teach, and what does it put on the CV?** Not a technical criterion, but it is a
   real one here, and the brain vault's North Star names "backend architecture, REST, ORM,
   deployment, auth" as the gaps being worked. A choice that exercises three of those is worth
   more than one that exercises none.

Performance is deliberately not on that list. At the scale of everything in Part 2 — hundreds of
rows, not millions — every engine here is fast enough that the difference is unmeasurable. Choose
on shape, cost and deployability; revisit on performance if a real problem ever appears.

---

## Part 1 — The engines

### PostgreSQL

The relational default, and increasingly the *only* default worth arguing against.

**Model.** Tables, rows, typed columns, foreign keys, ACID transactions with MVCC. Ships with
window functions, CTEs (including recursive), partial and expression indexes, materialised views,
`LISTEN`/`NOTIFY` for lightweight pub-sub, and transactional DDL — meaning a failed migration
rolls back cleanly instead of leaving the schema half-changed, which MySQL cannot do.

**The thing people miss.** Postgres stopped being "the SQL one" a long time ago:

| Want | Postgres feature | Replaces |
|---|---|---|
| Schemaless documents | `jsonb` + GIN indexes | MongoDB |
| Embedding/vector search | `pgvector` | Pinecone, Qdrant, Chroma |
| Geospatial | PostGIS | dedicated GIS stack |
| Full-text search | `tsvector`, `tsquery` | Elasticsearch (at small scale) |
| Time series | TimescaleDB | InfluxDB |
| Job queue | `SELECT ... FOR UPDATE SKIP LOCKED` | Redis/SQS (at small scale) |

So "I need flexible documents" is no longer a reason to leave Postgres. You can have a strict
`orders` table with a `jsonb` metadata column and get both.

**Postgres 18** (Sept 2025) added an asynchronous I/O subsystem (`io_method` = `worker` or
`io_uring`, up to ~3× on sequential and bitmap heap scans), native `uuidv7()` for
timestamp-ordered UUIDs that do not fragment B-tree indexes the way UUIDv4 does, B-tree skip
scans, virtual generated columns by default, and OAuth authentication.

**Costs.** One OS process per connection, so a serverless workload that opens a connection per
request will exhaust it — you need a pooler (PgBouncer, Supavisor, Hyperdrive) or an HTTP driver.
Every managed Postgres worth using solves this for you now, but it is the one operational sharp
edge. Schema migrations are also real, deliberate work; you cannot just start writing a new field.

**Use it when:** anything with users, money, ownership or reporting. Which is most things.

### MongoDB

A document database. Stores BSON documents in collections; no joins, no foreign keys, no
cross-document constraints.

**What it is genuinely good at.**

- **Documents you always read whole.** A CMS page with nested blocks, an event payload, a
  scraped API response, a game save. If the aggregate is the unit of both read and write,
  embedding it beats joining it every time.
- **Heterogeneous shapes.** A hundred product types with a hundred different attribute sets, where
  a relational model would mean either a hundred tables or an EAV nightmare.
- **Write throughput on self-contained documents,** and horizontal sharding that was designed in
  rather than bolted on.
- **Speed of early iteration.** No migration to add a field.

**What it is not good at, honestly.**

- **Referential integrity does not exist.** `ref: 'Product'` in Mongoose is documentation, not a
  constraint. Delete the product and the order line points at nothing — the database will let you,
  and no error will be raised until something reads it.
- **"Schemaless" is usually a relocation, not a removal.** Mongoose puts the schema back, in the
  application. So there *is* a schema; it is just enforced in one client instead of in the
  database, and anything that writes any other way — a script, Compass, a second service — walks
  straight past it. (Mongo does have JSON Schema validators, but almost nobody using Mongoose
  turns them on.)
- **`$lookup` is not a join.** It works, but the planner does not optimise it the way a relational
  join is optimised, and reaching for it repeatedly is the signal that the data was relational all
  along.
- **Multi-document transactions exist** (since 4.0) but carry real cost and require a replica set,
  and needing them frequently is again the signal.
- **Money is awkward.** JavaScript numbers are IEEE-754 doubles, and a Mongoose `Number` field
  stores a double unless you explicitly reach for `Decimal128`. Postgres has `numeric`, which is
  exact, and it is the default thing to reach for.

**Use it when:** the documents really are the aggregate, the shapes really do vary, and nothing in
the system is an invariant across two records. Genuinely: logging, analytics events, CMS content,
caching third-party API responses, prototypes where the shape is unknown.

**Do not use it because** "it's JavaScript-y" or "it's what the tutorial used." Those are the two
reasons it usually gets picked, and both are how a shopping cart ends up in a database with no
foreign keys.

### Postgres vs MongoDB, head to head

| | PostgreSQL | MongoDB |
|---|---|---|
| Data model | Tables, typed columns | BSON documents |
| Schema enforcement | In the database, always | In the app (Mongoose), or opt-in validators |
| Relationships | Foreign keys, real joins, `ON DELETE` behaviour | Manual refs, `$lookup`, no enforcement |
| Transactions | Everywhere, cheap, the default | Multi-document supported, costly, needs replica set |
| Flexible/nested data | `jsonb`, indexable | Native — its whole point |
| Money | `numeric` — exact | `Decimal128` if you remember; double if you don't |
| Derived values | Generated columns, `CHECK` constraints | Application must keep them in step |
| Ad-hoc queries | SQL — anything, after the fact | Designed-for queries are fast; others are painful |
| Scaling writes | Vertical first, then partition/Citus | Sharding built in |
| Serverless/edge fit | Excellent (Neon HTTP, Hyperdrive, Supabase) | **Poor — see below** |
| Free managed tier | Neon 0.5 GB × up to 100 projects; Supabase 500 MB | Atlas M0, 512 MB, forever |

**The serverless line is the one that matters most here.** Cloudflare Hyperdrive — the thing that
makes a normal database usable from a Worker — supports PostgreSQL and MySQL (MySQL went GA in
August 2026) and explicitly does **not** support MongoDB. The HTTPS bridge that used to let a
Worker talk to Atlas, the Atlas Data API, was deprecated and removed on **30 September 2025**. So
today there is no supported path from a Cloudflare Worker to MongoDB at all. If the deployment
target is Workers, Mongo is not a choice you get to make.

### MySQL / MariaDB

The other relational default, and the one that actually runs on cheap shared hosting.

InnoDB gives you ACID, foreign keys and row-level locking; MySQL 8 added CTEs, window functions
and JSON multi-valued indexes, closing most of the historic gap. It remains extremely fast on
simple indexed reads and it is everywhere — every LAMP host, every cPanel account, every PHP
tutorial.

Where Postgres still wins: transactional DDL, partial and expression indexes, richer types
(arrays, ranges, native UUID), a far deeper extension ecosystem, and stricter default behaviour.
MariaDB is the community fork; for anything at this scale the two are interchangeable.

**Use it when:** you are on PHP shared hosting, or the application already speaks it. Migrating a
working MySQL app to Postgres for purity is almost always a waste of a weekend.

### SQLite (and the edge-SQLite family)

Not a server. A C library that reads and writes one file. It is also, by installed count, the most
deployed database engine in the world.

**Strengths.** Zero operational surface. No connection pooling, no network, no credentials, no
process to keep alive. Reads are as fast as the filesystem. `STRICT` tables (3.37+) give real type
enforcement. Backups are `cp`.

**Limits.** One writer at a time (WAL mode makes readers concurrent with the writer, but writers
still serialise). No network access — the file has to be local to the process. That last point is
what the edge-SQLite products exist to fix:

- **Cloudflare D1** — SQLite as a Workers-native binding. Free tier: 5 M rows read/day, 100 K rows
  written/day, 5 GB per account, 500 MB max per database; paid raises a database to 10 GB, at
  roughly $0.001 per million rows read and $1.00 per million written, $0.75/GB-month storage.
  Daily limits reset at 00:00 UTC and queries simply stop when you hit one.
- **Turso** — worth understanding because the names are genuinely confusing. **libSQL** is the
  open-source SQLite fork that powers **Turso Cloud** (the managed service) today. **Turso
  Database** is a clean-room rewrite of SQLite in Rust — MVCC for concurrent writes, async I/O via
  `io_uring`, built-in vector search — currently in beta and *not* a drop-in production
  replacement yet. Use Turso Cloud/libSQL today; watch the rewrite.

**Use it when:** a local tool, a CLI, a desktop app, a single-node site, a test suite, or a
read-heavy edge site whose data changes rarely.

### The specialists

Reach for these *alongside* a primary database, never instead of one.

| Engine | Shape | Use it for | Do not use it for |
|---|---|---|---|
| **Redis / Valkey** | In-memory key-value | Sessions, caching, rate limits, queues, leaderboards | Anything you cannot afford to lose |
| **ClickHouse** | Columnar OLAP | Analytics over hundreds of millions of rows, dashboards | Transactional writes, updates |
| **DynamoDB** | Managed key-value / wide-column | Predictable single-digit-ms at any scale, AWS-native | Anything whose access patterns you can't design up front |
| **Neo4j** | Graph | Genuine graph traversal — social, fraud rings, dependencies | Ordinary "it has relationships" data. Foreign keys are fine |
| **Elasticsearch / OpenSearch** | Inverted index | Search over millions of documents, faceting, relevance tuning | A primary store; a small site's search (use Postgres FTS) |
| **pgvector / Qdrant / LanceDB** | Vector | Semantic search, RAG | Buying a dedicated vector DB before `pgvector` has failed you |

The honest rule for all six: at under ~100 K rows, Postgres does every one of these jobs well
enough, and running one database instead of two is worth more than any of the specialisations.

---

## Part 2 — The platforms

The engine is half the decision. Where it is hosted decides cost, cold-start behaviour and whether
it works from your runtime at all.

| Platform | Engine | Free tier (Aug 2026) | The reason to pick it | Watch out |
|---|---|---|---|---|
| **Neon** | Postgres | 100 CU-hours/mo, 0.5 GB per project, up to 100 projects, 10 branches each | Scale-to-zero (suspends after ~5 min idle, storage-only billing) and **database branching** — a throwaway copy per PR. HTTP driver works from Workers | Cold start on first query after suspend. Owned by Databricks since May 2025 |
| **Supabase** | Postgres | 500 MB DB, 1 GB storage, 5 GB egress, 50 K MAU, 2 active projects | Auth, storage, realtime and edge functions on top of plain Postgres. Fastest route to "logged-in users" without writing auth | **Projects pause after 7 days idle** on free — fatal for a portfolio link nobody clicks for a fortnight |
| **MongoDB Atlas** | MongoDB | M0: 512 MB, ~100 ops/sec, 500 connections, free forever, 1 per project | The only sane way to run Mongo. No time limit | Data API removed 30 Sept 2025 — driver-only access now |
| **Cloudflare D1** | SQLite | 5 M reads/day, 100 K writes/day, 5 GB/account | Native Workers binding, no connection story at all, no egress | 500 MB/db on free, 10 GB paid; hard daily caps |
| **Cloudflare Hyperdrive** | (proxy) | Included with Workers | Makes a *regional* Postgres/MySQL fast from Workers: global pooling, cached queries, no round-trip on connect | Postgres and MySQL only. **No MongoDB, no SQL Server** |
| **Turso** | libSQL/SQLite | Generous hobby tier | Many small databases — a database *per tenant* is the design it is built for | Rust rewrite still beta; three products share the name |
| **PlanetScale** | MySQL + Postgres | Check current tiers — the old free Hobby plan was withdrawn | Branching and non-blocking schema changes on MySQL at serious scale | Not the cheap option any more |
| **Railway / Render / Fly.io** | Anything in a container | Small credits / limited free instances | You want a **long-running Node process** — which is what an Express app is | Free instances sleep; cold starts are seconds |
| **AWS RDS / Aurora** | Postgres, MySQL | 12-month trial only | Production at company scale; Aurora Serverless v2 scales compute | Overkill, and the bill has teeth |
| **Upstash** | Redis / Kafka | Generous request-based free tier | Per-request-priced Redis over HTTP — works from Workers | Not a primary store |

**The one-line version:** for a personal project in 2026 that needs Postgres, **Neon** is the
default, because scale-to-zero means an unvisited site costs pennies of storage and nothing else.
Choose **Supabase** instead if you want auth handed to you and the site gets visited weekly.
Choose **D1** if the whole thing already lives on Cloudflare and the data is small.

---

## Part 3 — The access layer (ORMs and query builders)

| Tool | Style | Runtime cost | Best at | Worst at |
|---|---|---|---|---|
| **Prisma** | Schema-first DSL (`schema.prisma`) → generated client | ~1.6 MB / ~600 KB gzipped since v7 dropped the Rust engine | Migrations, DX, autocomplete, Prisma Studio. The most *teaching* option — it makes the relational model visible | Bundle size; the DSL is a second language; complex SQL fights the abstraction |
| **Drizzle** | Schema in TypeScript, queries that look like SQL | ~12 KB, zero dependencies | Edge and serverless — Workers, Vercel Edge, Deno. Cold starts of 100–300 ms against Prisma's 500–1500 ms in constrained runtimes | Younger ecosystem; you are expected to know SQL |
| **Kysely** | Pure typed query builder, no migrations opinion | Tiny | Type safety with zero magic; pairs well with hand-written migrations | Brings no migration story of its own |
| **Mongoose** | ODM for MongoDB | Moderate | Putting schema and validation back on top of Mongo | The schema it enforces is only enforced by *it* |
| **`pg` / `postgres.js`** | Raw driver | Minimal | Full control, no abstraction to fight | You write and maintain everything, including the types |
| **TypeORM / Sequelize** | Older Active Record / Data Mapper | Moderate | Legacy codebases | Both are effectively in maintenance mode; do not start here in 2026 |
| **PDO / MySQLi** | PHP, raw | n/a | Prepared statements, which is all you need for a PHP app | No type safety, no migrations — bring your own discipline |

**Prisma or Drizzle?** The honest split:

- Deploying to **Cloudflare Workers or any edge runtime** → **Drizzle**, on bundle size and cold
  start alone. Prisma 7 does now work at the edge via driver adapters without Accelerate, but it
  is still ~130× the runtime footprint.
- Deploying to a **long-running Node process**, and the goal includes *learning the relational
  model* → **Prisma**. `schema.prisma` plus `prisma migrate` is the clearest teaching device for
  schema design there is, and Prisma is still the name that appears more often in job adverts.
- Already fluent in SQL and want no abstraction → **Kysely** or the raw driver.

---

## Part 4 — Which database for which type of project

| Project type | Engine | Platform | Access layer | Why |
|---|---|---|---|---|
| Static portfolio / brochure site | **none** | — | — | Adding a database is a downgrade: a build step becomes a runtime dependency that can be down |
| Contact form on a static site | **none** | Form service, or Worker + D1/KV | — | The data is one row a week that you want emailed. Do not stand up Postgres for it |
| E-commerce, any size | **Postgres** | Neon / Supabase | Drizzle (edge) or Prisma (Node) | Money, stock and orders are exactly what constraints and transactions are for |
| SaaS with tenants and roles | **Postgres** | Supabase (RLS + auth) | Prisma | Row-level security is a Postgres feature and Supabase exposes it directly |
| CMS / blog with varied content blocks | **Postgres + `jsonb`** | Neon | Drizzle | Strict where it's strict, flexible where it isn't — without a second database |
| Content-heavy site, rarely written | **SQLite** | D1 or Turso | Drizzle | Read-heavy, tiny, edge-native, and effectively free |
| Realtime chat / collaboration | **Postgres** + Redis | Supabase + Upstash | Prisma | Postgres for truth, Redis for presence and ephemera |
| Analytics / event ingestion | **ClickHouse** (or Postgres until it hurts) | ClickHouse Cloud | raw SQL | Columnar wins by an order of magnitude — but not before ~10 M rows |
| Logging, scraping, unknown-shape payloads | **MongoDB** | Atlas | Mongoose | Genuinely the right shape: write-heavy, whole-document reads, no invariants |
| ML / semantic search / RAG | **Postgres + pgvector** | Neon / Supabase | Drizzle | One database. Reach for a dedicated vector store only after this fails |
| Desktop / CLI tool | **SQLite** | local file | raw | No server, no credentials, `cp` is the backup |
| Trading bot / scheduled scripts | **SQLite** | local file | raw or Drizzle | Single process, append-heavy, needs history and no operations |
| University PHP coursework | **MySQL** | XAMPP → shared host | PDO with prepared statements | It's what the module, the host and the marker expect |
| Note vault / knowledge base | **none** — files | git | ripgrep, then SQLite FTS5 | Markdown in git *is* the database, and it survives every tool you'll try |

---

## Part 5 — Slav's projects, one at a time

Eight repos in `STL73/*`, plus the projects tracked in `evolving-brain` that have no repo yet.
Recommendations are weighted by the North Star: *shipped and deployed on a real URL*, and practice
hours against the named gaps — **backend architecture, REST, ORM, deployment, auth**.

### 1. `STL73/Moss` — the moss decorations storefront

**What exists.** A React 19 storefront live at <https://mossart.spireforge.co.uk>, deployed as a
Cloudflare Worker with static assets. Separately, an undeployed Express 4 + Mongoose API in
`server/` with `auth` and `user` controllers real and `products`, `orders`, `categories` still
stub routes. The client reads eighteen products from `client/src/data/products.js` through
`client/src/lib/api.js`, which exists precisely as the seam where a real backend will be swapped
in.

**Recommendation: PostgreSQL on Neon, with Drizzle, behind a small API Worker. Retire Mongoose.**

The reasoning, strongest first:

1. **MongoDB cannot be reached from where this project is deployed.** The storefront is a
   Cloudflare Worker. Hyperdrive does not support MongoDB, and the Atlas Data API that used to
   bridge Workers to Atlas over HTTPS was removed on 30 September 2025. Keeping Mongo therefore
   means keeping a *second* hosting platform alive for `server/` — a long-running Node process on
   Render or Fly — for a shop that does not trade yet. Neon's HTTP driver runs inside a Worker
   directly, so the entire backend collapses onto the platform the site is already on, on the
   domain it already has.
2. **The data is relational, and the current schema shows it.** In `server/models/order.model.js`
   each line item stores `quantity`, `price` **and** `total`. `total` is `quantity × price`;
   nothing in MongoDB can enforce that, so any code path that gets it wrong writes a silently
   corrupt order. In Postgres that is one line — `total numeric GENERATED ALWAYS AS (quantity *
   price) STORED` — and it becomes impossible to get wrong. Likewise `ref: 'Product'` on an order
   line is not enforced by anything: delete a product and the order points at a hole. A foreign
   key with `ON DELETE RESTRICT` makes that a rejected delete instead of a corrupt order.
3. **Prices are money.** The client is already careful here — `products.js` stores integers in
   pence. The server model is `price: { type: Number }`, which is an IEEE-754 double. Postgres
   `numeric` (or keeping integer pence, enforced by a `CHECK`) removes the whole category of
   rounding bug that only ever shows up in someone's basket total.
4. **Stock is a race.** `stock` decrementing on checkout is the textbook case for a transaction
   with row-level locking. `signUp` is currently the only controller in the codebase using a
   Mongoose session — a real checkout would need one for every order, which is the point at which
   you are paying Mongo's transaction cost to get behaviour Postgres gives away.
5. **There is already a schema drift bug waiting.** `server/models/category.model.js` constrains
   `name` to an enum of six strings — `"Moss Pot Decorations"`, `"Moss Wall Art"`,
   `"Moss Wreaths"`, `"Moss Planters"`, `"Moss Tabletop Decor"`, `"Other Decorations"`. The
   client's six categories are `moss-pots`, `wall-art`, `planters`, `tabletop`, `wreaths`,
   `letters-signs`. They do not correspond, and `letters-signs` — added 2026-08-17 — has no
   server equivalent at all, so seeding it would throw a `ValidationError`. Worth noticing
   separately: a `Category` *collection* whose `name` is locked to six fixed values is not data,
   it is an enum with extra steps. In Postgres this is either a `categories` table with a real
   primary key that products reference, or a Postgres `ENUM` type — and you have to decide which,
   which is the useful part.
6. **It exercises every named gap at once.** Schema design, migrations, an ORM, REST, auth and a
   deployment — the exact list in `8 - North Star`. Mongoose is already on the CV as "actively
   learning"; PostgreSQL is on the same line and currently has nothing behind it.

**Shape of the work.** Neon project (free tier, scale-to-zero — £0 while the shop is dark) →
Drizzle schema for `users`, `categories`, `products`, `orders`, `order_items` → `drizzle-kit`
migrations → a Hono API Worker on `api.mossart.spireforge.co.uk` → point `lib/api.js` at it. The
`lib/api.js` seam means **no component changes**, which is the whole reason it was built that way.
Ship it read-only first: `GET /products` and `GET /products/:slug` only. Auth and orders come
after, and neither blocks the other.

**The honest alternative.** If the priority is a live API *this week* rather than the right one,
deploy `server/` unchanged to Render's free tier against an Atlas M0 cluster. It is perhaps two
hours' work, it reuses the auth controller that already exists, and it produces a real deployed
backend. It also means two platforms, a service that sleeps on the free tier, and a data model
you will migrate later anyway. Legitimate as a stepping stone; wrong as a destination.

**Do not** keep Mongoose *and* move to Postgres. Pick one.

### 2. `STL73/CompProject` — Manchester Event Portal

**What exists.** The strongest project in the portfolio by the vault's own assessment: PHP with an
MVC-ish `includes/` split, PDO with prepared statements, role-based access across users,
organisers and admins, plus events, categories, locations, favourites, notifications with
preferences, contact messages and system logs. It points at a MySQL database on shared hosting.

**Recommendation: stay on MySQL. Do not migrate. Fix three things instead.**

Migrating this to Postgres would burn a week and produce nothing a hiring manager can see. The
value here is that it is the only project evidencing backend, auth and roles — protect that.

1. **There are live database credentials committed in `src/includes/dbh.inc.php`** — host,
   database name, username and password, in git. The repo is private, which is the only reason
   this is not already an incident. Rotate the password, move all four values into an
   environment-based config or a `config.php` that is `.gitignore`d, and commit a
   `config.example.php` in its place. Do this before anything else on this list. Note that
   rotating does not remove the old password from git history — history rewriting or, more
   realistically, treating the old credential as permanently burned.
2. **There is no schema in the repo.** No `.sql` file anywhere. The structure of roughly nine
   tables exists only inside a live shared-hosting database, so if that account lapses the project
   is unrecoverable. `mysqldump --no-data` into `database/schema.sql`, plus a small `seed.sql`,
   and commit both. This is also what makes the project *runnable by someone else*, which is what
   a portfolio repo has to be.
3. **Then it deploys.** Once the schema is in the repo and the credentials are out of it, any
   PHP+MySQL host runs it. If it needs to leave shared hosting later, managed MySQL on Railway or
   PlanetScale takes it without a code change — PDO does not care.

### 3. `STL73/WorldQuiz` — geography quiz

**What exists.** PHP 8 + MySQLi with prepared statements throughout, `password_hash()` for
passwords, role-gated player and admin panels, 46 landmarks across 14 countries, ~5,000 lines of
hand-written CSS. `README.md` documents three tables: `users`, `score`, `countries`.

**Recommendation: stay on MySQL — and it is closer to deployable than anything else you own.**

Two concrete findings:

1. **The schema in the repo is incomplete, exactly as the vault suspected.** `database/World Qiuz
   db code.sql` contains `CREATE TABLE countries` and its seed rows, and *nothing else* — there is
   no `CREATE TABLE users` and no `CREATE TABLE score`, despite the README documenting both. The
   vault's note that this is "one missing `users`/`score` `CREATE TABLE` from deployable" is
   correct and still the single highest-leverage hour available across all eight repos. Write
   those two statements, add the foreign keys (`score.id → users.id`,
   `score.current_question_id → countries.id`), and the project can be cloned and run by a
   stranger.
2. **The `countries` table is worth normalising while you are in there** — not for performance, at
   46 rows, but because `answer1/answer2/answer3` plus `is_correct1/is_correct2/is_correct3`
   hard-codes "three answers" into the schema, allows zero correct answers or three, and cannot
   express a four-option question without a schema change. An `answers` table with
   `(id, question_id, text, is_correct)` fixes all three. It is also a good short answer to
   "tell me about a database design decision you'd make differently" in an interview, which may
   be worth more than the change itself. Keep the file name spelled correctly this time.

There is no argument for Postgres here. The module was PHP/MySQL, the README sells it as
"write the SQL, learn the SQL", and MySQLi with prepared statements is the correct tool for that
story.

### 4. `STL73/MyPortfolio` — personal portfolio

**What exists.** React 19 + Vite + Tailwind v4 + GSAP. Its own `CLAUDE.md` states it plainly:
*Backend: none. Database: none. Auth: none.* Content lives in `src/constants/`.

**Recommendation: no database. This is not a gap — it is the correct architecture.**

Adding one would make a static site that cannot break into a dynamic site that can, in exchange
for nothing a visitor would notice. The content changes when you change it, which is a deploy, not
a write.

The only data question is `Contact.jsx`. Three options, in order:

1. **A form service** — Formspree, Web3Forms, or similar. Zero infrastructure, arrives in your
   inbox. Right answer for a portfolio.
2. **A Cloudflare Worker + D1**, if you want to own it and demonstrate the stack. About twenty
   lines, free, and it puts a real (if small) backend behind the portfolio.
3. **Postgres.** No. A table you read four times a year is not worth a database.

This is the 90-day North Star target and it is not deployed. Nothing about databases is blocking
that — say so and deploy it.

### 5. `STL73/MossApp` — the February predecessor

**What exists.** The earlier static React storefront, last pushed 2026-02-24, superseded in every
respect by `STL73/Moss`. Sections, cards, constants, no backend.

**Recommendation: no database. Archive the repo.**

Two public repos with near-identical moss storefronts, one clearly abandoned, is a worse portfolio
signal than one repo. Archive it on GitHub (it stays readable, it stops looking active) and point
the vault's `[[Moss Decorations]]` page at the live one.

### 6. `STL73/evolving-brain` — the second brain

**What exists.** 173 markdown files in an Obsidian vault under PARA, private, plus
`scripts/wiki_build.py`.

**Recommendation: no database. The files are the database, and that is a feature.**

This is the case where a database is actively the wrong answer. Markdown in git gives you version
history, diffs, grep, portability, and survival across every tool you will try over the next
decade. Import it into Postgres and you have bought querying you do not need at the cost of
everything above. `ripgrep` over 173 files is instantaneous.

The one condition that would change this: **semantic search**, if you want "what did I decide
about X" to work on meaning rather than exact words. Even then the answer is not a server. Build a
**local SQLite index** from the markdown — FTS5 for keyword search, and `sqlite-vec` (or LanceDB)
for embeddings — regenerated by a script, `.gitignore`d, and treated as a derived artefact that
can be deleted and rebuilt at any time. The markdown stays canonical. Never let the index become
the source of truth.

### 7 & 8. `skills-hello-github-actions`, `skills-introduction-to-github`

GitHub Skills course repos. No database, nothing to decide. If they are not doing anything for the
portfolio, archiving them tidies the profile.

### 9. Trading (no repo — `D:\My Projects\Trading\`)

**What exists.** A forked Node.js Alpaca paper-trading bot running seven scheduled routines —
TSLA directional, the wheel, and copy-trading disclosed politician trades.

**Recommendation: SQLite, if it currently keeps history in JSON files.**

A single-process scheduled job that appends trade and decision records is precisely SQLite's
shape: no server, no credentials, no connection pool, and `cp` is the backup. It also makes the
one genuinely interesting question answerable — *did any of these three strategies actually
work?* — which JSON files scattered across a folder will not. One table for orders, one for
decisions with the reasoning attached, and a `positions` snapshot.

Worth noting honestly: the vault classes this as "an experiment, not a project Slav is driving,"
and it is not on the CV. So this is a small evening's work if the strategy question interests you,
and correctly ignored otherwise.

### 10. Rent Tracker — completed

Spreadsheets, PDFs and a self-contained HTML allocator; the dispute is won and closed. **No
database.** The vault is right that it is the best evidence of analytical work anywhere — that
value is in the 41-page evidence bundle, not in the storage engine.

### 11. Construction Business Website — not started

Nothing exists. If it becomes a real client site: it will be a brochure site, so **no database**,
exactly like MyPortfolio. If it needs a quote form, a form service. If it ever needs bookings or a
job tracker, that is Postgres on Neon — but decide that when there is a client, not now.

---

## Part 6 — The short version

| Project | Now | Should be | Effort |
|---|---|---|---|
| **Moss** | Mongoose + MongoDB, undeployed | **Postgres (Neon) + Drizzle**, API Worker | Days |
| **CompProject** | MySQL, shared hosting | **MySQL** — but get credentials out of git and schema into it | Hours |
| **WorldQuiz** | MySQL, local only | **MySQL** — write the two missing `CREATE TABLE`s | ~1 hour |
| **MyPortfolio** | none | **none** + a form service | Minutes |
| **MossApp** | none | **none** — archive | Minutes |
| **evolving-brain** | none | **none** — SQLite FTS5 index only if search gets slow | — |
| **Trading** | JSON files (assumed) | **SQLite** | An evening |
| **Rent Tracker** | files | **none** — complete | — |
| **Construction site** | — | **none** until a client exists | — |

**Three things to notice about that table.** Six of nine want no database at all, which is the
usual and correct answer for frontend work. Only one project should change engine, and it should
change because of *where it deploys*, not because Postgres is fashionable. And the highest-value
database task across the whole portfolio is not the Moss migration — it is the missing hour on
WorldQuiz, because that one moves a project from "local only" to "deployable," which is the only
thing the North Star measures.

---

## Sources

Fast-moving facts above (pricing, free-tier limits, version features, deprecations) were checked
on 2026-08-21 rather than recalled:

- [Neon pricing 2026](https://www.saaspricepulse.com/tools/neon) · [Neon free tier limits](https://agentdeals.dev/vendor/neon)
- [Drizzle vs Prisma 2026 comparison](https://www.bytebase.com/blog/drizzle-vs-prisma/) · [Drizzle v1 vs Prisma 6/7 vs Kysely](https://www.pkgpulse.com/guides/drizzle-orm-v1-vs-prisma-6-vs-kysely-2026)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits) · [D1 free tier breakdown](https://freetier.co/articles/cloudflare-d1-free-tier-limits-pricing-and-alternatives)
- [Hyperdrive supported databases](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/) · [Hyperdrive MySQL GA, Aug 2026](https://developers.cloudflare.com/changelog/post/2026-08-07-hyperdrive-mysql-ga/)
- [Atlas Data API deprecation and EOL](https://www.mongodb.com/docs/atlas/app-services/data-api/data-api-deprecation/) · [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [Supabase free tier limits 2026](https://uibakery.io/blog/supabase-pricing)
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/) · [Postgres 18 features write-up](https://xata.io/blog/going-down-the-rabbit-hole-of-postgres-18-features)
- [Turso, Turso Cloud and libSQL explained](https://turso.tech/what-is-turso)
