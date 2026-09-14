# PubMark — System Handbook

A plain-language guide to the system you built: what every piece is, what it
actually does, where it's fragile, and how to deploy it without flying blind.

Written to be read by *you*, not by another AI. If a sentence here doesn't
make sense, that's a gap worth closing before deployment — ask about it.

**Sections**
1. The Big Picture ← *you are here*
2. The Database (Postgres / Supabase)
3. The Backend API (Express)
4. The Web App (React + Vite)
5. The Mobile App (Expo / React Native)
6. Report Card — what's solid, what's fragile, what's missing
7. Deployment — from zero

---

# 1. The Big Picture

## 1.1 You didn't build one app. You built four things.

Most people think of "my system" as one program. Yours is actually **four
separate programs**, running on four different computers, talking to each
other over the internet:

| # | Piece | Runs where | What it is |
|---|-------|-----------|------------|
| 1 | **Web app** | In the user's browser | React app — admins, super-admins, vendors, officers |
| 2 | **Mobile app** | On the user's phone | Expo/React Native app — vendors and officers only |
| 3 | **Backend API** | On a server (currently your laptop) | Express program — holds all the rules |
| 4 | **Database + file storage** | Supabase's servers (Singapore) | Postgres database + a file bucket |

They are genuinely separate. The web app cannot read the database. The mobile
app cannot read the database. **Only the backend touches the database.**
Everything else has to ask the backend and wait for an answer.

```
   ┌──────────────┐         ┌──────────────┐
   │   Web app    │         │  Mobile app  │
   │  (browser)   │         │   (phone)    │
   └──────┬───────┘         └──────┬───────┘
          │                        │
          │   HTTPS requests       │
          │   (JSON in, JSON out)  │
          └───────────┬────────────┘
                      ▼
          ┌───────────────────────┐
          │     Backend API       │   ← Express, ~3000 lines
          │   server/src/index.js │      68 endpoints
          └───────────┬───────────┘
                      │  SQL queries          ┌──────────────┐
                      ├──────────────────────►│  Postgres    │
                      │                       │  (Supabase)  │
                      │  file upload/download └──────────────┘
                      └──────────────────────►┌──────────────┐
                                              │   Storage    │
                                              │ "attachments"│
                                              └──────────────┘
```

**Why this matters for deployment:** you're not deploying "an app." You're
deploying *three* things to three different places, and they all need to know
each other's addresses. Most of your deployment pain will come from one of
them having the wrong address for another. (Section 7 covers this in detail.)

---

## 1.2 What each technology actually is

You have a lot of names in your `package.json` files. Here's what the
load-bearing ones actually do — the rest are mostly UI components.

### Postgres — "the filing cabinet with strict rules"

Postgres is a **database program**. It's not part of your code; it's a
separate program running on a separate machine that does one job: store data
and answer questions about it, reliably.

It stores data in **tables** — think spreadsheets, but with rules enforced by
the database itself. Your `stalls` table, for example, refuses to accept a
row whose `status` isn't exactly `vacant`, `occupied`, or `unavailable`. Not
because your JavaScript checks it — because Postgres itself rejects it.

You talk to Postgres in a language called **SQL**:

```sql
SELECT * FROM profiles WHERE email = 'admin@pubmark.com' LIMIT 1;
```

That exact query is in your login route. Read it out loud: "select all
columns from the profiles table, where email equals this, give me at most 1."
SQL reads like English on purpose.

**Why a database instead of just files?** Three things files can't do:
- **Relationships** — "this application belongs to that stall" is enforced.
  You cannot create an application pointing at a stall that doesn't exist.
- **Transactions** — "do these 5 things, or do none of them." If step 3
  fails, steps 1 and 2 are undone automatically. Your stall-deletion code
  uses this so you never end up with half-deleted data.
- **Concurrency** — two admins clicking "approve" at the same moment won't
  corrupt anything.

### Supabase — "someone else runs the Postgres for me"

Supabase is a **company/service**, not a technology. They run a Postgres
database for you so you don't have to install and maintain one on a server.
They also bundle extras.

You use exactly two of their features:
- **The Postgres database** (your `DATABASE_URL` points at it)
- **Storage** — a place to put files (permits, stall photos, receipts). Your
  bucket is called `attachments`.

You do **not** use: Supabase Auth, Supabase Realtime, Supabase Edge
Functions, or the Supabase client library in your frontends. This is worth
knowing because 90% of Supabase tutorials online assume you use Supabase Auth
— you don't, so those tutorials will actively mislead you. You built your own
authentication (see below).

### Express — "when a request arrives at this address, run this function"

Express is a small library for writing a web server. Essentially all of
Express in your codebase looks like this:

```js
app.post("/api/applications", requireAuth, requireRole("admin", "super_admin", "vendor"), async (req, res, next) => {
  // ... your code ...
  res.json({ application: mapped });
});
```

Read as: *"When a POST request arrives at `/api/applications`, first run
`requireAuth`, then run `requireRole(...)`, then run this function."*

- `req` = the incoming request (who sent it, what data they sent)
- `res` = your reply (what you send back)
- `next` = "pass this to the error handler"

That's genuinely most of it. Express is a thin thing.

### An "API" — the menu of things your backend can do

An API is just **the list of addresses your backend responds to**. You have
68 of them. Each has:
- a **method** — `GET` (read), `POST` (create), `PATCH` (update),
  `DELETE` (remove)
- a **path** — `/api/stalls`, `/api/applications/:id`

`:id` means "anything goes here" — `/api/applications/abc-123` matches
`/api/applications/:id`, and the route receives `req.params.id = "abc-123"`.

### React — "describe what the screen should look like, not how to change it"

Old-style web code said *"find the element with id `total` and set its text
to 5."* React says *"the total is 5"* and figures out the DOM changes itself.

```jsx
<Text>{stats.pending}</Text>
```

When `stats.pending` changes, React re-renders that piece. You never write
"update the label."

**React Native** is the same idea, but instead of producing HTML it produces
real native Android/iOS views. That's why your mobile code uses `<View>` and
`<Text>` instead of `<div>` and `<span>` — there's no HTML on a phone.

### Vite / Expo — "the build tools"

- **Vite** takes your web source files and bundles them into plain
  HTML/CSS/JS that a browser can load. `npm run dev` runs it in dev mode;
  `npm run build` produces a `dist/` folder — *that folder is what you
  deploy.*
- **Expo** does the equivalent for mobile: bundles your JS, and (via EAS
  Build) compiles it into an actual `.apk`/`.ipa` app file.

---

## 1.3 How authentication actually works in your system

This is the part most worth understanding properly, because it's the part
that will break in production (Section 7) and the part with real security
consequences.

### Step 1 — Passwords are never stored

When someone registers, you never save their password. You save a **bcrypt
hash**:

```js
const passwordHash = await bcrypt.hash(password, 12);
```

A hash is a one-way scramble. `"user123"` → `"$2a$12$N9qo8uLOickgx2ZM..."`.
You cannot reverse it. To check a login, you don't decrypt anything — you
hash the attempt and compare:

```js
await bcrypt.compare(password, user.password_hash)
```

The `12` is the "cost factor" — how slow the hashing is on purpose. Slow
hashing means an attacker who steals your database can only test a few
thousand guesses per second instead of billions. 12 is a good value.

### Step 2 — A successful login issues a JWT

A **JWT** (JSON Web Token) is a small string with three parts separated by
dots: `header.payload.signature`.

Your payload is tiny:

```js
jwt.sign({ sub: profile.id, role: profile.role }, jwtSecret, { expiresIn: "8h" })
```

- `sub` = the user's id, `role` = their role, expires in 8 hours.
- The **signature** is made using your `JWT_SECRET`.

The critical property: **anyone can read a JWT, but only someone with the
secret can create a valid one.** The payload is just base64 — paste any JWT
into jwt.io and you'll see its contents. So:
- Never put anything secret in a JWT payload (you don't — good).
- **If `JWT_SECRET` leaks, anyone can forge a token claiming to be a
  super-admin.** Right now your secret is literally the string
  `use-a-new-long-random-secret`. Fix this before deploying — Section 7.

### Step 3 — The token travels differently on web vs mobile

This is a real design decision in your code, and a good one:

| | Web | Mobile |
|---|---|---|
| Where the token lives | httpOnly cookie `pubmark_session` | `expo-secure-store` (encrypted device storage) |
| How it's sent | Automatically by the browser | Manually: `Authorization: Bearer <token>` |
| Why | JavaScript can't read httpOnly cookies → XSS can't steal it | React Native doesn't persist cookies reliably |

Your `requireAuth` accepts either:

```js
const bearerToken = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
const cookieToken = req.headers.cookie?.match(/(?:^|; )pubmark_session=([^;]+)/)?.[1];
jwt.verify(bearerToken || cookieToken || "", jwtSecret);
```

That's why the same 68 endpoints serve both apps with zero duplication —
genuinely good architecture, whether or not you chose it deliberately.

### Step 4 — Every request re-checks the database

Your `requireAuth` doesn't just trust the token. It also queries:

```js
SELECT role, is_archived FROM profiles WHERE id = $1
```

This is why terminating a vendor kicks them out on their *next action*
instead of leaving them logged in for up to 8 hours. It costs one extra query
per request — a deliberate, correct trade.

It also means **`role` always comes from the database, never from the
token.** If you promoted someone to admin, they get admin powers immediately.
Also correct.

---

## 1.4 A complete request, start to finish

Concrete example: **a vendor on the mobile app submits a stall application
with a permit photo.** Follow it all the way down.

**1. The screen collects input.**
`mobile/src/screens/vendor/ApplicationFormScreen.jsx` holds the form values
in React state (`entries`, `permit`, `notes`).

**2. The photo is read into base64.**
`readAssetForUpload()` turns the image file into a long text string, because
JSON can only carry text — not raw binary.

**3. The app calls the API client.**

```js
createApplication({ stallId, businessName, permit, ... })
```

**4. `apiFetch` attaches the token and sends it.**
(`mobile/src/services/api.js`)

```js
fetch(`${baseUrl}/applications`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(input),
})
```

Now it leaves the phone and travels over the internet.

**5. CORS check.** The backend decides whether this origin is allowed to talk
to it at all. (Mobile has no origin header, so it's waved through.)

**6. `express.json()` parses the body** from text into a JS object —
`req.body`.

**7. `requireAuth` runs.** Verifies the JWT signature, then queries `profiles`
to confirm the account exists and isn't archived. Attaches `req.auth`.

**8. `requireRole("admin", "super_admin", "vendor")` runs.** Rejects with 403
if the role doesn't match.

**9. The route handler runs.** It validates fields, and for the permit:
- checks the MIME type is allowed (jpeg/png/webp/heic/pdf)
- checks the size is under 5 MB
- uploads the bytes to Supabase Storage at
  `permits/<applicationId>/<uuid>-<filename>`
- keeps only the *path* — not the file — for the database

**10. The row is inserted.**

```sql
INSERT INTO applications (user_id, stall_id, business_name, ..., permit_path)
VALUES ($1, $2, $3, ..., $9) RETURNING *
```

The `$1, $2` placeholders matter: they make **SQL injection impossible**.
The values are sent separately from the query text, so a business name of
`'; DROP TABLE stalls; --` is stored as literal text, not executed. Your
codebase uses placeholders consistently — genuinely good.

**11. The response is built.** `mapApplicationRow()` converts snake_case
database columns into camelCase JSON, and turns the stored *path* into a
**signed URL** — a temporary link valid for 10 minutes.

**12. Back on the phone**, the promise resolves, state updates, React
re-renders, and the vendor sees their application.

**Every single feature in your app is a variation of these 12 steps.** Once
this clicks, the whole system stops being mysterious.

---

## 1.5 Why files aren't stored in the database

Your `applications` table has a `permit_path` column — a short text string
like `permits/abc-123/def-456-permit.jpg`. The actual JPEG lives in Supabase
Storage.

This split is correct and worth understanding:
- Databases are slow and expensive at storing large binary blobs.
- Storage services are built for exactly this and serve files cheaply.
- Backups stay small.

**The bucket is private.** Nothing in it is publicly readable. When a
permitted user needs to see a file, the backend generates a **signed URL** —
a link with a cryptographic signature and a 10-minute expiry
(`SIGNED_URL_TTL_SECONDS = 600`). After 10 minutes, the link is dead.

That's why your API responses contain `permitUrl` fields that look different
every time you fetch. Not a bug.

---

## 1.6 The mental model to keep

If you remember nothing else:

> **The browser and the phone are untrusted. The backend is the only place
> where rules are real.**

Anyone can open browser dev tools, edit your React code, and make the
"Delete Stall" button appear for a vendor. That's *fine* — because when they
click it, `requireRole("admin", "super_admin")` on the server says no.

This is why every rule that matters exists twice in your codebase:
- **In the UI** — so honest users get a good experience (buttons hidden,
  forms validated)
- **On the server** — so dishonest users get stopped

If you ever find a rule that only exists in the UI, that's a security hole.
(There's one in your app — Section 6.)

---

## Section 1 checkpoint

You should now be able to answer, without looking:

1. Which of your four pieces can talk to the database directly?
2. What's the difference between Postgres and Supabase?
3. Why does the web app use a cookie but the mobile app use a header?
4. What stops someone from forging a login token?
5. Why is the permit file not stored in the `applications` table?
6. If a vendor edits your React code to show an admin button, what stops
   them from actually using it?

If any of those are shaky, say so — that's the point of doing this before
deployment, not during.

---

# 2. The Database

## 2.1 Your 20 tables, grouped by what they're for

| Group | Tables |
|---|---|
| **People** | `profiles`, `pending_user_creations` |
| **The map** | `stalls`, `market_perimeter`, `map_facilities` |
| **Renting a stall** | `applications`, `contract_renewal_requests`, `renewal_deadline_extensions`, `transfers`, `termination_requests` |
| **Enforcement** | `violations`, `violation_evidence`, `violation_requests`, `check_requests`, `check_request_files` |
| **Money** | `payment_receipts` |
| **Files** | `stall_images` |
| **Misc** | `announcements`, `archive`, `inventory_items`, `notification_read_state` |

`inventory_items` exists in the database but **has no API routes at all** —
the inventory feature reads and writes browser localStorage instead. More on
that in Section 6.

## 2.2 Primary keys and foreign keys — the two rules that hold it together

**Primary key** = the unique id of a row. Yours are all UUIDs
(`a416c5ce-f6d8-4b2c-...`) rather than 1, 2, 3. Good choice: UUIDs can be
generated by the app without asking the database first, and they don't leak
"we have 47 customers" to anyone who sees an id.

**Foreign key** = "this column must point at a real row in that table."

```
applications.stall_id  ──must exist in──►  stalls.id
applications.user_id   ──must exist in──►  profiles.id
```

Postgres *enforces* this. You cannot insert an application for a stall that
doesn't exist — the database rejects it, no matter what your JavaScript says.

### The consequence you already hit

Foreign keys also work backwards: **you can't delete a row that others point
at.** That's why deleting a stall isn't a one-liner. Seven tables point at
`stalls`:

```
                    ┌─── applications
                    ├─── violations
    stalls  ◄───────┼─── check_requests
                    ├─── violation_requests
                    ├─── transfers
                    ├─── termination_requests
                    ├─── payment_receipts
                    └─── stall_images
```

None of them use `ON DELETE CASCADE` (the setting that says "if the parent
dies, delete the children automatically"). So your backend has
`cascadeDeleteStall()` which deletes the children by hand, in the right
order, inside a transaction. That's why the delete-stall route is 20 lines
instead of 1.

**When we wiped the stall data earlier, this is exactly why the order
mattered** — children first, parents last.

## 2.3 What a transaction is

Some operations touch several tables. If step 3 fails, steps 1–2 must be
undone or you get corrupt data — a violation whose evidence rows point
nowhere.

```sql
BEGIN;
  DELETE FROM violation_evidence WHERE ...;
  DELETE FROM violations WHERE ...;
  DELETE FROM stalls WHERE ...;
COMMIT;
```

Everything between `BEGIN` and `COMMIT` is all-or-nothing. If anything throws,
`ROLLBACK` undoes the lot. Your backend wraps 8 multi-table writes this way.
This is real engineering and it's correctly done.

## 2.4 Indexes — why some queries are fast

Without an index, `SELECT * FROM applications WHERE stall_id = 'abc'` reads
**every row** and checks each one. With an index on `stall_id`, Postgres
jumps straight to the matches — like a book index vs. reading every page.

Your schema has compound indexes added during earlier optimization work. The
trade: indexes make reads faster and writes slightly slower, and use disk.
For your read-heavy app that's the right trade.

## 2.5 Row Level Security (RLS) — and why yours looks alarming but isn't

Supabase's linter reports this for **all 21 tables**:

> Table `public.profiles` has RLS enabled, but no policies exist

That sounds broken. It isn't — for *your* architecture it's the correct and
safest configuration. Here's why.

RLS is a Postgres feature that filters rows based on *who is asking*. It
exists for apps where the **browser talks to the database directly** using a
public "anon key" — then you need policies like "a user may only SELECT their
own row."

**Your app never does that.** Your browsers and phones only ever talk to your
Express server. Express connects using the **service role key**, which
bypasses RLS entirely.

So the current state means:
- Anyone with your public/anon key connecting directly → **RLS on, zero
  policies → zero rows readable.** Locked shut. 
- Your Express server → service role → full access. Works. 

This is "deny by default." It's the right posture. **Do not add RLS policies**
unless you later decide to let clients talk to Supabase directly — which you
shouldn't, because all your business rules live in Express.

The one thing to protect: **the service role key is a master key.** It must
never appear in web or mobile code, only in server environment variables.
Currently correct — keep it that way.

## 2.6 Migrations — your biggest structural gap

A **migration** is a saved `.sql` file recording a schema change, so any
database can be rebuilt by replaying them in order.

You have 8:

```
2026-08-23-payment-receipts.sql
2026-09-06-contract-renewals.sql
2026-09-06-followup-request-links.sql
2026-09-07-map-facilities-office.sql
2026-09-07-map-facilities.sql
2026-09-08-application-status-timestamps.sql
2026-09-08-technical-room-and-office-polygons.sql
2026-09-09-google-signup-pending-user-creations-nullable.sql
```

**But you have 20 tables.** `profiles`, `stalls`, `applications`,
`violations`, `check_requests` — the core of your entire system — have no
migration file. They were created ad-hoc in the Supabase dashboard.

Why this is a real problem:
- **You cannot recreate your database.** If the project is deleted, corrupted,
  or you need a staging copy, there is no script to rebuild it. You'd be
  reverse-engineering the schema from your code.
- **`server/mysql-schema.sql` is a trap.** It's left over from a MySQL phase
  before you moved to Postgres. It uses MySQL syntax that Postgres rejects.
  If future-you (or a teammate) runs it thinking it's the schema, it fails —
  or worse, half-succeeds.

**Fix before deploying** (30 minutes, high value):

```bash
# Produces a complete schema file from your live database
npx supabase db dump --db-url "<your DATABASE_URL>" --schema public -f server/migrations/000-baseline-schema.sql
```

Commit that. Delete `mysql-schema.sql`. Now your schema is reproducible.

## 2.7 snake_case vs camelCase — the translation layer

Postgres columns are `snake_case` (`business_name`, `contract_end`).
JavaScript is `camelCase` (`businessName`, `contractEnd`).

Your backend translates at the boundary using mapper functions:

```js
function mapApplicationRow(r) {
  return {
    businessName: r.business_name,
    contractEnd: r.contract_end,
    permitUrl: await signedUrlFor(r.permit_path),  // path → temporary link
    ...
  };
}
```

This is a good pattern — one place decides what leaves the server. Note the
mapper also **omits** things: `password_hash` never appears in any mapper, so
it can't accidentally be sent to a client.

---

# 3. The Backend API

## 3.1 The shape of it

One file: `server/src/index.js`, ~3,050 lines, 68 endpoints.

**Honest assessment:** a single 3,000-line file is past the point where it
should be split. It works, and it's readable because it's well-commented and
grouped — but finding anything requires search, and two people can't edit it
without conflicts. Not urgent for deployment; worth splitting later into
`routes/auth.js`, `routes/stalls.js`, etc.

## 3.2 The middleware chain

Every request passes through a pipeline. Order matters enormously:

```js
app.use(cors({ ... }))              // 1. Is this origin allowed?
app.use(express.json({ limit }))    // 2. Parse JSON body → req.body
// then per-route:
requireAuth                          // 3. Valid token? Account alive?
requireRole("admin", "super_admin")  // 4. Right role?
handler                              // 5. Do the work
app.use((error, req, res, next) => ) // 6. Anything thrown lands here
```

Anything can stop the chain by sending a response. `requireRole` never runs
if `requireAuth` already replied 401.

## 3.3 Route order is a real hazard in your code

Express matches **top to bottom, first match wins.** This bit you once
already:

```js
app.patch("/api/stalls/geometry", ...)  // MUST come first
app.patch("/api/stalls/:id", ...)       // ":id" would match "geometry"
```

If `/:id` came first, a request to `/api/stalls/geometry` would be treated as
"update the stall whose id is the literal string `geometry`". You fixed this
once; the rule is now: **static paths before `:id` paths, always.**

## 3.4 File uploads — you have two different systems

**Path A — base64 through the API (older, used by most flows)**
The client reads the file, converts to a base64 string, and includes it in the
JSON body. The server decodes and uploads to Storage.
- Simple, works everywhere
- Wasteful: base64 is ~33% larger, and a 5 MB file becomes ~6.7 MB of JSON
  held entirely in server memory. That's why `express.json({ limit: "10mb" })`
  exists.

**Path B — signed direct upload (newer, only stall photos)**
`POST /api/uploads/sign` returns a temporary URL; the browser uploads straight
to Supabase Storage, bypassing your server entirely; then the path is sent to
the API, which verifies the object actually exists before trusting it.
- Much better: your server never touches the bytes
- Only wired into one flow

**This inconsistency is technical debt.** Both work; having both means new
code has to guess which pattern to follow. Not a deployment blocker.

## 3.5 The thing I'd fix first in this file

At the top of `GET /api/applications`:

```js
app.get("/api/applications", requireAuth, async (req, res, next) => {
  await autoTerminateExpiredPermitDeadlines();   // ← scans ALL approved apps
  await autoTerminateExpiredContracts();         // ← UPDATE across the table
  ...
```

**Every single time anyone opens the applications list**, the server scans
every approved application, parses metadata out of a text field, and possibly
issues a batch of UPDATEs — *before* returning the data the user asked for.

Why this is wrong:
- It makes a read endpoint slow and unpredictable
- Two users loading the page simultaneously run the same sweep twice
- If the sweep throws, the list fails to load even though the read was fine
- The "did a contract expire" question has nothing to do with "show me the
  list"

**This is scheduled work living inside a request handler.** The correct home
is a cron job — run it once every hour, independent of traffic. Most hosts
give you cron for free (Render Cron Jobs, Railway cron, or a free
cron-job.org ping to a protected `/api/tasks/expire` endpoint).

Not a *blocker* — but under real traffic this is the endpoint that will get
slow first, and it's a 30-minute fix.

## 3.6 Pagination and caching

- `?limit=&offset=` on the heavy list endpoints. `parsePagination` clamps
  limit to a max of 100 so nobody can request 1,000,000 rows.
- **ETag** support on `/api/map-facilities` and `/api/perimeters`: the server
  sends a fingerprint of the response; if the client sends it back and nothing
  changed, the server replies `304 Not Modified` with an empty body. Saves
  bandwidth on data that rarely changes.
- Deliberately **not** on `/api/stalls` — stall responses contain freshly
  signed photo URLs that differ every request, so an ETag would never match.
  Correct reasoning.

## 3.7 What the backend is missing

| Missing | Why it matters in production |
|---|---|
| **Rate limiting** | Nothing stops 10,000 login attempts/minute against `/api/auth/login`. bcrypt makes each slow, which also means an attacker can exhaust your CPU. Add `express-rate-limit`. |
| **Security headers** | No `helmet`. Missing HSTS, X-Frame-Options (clickjacking), etc. One line to add. |
| **Structured logging** | `console.error(error)` only. On a host you'll be reading a raw log stream with no request ids, no timestamps you control, no way to trace one user's failing request. |
| **Error tracking** | No Sentry/equivalent. When a user says "it broke," you'll have nothing. |
| **Input validation library** | Validation is hand-written per route (`if (!name \|\| !phone)`). Works, but inconsistent and easy to forget. `zod` would centralize it. |
| **Password reset** | **There is no forgot-password flow.** A vendor who forgets their password has no path back in except an admin manually resetting it. This is a product gap you'll feel within a week of real use. |
| **Health check endpoint** | Hosts want a `/healthz` to know the app is alive. |

---

# 4. The Web App

## 4.1 Structure

- **Vite** bundles it. `npm run dev` = dev server on :5173. `npm run build`
  = static files in `dist/` — *that folder is what gets deployed.*
- **React Router** (`src/app/routes.jsx`) maps URLs to page components.
- **Tailwind CSS 4** for styling — the `className="flex items-center gap-2"`
  strings. Utility classes instead of separate CSS files.
- **shadcn/Radix** components in `src/app/components/ui/` — a large generated
  component library. Shared infrastructure; changing those files affects
  everything.
- **Leaflet** + **leaflet-draw** for the interactive map and polygon drawing.

## 4.2 Route protection — better than your docs claim

`ProtectedRoute` gates every authenticated page. Your `CLAUDE.md` says it only
checks a cached client profile with no server validation. **That is out of
date.** The current code:

1. `AuthContext` calls `GET /api/auth/me` on mount — a real server round-trip
2. Holds `status` as `checking` → `authenticated` / `unauthenticated` / `error`
3. `ProtectedRoute` renders a spinner while checking, blocks on error, and
   redirects if the role doesn't match

That's correct behaviour. **The stale documentation is itself the risk** — see
Section 6.

## 4.3 TanStack Query — what it actually does for you

Before: every screen did its own `useEffect` + `fetch` + `useState`. Two
screens showing stalls = two fetches, two copies, two chances to disagree.

After: `useStalls()` — a shared cache keyed by resource.

```js
useQuery({ queryKey: ["stalls"], queryFn: getStalls, staleTime: 5 * 60_000 })
```

- Any number of components calling `useStalls()` share **one** request
- `staleTime` = how long data is considered fresh; within that window,
  mounting another component costs zero network
- Refetches automatically on window focus

Your staleTimes are tuned by data type — 5 min for stalls/facilities (rarely
change), 1 min for announcements, 15s for workflow data like receipts and
transfers. That's a thoughtful, correct pattern.

`queryClient.clear()` runs on logout so the next account never sees the
previous one's cached data. Good catch by whoever added it.

## 4.4 The store-module mess

`src/app/components/` contains files named `*Store.ts` / `*Storage.ts`. **They
are not all the same thing**, and the naming actively lies:

| File | Actually backed by |
|---|---|
| `applicationsStorage.ts`, `violationsStore.ts`, `checkRequestsStore.ts`, `transferStorage.ts`, `perimeterStore.ts` | **The API** (thin `apiFetch` wrappers) |
| `stallsStorage.ts` | **Legacy localStorage** — mostly dead, but `SuperAdminDashboard.jsx` still calls it in a few places |
| `inventoryStore.ts` | **Browser localStorage only** |

**The inventory problem is worth stating plainly:** inventory data lives in
*one browser's* localStorage. It is not on the server. It is invisible to
every other user and every other device. Clearing browser data deletes it
permanently. There's an empty `inventory_items` table in Postgres waiting for
it, but no API routes were ever built.

Before deploying, decide: either finish inventory (add ~5 routes) or remove
the feature from the UI. Shipping it as-is means a super-admin will enter
real inventory data and lose it.

---

# 5. The Mobile App

## 5.1 What it is

Expo SDK 57 / React Native 0.86. Vendors and officers only — admins and
super-admins are pushed to the web app (there's an explicit role check on
login that signs them back out).

```
mobile/src/
  navigation/RootNavigator.jsx   ← decides which screens exist per role
  screens/vendor/                ← Home, Applications, Transfers, Notices, Map
  screens/officer/               ← Violations, Checks, Map, Receipts, Notices
  services/api.js                ← same 68 endpoints, bearer token
  context/AuthContext.jsx        ← session state
  hooks/                         ← TanStack Query, same as web
```

## 5.2 The one real difference from web: the token

Web gets an httpOnly cookie automatically. Mobile can't rely on cookies, so:

- Token stored in **`expo-secure-store`** — encrypted OS keystore (Android
  Keystore / iOS Keychain), not plain storage
- Sent manually: `Authorization: Bearer <token>`

Everything else — the endpoints, the roles, the rules — is identical. That's
why adding Google Sign-In to mobile required **zero backend changes**.

## 5.3 Why you needed a Development Build

Expo Go is a pre-built app containing a fixed set of native modules. Google
Sign-In needs its own compiled native code, which Expo Go doesn't have and
can't add at runtime.

So you built a **Development Build** — your own copy of the Expo Go shell with
your native modules compiled in. Still fully Expo: same `app.json`, same
`npx expo start` (as `--dev-client`), same fast refresh.

**The rule to remember:** JS/UI changes hot-reload instantly, forever. Only
these need a rebuild:
- adding a package with native code
- changing native config in `app.json` (icon, package name, permissions,
  `softwareKeyboardLayoutMode`)
- major SDK upgrades

## 5.4 How the app finds your API — and the production trap

`mobile/src/services/apiBaseUrl.js`:

```js
if (__DEV__) {
  const host = hostFromExpo();          // e.g. "192.168.1.8" from Metro
  if (host) return `http://${host}:4000/api`;
}
if (explicit) return explicit;           // EXPO_PUBLIC_API_BASE_URL
return null;                             // ← app cannot reach the API at all
```

In development this is genuinely clever — it follows whatever IP your laptop
has, so changing Wi-Fi doesn't break anything.

**In production it falls through to `EXPO_PUBLIC_API_BASE_URL`.** And here's
the trap: **Expo bakes env vars into the bundle at build time.** If you run
`eas build` without that variable set, you get an app that compiles fine,
installs fine, opens fine — and cannot reach the server at all. Every request
fails with "Could not reach the server."

You cannot fix that by setting the variable afterwards. You have to rebuild.
Section 7 covers where to set it.

---

# 6. Report Card

Grading the way you asked: what you'd be marked well for, what you got away
with, and what's missing.

## 6.1 Genuinely good — keep these

These are real engineering decisions, whether or not you made them
consciously:

1. **Every SQL query uses `$1, $2` placeholders.** SQL injection is
   structurally impossible in this codebase. This is the #1 thing student
   projects get wrong; yours is clean throughout.
2. **bcrypt at cost 12.** Correct algorithm, correct cost.
3. **Role checks live on the server, on every route.** Not just in the UI.
4. **`requireAuth` re-checks the database each request** — terminating an
   account takes effect immediately, and `role` can never be stale or forged.
5. **httpOnly cookie on web / secure-store on mobile.** Both correct for
   their platform; XSS can't read either.
6. **Private storage bucket + 10-minute signed URLs.** No file is publicly
   reachable, ever.
7. **Transactions around multi-table writes.** No half-finished states.
8. **Connection pool limits and statement timeouts.** A runaway query can't
   hang the server forever.
9. **Deny-by-default RLS posture** (Section 2.5).
10. **One API serving two clients** with a token scheme that works for both.
11. **TanStack Query with per-resource staleTimes** and cache clearing on
    logout.
12. **Mappers that strip `password_hash`** — secrets can't leak by accident.

## 6.2 Where you got away with it

Things that work but that you'd struggle to defend or debug:

**1. Documentation that is now actively wrong.**
This is the most dangerous item on the list, because you'll *trust* it.
- `CLAUDE.md` says `ProtectedRoute` does no server validation — **false**, it
  does (§4.2).
- `CLAUDE.md` says `map_facilities` has RLS disabled — **false**, it's
  enabled like everything else.
- `CLAUDE.md` says archive is localStorage-only — **false**, `/api/archive`
  routes and an `archive` table exist.
- `mobile/src/screens/vendor/HomeScreen.jsx` says *"`/applications` returns
  every application, so filter client-side"* — **false**, the server scopes
  vendors to their own rows. The client filter is now harmless redundancy,
  but the comment would lead you to believe there's a data leak.

Stale docs are worse than no docs. Fix or delete these.

**2. Scheduled work inside a GET route** (§3.5). Two full sweeps run on every
applications-list load.

**3. The schema isn't reproducible** (§2.6). 8 migrations, 20 tables, plus a
misleading `mysql-schema.sql` that would fail if run.

**4. A 3,000-line single-file backend.** Fine now; painful with a teammate.

**5. Two parallel upload systems** (§3.4).

**6. `ssl: { rejectUnauthorized: false }`** on the database pool. Disables
certificate verification. Common with Supabase's pooler and low-risk on a
trusted network path, but it does mean a man-in-the-middle wouldn't be
detected.

**7. localStorage-only inventory** (§4.4) — data that looks saved but isn't.

**8. Legacy `stallsStorage.ts`** still called by `SuperAdminDashboard.jsx`
alongside the real API — two sources of truth for stalls in one file.

**9. Project named `@figma/my-make-file`.** Cosmetic, but it's the name that
shows up in deploy dashboards and logs.

## 6.3 Must fix before you deploy

Ranked. The first two are non-negotiable.

| # | Issue | Risk |
|---|---|---|
| 1 | **`JWT_SECRET` is the literal string `use-a-new-long-random-secret`** | Anyone who has seen your repo or this default can forge a valid super-admin token against your live system. Total compromise. |
| 2 | **`sameSite: "lax"` cookie + separate API domain** | Web login will silently break in production (§7.4) |
| 3 | **No rate limiting on `/api/auth/login`** | Brute force + CPU exhaustion via bcrypt |
| 4 | **No password reset flow** | Real users *will* lock themselves out |
| 5 | **Gmail SMTP for confirmation emails** | ~500/day limit, and Gmail-sent mail to strangers often lands in spam. Your entire account-creation flow depends on these arriving. |
| 6 | **`API_PUBLIC_URL` is a Cloudflare tunnel that changes every run** | Confirmation links will point at a dead address |
| 7 | **No error tracking / structured logs** | You'll be debugging production blind |
| 8 | **Inventory feature loses data** | Ship it broken or remove it |
| 9 | **No schema baseline** | Cannot rebuild or create staging |
| 10 | **No `helmet`** | Missing standard security headers |

## 6.4 Missing entirely

- **Tests.** Zero. No unit, no integration, no end-to-end. Every deploy is a
  hope. You don't need 100% coverage — but ~10 tests over login, role checks,
  and application submission would catch most regressions.
- **CI.** No GitHub Actions. Nothing checks a PR before merge.
- **Backups.** Supabase free tier keeps limited backups. You have no
  exported copy of your own data.
- **A staging environment.** You will be testing in production.

---

# 7. Deployment

You said you're starting from zero — no domain, no hosting, no store
accounts. Here's the whole path.

## 7.1 What goes where

You have three deployable pieces plus the database:

| Piece | What it is | Where it goes | Cost |
|---|---|---|---|
| **Web app** | Static files (`dist/`) | **Vercel** or Netlify | Free |
| **Backend API** | Long-running Node process | **Render** or Railway | Free tier w/ caveats, ~$7/mo real |
| **Database + Storage** | Already exists | **Supabase** | Free tier w/ caveats, $25/mo Pro |
| **Mobile app** | `.apk` / `.aab` | **EAS Build** → direct download or Play Store | Free / $25 one-time |

**Why the API can't go on Vercel like the web app:** Vercel serves static
files and short-lived serverless functions. Your Express app is a
*continuously running process* holding a database connection pool. It needs a
host that runs a real server — Render, Railway, Fly.io.

### The free-tier caveats that will bite you

- **Render free web services sleep after ~15 minutes of no traffic.** The next
  request takes **~50 seconds** to wake it. Users will think the app is
  broken. For a demo this is survivable; for real use, pay the $7.
- **Supabase free projects pause after ~1 week of inactivity.** You have to
  manually un-pause them in the dashboard. If your defence is on a Monday and
  nobody touched it since the previous Sunday, the database will be asleep.

**My honest recommendation:** free tier for building and testing, then before
any real demo or handover, pay for one month of Render ($7). It removes the
single most embarrassing failure mode.

## 7.2 Domains

You don't need one to start — Vercel gives you `yourapp.vercel.app` and
Render gives you `yourapi.onrender.com`. Both are HTTPS. Everything works.

When you do want one: **Cloudflare Registrar** (sells at cost, ~$10/yr) or
Namecheap. Then:

```
pubmark.example        → Vercel   (web app)
api.pubmark.example    → Render   (backend)
```

Both hosts walk you through adding the DNS records.

## 7.3 Environment variables — the complete list

Env vars are how you tell each deployed piece its configuration without
committing secrets. **Never commit a `.env` file.** Yours are correctly
gitignored.

### Backend (Render/Railway → Environment tab)

```bash
NODE_ENV=production                    # ← currently never set; enables secure cookies
PORT=4000                              # host usually overrides this
DATABASE_URL=postgresql://...          # from Supabase → Settings → Database
JWT_SECRET=<generate a new one>        # see below
CLIENT_ORIGIN=https://pubmark.example  # your real web app URL, no trailing slash
SUPABASE_URL=https://mkdk....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # master key — backend only, never client
GOOGLE_CLIENT_ID=635844852444-6r6f...apps.googleusercontent.com
API_PUBLIC_URL=https://api.pubmark.example   # for confirmation email links
GMAIL_USER=pubmark214@gmail.com
GMAIL_APP_PASSWORD=<app password>
```

**Generate a real JWT secret now:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Note: changing it invalidates every existing session — everyone gets logged
out once. Do it before launch, not after.

### Web app (Vercel → Environment Variables)

```bash
VITE_API_BASE_URL=https://api.pubmark.example/api
VITE_GOOGLE_CLIENT_ID=635844852444-6r6f...apps.googleusercontent.com
```

Vite bakes `VITE_*` vars in **at build time** — change one, you must redeploy.

### Mobile (EAS → `eas.json` or `eas secret`)

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.pubmark.example/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=635844852444-6r6f...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=635844852444-j0si...apps.googleusercontent.com
```

Also baked in at build time (§5.4). Put them in `eas.json` under a
`production` profile's `env` block.

## 7.4 The cookie problem — read this twice

**This will cost you a day if you don't know it in advance.**

Your session cookie is created with:

```js
{ httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }
```

`sameSite: "lax"` means: *the browser will not send this cookie on requests to
a different site.*

In development everything is `localhost` — same site, cookie sent, works.

In production, `pubmark.vercel.app` calling `api.onrender.com` is a
**cross-site** request. The browser will:
- accept the cookie on login (you'll see login "succeed")
- then **refuse to send it** on every subsequent request
- so every API call returns 401 and the app bounces you back to login

The symptom is maddening: *"login works but I get logged out immediately."*

### Two ways to fix it

**Option A — put them on the same site (recommended).**
Host the web app on Vercel and add a rewrite so `/api/*` is proxied to your
backend. Then the browser only ever sees one origin.

`vercel.json` in your repo root:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.pubmark.example/api/:path*" }
  ]
}
```

Then set `VITE_API_BASE_URL=/api` (a relative path). Same-site, `lax` works,
nothing else changes.

**Option B — allow cross-site cookies explicitly.**
In `server/src/index.js`:

```js
function cookieOptions() {
  const crossSite = process.env.COOKIE_CROSS_SITE === "true";
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite || process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  };
}
```

`sameSite: "none"` **requires** `secure: true`, which requires HTTPS. Both
Vercel and Render give you HTTPS, so that's fine. Then set
`COOKIE_CROSS_SITE=true` in the backend environment.

Also confirm CORS: you already use `credentials: true` with an explicit
origin list. That's correct — with credentials you may **never** use a `*`
wildcard origin, and you don't.

**One more thing:** your CORS also allows *any* localhost origin
(`isLocalDevOrigin`). Harmless in dev; in production it means a page running
on someone's own machine could make authenticated requests against your live
API. Gate it:

```js
if (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin)) return callback(null, true);
```

## 7.5 Google Sign-In in production

Your Google Cloud OAuth client currently only authorizes `http://localhost:5173`.
Add your real domain, or Google sign-in fails on the live site with
*"The given origin is not allowed for the given client ID."*

**Google Cloud Console → APIs & Services → Credentials → your Web client:**
- Authorized JavaScript origins: `https://pubmark.example`
- (No redirect URI needed — you use the ID-token flow, not a redirect flow.)

Changes can take a few minutes to propagate. Also: your OAuth consent screen
is in **Testing** mode, which limits sign-in to explicitly listed test users
and expires tokens after 7 days. For real users you must **Publish** it
(Google Auth Platform → Audience → Publish app).

The Android OAuth client is tied to the **SHA-1 of the signing key**. Your
current one matches the EAS *development* keystore. A production build signed
with a different key needs that key's SHA-1 added too:

```bash
cd mobile && npx eas-cli credentials
```

## 7.6 Email — plan to move off Gmail

Your entire account-creation flow depends on confirmation emails arriving.
Gmail SMTP will:
- cap you around 500 recipients/day
- frequently land in spam for recipients who've never emailed you
- risk the account being flagged for "unusual activity"

For a school demo it's fine. For real deployment, move to a transactional
provider — **Resend** (3,000 emails/month free) or **Postmark**. Both need
you to verify a domain (add DNS records), which is also what makes your mail
*not* land in spam. It's a `nodemailer` config swap; the rest of your code
doesn't change.

## 7.7 Deployment order

Do it in this order — each step depends on the one before.

1. **Fix the blockers first** (§6.3 items 1–2, plus §7.4). Don't deploy
   known-broken auth.
2. **Supabase** — already live. Confirm it's not paused. Copy the connection
   string.
3. **Backend to Render:**
   - New → Web Service → connect your GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add every env var from §7.3
   - Deploy → note the URL (`https://xxx.onrender.com`)
   - **Verify:** open `https://xxx.onrender.com/api/stalls` in a browser. You
     should get JSON (an empty array is fine). If you get an error page, read
     the Render logs before continuing.
4. **Web app to Vercel:**
   - New Project → import repo
   - Framework: Vite. Build: `npm run build`. Output: `dist`
   - Add `VITE_*` env vars
   - Add `vercel.json` rewrite if using Option A
   - Deploy
5. **Update the backend's `CLIENT_ORIGIN`** to the Vercel URL, redeploy.
6. **Google Console** — add the production origin (§7.5).
7. **Test the web app end to end**: login, create a stall, submit an
   application, upload a permit, sign in with Google.
8. **Mobile production build:**
   ```bash
   cd mobile
   npx eas-cli build --profile production --platform android
   ```
   with `EXPO_PUBLIC_API_BASE_URL` pointing at the live API. Install the APK
   and verify it reaches production, not your laptop.

## 7.8 Bugs you will hit — with fixes

Written so you can search this table at 2am.

| Symptom | Cause | Fix |
|---|---|---|
| Login succeeds, then every page bounces to login | `sameSite: lax` cross-site cookie | §7.4 |
| Console: *"blocked by CORS policy"* | `CLIENT_ORIGIN` doesn't exactly match, or has a trailing slash | Match the origin character-for-character, no trailing `/` |
| First request of the day takes ~50s | Render free tier cold start | Upgrade, or ping it every 10 min |
| *"Could not reach the server"* on mobile only | `EXPO_PUBLIC_API_BASE_URL` missing at build time | Rebuild with the var set (§5.4) |
| Google button: *"origin is not allowed"* | Production domain not in Google Console | §7.5 |
| Google sign-in worked, now fails after a week | OAuth consent screen still in Testing mode | Publish the app |
| Confirmation emails never arrive | Gmail limits / spam / stale `API_PUBLIC_URL` | §7.6, and set a real `API_PUBLIC_URL` |
| Confirmation link 404s or points at a dead tunnel | `API_PUBLIC_URL` still the Cloudflare tunnel | Set it to your live API domain |
| Images/permits show a name but won't open | Signed URL expired (10 min) — page left open too long | Refresh the page; consider raising `SIGNED_URL_TTL_SECONDS` |
| `413 Payload Too Large` on upload | Host body limit below your 10 MB | Raise host limit, or move that flow to signed direct upload (§3.4) |
| Everything 500s, logs mention connections | Supabase pooler connection cap | Lower pool `max`, ensure only one instance |
| Database "paused" / all queries fail | Supabase free project auto-paused | Un-pause in dashboard; upgrade to avoid |
| Site loads but all API calls fail with mixed-content | Web app on HTTPS calling an HTTP API | API must be HTTPS |
| Dates land one day off | Timezone: `date` columns vs. server locale | Compare dates as `YYYY-MM-DD` strings, not `Date` objects |

## 7.9 After you're live

- **Turn on error tracking.** Sentry's free tier takes ~20 minutes to add
  and turns "it broke" into a stack trace with the user's request.
- **Take a database backup before every risky change:**
  ```bash
  npx supabase db dump --db-url "<DATABASE_URL>" -f backup-$(date +%F).sql
  ```
  Keep these somewhere that isn't your laptop. Note they contain real emails
  and password hashes — your `.gitignore` already excludes `dumps/`.
- **Watch your host's logs** for the first few days. Most problems announce
  themselves there before a user reports them.
- **Write down your rollback plan.** On Vercel and Render that's "redeploy
  the previous commit" — but know where the button is *before* you need it.

---

## Final word

The system is more solid than "vibe-coded" usually implies. The security
fundamentals — parameterized queries, server-side role enforcement, proper
password hashing, private file storage — are the hard things to retrofit, and
they're already right.

What's missing is the operational layer: tests, monitoring, reproducible
schema, and a few production-specific settings. That's normal for a project
at this stage, and all of it is learnable in the order this handbook lays out.

The two things that would genuinely hurt you if ignored: **the JWT secret**
and **the cookie setting**. Everything else you can fix while live.

---

# Appendix A — The Fix List

Nothing here has been applied. Each item is written so you can do it
yourself, in order, when you're ready. Estimated total: ~2 hours.

---

## A1. Replace the JWT secret 🔴 *blocker · 2 min*

**Problem:** `server/.env` currently has
`JWT_SECRET=use-a-new-long-random-secret` — a placeholder. Anyone who knows
it can forge a super-admin token.

**Generate one:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Put it in two places:**
- `server/.env` → `JWT_SECRET=<the new value>` (local)
- Your host's Environment tab (Render/Railway) → same key, same value

**Side effect:** every signed-in user is logged out once. Do it before
launch, not after.

---

## A2. Fix the production cookie 🔴 *blocker · 10 min*

**Problem:** `sameSite: "lax"` stops the browser sending your session cookie
to a different domain. Web login breaks in production (§7.4).

**File:** `server/src/index.js`, ~line 292

**Now:**
```js
function cookieOptions() { return { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }; }
```

**Change to:**
```js
// When the web app and this API live on different domains (the normal
// production setup), the browser will refuse to send a `lax` cookie
// cross-site — login appears to work, then every request 401s. `none`
// permits it, and requires `secure`, which requires HTTPS.
function cookieOptions() {
  const crossSite = process.env.COOKIE_CROSS_SITE === "true";
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite || process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  };
}
```

**Then set on the host:** `COOKIE_CROSS_SITE=true`

*Skip this entirely if you use the Vercel rewrite approach in §7.4 Option A —
same-domain means `lax` keeps working.*

---

## A3. Set `NODE_ENV=production` 🔴 *blocker · 1 min*

**Problem:** never set anywhere, so `secure` cookies stay off even on HTTPS.

**Fix:** add `NODE_ENV=production` to your host's environment variables.
Nothing to change in code.

---

## A4. Rate-limit the login route 🟠 *high · 15 min*

**Problem:** nothing stops unlimited login attempts. bcrypt is deliberately
slow, so a flood also burns your CPU.

```bash
cd server && npm install express-rate-limit
```

**File:** `server/src/index.js`

Add near the other imports:
```js
import rateLimit from "express-rate-limit";
```

Add above the auth routes (~line 820):
```js
// Brute-force guard. bcrypt is slow on purpose, so an unlimited flood of
// guesses is both a credential risk and a CPU exhaustion risk.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                     // per IP, per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in a few minutes." },
});
```

Then apply it to the three credential endpoints:
```js
app.post("/api/auth/login", authLimiter, async (req, res, next) => {
app.post("/api/auth/register", authLimiter, async (req, res, next) => {
app.post("/api/auth/google/login", authLimiter, async (req, res, next) => {
```

**Note:** on Render/Railway your app sits behind a proxy, so add this once
near the top of the file or every request looks like it comes from the same
IP:
```js
app.set("trust proxy", 1);
```

---

## A5. Stop allowing localhost origins in production 🟠 *high · 5 min*

**Problem:** CORS currently waves through *any* localhost origin. In
production that lets a page on someone's own machine make authenticated
requests to your live API.

**File:** `server/src/index.js`, ~line 283

**Now:**
```js
if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) return callback(null, true);
```

**Change to:**
```js
const allowLocalhost = process.env.NODE_ENV !== "production";
if (!origin || allowedOrigins.has(origin) || (allowLocalhost && isLocalDevOrigin(origin))) {
  return callback(null, true);
}
```

---

## A6. Add security headers 🟡 *medium · 5 min*

```bash
cd server && npm install helmet
```

**File:** `server/src/index.js`

```js
import helmet from "helmet";
```

Add **above** the `cors()` line:
```js
// Standard hardening headers: HSTS, X-Content-Type-Options, frame denial
// (clickjacking), and friends. crossOriginResourcePolicy is relaxed because
// signed Storage URLs are fetched from a different origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
```

---

## A7. Add a health check endpoint 🟡 *medium · 3 min*

**Why:** hosts use it to tell whether your app is alive, and you can hit it to
confirm a deploy worked without logging in.

**File:** `server/src/index.js`, near the other routes:

```js
// Liveness probe for the host and for post-deploy smoke checks. Also
// confirms the database is actually reachable, not just that Node booted.
app.get("/api/healthz", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});
```

Point Render's Health Check Path at `/api/healthz`.

---

## A8. Create a schema baseline 🟠 *high · 20 min*

**Problem:** 8 migration files, 20 tables. Your core schema exists nowhere as
code — you cannot rebuild the database (§2.6).

```bash
npx supabase db dump --db-url "<your DATABASE_URL>" --schema public -f server/migrations/000-baseline-schema.sql
```

Commit that file. Then delete the misleading leftover:

```bash
git rm server/mysql-schema.sql
```

*(It's MySQL syntax from before the Postgres migration. Running it against
Postgres fails — and anyone who finds it will assume it's the real schema.)*

---

## A9. Correct the stale documentation 🟠 *high · 15 min*

Four claims in your docs are now false and will mislead you (§6.2 item 1).

**`CLAUDE.md`:**

| Says | Reality | Action |
|---|---|---|
| Gotcha #2 — `ProtectedRoute` checks only a cached profile, no server validation | `AuthContext` calls `GET /api/auth/me` on mount and gates on real status | Rewrite or delete the gotcha |
| Gotcha #8 — `map_facilities` has RLS disabled | RLS is enabled on all 21 tables | Delete the gotcha; replace with the §2.5 explanation of why "enabled, no policies" is correct here |
| Archive is `localStorage`-only | `/api/archive` routes and an `archive` table exist | Move archive to the Postgres-backed list; **inventory is the only localStorage feature left** |

**`mobile/src/screens/vendor/HomeScreen.jsx`** (~line 60):

```js
// The /applications endpoint returns every application; a vendor should only
// ever see their own, so filter client-side by the logged-in user's id.
```

The server *does* scope vendors to their own rows. Replace with:

```js
// The server already scopes vendors to their own applications; this filter
// is belt-and-braces for the shared cache, not a security boundary.
```

---

## A10. Move the expiry sweeps out of the read route 🟡 *medium · 30 min*

**Problem:** `GET /api/applications` runs two full table sweeps before
returning data, on every single load (§3.5).

**File:** `server/src/index.js`, ~line 2202

**Remove these two lines from the route:**
```js
await autoTerminateExpiredPermitDeadlines();
await autoTerminateExpiredContracts();
```

**Add a protected task endpoint instead:**
```js
// Scheduled maintenance, triggered by an external cron rather than by user
// traffic — these sweeps scan every approved application and have nothing to
// do with answering a read request.
app.post("/api/tasks/expire", async (req, res, next) => {
  if (req.headers["x-task-key"] !== process.env.TASK_KEY) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  try {
    await autoTerminateExpiredPermitDeadlines();
    await autoTerminateExpiredContracts();
    res.json({ ok: true });
  } catch (error) { next(error); }
});
```

Set `TASK_KEY` to a random string (same generator as A1), then schedule it
hourly — Render Cron Jobs, Railway cron, or free [cron-job.org](https://cron-job.org):

```
POST https://api.pubmark.example/api/tasks/expire
Header: x-task-key: <TASK_KEY>
```

---

## A11. Decide what to do about inventory 🟠 *high · varies*

**Problem:** the inventory feature writes to one browser's `localStorage`. It
is not on the server, not shared between users, and permanently lost when
browser data is cleared. An empty `inventory_items` table exists but has no
API routes.

Pick one:

- **Remove it** *(~20 min)* — delete the Inventory nav item and page. Honest,
  and reversible later.
- **Finish it** *(~2 h)* — add `GET/POST/PATCH/DELETE /api/inventory` following
  the pattern of any existing resource, then swap `inventoryStore.ts` from
  `localStorage` to `apiFetch`. The table is already there.

**Do not ship it as-is.** A super-admin will enter real stock data and lose it.

---

## A12. Add a password reset flow 🟠 *high · ~3 h*

**Problem:** there is no forgot-password path. A locked-out user needs an
admin to reset them manually.

You already have every piece needed — the `pending_user_creations` table
demonstrates the exact pattern (hashed token, expiry, emailed link):

1. `POST /api/auth/forgot-password` — look up the email; **always reply 200**
   whether or not it exists (never reveal which emails are registered); if it
   exists, store a SHA-256-hashed token with a 1-hour expiry and email the link
2. `GET /api/auth/reset-password?token=…` — validate, show the form
3. `POST /api/auth/reset-password` — validate again, `bcrypt.hash` the new
   password, update `profiles`, delete the token

Reuse `sendUserConfirmationEmail` as the template.

---

## A13. Move off Gmail SMTP 🟡 *medium · 1 h*

**Problem:** ~500/day cap, frequent spam-foldering, and your whole signup flow
depends on delivery (§7.6).

**Fix:** sign up for [Resend](https://resend.com) (3,000/month free), verify
your domain via the DNS records they give you, then swap the transport:

```js
const mailer = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: { user: "resend", pass: process.env.RESEND_API_KEY },
});
```

Everything else about your email code stays the same. Domain verification is
what actually keeps mail out of spam.

---

## A14. Add error tracking 🟡 *medium · 20 min*

**Problem:** `console.error` only. When a user reports a bug you have nothing
to look at.

```bash
cd server && npm install @sentry/node
```

Free tier is generous. Initialize at the top of `index.js`, and report inside
your existing error handler:

```js
app.use((error, _req, res, _next) => {
  console.error(error);
  Sentry.captureException(error);   // ← add
  ...
```

---

## A15. Write a handful of tests 🟢 *nice to have · 3 h*

Zero tests today. You don't need coverage — you need a smoke net. The five
that would catch the most:

1. Login with correct credentials returns a token
2. Login with wrong password returns 401
3. A vendor calling an admin-only route gets 403
4. `GET /api/applications` as a vendor returns only that vendor's rows
5. Creating an application with a missing field returns 400

`node:test` is built into Node — no framework needed:

```bash
node --test server/tests/
```

---

## Suggested order

**Before you deploy at all:**
A1 → A2 → A3 → A8 → A11

**Before real users touch it:**
A4 → A5 → A9 → A12

**First week live:**
A6 → A7 → A10 → A13 → A14

**When you have breathing room:**
A15, plus splitting `index.js` into route modules.

---

# Appendix B — Developer Guide

How to actually work on this project: starting it up, adding features,
debugging, and what to do next.

---

## B1. Starting everything up

### Web + backend (one command)

```bash
npm run dev
```

From the repo root. This runs three things at once, colour-coded in your
terminal:

| Colour | What | Where |
|---|---|---|
| blue | Vite (web app) | http://localhost:5173 |
| green | Express (API) | http://localhost:4000 |
| magenta | Cloudflare tunnel | random public URL |

**What the tunnel is for:** it gives your local machine a temporary public
HTTPS address so confirmation-email links work while developing. The URL
changes every run — `server/start-with-tunnel.js` rewrites `API_PUBLIC_URL`
in `server/.env` automatically before the server boots.

If you don't need email links, skip it:
```bash
npm run dev:web                      # web only
cd server && npm run dev:no-tunnel   # API only, auto-restarts on save
```

### Mobile

```bash
cd mobile
npx expo start --dev-client
```

**`--dev-client` is required.** Plain `npx expo start` targets Expo Go, which
can no longer run this app (Google Sign-In needs compiled native code — §5.3).

Your laptop and phone must be on the **same Wi-Fi**. The app finds the API
automatically from whatever host Metro is served on (§5.4).

### Demo accounts

```bash
cd server && npm run seed
```

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@pubmark.com | super123 |
| Admin | admin@pubmark.com | admin123 |
| Vendor | juan@example.com | user123 |
| Officer | officer@pubmark.com | officer123 |

---

## B2. Command reference

**Root (web + backend)**
```bash
npm run dev              # everything: web + API + tunnel
npm run dev:web          # Vite only
npm run dev:server       # API only (with tunnel)
npm run build            # production build → dist/
```

**Backend** (`cd server`)
```bash
npm run dev              # with tunnel
npm run dev:no-tunnel    # no tunnel, --watch auto-restart
npm start                # production mode
npm run seed             # create demo accounts
```

**Mobile** (`cd mobile`) — also in `mobile/COMMANDS.txt`
```bash
npx expo start --dev-client                                   # daily driver
npx eas-cli build --profile development --platform android    # rebuild dev client
npx eas-cli build --profile production --platform android     # release build
npx eas-cli whoami                                            # which Expo account
npm install                                                   # after pulling changes
```

**Database**
```bash
# Backup (do this before anything risky)
npx supabase db dump --db-url "<DATABASE_URL>" -f backup-$(date +%F).sql
```

---

## B3. How to add a feature (the recipe)

Every feature in this codebase follows the same 5 layers. Adding a
"maintenance requests" feature would look like this — swap the names for
whatever you're building.

### Layer 1 — Database

Create `server/migrations/2026-09-15-maintenance-requests.sql`:

```sql
CREATE TABLE maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id uuid NOT NULL REFERENCES stalls(id),
  requested_by uuid NOT NULL REFERENCES profiles(id),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON maintenance_requests (stall_id);
```

Apply it in the Supabase SQL editor **and** commit the file. Both — the file
alone doesn't change anything, and applying alone leaves no record.

### Layer 2 — Backend route

In `server/src/index.js`:

```js
// Static paths BEFORE :id paths, always (§3.3)
app.get("/api/maintenance", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, s.stall_name, p.name AS requester_name
      FROM maintenance_requests m
      LEFT JOIN stalls s ON m.stall_id = s.id
      LEFT JOIN profiles p ON m.requested_by = p.id
      ORDER BY m.created_at DESC
    `);
    res.json({ requests: rows.map(mapMaintenanceRow) });
  } catch (error) { next(error); }
});
```

Non-negotiables:
- `$1, $2` placeholders for **every** value from the client
- `requireAuth` + `requireRole` on anything not deliberately public
- a mapper that converts snake_case → camelCase and omits anything secret

### Layer 3 — API client

`src/app/services/api.js` (web) and `mobile/src/services/api.js` (mobile) —
same function, both files:

```js
export async function getMaintenanceRequests() {
  return apiFetch("/maintenance");
}
```

### Layer 4 — Data hook

If more than one screen needs it, make it a shared TanStack Query hook so
they share one cache (§4.3). `src/app/hooks/useMaintenance.js`:

```js
export const MAINTENANCE_QUERY_KEY = ["maintenance"];

export function useMaintenance() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: MAINTENANCE_QUERY_KEY,
    queryFn: getMaintenanceRequests,
    staleTime: 15_000,   // workflow data — see §4.3 for the convention
  });
  return { data, loading: isLoading, error: error?.message ?? null, refetch };
}
```

### Layer 5 — UI

**Web:** create the page in `src/app/pages/`, register the route in
`src/app/routes.jsx` wrapped in `<ProtectedRoute role={...}>`, and add the
nav item in `src/app/components/DashboardLayout.jsx`.

**Mobile:** create the screen in `mobile/src/screens/<role>/`, register it in
`mobile/src/navigation/RootNavigator.jsx`.

### Then test it as every role

The habit worth building: after any change, log in as **vendor, officer,
admin, and super-admin** and check each one sees exactly what they should.
Most bugs in a role-based app are "this button appears for the wrong person."

---

## B4. Debugging — where to look

| Symptom | Look here first |
|---|---|
| Web page is blank | Browser DevTools → Console. Usually a JS error in the component. |
| Button does nothing | Console. Then check the Network tab for the request. |
| Request returns 500 | **The server terminal.** Full stack trace is printed there, not in the browser. |
| Request returns 401 | Token expired (8h), or you're signed out. Log in again. If it persists in production → §7.4. |
| Request returns 403 | Role check. You're logged in as the wrong role for that route. |
| Data doesn't update after saving | TanStack Query cache. You need `queryClient.invalidateQueries({ queryKey: [...] })` after the mutation, or the screen shows stale cached data until `staleTime` lapses. |
| Mobile: "Could not reach the server" | Same Wi-Fi? API actually running? Try the API URL in the phone's browser. |
| Mobile: red error about a native module | You added a native package — needs `eas build`, not just a reload (§5.3). |
| Map shows nothing | No stalls in the DB, or wrong floor selected. Check `/api/stalls` returns data. |
| Uploaded file won't open | Signed URL expired (10 min). Refresh the page. |
| "Origin not allowed" on Google button | Google Cloud Console origins (§7.5). |

**The single most useful habit:** keep the server terminal visible while you
work. Almost every backend problem announces itself there before you see it
in the UI.

---

## B5. Git workflow

You're currently on `Mobile-Version` with `main` as the base.

```bash
git checkout -b feature/maintenance-requests    # branch per feature
# ... work ...
git add <specific files>                        # not `git add .`
git commit -m "Add maintenance request tracking"
git push -u origin feature/maintenance-requests
# open a PR on GitHub, merge into main
```

Rules worth keeping:
- **Never commit `.env` files.** Your `.gitignore` covers them — don't
  override it.
- **Stage specific files**, not `git add .` — that's how secrets and stray
  dumps get committed by accident.
- **Check `git status` before committing.** If something unexpected is
  listed, look at it before it becomes permanent history.

---

## B6. What to do next — a realistic roadmap

### This week — make it deployable

1. **A1, A2, A3** — JWT secret, cookie config, `NODE_ENV`. ~15 minutes,
   removes both blockers.
2. **A8** — dump the schema baseline. Now your database is reproducible.
3. **A11** — decide on inventory. Removing it is 20 minutes and honest.
4. **Deploy to free tiers** (§7.7) and get it working end to end. Expect the
   bugs in §7.8 — that table exists so you can look them up instead of
   guessing.

**Goal: a working public URL you can send to someone.** Everything after this
is improvement; this is the milestone that matters.

### Next week — make it safe for real users

5. **A4, A5** — rate limiting, CORS gate.
6. **A9** — correct the stale docs, before they mislead you again.
7. **A12** — password reset. The first real user who forgets their password
   will need it.
8. **A13** — move off Gmail if real people will be receiving these emails.

### The week after — make it maintainable

9. **A6, A7, A10, A14** — headers, health check, cron job, error tracking.
10. **A15** — five tests. Not for coverage; so you find out when you break
    login.
11. **Split `server/src/index.js`** into `routes/auth.js`, `routes/stalls.js`,
    etc. Do this when you have a working deploy and tests, never before.

### Ongoing

- Back up the database before anything risky.
- When you add a feature, follow the B3 recipe — the consistency is what
  keeps this maintainable as it grows.
- When something in this handbook turns out to be wrong, **fix the handbook.**
  Stale docs caused four of the problems in §6.2; don't create the fifth.

---

## B7. If you're handing this to someone else

Give them, in this order:

1. This handbook — §1 first, then §2–5 for whichever part they're touching
2. `CLAUDE.md` — **after** applying A9, or it will actively mislead them
3. `mobile/COMMANDS.txt` — the mobile day-to-day
4. A `.env` file **sent privately**, never through the repo

Then have them run `npm run dev` and `npm run seed`, and log in as each of
the four demo accounts. If they can do that, they're set up correctly.

---

# Appendix C — How Your System Actually Works

Section 3 explained the backend's *plumbing* — middleware, routing, uploads.
This appendix explains the **business processes**: what actually happens,
step by step, across the seven workflows your system runs.

These are the parts nobody could guess by reading a file list. Read this one
slowly.

---

## C1. Creating an account (the two-step dance)

There are **two completely different ways** an account gets created, and
knowing which is which explains a lot of the code.

### Path 1 — Vendor signs up themselves

`POST /api/auth/register` → a row goes straight into `profiles`, they're
logged in immediately. Simple.

### Path 2 — An admin creates the account (the interesting one)

When a super-admin uses "Create User", **nothing is written to `profiles`.**
Instead:

```
Admin fills form
      │
      ▼
POST /api/users
      │
      ├─► bcrypt-hash the password
      ├─► generate a random token:  crypto.randomBytes(32)
      ├─► store only the SHA-256 HASH of that token
      ├─► INSERT INTO pending_user_creations  (expires in 24h)
      └─► email the RAW token as a link
                │
                ▼
      User clicks the link
                │
                ▼
      GET /api/auth/confirm-user?token=abc123
                │
                ├─► SHA-256 the incoming token
                ├─► find the pending row by that hash, check not expired
                ├─► INSERT INTO profiles         ← account exists now
                └─► DELETE the pending row       ← link can't be reused
```

**Why store a hash instead of the token?** Same reason as passwords. If
someone dumps your `pending_user_creations` table, they get hashes — useless
for clicking the link. Only the email recipient ever holds the real token.

**Why the 24-hour expiry?** Limits the damage of a forwarded or leaked email.

**Why delete the row on confirm?** The link becomes single-use. Clicking it
twice does nothing the second time.

This is genuinely well-built security. The Google signup flow (§1.3) reuses
this exact table — with `created_by = NULL` to mark "self-service, no admin
behind it."

**The catch:** this whole flow is only as reliable as your email delivery. If
the email doesn't arrive, the account simply never exists — the user is stuck
with no way forward. That's why §7.6 (moving off Gmail) matters more than it
looks.

---

## C2. The stall application lifecycle — the heart of your system

This is the longest journey in the app. Follow it all the way.

```
   [ Vendor browses map, taps a vacant stall ]
                    │
                    ▼
        POST /api/applications
        status = 'pending'
        (permit optional at this stage)
                    │
                    ▼
        ┌───────────────────────┐
        │   Admin reviews it    │
        └───────┬───────────────┘
                │
      ┌─────────┴─────────┐
      ▼                   ▼
  APPROVED             REJECTED
  approved_at = NOW    rejected_at = NOW
      │                   │
      │                   └──► stall returns to 'vacant'
      ▼
  syncStallOccupancy() → stall becomes 'occupied'
      │
      ├──────────────────────────────────────┐
      │                                      │
      ▼                                      ▼
  No permit on file?              Permit already uploaded
      │                                      │
      ▼                                      │
  Admin may set a permit deadline            │
      │                                      │
      ├── vendor uploads in time ────────────┤
      │                                      │
      └── deadline passes, still none        │
              │                              │
              ▼                              ▼
        AUTO-TERMINATED              Contract runs to contract_end
        status → 'rejected'                  │
                                             ▼
                                    Renewal window opens
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                    Vendor requests renewal          Nobody does anything
                              │                             │
                    Admin approves/rejects                  ▼
                              │                    AUTO-TERMINATED after
                              ▼                    contract_end + 7 days
                    contract_end extended                    │
                                                             ▼
                                                  syncStallOccupancy()
                                                  stall → 'vacant'
```

### The four ways an application can end

Worth knowing, because your UI distinguishes them:

| Ending | What sets it | How you can tell |
|---|---|---|
| Admin rejects it | `PATCH /api/applications/:id` | `rejected_at` is set |
| Permit deadline missed | `autoTerminateExpiredPermitDeadlines()` | `rejected_at` is **null**, remarks mention the permit |
| Contract expired unrenewed | `autoTerminateExpiredContracts()` | `contract_terminated_at` is set |
| Vendor requests termination | `POST /api/termination-requests` → admin approves | a `termination_requests` row exists |

Notice the deliberate design: **the auto-termination paths do not set
`rejected_at`.** That's how the mobile tracking timeline can show "your
contract expired" differently from "an admin rejected you." Small detail,
genuinely thoughtful.

---

## C3. Stall occupancy — derived state, not stored state

This one caused a real bug you already fixed, and the lesson generalises.

A stall's `status` column can be `vacant`, `occupied`, or `unavailable`. But
"occupied" isn't a fact someone types in — it's a **consequence** of whether
an approved application exists.

```js
async function syncStallOccupancy(stallId, client = db) {
  const { rows } = await client.query(
    "SELECT 1 FROM applications WHERE stall_id = $1 AND status = 'approved' LIMIT 1",
    [stallId]
  );
  await client.query(
    "UPDATE stalls SET status = $1 WHERE id = $2 AND status <> 'unavailable'",
    [rows.length > 0 ? "occupied" : "vacant", stallId]
  );
}
```

Read the second query carefully — `AND status <> 'unavailable'`. That clause
means: *if an admin manually marked this stall unavailable (under renovation,
say), never overwrite that.* Manual intent beats derived state. Good.

**This function must be called every time occupancy could change**, and it is:
admin approve/reject, both auto-termination sweeps, deleting an application,
and the vendor-termination path.

**The lesson:** when one column's value is *derived* from other tables, you
have two choices —
1. **Compute it live every time** (always correct, slower)
2. **Store it and keep it synced** (fast, but wrong the moment you forget a
   sync point)

You chose (2), which is why the bug happened: a sync point was missed, and
stalls showed "vacant" while occupied. If you add a new way for applications
to change status, **you must call `syncStallOccupancy` there too.** Write that
on a sticky note.

---

## C4. The permit deadline mechanism — and the hack inside it

This is the most instructive piece of code in your backend, because it works
*and* it's the wrong approach, and the two are connected.

### What it does

When an admin approves an application with no permit, they can set a deadline.
If the deadline passes with no permit, the application is auto-terminated.

### How it's stored — this is the hack

There is **no `permit_deadline_at` column.** The deadline is hidden inside the
free-text `admin_remarks` field using marker syntax:

```
[[PM_PERMIT_DEADLINE:2026-09-20T10:00:00.000Z]]
[[PM_PERMIT_DEADLINE_UPDATED:2026-09-15T08:30:00.000Z]]
Please submit your business permit before the deadline.
```

Two functions handle it:
- `buildPermitMetaRemarks()` — writes the markers in
- `parsePermitMeta()` — regex-extracts them and strips them out, so the
  vendor only sees the human sentence

### Why this is clever

It shipped a feature without a schema migration. No table change, no
downtime, no coordination. That's a real advantage under time pressure.

### Why it's the wrong approach

**1. The database can't query it.** This is a text field, so you cannot write:

```sql
-- IMPOSSIBLE with the current design
SELECT * FROM applications WHERE permit_deadline_at < NOW();
```

**2. Which forces the slow code in §3.5.** Look at what
`autoTerminateExpiredPermitDeadlines()` has to do instead:

```js
const { rows } = await db.query("SELECT ... FROM applications WHERE status = 'approved'");
for (const row of rows) {
  const meta = parsePermitMeta(row.admin_remarks || "");   // regex, in Node
  ...
}
```

It loads **every approved application** into Node and regex-parses each one —
because Postgres can't help. With 25 applications that's invisible. With
2,000 it's a serious problem. **And this runs on every applications-list
page load.**

So the storage hack directly causes the performance issue. They're the same
bug wearing two hats.

**3. It's fragile.** If an admin types `[[PM_PERMIT_DEADLINE:` into their
remarks, the parser reads it as real data. No validation prevents this.

**4. It can't be indexed**, sorted, or reported on.

### The proper fix (~1 hour, do it after deploying)

```sql
ALTER TABLE applications
  ADD COLUMN permit_deadline_at timestamptz,
  ADD COLUMN permit_terminated_at timestamptz;

CREATE INDEX ON applications (permit_deadline_at)
  WHERE status = 'approved' AND permit_path IS NULL;
```

Then backfill from the existing markers, and the whole sweep collapses into
one indexed query:

```sql
UPDATE applications SET status = 'rejected', permit_terminated_at = NOW()
WHERE status = 'approved' AND permit_path IS NULL
  AND permit_deadline_at < NOW() AND permit_terminated_at IS NULL;
```

**The general lesson:** stuffing structured data into a text column always
feels faster today. The bill arrives as a query you can't write.

---

## C5. Inspections and violations — a three-table workflow

Your enforcement side has three related concepts that are easy to confuse.

| Table | What it means | Who creates it |
|---|---|---|
| `check_requests` | "Officer, go inspect this stall" | Admin |
| `violation_requests` | "Officer, go investigate a suspected violation" | Admin |
| `violations` | An actual recorded offence | Officer (or admin) |

```
  Admin sees a problem or wants a routine check
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
  check_requests           violation_requests
  (routine inspection)     (suspected violation)
        │                        │
        │  assigned to officer   │
        ▼                        ▼
  Officer opens the mobile app, Checks tab
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
  "Submit Report & Complete"   "Report Violation"
        │                        │
        │                        ▼
        │                  INSERT INTO violations
        │                  status = 'open'
        │                        │
        │                        ├──► violation_evidence rows
        │                        │    (photos → Storage, path in DB)
        ▼                        ▼
  status = 'completed'    Admin reviews the violation
  completion_summary set          │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
                 reviewed     resolved     dismissed
```

**Why evidence is a separate table:** one violation can have many photos.
That's a one-to-many relationship, which needs its own table — you can't put
"3 photos" in a single column. Same reason `stall_images` and
`check_request_files` exist separately.

**The follow-up link:** `violation_requests.violation_id` lets a completed
investigation point at the violation it produced. That's why your mobile
Checks screen can badge some items "Follow-up" — it's checking whether the
request came from a violation investigation rather than a routine check.

---

## C6. Stall transfers — a two-party handshake

A vendor wants to hand their stall to another vendor.

```
  Vendor A: "Transfer my stall to vendor@example.com"
                    │
                    ▼
        POST /api/transfers
        status = 'pending'
        from_user_id = A, to_user_id = B
        original_application_id = A's approved application
                    │
                    ▼
        Vendor B sees it in their Transfers tab
        (this is what the red badge counts)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    ACCEPTED                DECLINED
    status='accepted'       status='declined'
    responded_at=NOW        responded_at=NOW
        │                       │
        ▼                       └─► nothing else changes
    A's claim is released
    B must now APPLY for the stall
    to start their own contract
```

**The design decision worth noticing:** accepting a transfer does **not**
automatically create a contract for B. It releases A's claim, and B then
applies normally. That keeps every contract traceable to a real application
with its own terms and dates — rather than silently inheriting A's contract
end date and business type.

More steps for the user, much cleaner data. Correct call.

---

## C7. Termination — two different things with one table

`termination_requests.type` is either `'account'` or `'contract'`:

| Type | `stall_id` | What it means | On approval |
|---|---|---|---|
| `contract` | set | "End my lease on this stall" | That application is rejected; `syncStallOccupancy` frees the stall |
| `account` | **null** | "Close my whole PubMark account" | `profiles.is_archived = true`; **all** their approved applications are rejected; every affected stall re-synced |

The account path is the more dramatic one. Once `is_archived` flips:

- `requireAuth` catches it on the vendor's **very next request** (§1.3)
- Returns `401` with `code: "account_terminated"`
- Both clients recognise that specific code and force a clean logout — the
  web app dispatches a `pubmark:unauthorized` event, mobile shows an alert
  and clears the session

That's why a terminated vendor doesn't stay logged in for up to 8 hours. The
mechanism is genuinely well-joined-up across all three programs.

---

## C8. Archiving — a snapshot, not a delete

Admins can archive applications, violations, check requests, stalls, and
vendors. Archiving is **not** deletion:

```js
INSERT INTO archive (type, title, original_id, original_data, archived_by, ...)
```

`original_data` is a **jsonb** column holding a complete copy of the row as
it was at that moment.

**Why keep a frozen copy instead of just flagging the row?** Because the
original may later be genuinely deleted, or change. The archive is a
historical record — what the thing looked like *when it was archived*.
`can_restore` marks whether it can be brought back.

Most tables also carry an `is_archived` boolean, so archived rows are hidden
from normal staff lists while still being visible to the vendor who owns
them (see the `WHERE a.is_archived = false` branch in `GET /api/applications`,
which is applied to staff views only — deliberately).

---

## C9. The request-lifecycle summary

Every one of the flows above is built from the same five moves:

1. **A row is created** with a status (`pending`)
2. **Someone with the right role changes that status** via a `PATCH`
3. **A timestamp is stamped** so you know when it happened
4. **Derived state is re-synced** (`syncStallOccupancy`)
5. **Files, if any, live in Storage** and only their paths live in the
   database

If you internalise those five moves, you can predict how any feature in this
codebase works before you read it — and build new ones that fit.

---

## C10. What to be careful about when you extend this

Drawn from the actual problems in this codebase:

1. **If you add a new way for an application's status to change, call
   `syncStallOccupancy`.** This has been forgotten before, and stalls showed
   the wrong status for weeks.
2. **Don't put structured data in text columns** (C4). Add a column and a
   migration. It's an hour now versus a rewrite later.
3. **Static routes before `:id` routes** (§3.3). This has already shipped as
   a bug once.
4. **Never delete a parent row without handling its children** (§2.2), or
   Postgres rejects it and your user sees "Unexpected server error."
5. **Anything that must be true must be enforced on the server.** UI checks
   are a courtesy, not a control (§1.6).
6. **New file uploads should use the signed-upload path** (§3.4), not base64.
7. **After any change, test as all four roles.** Most bugs in a role-based
   system are visibility bugs.

---

# Appendix D — Code & Data Map

Where the logic lives, and how every table connects to every other table.
This is the reference you open when you need to *find* something in a
3,000-line file.

---

## D1. The complete data map

All 20 tables. An arrow means "this column must point at a real row over
there."

```
                          ┌────────────────┐
                          │    profiles    │  ← every person: 4 roles
                          │  (38 rows)     │
                          └────────┬───────┘
                                   │ referenced by almost everything
          ┌────────────────────────┼────────────────────────────┐
          │                        │                            │
          ▼                        ▼                            ▼
 ┌─────────────────┐      ┌────────────────┐         ┌──────────────────────┐
 │ pending_user_   │      │  announcements │         │ notification_read_   │
 │ creations       │      │   author_id    │         │ state   user_id      │
 │  created_by     │      └────────────────┘         └──────────────────────┘
 └─────────────────┘

                          ┌────────────────┐
                          │     stalls     │  ← the map. 8 tables point here
                          │   owner_id ────┼──► profiles
                          │   geometry     │
                          └────────┬───────┘
                                   │
   ┌───────────┬───────────┬───────┼────────┬──────────────┬─────────────┐
   ▼           ▼           ▼       ▼        ▼              ▼             ▼
┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────┐
│applica-│ │violation│ │check_  │ │violation_    │ │termination_ │ │payment_  │
│tions   │ │s        │ │requests│ │requests      │ │requests     │ │receipts  │
│user_id→│ │vendor_id│ │request-│ │requested_by→ │ │vendor_id→   │ │vendor_id→│
│profiles│ │officer_ │ │ed_by→  │ │assigned_     │ │profiles     │ │submitted_│
│        │ │id→prof. │ │assign- │ │officer_id→   │ │(stall_id    │ │by→prof.  │
│        │ │         │ │ed_to→  │ │profiles      │ │ NULLABLE)   │ │reviewed_ │
│        │ │         │ │profiles│ │violation_id ─┼─► violations  │ │by→prof.  │
└───┬────┘ └────┬────┘ └───┬────┘ └──────────────┘ └─────────────┘ └──────────┘
    │           │          │
    │           ▼          ▼
    │    ┌────────────┐ ┌──────────────────┐         ┌──────────────┐
    │    │ violation_ │ │check_request_    │         │ stall_images │
    │    │ evidence   │ │files             │         │  stall_id ───┼──► stalls
    │    │violation_id│ │check_request_id  │         │  uploaded_by │
    │    │uploaded_by │ │uploaded_by       │         └──────────────┘
    │    └────────────┘ └──────────────────┘
    │
    ├──────────────────┬─────────────────────┐
    ▼                  ▼                     ▼
┌──────────────┐ ┌──────────────────┐ ┌──────────────┐
│contract_     │ │renewal_deadline_ │ │  transfers   │
│renewal_      │ │extensions        │ │ stall_id ────┼──► stalls
│requests      │ │ application_id   │ │ original_    │
│application_id│ │ extended_by      │ │ application_ │
│vendor_id     │ └──────────────────┘ │ id ──────────┼──► applications
│reviewed_by   │                      │ from_user_id │
└──────────────┘                      │ to_user_id   │
                                      └──────────────┘

  Standalone (no foreign keys into the core):
  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  ┌─────────┐
  │ market_perimeter│  │map_facilities│  │ inventory_items  │  │ archive │
  │  created_by →   │  │ created_by → │  │  (NO API ROUTES) │  │archived_│
  │  profiles       │  │ profiles     │  │                  │  │by→prof. │
  └─────────────────┘  └──────────────┘  └──────────────────┘  └─────────┘
```

### Reading this map

**`profiles` and `stalls` are the two hubs.** Nearly everything points at one
or both. That's why deleting either is complicated and deleting anything else
is easy.

**`archive` deliberately has no foreign key to what it archives.** It stores
`original_id` as a plain uuid plus a full `original_data` JSON snapshot — on
purpose, so the archive survives even after the original row is deleted
(§C8). If it had a real FK, deleting the original would be blocked or would
destroy the archive.

**`termination_requests.stall_id` is nullable** — that's how one table serves
both "end this lease" and "close my account" (§C7).

**`violation_requests.violation_id` is the follow-up link** — it points
*forward* to the violation that investigation produced.

**`inventory_items` is an orphan.** It has no API routes; the feature writes
to browser localStorage instead (§4.4).

---

## D2. Navigating `server/src/index.js`

The file is 3,057 lines in roughly this order. Line numbers drift as you
edit — use the search terms.

| Lines | What's there | Search for |
|---|---|---|
| 1–28 | Imports, database pool config | `new pg.Pool` |
| 30–50 | Storage constants (bucket, 5 MB limit, allowed MIME) | `ATTACHMENTS_BUCKET` |
| 51–88 | Email setup + confirmation links | `sendUserConfirmationEmail` |
| 89–125 | Google ID-token verification | `verifyGoogleIdToken` |
| 126–263 | **File handling toolkit** | `uploadAttachment` |
| 265–290 | CORS + JSON body parsing | `app.use(cors(` |
| 292–345 | **Auth: cookies, JWT, requireAuth, requireRole** | `function requireAuth` |
| 346–715 | **Mappers + shared list queries** | `function map` |
| 716–820 | **Business logic: occupancy sync, auto-termination** | `syncStallOccupancy` |
| 823–1023 | Auth routes (login, register, Google, confirm) | `/api/auth/` |
| 1024–1180 | User + pending-user management | `/api/users` |
| 1182–1230 | Announcements | `/api/announcements` |
| 1230–1560 | Check requests + violation requests | `/api/check-requests` |
| 1558–1700 | Violations | `/api/violations` |
| 1696–1800 | Termination requests | `/api/termination-requests` |
| 1803–2200 | **Stalls** (list, create, geometry, delete, import) | `/api/stalls` |
| 2201–2450 | **Applications** + permits | `/api/applications` |
| 2454–2520 | Contract renewals + deadline extensions | `/api/contract-renewals` |
| 2521–2647 | Payment receipts | `/api/receipts` |
| 2648–2759 | Archive | `/api/archive` |
| 2760–2880 | Transfers | `/api/transfers` |
| 2881–3038 | Map facilities + perimeters | `/api/map-facilities` |
| 3040–3057 | Global error handler + `app.listen` | `app.use((error` |

**The pattern:** helpers first (lines 1–820), routes after (823+). When
adding a route, put its helpers up top with the others, not inline.

---

## D3. The logic library — every helper and what it does

This is where the reusable logic actually lives. Grouped by job.

### Files and Storage (lines 126–263)

| Function | What it does |
|---|---|
| `uploadAttachment(prefix, ownerId, file)` | Validates MIME + size, uploads base64 to Storage, returns the path |
| `signedUrlFor(storagePath)` | Turns a stored path into a 10-minute temporary link. **Called by every mapper that returns a file** |
| `removeAttachment(path)` | Deletes one object from Storage |
| `verifyUploadedObject(path, prefix)` | For signed direct uploads: confirms the object *really exists* and is in the caller's own folder before trusting a client-supplied path |
| `storeAttachments(...)` | Handles multiple files at once |
| `resolvePreSignedAttachments(...)` | The signed-upload path (§3.4) |
| `sanitizeFileName(name)` | Strips unsafe characters — real filenames are like `Screenshot_20260828 Expo Go.jpg` |
| `displayFileName(path)` | Pulls the human-readable name back out of a storage path |
| `hasFileContents(file)` | Distinguishes a real upload from a name-only legacy record |

**Security note:** `verifyUploadedObject` is doing real work. Without it, a
client could claim "my file is at `permits/<someone else's id>/secret.pdf`"
and the server would happily link to another user's document.

### Auth and access (lines 292–345, 1052, 1914)

| Function | What it does |
|---|---|
| `cookieOptions()` | Cookie flags — **the one to change for production** (§A2) |
| `setSession(res, profile)` | Signs an 8h JWT, sets the cookie, returns the token for mobile |
| `requireAuth` | Verifies token **and** re-checks `profiles` for existence + `is_archived` |
| `requireRole(...roles)` | Rejects with 403 if the role doesn't match |
| `profile(row)` | Shapes a DB row into a safe public object — **omits `password_hash`** |
| `canAssignRole(req, role)` | Only super-admins may create admins or super-admins |
| `canSignUploadFor(role, purpose)` | Restricts which upload folders a role may write to |
| `isLocalDevOrigin(origin)` | CORS localhost allowance — **should be dev-only** (§A5) |

### Mappers — database row → API JSON (lines 346–715 and scattered)

`mapApplicationRow`, `mapViolationRow`, `mapCheckRequestRow`,
`mapViolationRequestRow`, `mapTerminationRequestRow`, `mapTransferRow`,
`mapPaymentReceiptRow`, `mapArchiveRow`, `mapAnnouncementRow`,
`mapRenewalRow`, `mapFacilityRow`

Every one does the same three jobs:
1. snake_case → camelCase
2. `storage_path` → a fresh signed URL
3. **Drop anything that shouldn't leave the server**

**These are your security boundary for outbound data.** If a secret ever
leaks to a client, a mapper is where it happened.

### Batch loaders — the N+1 fix (lines 406, 552, 580)

`getCheckRequestFilesMap(ids)`, `getViolationEvidenceMap(ids)`,
`getStallImagesMap(ids)`

**What problem these solve:** listing 50 violations, each with photos, the
naive way = 1 query for violations + 50 queries for evidence = **51 queries**.
That's the "N+1 problem," and it's the most common cause of slow APIs.

These fetch *all* the children in **one** query and return a
`Map(parentId → children[])` the mapper reads from. 51 queries becomes 2.

Whoever wrote this knew what they were doing. **Follow this pattern** whenever
you list rows that have attached children.

### Shared list queries (lines 479–703)

`listCheckRequestsInternal`, `listViolationRequestsInternal`,
`listViolationsInternal`, `listTerminationRequestsInternal`

One query definition reused by several routes — so a `GET` list and the list
returned after a `PATCH` can never disagree about shape.

### Business logic — the real rules (lines 716–820)

| Function | What it does | Called from |
|---|---|---|
| `syncStallOccupancy(stallId)` | Recomputes vacant/occupied from approved applications; never overrides `unavailable` (§C3) | approve/reject, both auto-terminations, delete application, account termination |
| `autoTerminateExpiredContracts()` | One SQL `UPDATE` — expires contracts past their renewal deadline with no pending request | `GET /api/applications` ⚠️ should be cron (§A10) |
| `autoTerminateExpiredPermitDeadlines()` | Loads **all** approved apps, regex-parses deadlines, terminates the lapsed ones (§C4) | same ⚠️ |
| `parsePermitMeta(remarks)` | Extracts `[[PM_...]]` markers out of the remarks text | mappers, sweeps |
| `buildPermitMetaRemarks(...)` | Writes those markers back in | deadline routes |
| `syncViolationRequestsToCheckRequests()` | Mirrors a violation investigation into the officer's Checks list | violation-request routes |

### Destructive helpers (lines 2098–2144)

| Function | What it does |
|---|---|
| `findOwnedStallNames(ids)` | Blocks deletion of stalls with an approved tenant → 409 |
| `collectStallAttachmentPaths(conn, id)` | Gathers every Storage path belonging to a stall, so files get deleted too — not orphaned |
| `cascadeDeleteStall(conn, id)` | Deletes all children in FK-safe order inside a transaction (§2.2) |

### Utilities

`parsePagination` (clamps `limit` to 100), `sendWithETag` (304 support),
`formatBytes`, `humanSize`, `mapCompletionFileType`, `validFacilityGeometry`,
`normalizeConnectedFloors`, `confirmationPage` (the HTML page shown after
clicking a confirmation link — the one place this API returns HTML instead of
JSON).

---

## D4. Data lineage — who writes to what

When a table has wrong data, this tells you where to look.

| Table | Written by |
|---|---|
| `profiles` | `POST /auth/register`, `GET /auth/confirm-user`, `PATCH /users/:id`, account termination (`is_archived`) |
| `pending_user_creations` | `POST /users`, `POST /auth/google/register`, resend; **deleted** on confirm |
| `stalls` | `POST/PATCH/DELETE /stalls`, `PATCH /stalls/geometry`, `POST /stalls/import`, **and `syncStallOccupancy` from 6 places** |
| `applications` | `POST /applications`, `PATCH /applications/:id`, `/permit`, `/renewal-deadline`, both auto-termination sweeps, termination approval |
| `stall_images` | `POST/PATCH /stalls` (signed uploads); deleted by `cascadeDeleteStall` |
| `violations` | `POST /violations`, `PATCH /violations/:id`, and check-request completion when an officer reports one |
| `violation_evidence` | `POST /violations` (photos) |
| `check_requests` | `POST /check-requests`, `PATCH /check-requests/:id`, **and `syncViolationRequestsToCheckRequests`** |
| `violation_requests` | `POST/PATCH /violation-requests` |
| `payment_receipts` | `POST /receipts` (vendor/officer), `PATCH /receipts/:id` (admin verify/reject) |
| `transfers` | `POST /transfers`, `PATCH /transfers/:id` |
| `termination_requests` | `POST /termination-requests`, `PATCH /termination-requests/:id` |
| `contract_renewal_requests` | `POST /contract-renewals`, `PATCH /contract-renewals/:id` |
| `archive` | `POST /archive`; `DELETE /archive/:id` restores or purges |
| `market_perimeter`, `map_facilities` | super-admin map editor routes only |
| `notification_read_state` | `POST /notification-read-state/:trackerKey` |
| `inventory_items` | **Nothing.** No routes exist (§4.4) |

**The row worth memorising:** `stalls` is written from **six different
places**, five of which are `syncStallOccupancy`. That concentration is
exactly why the occupancy bug happened — and why any new status-changing code
must call it (§C10 rule 1).

---

## D5. Tracing a bug backwards

When something's wrong in the data, work in this order:

1. **Which table holds the wrong value?** → D1 tells you what it connects to
2. **Who writes to that table?** → D4 gives you the exact routes
3. **Where is that route?** → D2 gives you the line range
4. **What shared logic does it use?** → D3 tells you what those helpers do
5. **What's the intended flow?** → Appendix C shows what *should* happen

Example — *"a stall shows vacant but has an approved tenant":*
1. Wrong value is `stalls.status`
2. D4: written by stall routes **and `syncStallOccupancy`**
3. D3: `syncStallOccupancy` is called from 6 places
4. → Find the code path that changed the application status **without**
   calling it. That's your bug.

That's the whole debugging method. It works for every table in the system.

---

# Appendix E — File Directory

"I want to change X — which file do I open?"

---

## E1. The whole repo at a glance

```
PubMark/
├── src/                    ← WEB APP (React, runs in browser)
│   ├── app/
│   │   ├── App.jsx             app root: providers wrap everything
│   │   ├── routes.jsx          ★ every URL → which page
│   │   ├── pages/              one file per screen
│   │   ├── components/         shared UI + map editors + API wrappers
│   │   │   └── ui/             generated shadcn library — don't edit casually
│   │   ├── context/            AuthContext (session state)
│   │   ├── hooks/              TanStack Query data hooks
│   │   ├── services/           ★ api.js — every web→backend call
│   │   └── content/            static text (tenant terms)
│   ├── styles/                 theme.css, tailwind.css, fonts.css
│   └── imports/                Figma leftovers — reference only, not built
│
├── server/                 ← BACKEND API (Express, runs on a server)
│   ├── src/index.js            ★ ALL 68 routes + all logic (3,057 lines)
│   ├── migrations/             .sql schema changes (incomplete — §2.6)
│   ├── seed-demo-users.js      npm run seed
│   ├── start-with-tunnel.js    dev tunnel + rewrites API_PUBLIC_URL
│   ├── .env                    ★ SECRETS — never committed
│   └── mysql-schema.sql        ⚠️ DEAD FILE from the MySQL era — delete (§A8)
│
├── mobile/                 ← MOBILE APP (Expo/React Native)
│   ├── app.json                ★ native config: icons, package name, plugins
│   ├── eas.json                build profiles for EAS
│   ├── assets/                 app icon, adaptive icons, google-logo.png
│   ├── COMMANDS.txt            day-to-day command cheat sheet
│   └── src/
│       ├── navigation/RootNavigator.jsx   ★ which screens exist per role
│       ├── screens/            vendor/ and officer/ screens
│       ├── components/ui.jsx   shared mobile components (incl. OfficerHeader)
│       ├── context/AuthContext.jsx
│       ├── hooks/              same TanStack Query pattern as web
│       └── services/
│           ├── api.js          ★ every mobile→backend call
│           ├── apiBaseUrl.js   ★ how the app finds your server (§5.4)
│           ├── tokenStore.js   expo-secure-store wrapper
│           └── fileUpload.js   file → base64 for uploads
│
├── .env.local              ★ WEB secrets (VITE_*) — never committed
├── vite.config.js          web build config
├── SYSTEM_HANDBOOK.md      ← this file
├── CLAUDE.md               AI context (⚠️ 3 stale claims — §A9)
└── PROJECT_CONTEXT.md      older handoff doc
```

★ = the files you'll touch most.

---

## E2. "I want to change…" → open this

### Backend / data

| Task | File |
|---|---|
| Any API endpoint | `server/src/index.js` (§D2 for line ranges) |
| Login / JWT / session cookie | `server/src/index.js` → search `cookieOptions` |
| Who can do what (roles) | `server/src/index.js` → search `requireRole` |
| File upload rules (size, types) | `server/src/index.js` lines 38–45 |
| Confirmation email wording | `server/src/index.js` → `sendUserConfirmationEmail` |
| Add a database table/column | new file in `server/migrations/` **and** run it in Supabase |
| Demo accounts | `server/seed-demo-users.js` |
| Secrets / DB URL / keys | `server/.env` |

### Web app

| Task | File |
|---|---|
| Add a page or change a URL | `src/app/routes.jsx` |
| Sidebar nav items / badges | `src/app/components/DashboardLayout.jsx` |
| Login screen (incl. Google button) | `src/app/pages/Login.jsx` |
| Signup form | `src/app/pages/Register.jsx` |
| Admin dashboard | `src/app/pages/AdminDashboard.jsx` |
| Super-admin (users, stalls, analytics) | `src/app/pages/SuperAdminDashboard.jsx` |
| Vendor dashboard | `src/app/pages/UserDashboard.jsx` |
| Officer dashboard | `src/app/pages/OfficerDashboard.jsx` |
| Walk-in application flow | `src/app/pages/WalkInApplication.jsx` |
| Application review screen | `src/app/pages/AdminApplicationDetails.jsx` |
| **The map** (admin view, drawing stalls) | `src/app/components/AdminMapView.jsx` |
| Map — super-admin editor | `src/app/components/SuperAdminMapEditor.jsx` |
| Map — perimeter / facilities | `src/app/components/FacilityMapEditor.jsx` |
| Map — officer view | `src/app/components/OfficerMapView.jsx` |
| Guest (logged-out) map | `src/app/pages/GuestMapView.jsx` |
| Route protection | `src/app/components/ProtectedRoute.jsx` |
| Session/auth state | `src/app/context/AuthContext.jsx` |
| Any call to the backend | `src/app/services/api.js` |
| Shared data fetching | `src/app/hooks/use*.js` |
| Colors, fonts, theme | `src/styles/theme.css` |
| Terms & conditions text | `src/app/content/tenantTerms.js` |
| Web secrets (API URL, Google ID) | `.env.local` |

### Mobile app

| Task | File |
|---|---|
| Which screens/tabs exist per role | `mobile/src/navigation/RootNavigator.jsx` |
| Tab transition animation | `mobile/src/navigation/RootNavigator.jsx` → `tabScreenOptions` |
| Login screen + Google button | `mobile/src/screens/LoginScreen.jsx` |
| Google signup fill-up form | `mobile/src/screens/GoogleSignupFillUpForm.jsx` |
| Vendor home + profile dropdown | `mobile/src/screens/vendor/HomeScreen.jsx` |
| Apply for a stall | `mobile/src/screens/vendor/ApplicationFormScreen.jsx` |
| Application detail + timeline | `mobile/src/screens/vendor/ApplicationDetailScreen.jsx` |
| Transfers (+ badge) | `mobile/src/screens/vendor/TransfersScreen.jsx` |
| **Officer header** (shared by 5 screens) | `mobile/src/components/ui.jsx` → `OfficerHeader` |
| Officer violations / checks / receipts | `mobile/src/screens/officer/*.jsx` |
| Any call to the backend | `mobile/src/services/api.js` |
| How the app finds the API | `mobile/src/services/apiBaseUrl.js` |
| App icon, package name, permissions | `mobile/app.json` ⚠️ needs a rebuild |
| Build profiles / env vars for builds | `mobile/eas.json` |
| Mobile secrets | `mobile/.env` |

---

## E3. Files that need extra care

| File | Why |
|---|---|
| `server/src/index.js` | Everything. One typo breaks the whole API. Route order matters (§3.3). |
| `src/app/routes.jsx` | Breaks every URL if wrong |
| `src/app/components/DashboardLayout.jsx` | Shared by every admin/officer/vendor page |
| `src/app/components/ui/` | Generated shadcn library — many consumers; check before editing |
| `mobile/src/components/ui.jsx` | Shared by all 5 officer screens |
| `mobile/app.json` | Native config — **any change here requires `eas build`** |
| `vite.config.js` | Don't remove the React or Tailwind plugins; don't add `.css`/`.ts` to `assetsInclude` |
| `.env` / `.env.local` / `server/.env` | Secrets. Never commit. Already gitignored — keep it that way. |

---

## E4. Files you can ignore

| File/folder | Why |
|---|---|
| `src/imports/` | Figma export leftovers — reference images, not part of the build |
| `server/mysql-schema.sql` | Dead MySQL-era file. **Delete it** (§A8) — it will mislead whoever finds it |
| `node_modules/` | Installed packages, never edited, never committed |
| `dist/`, `.expo/` | Build output, regenerated every time |
| `src/app/components/stallsStorage.js` | Legacy localStorage store, mostly dead — but `SuperAdminDashboard.jsx` still calls it in a few places (§6.2 item 8) |

---

## E5. The two files to read first

If you only open two files to understand this system:

1. **`server/src/index.js`** — every rule your system enforces is in here.
   Read `requireAuth` (line ~308), `syncStallOccupancy` (~716), and one route
   end to end.
2. **`src/app/routes.jsx`** — the complete map of what the web app can do, in
   about 100 lines.

Then `mobile/src/navigation/RootNavigator.jsx` for the mobile equivalent.
