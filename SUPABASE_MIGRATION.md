# Migrating PubMark's backend database from local MySQL to Supabase

> This is the concrete, in-progress version of the migration `MYSQL_TRANSITION.md`
> already describes as the eventual plan. Working through it phase by phase —
> check off progress here as each one completes.

## Context

PubMark currently runs on a local MySQL database that only whoever's running
`server/` (each on their own machine) can access — there's no shared,
always-on database. The goal is to move to Supabase permanently, so anyone on
the team (and eventually real users) can connect to one shared database
instead of everyone running MySQL locally.

**Confirmed approach:** keep the Express server (`server/src/index.js`)
exactly as it is structurally — same routes, same login-checking logic, same
role rules for admin/vendor/officer. Only *what database it talks to
underneath* changes, from MySQL to Supabase's Postgres. The React frontend
doesn't change at all, because it was never talking to MySQL directly — it
always went through the server.

This explicitly does **not** include switching to Supabase's own login system
(Supabase Auth). The existing email/password/JWT login logic stays exactly as
it is — only the database queries underneath it change.

Grounded in the actual files, not generic advice:
- `server/mysql-schema.sql` — 13 tables, all using text-based UUIDs, MySQL
  `ENUM` types, and `JSON` columns for map geometry.
- `server/src/index.js` (1194 lines) — every route talks to MySQL through the
  `mysql2` package, using `?` placeholders and `[rows] = await db.execute(...)`.
- `dumps/*.sql` (not committed — see `.gitignore` note below) — the real data
  is small: profiles (9 rows), applications (5), stalls (2), a handful of
  rows in the rest. This matters — it means moving the data is a light task,
  not a big data-engineering job.
- Three tables in the schema — `transfers`, `inventory_items`, `archive` —
  have **no matching routes** in `index.js` yet (those features still use
  `localStorage`, per `CLAUDE.md`). So only some tables need route code
  rewritten; the rest just need to exist in the new schema for later.

**How this is being worked through:** step by step, deliberately slow.
For each phase:
1. Plain-language explanation first — no SQL, no jargon — before any code.
2. Small pieces, not all at once. Phase 3 in particular (rewriting the
   server) happens a few routes at a time, not all 12+ endpoints in one sitting.
3. Confirm it works before moving to the next phase.
4. The current MySQL setup and server keep running, completely untouched,
   through the entire process. Nothing "goes live" on Supabase until it's
   been seen working — no point where the app is broken or at risk mid-migration.

Rough shape:
- **Phase 0:** one sitting, ~15 min, mostly clicking through Supabase's dashboard.
- **Phases 1 + 2:** one sitting — short, since the real data is only a few
  dozen rows total.
- **Phase 3:** the long one, spread across several sittings in small batches.
- **Phase 4:** quick, a config swap.

---

## Phase 0 — Create the Supabase project and connect it

**YOU do:**
1. Go to supabase.com → sign up or log in.
2. Click **New Project** → pick/create an organization → name it (e.g.
   `go`) → set a database password and **write it down somewhere safe**
   → pick a region close to you → click **Create**. Wait ~2 minutes.
   (Free tier — no credit card needed, and it's more than enough for this
   data size. Free projects auto-pause after ~a week of inactivity; one click
   to resume if that happens.)
3. Click your avatar (top right) → **Account Settings** → **Access Tokens** →
   **Generate new token** → name it (e.g. `pubmark-mcp`) → copy it.
4. Paste that token in chat with Claude.

**Claude does:**
5. Runs `claude mcp add supabase ...` with the token, scoped to just this one
   project, so it can only touch this project, not the whole account.
6. Confirms the connection works.

**Purpose:** without this, nothing else in the plan is possible — a real
Supabase project is needed to create tables in and a way to talk to it.

- [ ] Phase 0 complete

---

## Phase 1 — Translate the schema (MySQL → Postgres)

MySQL and Postgres (what Supabase runs) use different SQL dialects. Translate
`server/mysql-schema.sql` into a new `server/supabase-schema.sql`, table by
table, using one consistent mapping:

| MySQL (current) | Postgres/Supabase (new) | Why |
|---|---|---|
| `CHAR(36)` for UUIDs | `uuid` | Native type, same values, no app changes — IDs are already generated with `crypto.randomUUID()` in `index.js`, so this needs no code change. |
| `ENUM('a','b','c')` | `text` + `CHECK (col IN ('a','b','c'))` | Postgres enums are painful to change later (e.g. adding a new violation category); a CHECK constraint is just as safe and easy to edit. |
| `JSON` (for map geometry) | `jsonb` | Postgres's indexed JSON type — same data, faster queries. |
| `TIMESTAMP ... ON UPDATE CURRENT_TIMESTAMP` | `timestamptz` + a trigger | Postgres doesn't have MySQL's auto-update-on-change shorthand; needs a small trigger function, used identically on every table that needs it. |

Example, using `profiles` (the smallest table) to show the pattern once:

```sql
-- MySQL (current)
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  role ENUM('super_admin','admin','vendor','officer') NOT NULL DEFAULT 'vendor',
  ...
);

-- Postgres/Supabase (new)
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'vendor' CHECK (role IN ('super_admin','admin','vendor','officer')),
  ...
);
```

All 13 tables follow this same mechanical translation — done together, one
table at a time, not all pasted at once.

**YOU do:** read each table's translation as it's shown (plain-language
explanation first), confirm or ask questions. No typing required unless the
MCP connection has trouble, in which case there's a click-by-click fallback
via Supabase's SQL editor.

**Claude does:** writes `server/supabase-schema.sql`, runs it against the
Supabase project through the MCP connection, then shows the new tables in
Supabase for confirmation.

- [ ] Phase 1 complete

---

## Phase 2 — Move the existing data

Given how little data there actually is (dozens of rows total, not
thousands), this is a light step: translate the `INSERT` statements from the
MySQL dump into Postgres-compatible ones and run them against the new
tables. No heavy migration tooling needed for this size.

**YOU do:** open Supabase's **Table Editor** (left sidebar) once the data is
in, click through a table or two, confirm the real rows are there (e.g.
`admin@pubmark.com` in `profiles`).

**Claude does:** everything else — translate and run the inserts.

**Verification:** row counts in Supabase match the row counts in the current
MySQL database, table by table.

- [ ] Phase 2 complete

---

## Phase 3 — Swap the server's database client (mysql2 → pg)

The biggest phase, since `server/src/index.js` touches the database in
almost every route. One consistent pattern repeats throughout:

| mysql2 (current) | pg / Postgres (new) |
|---|---|
| `?` placeholders | `$1`, `$2`, `$3`... |
| `const [rows] = await db.execute(sql, [a, b])` | `const { rows } = await db.query(sql, [a, b])` |
| `conn.beginTransaction()` / `commit()` / `rollback()` | `client.query('BEGIN')` / `'COMMIT'` / `'ROLLBACK'` |

`pg` (not the Supabase JS client) because the code already does multi-table
`LEFT JOIN`s everywhere (announcements+profiles, applications+stalls+profiles,
violations+stalls+profiles) — `pg` lets those stay as plain SQL, the same
shape as today, instead of relearning Supabase's query-builder syntax on top
of everything else at once. This doesn't block adopting Supabase-native
features (RLS, Realtime, Storage) later — those work at the database level
regardless of which client library sends the queries.

Routes that actually need rewriting (checked against the real file — these
are the ones with live database calls today):
- Auth: `/api/auth/login`, `/register`, `/me`, `/logout`, `/users/by-email`
- `/api/users`, `/api/announcements`
- `/api/check-requests`, `/api/violation-requests`, `/api/violations`,
  `/api/termination-requests`
- `/api/stalls` (+ `/geometry`, `/import`)
- `/api/applications` (+ `/:id/permit`)
- `/api/perimeters`

Also gets updated: `server/seed-demo-users.js` (same `?` → `$1` pattern, much
smaller file).

Two things get **deleted**, not translated: the `ensureDefaultAnnouncements()`,
`ensureRequestTables()`, and `ensureViolationAndTerminationTables()`
functions in `index.js`. Those exist today to self-heal a MySQL schema that
might be missing tables — once Phase 1 creates the full Postgres schema up
front, they have nothing left to do.

Untouched: all the bcrypt/JWT/cookie login logic, all the role-checking
(`requireAuth`, `requireRole`), the whole CORS setup. Those don't care what
database is underneath.

**YOU do, per small batch of routes:**
1. Read the explanation of what that batch of routes does, see the before/after.
2. After the edit lands, run `npm run dev` inside `server/`.
3. Test the matching feature in the browser (exact click path given each time).
4. Confirm it worked → next batch, or flag the problem.

**Claude does:** the actual code edits, one small batch at a time — never all
12+ routes in a single pass.

- [ ] Auth routes
- [ ] Users + announcements
- [ ] Check requests + violation requests
- [ ] Violations + termination requests
- [ ] Stalls (+ geometry, import)
- [ ] Applications (+ permit)
- [ ] Perimeters
- [ ] `seed-demo-users.js`
- [ ] Phase 3 complete

---

## Phase 4 — Point the server at Supabase

**YOU do:**
1. In Supabase: **Settings** → **Database** → copy the **Connection string**.
2. Provide it (in chat, or paste directly into `server/.env`).
3. Run `npm run dev` in `server/` one more time, do a final full check
   (log in, view stalls, view applications).

**Claude does:**
- `server/package.json`: remove `mysql2`, add `pg`.
- Update `server/.env` with the Supabase connection string if asked to.
  `JWT_SECRET` stays exactly as it is.
- Local MySQL stays installed and untouched — nothing gets deleted until
  everything's confirmed working against Supabase, so falling back is easy.

- [ ] Phase 4 complete

---

## Verification

1. **Schema check:** table list and row counts in Supabase match what was in MySQL.
2. **Login round-trip:**
   ```
   curl -i -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"admin@pubmark.com\",\"password\":\"admin123\"}"
   ```
   Expect `200` with a profile body — proves both the new database connection
   and the untouched auth logic work together.
3. **Full smoke test:** `npm run dev:web` → log in as super-admin and admin →
   check stalls map, applications list, announcements, violations all load
   and can be edited — proves every rewritten route actually works, not just auth.
