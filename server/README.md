# PubMark temporary MySQL API

The React app connects to this API, never directly to MySQL. Authentication is
stored in an httpOnly cookie and the browser only caches a display profile for
immediate route rendering.

1. Create a MySQL database and run `mysql-schema.sql`.
2. Copy `.env.example` to `.env` and set every value, especially a long random `JWT_SECRET`.
3. Run `npm install` inside `server`, then `npm run dev`.
4. Copy the root `.env.example` to `.env.local` and set `VITE_API_BASE_URL=http://localhost:4000/api`.

The current server implements secure registration, sign-in, sign-out, and
session recovery. Add every domain endpoint under `/api` using the same role
checks before moving each corresponding React storage service off localStorage.
