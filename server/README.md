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
requests, termination requests, announcements, perimeters) — all backed by
Postgres via the `pg` package.
