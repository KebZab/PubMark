# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is PubMark?

PubMark is a smart public-market stall management PWA (Progressive Web App) built in React 18, JavaScript, and Vite. Four roles access it: vendors (apply for/manage market stalls), officers (inspections and violation reports), admins (day-to-day operations), and super-admins (users, maps, inventory, analytics, archives). The interactive Leaflet map lets users draw and manage stall polygons.

**⚠️ Backend reality check (updated 2026-09-08):** this app briefly ran on a real MySQL database early on, then migrated to **PostgreSQL hosted on Supabase** — `server/src/index.js` connects via `pg.Pool` using `DATABASE_URL` (a Supabase pooler connection string), and every route uses Postgres syntax (`$1` placeholders, `ON CONFLICT DO UPDATE`, `RETURNING`, `jsonb`, `gen_random_uuid()`). **`server/mysql-schema.sql` is a stale historical artifact from before that migration — it is literal MySQL syntax (`ENUM`, `CHAR(36)`, `utf8mb4`) and does not match the live schema. Do not run it; it would create a database structurally incompatible with the server code.** The live schema lives in the Supabase project itself — inspect it via the Supabase dashboard or the `supabase` MCP tools (`list_tables`, `execute_sql`) rather than this file. `npm run seed` (in `server/`) still works as documented below; it inserts via `pg`, not MySQL.

Beyond auth, **stalls (incl. geometry), applications, perimeters, announcements, users, violations, check-requests, violation-requests, termination-requests, and transfers are all Postgres-backed** via real routes in `server/src/index.js`. The corresponding `src/app/components/*Store.ts` / `*Storage.ts` files for those entities are mostly thin `apiFetch` wrappers now, not localStorage — **do not assume a `*Store.ts`/`*Storage.ts` file name means localStorage; check whether it imports `apiFetch` before assuming either way.** Still genuinely `localStorage`-only (no backend route exists yet): **inventory** (`inventoryStore.ts`) and **archive** (`archiveStore.ts`). Note also `stallsStorage.ts` (the old localStorage-based stall store) is legacy dead weight for most flows — `AdminMapView.jsx` uses `stallsApi.js` (real API) — but `SuperAdminDashboard.jsx` still calls `getStoredStalls`/`updateStoredStall` from it directly in a few places, which is a latent inconsistency worth resolving if you touch stall import/export there. Do not assume `database.md` describes a running feature; that file documents a *possible future* schema evolution, not a gap in the current backend (which is already Postgres). For exhaustive current architecture, design system, routes, and known gaps, read [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) (updated continuously as a working AI handoff doc).

**Performance/architecture optimization work:** [`SUPABASE_FUTURE_OPTIMIZATION.md`](./SUPABASE_FUTURE_OPTIMIZATION.md) tracks a 5-phase plan (query caching, pagination, signed uploads, cleanup) — Phases 1–3 are fully implemented (DB indexes/transactions/timeouts, TanStack Query in web+mobile, cursor-style pagination + ETag support on several endpoints); Phase 4 (signed direct Storage uploads) has one pilot flow done (stall photos) with the rest of the app still on the original base64-upload path by design, not by omission — see that doc for exact status per item before assuming something in it is or isn't live.

## Commands

**Frontend (root directory):**
- `npm install` — install frontend dependencies
- `npm run dev` — start Vite dev server (http://localhost:5173)
- `npm run build` — production build to `dist/`

**Backend (`server/` directory, separate package.json):**
- `npm install` — install backend dependencies (run inside `server/`)
- `npm run seed` — populate the Postgres database with demo accounts (`admin@pubmark.com`, `officer@pubmark.com`, etc.) via `seed-demo-users.js`
- `npm run dev` — start a Cloudflare quick tunnel (`start-with-tunnel.js`) and the Express API server (http://localhost:4000). The tunnel gets a new random URL every run, which is auto-written to `API_PUBLIC_URL` in `server/.env` before the server starts, so account-confirmation emails always link to a reachable address. Use `npm run dev:no-tunnel` to run just the server without the tunnel.
- `npm run start` — production start

**Setup order:**
1. Root `.env.local` from `.env.example` with `VITE_API_BASE_URL=http://localhost:4000/api`.
2. A Postgres database (this project uses Supabase) — get the connection string into `server/.env` as `DATABASE_URL`, then `npm run seed` inside `server/` to create demo accounts. There is no checked-in canonical schema file (see the backend-reality note above); inspect the live Supabase project's schema directly if you need it, or ask the project owner for a fresh `pg_dump`.
3. Root `npm install && npm run dev` (frontend) in parallel with `cd server && npm install && npm run dev` (backend).

**No test runner and no lint script exist yet.**

**The codebase is plain JavaScript** (`.js` / `.jsx`) — both the web app and
`mobile/`. It was converted from TypeScript by erasing type annotations only;
no logic or styling changed. There is no `tsconfig.json` and no type-check
step. API response shapes are documented as JSDoc `@typedef` blocks in
`mobile/src/services/types.js`.

## Architecture and state management

### localStorage → Postgres migration

Auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`) uses bcrypt password hashing, JWT signed cookies (`pubmark_session`, 8-hour expiry), and Postgres-backed user profiles. Beyond auth, **stalls, applications, perimeters, announcements, users, violations, check-requests, violation-requests, termination-requests, and transfers are also Postgres-backed** — see the backend-reality note above for the full breakdown. Only **inventory and archive** remain `localStorage`-only. When you migrate one of those remaining features:

1. Add a route to `server/src/index.js` with role checks.
2. Add a fetch client function to `src/app/services/api.js` (or a dedicated `*Api.js`/`*Store.js` wrapper, following the pattern in `violationsStore.ts` or `checkRequestsStore.ts`).
3. Replace all consumers of the legacy `localStorage` store with API calls.
4. Do not dual-write; migrate every consumer before removing the `localStorage` fallback.
5. Preserve the UUID/snake_case conventions already used throughout the schema.
6. **Route registration order matters in Express.** `server/src/index.js` registers routes in file order and matches top-down — a static path (e.g. `/api/stalls/geometry`) must be declared *before* a dynamic sibling (e.g. `/api/stalls/:id`), or the dynamic route swallows it (see gotcha #6 below; this exact bug shipped once already).

### Routes and role-gating

All routes are defined in [`src/app/routes.jsx`](./src/app/routes.jsx) and gated by `ProtectedRoute` (checks a cached client profile, no per-route server validation yet — known gap). The four roles route to:
- Vendor: `/dashboard`, `/dashboard/map`, `/apply/:stallId`, `/applications/:id`, etc.
- Officer: `/officer`, `/officer/map`, `/officer/violations`, `/officer/log`.
- Admin: `/admin`, `/admin/map`, `/admin/stalls`, `/admin/applications/:id`, etc.
- Super-admin: `/super-admin` + `/users`, `/map`, `/settings`, `/violations`, etc.

Shared: `/analytics`, `/archive` (admin + super-admin).

`DashboardLayout` is the role-aware shell (sidebar navigation, header, logout).

### Domain state modules

Each feature area has its own store module under `src/app/components/` (or `src/app/services/` for the newer ones). Despite the shared naming pattern, they are **not all backed the same way** — check the "Backend" column, or grep the file for `apiFetch` vs `localStorage`, before assuming:

| Module | Entity | Backend |
|--------|--------|---------|
| `stallsStorage.ts` (legacy) / `services/stallsApi.js` (current) | drawn stalls, geometry, CRUD | Postgres (`stallsApi.js`); `stallsStorage.ts` is mostly dead but still used directly by `SuperAdminDashboard.jsx` in a few spots |
| `applicationsStorage.ts` | vendor applications, status, permits | Postgres |
| `transferStorage.ts` | vendor stall transfers | Postgres (real `/api/transfers*` routes exist — this file, despite its name, is not a pure localStorage store anymore) |
| `violationsStore.ts` | violations, evidence, resolve/dismiss | Postgres |
| `checkRequestsStore.ts` | inspections and completion files | Postgres |
| `violationRequestStore.ts` | officer violation-check requests | Postgres |
| `inventoryStore.ts` | inventory items, low-stock | `localStorage` only |
| `announcementsStore.ts` / `hooks/useAnnouncements.js` | admin announcements | Postgres |
| `archiveStore.ts` | archived records | `localStorage` only |
| `perimeterStore.ts` / `hooks/usePerimeters.js` | one market boundary polygon | Postgres |

Maps (`AdminMapView`, `SuperAdminMapEditor`, `OfficerMapView`, `AdminCheckRequestMap`) write to these stores/APIs. **Client-side data fetching now goes through TanStack Query** (`@tanstack/react-query`, added as part of the Supabase optimization work — see `hooks/useStalls.js`, `useApplications.js`, `usePerimeters.js`, `useMapFacilities.js`, `useAnnouncements.js` on web, and their mobile equivalents under `mobile/src/hooks/`) rather than bespoke `useState`/`useEffect` per screen — these hooks share one cache per resource type across every screen that uses them, with staleTimes tuned per data category (5 min for stalls/facilities/perimeters, 1 min for announcements, 15s for workflow data). There is no Redux, Zustand, or React Context beyond that — state otherwise lives in these per-feature modules. When building a new feature that's still `localStorage`-backed (inventory, archive), follow the existing pattern for that module: one store per entity, JSON serialize/deserialize via `localStorage`. When adding to an already-migrated entity, follow the `apiFetch`-wrapper pattern instead (see `violationsStore.ts` for a good example), and prefer wiring shared reads through a TanStack Query hook if more than one screen needs the same data.

**Legacy-data migration on page load:** [`src/app/services/legacyRequestMigration.js`](./src/app/services/legacyRequestMigration.js) runs on every "Reports & Requests" / "Send Request" page load (called from `AdminDashboard.jsx`'s `loadReportsData`/`loadRequestData`) to one-time-migrate any leftover `localStorage` request/violation data (from before those entities moved to Postgres) into the API, gated by the `pubmark_db_request_migration_v1` localStorage key. Each item is migrated in its own try/catch (fixed 2026-08-17 — see below) so a stale record referencing a since-deleted or pre-migration `local_...` stall ID is skipped rather than repeatedly 500ing and blocking the migration from ever completing. **This is still in place deliberately** — removing it is only safe once you're certain no user's browser could still be carrying pre-migration localStorage data, which isn't something verifiable from the codebase alone.

## Working in this repo

### Design system

The interface uses **Tailwind CSS 4** and **teal/white/Inter** professional typography. See [`src/styles/theme.css`](./src/styles/theme.css) for tokens. Do **not** redesign this style unless explicitly requested. Important conventions:

- Primary color: teal (`#14B8A6`), used for action buttons and accents.
- Typography: Inter 400–800, base 16px, headings are `2xl`/`xl`/`lg` with 500 weight.
- Spacing: `p-4`/`p-5`/`p-6` for cards, `gap-2`/`gap-3` for controls.
- Status colors: teal/emerald for approval/success, amber for pending, red for rejected.
- Responsive: mostly `sm:` and `lg:` breakpoints. Mobile-first; forms constrain to `max-w-md`.

### Shadcn UI primitives

`src/app/components/ui/` is a large generated shadcn-style component library built on Radix. It's shared infrastructure; **inspect all consumers before altering** the primitives themselves.

### Vite config

`vite.config.js` includes a custom `figma-asset-resolver` for `figma:asset/...` imports. **Do not remove the React or Tailwind plugins** and **never add `.css`, `.tsx`, or `.ts` to `assetsInclude`** (these notes are in the config itself).

### Environment variables

| File | Variables |
|------|-----------|
| Root `.env.local` | `VITE_API_BASE_URL` (e.g., `http://localhost:4000/api`) — the browser only ever talks to this Express API, never to Postgres or Supabase Storage directly |
| `server/.env` | `PORT=4000`, `CLIENT_ORIGIN`, `DATABASE_URL` (Postgres/Supabase), `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Storage), optionally `GMAIL_USER`/`GMAIL_APP_PASSWORD`/`API_PUBLIC_URL` (account-confirmation email) — **never commit** |

**Never expose `DATABASE_URL`, `JWT_SECRET`, or `SUPABASE_SERVICE_ROLE_KEY` to the frontend** (no `VITE_`-prefixed equivalents should ever exist for these). Do not commit `.env*` files (they are gitignored). There is no Supabase client in the frontend — a leftover unused one (`src/app/services/supabase.js`, a dead alternate Supabase-Auth client from before this app's custom bcrypt+JWT backend existed) was removed 2026-09-08.

### High-impact files

- `src/app/routes.jsx` — changes here affect every route.
- `src/app/components/ProtectedRoute.jsx` — guards all authenticated pages.
- `src/app/components/DashboardLayout.jsx` — the shared sidebar/header; affects visual consistency.
- `src/styles/theme.css`, `src/styles/tailwind.css`, `src/styles/fonts.css` — design tokens and global styles.
- `server/src/index.js` — the entire backend API; also owns the Postgres pool config, transaction helpers, and attachment/Storage logic.
- `database.md` — a possible future schema evolution reference; not required reading for the current backend.

### Common gotchas

1. **Don't assume a store module means localStorage.** Most domain modules (stalls, applications, violations, check-requests, violation-requests, perimeters, announcements, transfers) are Postgres-backed `apiFetch` wrappers now; only inventory and archive are still pure `localStorage`. See the Domain state modules table above.
2. **Cached profile can outlive server session.** `ProtectedRoute` checks the UI cache, not a live server call. `GET /api/auth/me` is not called on every route (known gap).
3. **Maps write geometry through the API for stalls (`stallsApi.js` → `PATCH /api/stalls/geometry`), and through `perimeterStore`/`usePerimeters` for the market boundary.** `AdminMapView.jsx`'s edit/delete handlers pre-check the market perimeter and vendor-occupancy client-side, but the server is the source of truth for both.
4. **Figma origin.** Root `package.json` name is `@figma/my-make-file` and `vite.config.js` has Figma-specific tooling. This was scaffolded from a Figma "Make" export; `src/imports/` has Figma images (reference only, not executed by the build).
5. **No server `.env.example`.** The existing `server/.env` file has no checked-in template—copy from `root/.env.example` and update Postgres/Supabase creds and `JWT_SECRET` manually.
6. **Express route order bites `server/src/index.js`.** Routes are matched top-down; a dynamic `:id` route declared before a static sibling path will swallow requests meant for the static one (e.g. `PATCH /api/stalls/:id` registered before `PATCH /api/stalls/geometry` caused every geometry-save request to 400 with "No fields to update." — fixed 2026-08-17 by reordering). When adding a new static sub-path under an existing resource, declare it above any `:id`-style route on that resource.
7. **`stalls` is referenced by several tables with no `ON DELETE CASCADE`** (`applications`, `violations`, `check_requests`, `violation_requests`, `transfers`, `termination_requests`). Deleting a stall must go through the cascade-cleanup + ownership-check logic in `DELETE /api/stalls/:id` / `DELETE /api/stalls` (not a bare `DELETE FROM stalls`), or it will FK-fail on any stall with history. "Owned by a vendor" is defined as having an `applications` row with `status = 'approved'`.
8. **`map_facilities` has Row Level Security disabled** (flagged 2026-09-08 by Supabase's own advisories) — every other table has RLS enabled. Since the app never uses the anon/authenticated Supabase client roles directly (only the server's service-role connection), this is lower-risk than it would be in an app with a Supabase client in the frontend, but it's still inconsistent with every other table and worth fixing deliberately (enabling RLS with no policies would just block all access, so this needs real policies added, not a bare `ENABLE ROW LEVEL SECURITY`).
9. **Signed Storage upload paths are user-scoped, not entity-scoped.** `POST /api/uploads/sign` (added 2026-09-08, currently only wired to stall photos) signs paths like `stalls/<userId>/<uuid>-<filename>` rather than `stalls/<stallId>/...`, because the domain record (a new stall, application, etc.) often doesn't exist yet when the upload is signed. The server verifies both that the path is scoped to the requesting user and that the object actually exists in Storage before ever trusting it as a database reference — see `resolvePreSignedAttachments()`.

### Reference files

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — detailed AI handoff doc with design system, routes, business rules, screens, known gaps, and instructions for the next session.
- [`MYSQL_TRANSITION.md`](./MYSQL_TRANSITION.md) — historical notes from the MySQL → Postgres/Supabase migration; useful for understanding *why* some things are named the way they are (e.g. `mysql-schema.sql`, `npm run seed`'s original purpose), not a description of the current backend.
- [`database.md`](./database.md) — a possible future Postgres/Supabase schema evolution (RLS policy expansion, Storage policy changes) — not a gap in the current backend, which already runs on Postgres/Supabase.
- [`SUPABASE_FUTURE_OPTIMIZATION.md`](./SUPABASE_FUTURE_OPTIMIZATION.md) — the 5-phase performance/architecture optimization plan; see its own status notes for what's actually implemented vs. still proposed.
- `server/README.md` — backend setup steps.

## Session log

### 2026-08-17 — stall delete/geometry/reports bug fixes

Three related bugs found and fixed in the stalls/reports flow, all in `server/src/index.js` unless noted:

1. **Stall delete had no ownership rule and FK-failed on any stall with history.** `DELETE /api/stalls/:id` and `DELETE /api/stalls` did a bare `DELETE FROM stalls`, which (a) let admins delete stalls currently occupied by a vendor, and (b) threw an FK constraint error (surfaced to the user as a generic "Unexpected server error") whenever the stall had any historical `applications`/`violations`/`check_requests`/`violation_requests`/`transfers`/`termination_requests` rows, since none of those FKs cascade. Fixed by adding `findOwnedStallNames()` (blocks delete with a `409` when an `applications` row with `status = 'approved'` exists) and `cascadeDeleteStall()` (cleans up dependent rows in a transaction before deleting the stall) — both used by the single and bulk delete routes. Mirrored on the frontend in `AdminMapView.jsx`: the Delete button is disabled for occupied stalls, and both delete paths pre-check occupancy and re-`refetch()` on failure so the map doesn't show a stall as gone when it wasn't.
2. **Geometry save always failed with "No fields to update."** `PATCH /api/stalls/:id` was registered before `PATCH /api/stalls/geometry`; Express matched the dynamic route first and treated `"geometry"` as a stall ID. Fixed by moving the `/geometry` route above `/:id`. See gotcha #6 above — watch for this class of bug elsewhere.
3. **"Reports & Requests" / "Send Request" pages 500'd on every load.** `legacyRequestMigration.js` migrates old pre-migration `localStorage` request/violation data into the API on every page load of those tabs, in a loop with no per-item error handling. Legacy records referencing stale/local-only stall IDs fail the `stall_id` FK constraint on insert, which threw out of the loop *before* the migration was marked `"done"` — so it retried (and 500'd) forever. Fixed by wrapping each loop iteration in its own try/catch so one bad record is skipped instead of blocking the rest and re-triggering on every visit.

### 2026-09-08 — email confirmation for super-admin-created accounts; Supabase optimization Phases 1–4 (pilot)

**Email confirmation feature:** `POST /api/users` (super-admin's "Create User") no longer writes to `profiles` directly — it creates a `pending_user_creations` row and emails (via Nodemailer/Gmail SMTP; `GMAIL_USER`/`GMAIL_APP_PASSWORD`/`API_PUBLIC_URL` in `server/.env`) a confirmation link to `GET /api/auth/confirm-user`, which only then creates the real account. New `GET /api/pending-users`, `POST /api/pending-users/:id/resend`, `DELETE /api/pending-users/:id` (super-admin only) back a "Pending Invitations" section merged into the Users table in `SuperAdminDashboard.jsx`. Login for a still-pending email now returns a clear "Please confirm your email before signing in." (`code: "pending_confirmation"`) instead of a generic invalid-credentials message, without leaking pending-invite existence to a wrong-password guess.

**Supabase optimization work (see `SUPABASE_FUTURE_OPTIMIZATION.md` for the full plan):**
- **Phase 1** — added compound indexes and uniqueness constraints (audited first; zero existing conflicts), pool timeouts (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, `statement_timeout`, `query_timeout`), and transactions around 8 previously-unprotected multi-table writes (violation-requests, violations, check-requests, stalls) that could have left partial/orphaned rows on failure.
- **Phase 2** — introduced TanStack Query on both web and mobile; migrated `useStalls`/`useApplications`/`usePerimeters`/`useMapFacilities` (and added a new shared `useAnnouncements`) to it, preserving each hook's existing return shape so consumers didn't need to change. Mobile also gained an `AppState`-based focus-refetch (there's no browser "window focus" event on native).
- **Phase 3** — added `?limit=&offset=` pagination (matching the existing pattern already used by users/stalls/applications, not the doc's literal "cursor" wording, to avoid two incompatible pagination styles in one API) to violations, receipts, archive, transfers, check-requests, violation-requests, and termination-requests. Added ETag/304 support to `/api/map-facilities` and `/api/perimeters` — **not** `/api/stalls`, because stall photos carry freshly-signed Storage URLs that differ on every request, which would make an ETag there never actually match (caught by testing, not assumed).
- **Phase 4 (pilot only)** — `POST /api/uploads/sign` plus `resolvePreSignedAttachments()` let the client upload a file directly to Supabase Storage via a signed URL instead of base64-encoding it into the domain-record request. Wired end-to-end for **stall photos only** (`AdminMapView.jsx`); the other 8 upload flows (permits, violation evidence, check-request files, receipts) intentionally still use the original base64 path — both coexist in the same routes. The raw signed-upload HTTP contract (`PUT` to the `signedUrl` with the file as the body, no SDK needed) was verified empirically against the real Supabase project before writing any client code, not assumed from docs.
- **Phase 5 (this entry)** — removed the dead frontend Supabase-Auth client (`src/app/services/supabase.js`, zero imports found) and its `VITE_SUPABASE_*` env vars; rewrote this file's MySQL-era terminology to match the actual Postgres/Supabase backend (see the backend-reality note at the top). Deliberately **did not** touch `legacyRequestMigration.js` — retiring it is a data-safety call that depends on real-world browser state this session can't observe.
- Also surfaced, not fixed: `map_facilities` has RLS disabled (see gotcha #8) — flagged for a deliberate decision on policies, not auto-remediated.

### 2026-09-08 (cont.) — mobile notices badge, mobile tracking timeline, admin loading states, stall-status sync fix, walk-in application

**Mobile notices badge (new, per-account, Supabase-backed):** new `notification_read_state` table (`user_id`, `tracker_key`, `last_seen_at`, PK on both) + `GET`/`POST /api/notification-read-state`, consumed by `mobile/src/hooks/useLastSeenTracker.js` (generic) and `useNoticesBadge.js` (Notices-specific), wired into `RootNavigator.jsx`'s `tabBarBadge`. Also fixed a real pre-existing gap while at it: mobile's TanStack Query cache was never cleared on logout (`AuthContext.jsx`'s `signOut()` now calls `queryClient.clear()`), so a new login could briefly surface the previous account's cached data.

**Mobile application tracking timeline:** vendor mobile app's `ApplicationDetailScreen.jsx` gained a Shopee-style vertical tracking timeline (`mobile/src/components/Timeline.jsx` + `mobile/src/utils/applicationTimeline.js`). Required three new nullable columns on `applications` — `approved_at`, `rejected_at`, `permit_uploaded_at` (`server/migrations/2026-09-08-application-status-timestamps.sql`) — since the backend previously tracked only current status, not *when* a decision was made. `approved_at`/`rejected_at` are stamped **only** by an admin's explicit `PATCH /api/applications/:id` status change, deliberately not by the auto-termination paths, so a system termination stays visually distinct from a reviewed rejection on the timeline.

**Admin loading states:** every Approve/Reject button in the admin application-review flow (`AdminApplicationDetails.jsx`, and all three occurrences in `AdminDashboard.jsx` — the quick-action list, the applications table, and the detail modal) now shows a spinner and disables itself while the request is in flight, preventing double-submits.

**Stall "vacant" bug — root cause and fix:** stalls with an approved vendor were still showing "vacant." Root cause was two-fold: (1) `SuperAdminDashboard.jsx` trusted the stored `stalls.status` column instead of computing occupancy from approved applications the way `AdminMapView.jsx`/`Analytics.jsx` already correctly do — fixed by adding `getStallDisplayStatus()` there too, and removed "Occupied" as a manually-settable dropdown option (it's derived now, not typed in); (2) the raw `stalls.status` column itself was never kept in sync by the backend at all. Added `syncStallOccupancy()` in `server/src/index.js` (checks for any approved application on the stall, sets `status` to `occupied`/`vacant`, always preserving a manually-set `unavailable`) and wired it into every place `applications.status` can flip to/from `approved`: admin approve/reject, both auto-termination sweeps, deleting an application record directly, and the vendor-account-termination bulk-reject path. Backfilled the 5 stalls that were already wrong at the time.

**Walk-in Application (new admin feature):** new sidebar tab (`/admin/walk-in`, admin role only) for filing an in-person application, with two pill sub-panels reusing the same tab visual pattern as "Reports & Requests":
- **Create Vendor** — reuses `POST /api/users` (the same pending-invitation + email-confirmation mechanism super-admin's "Create User" already uses) completely unchanged, just with the payload's `role` hardcoded to `"vendor"` and no role picker rendered. A vendor created here is **not** immediately selectable in "Apply for Stall" — same as any other account created through this mechanism, they must confirm via email first. The two panels are deliberately decoupled, not a single wizard.
- **Apply for Stall** — 3-step flow (pick vendor → pick stall via the existing `AddStallMapPicker`, reused unchanged → fill the application, same fields/validation as the self-service `ApplicationForm.jsx`, whose `BUSINESS_TYPES`/`TERM_OPTIONS` constants were exported for reuse rather than duplicated). Required opening up `POST /api/applications` (previously vendor-only, always used `req.auth.sub` as `user_id`) to also accept `admin`/`super_admin` callers with an optional `vendorId` in the body — validated server-side as `role = 'vendor' AND is_archived = false` before use; a vendor caller's own `vendorId` (if ever sent) is always ignored, so a vendor can never file as someone else. Also added an opt-in `activeOnly=true` filter to `GET /api/users` so the vendor picker excludes terminated accounts without changing that endpoint's default behavior for other callers. All three security-relevant behaviors (vendor resolution, archived-vendor rejection, vendor-can't-spoof) were verified live via curl before any UI was built, then the full flow (create vendor → search → pick stall on the map → submit) was verified end-to-end via Playwright with zero console errors.
