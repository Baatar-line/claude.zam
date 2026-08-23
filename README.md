# Зам

Career guidance platform for Mongolian students in grades 7–12. All product
copy is Mongolian Cyrillic; the code and developer docs are English.

**Build state — §2, §3 and §4 of the prompt pack are complete.** The repo has
its skeleton, its data model, and its scoring engine. There are no product
screens yet: those are §5, and §1 (the design system) comes first.

---

## Stack

| | |
|---|---|
| Runtime / PM | Bun |
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript, `strict` plus `noUncheckedIndexedAccess` |
| Styling | TailwindCSS v4, CSS-first config |
| Database | PostgreSQL — Neon in production, a local cluster in development |
| ORM | Prisma 6 with `@prisma/adapter-neon` |
| Validation | Zod, on every boundary: env, seed input, server actions |
| Mutations | Server Actions through `lib/actions/defineAction` |
| AI | Anthropic SDK, server-side only, never on the scoring path |
| Email | Resend, parent report delivery only |
| Testing | Vitest |

---

## Running it

### 1. Prerequisites

Bun ≥ 1.2 and a PostgreSQL you can reach. Any Postgres 14+ will do locally;
production is Neon.

```bash
bun install
```

### 2. Environment

```bash
cp .env.example .env
openssl rand -base64 32   # paste into SESSION_SECRET
```

`lib/env.ts` validates the whole environment with Zod at boot and **throws on
a missing required variable**, so a half-configured deploy never serves a
request. `ANTHROPIC_API_KEY` and `RESEND_API_KEY` are deliberately optional —
the product is required to work correctly without either.

### 3. Database

```bash
bun run db:migrate     # prisma migrate dev
bun run seed           # validates the dataset, then writes it
```

`bun run seed` is idempotent: it upserts every content row on a stable
authoring key, so running it twice leaves the database exactly as running it
once. `bun run seed:check` validates without writing.

The dataset it currently writes is the **development fixture**
(`prisma/seed/data/fixture.ts`). Its salaries and demand levels are
placeholders and the script says so loudly on every run. §7 replaces it with
30 sourced careers.

### 4. Develop

```bash
bun run dev            # http://localhost:3000
curl localhost:3000/api/health
```

### 5. Checks

```bash
bun run typecheck      # tsc --noEmit
bun run test           # vitest run
bun run build          # prisma generate && next build
```

---

## Local Postgres in one minute

If you have no database to hand:

```bash
pg_ctlcluster 16 main start
su postgres -c "psql -c \"CREATE ROLE zam LOGIN PASSWORD 'zam' SUPERUSER;\" -c 'CREATE DATABASE zam OWNER zam;'"
```

Then point both `DATABASE_URL` and `DIRECT_DATABASE_URL` at
`postgresql://zam:zam@127.0.0.1:5432/zam`.

### Why two database code paths

`schema.prisma` and every migration are identical everywhere. Only the
transport differs: `@prisma/adapter-neon` speaks WebSocket to Neon's
serverless endpoint, which a plain local Postgres cannot answer without
Neon's proxy in front of it. So `lib/db/client.ts` uses the adapter when the
connection is a Neon one and the native engine otherwise. `DB_ADAPTER`
overrides the inference; unset, it is read from the host in `DATABASE_URL`.

---

## Layout

```
app/
  (marketing)/           landing, about, for-parents, for-schools   — §5.1
  (test)/test/           the assessment flow                        — §5.2
  (result)/r/[code]/     result, career detail, roadmap             — §5.3–5.5
  (school)/s/            class dashboard                            — §5.6
  api/health/            health check (webhooks only otherwise)
lib/
  scoring/               PURE functions. No next, react or prisma imports.
  ai/                    Claude client and prompt builders            — §6
  db/                    Prisma singleton, query helpers
  content/               career / university / scholarship read layer
  validation/            Zod schemas shared by client and server
  actions/               the typed server-action helper
components/
  ui/                    design primitives                           — §1
  test/                  question renderers                          — §5.2
  result/                result modules                              — §5.3
prisma/
  schema.prisma
  seed/                  Zod seed schemas, the seed runner, datasets
```

---

## The rules this repo is built to keep

These are load-bearing. Each has a mechanism behind it, not just a comment.

1. **The scoring engine is pure.** `lib/scoring` imports nothing from Next,
   React or Prisma and uses no clock and no randomness, so it runs in a plain
   Bun script. `lib/scoring/purity.test.ts` fails the build if that stops
   being true.
2. **No AI on the scoring path.** No model computes a score, a percentage or
   a ranking. The result page must render fully and correctly with the
   Anthropic key removed — which is why `ANTHROPIC_API_KEY` is optional in
   `lib/env.ts` rather than required.
3. **The environment fails loudly at boot.** `lib/env.ts` throws during module
   evaluation, never at request time.
4. **No client component receives a Prisma model.** `lib/db/client.ts` imports
   `server-only`, so importing it from a client component is a build error.
5. **Server actions are idempotent where they can be, rate-limited where they
   cannot.** Student writes upsert on a unique key (`Answer` is unique per
   session and question, `RoadmapProgress` per session and step), so a retried
   request from a flaky phone connection is a no-op. Actions that cannot be
   replayed safely — resume-code redemption above all — declare a rate limit
   instead.

### Known gap before launch

`lib/actions/rate-limit.ts` is in-memory, so on Vercel each lambda gets its
own counter. It is correct for development and a single long-lived server. It
must be backed by Postgres or Upstash — keeping the `RateLimiter` interface —
before the resume-code flow is exposed publicly.

---

## Reviewing the scoring choices

`lib/scoring/README.md` explains, in Mongolian and in plain language, what the
engine measures, why the four blocks are weighted 35/35/20/10, why match
scores never display below 35, and what each validity flag does. It is
written to be audited by an educator, not an engineer.
