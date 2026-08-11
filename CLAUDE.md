# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is PubMark?

PubMark is a smart public-market stall management PWA (Progressive Web App) built in React 18, TypeScript, and Vite. Four roles access it: vendors (apply for/manage market stalls), officers (inspections and violation reports), admins (day-to-day operations), and super-admins (users, maps, inventory, analytics, archives). The interactive Leaflet map lets users draw and manage stall polygons.

**⚠️ Architectural status (critical):** the application is mid-migration from browser `localStorage` to a real backend. **Only login and registration talk to the MySQL API**—everything else (stalls, applications, transfers, violations, inventory, etc.) still reads/writes `localStorage` directly via domain-specific store modules. Do not assume `database.md` describes a running feature; that file documents the *future* Supabase/PostgreSQL target, not the current backend. For exhaustive current architecture, design system, routes, and known gaps, read [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) (updated continuously as a working AI handoff doc).

## Commands

**Frontend (root directory):**
- `npm install` — install frontend dependencies
- `npm run dev` — start Vite dev server (http://localhost:5173)
- `npm run build` — production build to `dist/`

**Backend (`server/` directory, separate package.json):**
- `npm install` — install backend dependencies (run inside `server/`)
- `npm run seed` — populate MySQL with demo accounts (`admin@pubmark.com`, `officer@pubmark.com`, etc.)
- `npm run dev` — start Express API server (http://localhost:4000)
- `npm run start` — production start

**Setup order:**
1. Root `.env.local` from `.env.example` with `VITE_API_BASE_URL=http://localhost:4000/api`.
2. MySQL database: create schema, run `server/mysql-schema.sql`, then `npm run seed` inside `server/`.
3. Root `npm install && npm run dev` (frontend) in parallel with `cd server && npm install && npm run dev` (backend).

**No test runner, no lint script, no TypeScript type-check command exist yet.** TypeScript is used but not validated in CI.

## Architecture and state management

### localStorage → MySQL migration

The **only backend endpoints** are auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`); they use bcrypt password hashing, JWT signed cookies (`pubmark_session`, 8-hour expiry), and MySQL-backed user profiles. Everything else is still `localStorage`. When you migrate a feature (e.g., stalls, applications, transfers, violations, check requests, inventory, announcements, or perimeter):

1. Add a typed API route to `server/src/index.js` with role checks.
2. Add a typed fetch client function to `src/app/services/api.ts`.
3. Replace all consumers of the legacy `localStorage` store with API calls.
4. Do not dual-write; migrate every consumer before removing the `localStorage` fallback.
5. Preserve the UUID/snake_case conventions so the eventual Supabase migration is straightforward.

### Routes and role-gating

All routes are defined in [`src/app/routes.tsx`](./src/app/routes.tsx) and gated by `ProtectedRoute` (checks a cached client profile, no per-route server validation yet — known gap). The four roles route to:
- Vendor: `/dashboard`, `/dashboard/map`, `/apply/:stallId`, `/applications/:id`, etc.
- Officer: `/officer`, `/officer/map`, `/officer/violations`, `/officer/log`.
- Admin: `/admin`, `/admin/map`, `/admin/stalls`, `/admin/applications/:id`, etc.
- Super-admin: `/super-admin` + `/users`, `/map`, `/settings`, `/violations`, etc.

Shared: `/analytics`, `/archive` (admin + super-admin).

`DashboardLayout` is the role-aware shell (sidebar navigation, header, logout).

### Domain state modules

Each feature area has its own store module under `src/app/components/`:

| Module | Entity |
|--------|--------|
| `stallsStorage.ts` | drawn stalls, geometry, CRUD |
| `applicationsStorage.ts` | vendor applications, status, permits |
| `transferStorage.ts` | vendor stall transfers |
| `violationsStore.ts` | violations, evidence, resolve/dismiss |
| `checkRequestsStore.ts` | inspections and completion files |
| `inventoryStore.ts` | inventory items, low-stock |
| `announcementsStore.ts` | admin announcements |
| `archiveStore.ts` | archived records |
| `perimeterStore.ts` | one market boundary polygon |

Maps (`AdminMapView`, `SuperAdminMapEditor`, `OfficerMapView`, `AdminCheckRequestMap`) all write to these stores. There is no Redux, Zustand, or React Context—state is per-feature `localStorage`. When building new features, follow this pattern: one store module per entity, JSON serialize/deserialize via `localStorage`.

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

`vite.config.ts` includes a custom `figma-asset-resolver` for `figma:asset/...` imports. **Do not remove the React or Tailwind plugins** and **never add `.css`, `.tsx`, or `.ts` to `assetsInclude`** (these notes are in the config itself).

### Environment variables

| File | Variables |
|------|-----------|
| Root `.env.local` | `VITE_API_BASE_URL` (e.g., `http://localhost:4000/api`); future Supabase vars (unused) |
| `server/.env` | `PORT=4000`, `CLIENT_ORIGIN`, MySQL creds, `JWT_SECRET` — **never commit** |

**Never expose `MYSQL_PASSWORD` or `JWT_SECRET`.** Do not commit `.env*` files (they are gitignored).

### High-impact files

- `src/app/routes.tsx` — changes here affect every route.
- `src/app/components/ProtectedRoute.tsx` — guards all authenticated pages.
- `src/app/components/DashboardLayout.tsx` — the shared sidebar/header; affects visual consistency.
- `src/styles/theme.css`, `src/styles/tailwind.css`, `src/styles/fonts.css` — design tokens and global styles.
- `server/mysql-schema.sql` — preserve UUIDs, relationships, and role semantics.
- `database.md` — reference for future Supabase migration; not the current backend.

### Common gotchas

1. **Only auth hits the API.** If a feature uses `applicationsStorage.ts`, it's still `localStorage`, not persisted to MySQL.
2. **Cached profile can outlive server session.** `ProtectedRoute` checks the UI cache, not a live server call. `GET /api/auth/me` is not called on every route (known gap).
3. **Maps share geometry with stores.** Editing a stall polygon updates `stallsStorage` directly. Perimeter editing updates `perimeterStore`.
4. **Figma origin.** Root `package.json` name is `@figma/my-make-file` and `vite.config.ts` has Figma-specific tooling. This was scaffolded from a Figma "Make" export; `src/imports/` has Figma images (reference only, not executed by the build).
5. **No server `.env.example`.** The existing `server/.env` file has no checked-in template—copy from `root/.env.example` and update MySQL creds and `JWT_SECRET` manually.

### Reference files

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — detailed AI handoff doc with design system, routes, business rules, screens, known gaps, and instructions for the next session.
- [`MYSQL_TRANSITION.md`](./MYSQL_TRANSITION.md) — notes on the temporary MySQL backend and the planned Supabase migration order.
- [`database.md`](./database.md) — future Supabase/PostgreSQL schema, RLS, Storage policies (not current backend).
- `server/README.md` — backend setup steps.
