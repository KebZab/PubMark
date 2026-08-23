# PubMark API

The React app connects to this API, never directly to Supabase. Authentication is
stored in an httpOnly cookie and the browser only caches a display profile for
immediate route rendering.

The database is a single shared Supabase (Postgres) project — there is no local
database to install or set up.

1. Copy `.env.example` to `.env`.
2. Ask the project owner for the real `DATABASE_URL` and `JWT_SECRET` values and
   fill them in — these are shared secrets, never generate your own or guess them.
3. Run `npm install` inside `server`, then `npm run dev`.
4. In the project root, copy `.env.example` to `.env.local` and set
   `VITE_API_BASE_URL=http://localhost:4000/api`.

You do not need to run `npm run seed` — the demo accounts already exist in the
shared database.

The server implements secure registration, sign-in, sign-out, session recovery,
and every domain endpoint under `/api` (stalls, applications, violations, check
requests, termination requests, announcements, perimeters, payment receipts) —
all backed by Postgres via the `pg` package.

## Payment receipts (one-time setup)

The `/api/receipts` routes upload the actual receipt file to Supabase Storage
(everything else in this app only stores fake file metadata — this is the one
feature with real binary uploads). One-time setup, done once per Supabase
project, not per developer:

1. Run `server/migrations/2026-08-23-payment-receipts.sql` in the Supabase
   SQL editor to create the `payment_receipts` table.
2. In the Supabase dashboard: **Storage** -> **New bucket** -> name it
   `receipts`, leave it **private** (not public).
3. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`
   (Settings -> API in the dashboard — use the `service_role` secret key, not
   `anon`). This key must never reach the browser, same as `JWT_SECRET`.

Without step 3, every other route keeps working — only receipt uploads will
fail with a clear "not configured" error.
