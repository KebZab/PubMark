# PubMark — Project Context and AI Handoff

## 1. Executive summary

PubMark is a smart public-market stall management PWA. It serves four roles:
vendors apply for and manage market stalls; officers perform inspections and
report violations; admins manage day-to-day market operations; super-admins
manage users, maps, inventory, analytics, and archives. The interface is a
React/Vite/TypeScript wireframe with an interactive Leaflet market map.

**Current architectural status (important):** the application is in a backend
migration. Login and registration now call the temporary MySQL HTTP API, but
the majority of domain pages and stores still use browser `localStorage`.
MySQL schema files describe the intended temporary database, but API endpoints
exist only for authentication. Do not claim that applications, stalls, files,
or other workflows are already persisted to MySQL. `database.md` is the
future Supabase/PostgreSQL reference, not the running backend.

## Current session progress (2026-08-12)

- Added the temporary Express/MySQL authentication service under `server/`.
  It implements login, vendor registration, session lookup, logout, bcrypt
  password hashing, and an 8-hour HTTP-only JWT cookie.
- Added the temporary MySQL schema and `seed-demo-users.js`. The seed script
  was run successfully against the configured local database, so these demo
  accounts now exist: `admin@pubmark.com`, `juan@example.com`,
  `officer@pubmark.com`, and `superadmin@pubmark.com`. Their passwords remain
  the documented demo values; do not use them in production.
- Added `src/app/services/api.ts` and changed Login/Register to use the MySQL
  API. Operational stores are still browser-local and remain the next
  migration phase.
- Added PWA shell assets: `public/manifest.webmanifest`, `public/sw.js`,
  `public/icon.svg`, and `PWAInstallPrompt`. The production frontend build
  passed after these changes.
- Fixed local-development CORS: the server accepts localhost/127.0.0.1 on
  Vite ports 5173 and 5174, as well as any comma-separated origins in
  `CLIENT_ORIGIN`. The preflight response for `http://localhost:5174` was
  verified successfully.
- Local configuration files currently exist at root `.env.local` and
  `server/.env`. They intentionally contain no documented secrets here.
  `server/.env.example` is currently absent from the working directory; do
  not rely on it until a sanitized template is recreated.
- For a second device, export/import the `pubmark` schema and data in MySQL
  Workbench, copy the project, configure that device's local API and frontend
  env files, then run its own MySQL/API/Vite processes. This produces an
  independent local database copy, not synchronization.
- Registration now includes a required Terms and Agreement section on
  `src/app/pages/Register.tsx`. The tenant rules are rendered from
  `src/app/content/tenantTerms.ts`, and account creation is blocked until the
  user accepts them.
- Signup feedback was improved in `Register.tsx`: validation now scrolls to
  the first blocking field and surfaces clearer visible error messages instead
  of failing silently when a required field or agreement checkbox is missed.
- The vendor contract print view in `src/app/components/ContractModal.tsx`
  was reworked into a formal multi-page lease layout based directly on the
  scanned contract pages provided during this session. The current template is
  intentionally aligned to the supplied page images rather than the previous
  modern card-style document.
- Vendor contract actions on `src/app/pages/UserDashboard.tsx` were adjusted
  so that contract termination now opens a choice modal asking whether the
  vendor wants to transfer the contract or terminate it outright. The old
  separate transfer entry point in that dashboard flow was removed in favor of
  this combined decision step.
- Contract transfer email lookup no longer depends on legacy browser
  `localStorage` users. A new backend route,
  `GET /api/auth/users/by-email`, was added in `server/src/index.js`, and the
  transfer flows in `UserDashboard.tsx` and `ApplicationDetails.tsx` now use
  `findUserByEmail()` from `src/app/services/api.ts` so existing MySQL-backed
  accounts can be found correctly.

## 2. Architecture

```text
Browser / installed PWA
  ├─ React 18 + React Router 7 pages and components
  ├─ Tailwind 4 CSS/theme + Radix/shadcn-style primitives
  ├─ Leaflet/react-leaflet maps
  ├─ localStorage legacy stores (most operational data, transitional)
  └─ HTTP API client (login/register only today)
          ↓ credentials: include; httpOnly cookie
Express API (`server/src/index.js`)
  ├─ CORS and JSON middleware
  ├─ bcryptjs password verification/hashing
  ├─ JWT signed 8-hour `pubmark_session` cookie
  └─ mysql2 pool
          ↓
Temporary MySQL `pubmark` database

Future: replace API/service implementation and MySQL with Supabase Auth,
PostgreSQL, Storage, RLS, and Realtime; preserve UI/domain interfaces.
```

There is no Redux, Zustand, React Context, test suite, CI/CD configuration,
Docker setup, or deployment configuration in the available files.

## 3. Repository structure

```text
Stall Management System Wireframe/
├─ src/
│  ├─ main.tsx                         React/PWA bootstrapping
│  ├─ app/
│  │  ├─ App.tsx, routes.tsx            root and browser-router routes
│  │  ├─ pages/                         16 role-oriented screens
│  │  ├─ components/                    domain, map, layout, legacy stores
│  │  │  ├─ ui/                         Radix/shadcn-style primitive library
│  │  │  └─ figma/ImageWithFallback.tsx
│  │  └─ services/                      MySQL API client; legacy/Supabase work
│  ├─ styles/                           Tailwind imports, tokens, fonts, motion
│  └─ imports/                          Figma-export images and reference notes
├─ public/                              PWA manifest, service worker, SVG icon
├─ server/                              temporary Express + MySQL API
│  ├─ src/index.js                      implemented auth endpoints
│  ├─ mysql-schema.sql                  intended temporary schema
│  ├─ seed-demo-users.js                bcrypt demo-account seed script
│  └─ README.md, package.json, package-lock.json
├─ database.md                          detailed future Supabase schema/RLS plan
├─ MYSQL_TRANSITION.md                  MySQL → Supabase migration notes
├─ package.json, package-lock.json      frontend dependencies/scripts
├─ vite.config.ts, postcss.config.mjs, pnpm-workspace.yaml
├─ index.html, default_shadcn_theme.css, ATTRIBUTIONS.md, README.md
└─ guidelines/Guidelines.md             uncustomized guidance template
```

`src/imports/image*.png` are Figma-exported visual assets. The pasted HTML
and project overview in `src/imports/pasted_text/` are reference material,
not executed by Vite. `default_shadcn_theme.css` is a reference theme file,
not imported by `src/main.tsx`.

## 4. Technology stack and dependencies

Frontend: React 18.3.1, React DOM 18.3.1, TypeScript/TSX, Vite 6.3.5,
`@vitejs/plugin-react` 4.7.0, Tailwind CSS 4.1.12 with `@tailwindcss/vite`,
and React Router 7.13.0. Package scripts are `npm run dev` (`vite`) and
`npm run build` (`vite build`). There is no test script.

Important runtime dependencies:

| Dependency | Version | Use |
|---|---:|---|
| `react-router` | 7.13.0 | browser router, navigation, route guards |
| `leaflet`, `react-leaflet`, `leaflet-draw` | ^1.9.4, ^4.2.1, ^1.0.4 | maps, drawn stall/perimeter geometry |
| `lucide-react` | 0.487.0 | primary icon system |
| Radix packages | 1.x/2.x | accessible bases for `components/ui` |
| `class-variance-authority`, `clsx`, `tailwind-merge` | listed in package.json | UI class variants/merging |
| `react-hook-form` | 7.55.0 | available UI form primitive dependency |
| `recharts` | 2.15.2 | available chart dependency; Analytics uses custom SVG/HTML charts |
| `motion`, `tw-animate-css`, `vaul`, `sonner` | listed | animation/drawer/toast ecosystem; custom Toast is used |
| MUI/Emotion | listed | installed but not established as the main screen design system |

Backend dependencies are isolated in `server/package.json`: Express 4.21.2,
mysql2 3.12.0, bcryptjs 2.4.3, jsonwebtoken 9.0.2, cors 2.8.5, dotenv 16.4.7.
They must be installed inside `server` separately. The official Supabase JS
package is **not** installed; `src/app/services/supabase.ts` is a hand-written
future REST adapter and is not currently imported by application screens.

## 5. Configuration and execution

Frontend environment (`.env.local`, created from `.env.example`):

```text
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SUPABASE_URL=<future / optional>
VITE_SUPABASE_PUBLISHABLE_KEY=<future / optional>
```

Backend environment (`server/.env`; recreate its sanitized template before
sharing the project because `server/.env.example` is currently absent):

```text
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=pubmark
MYSQL_USER=pubmark_app
MYSQL_PASSWORD=<REDACTED>
JWT_SECRET=<REDACTED>
```

Setup: run `npm install` and `npm run dev` in the repository. For MySQL, run
`mysql-schema.sql`, then in `server`: `npm install`, `npm run seed`, and
`npm run dev`. Run `npm run build` at root for production output. Deployment
platform and production host are unknown/not configured. HTTPS is required for
PWA installation and secure production cookies.

`vite.config.ts` supplies React, Tailwind, a Figma asset resolver, `@` →
`src`, and SVG/CSV asset handling. Tailwind v4 scans `src/**/*.{js,ts,jsx,tsx}`
from `src/styles/tailwind.css`; there is no standalone Tailwind config.

## 6. Database and legacy state

### MySQL (intended temporary backend)

Database name: `pubmark`. `server/mysql-schema.sql` creates `profiles`,
`stalls`, `applications`, `transfers`, `termination_requests`, `violations`,
`violation_evidence`, `violation_requests`, `check_requests`,
`check_request_files`, `announcements`, `inventory_items`, `archive`, and
`market_perimeter`. IDs are `CHAR(36)` UUID strings. Relationships are:

```text
profiles ──< applications >── stalls
profiles ──< transfers (sender/recipient) >── stalls
profiles ──< termination_requests >── stalls?
profiles (officer) ──< violations >── stalls
violations ──< violation_evidence
profiles ──< check_requests >── stalls; check_requests ──< files
profiles ──< announcements / archive / market_perimeter
```

Core constraints are email uniqueness, enum roles/statuses, foreign keys, and
timestamp defaults. No additional indexes are declared beyond PKs/unique email.
The SQL does not create a general file-object store; `storage_path` fields
assume an external storage provider. The only implemented MySQL queries are
profile lookup, profile creation, and profile lookup by JWT subject.

### Legacy browser stores (currently used by operational UI)

| Key / module | Main entity and actions |
|---|---|
| `pubmark_users`, `authStorage.ts` | legacy users/profile cache, user CRUD, seeded users |
| `pubmark_stalls`, `stallsStorage.ts` | drawn stall CRUD and geometry |
| `pubmark_applications`, `applicationsStorage.ts` | application CRUD/status/permit metadata; date helpers |
| `pubmark_transfers`, `transferStorage.ts` | vendor transfer records |
| `pubmark_termination_requests`, `terminationRequestsStore.ts` | account/contract termination requests |
| `pubmark_violations`, `violationsStore.ts` | violations, evidence metadata, resolve/dismiss |
| `pubmark_violation_requests`, `violationRequestStore.ts` | officer assignment requests |
| `pubmark_check_requests`, `checkRequestsStore.ts` | inspections and completion files |
| `stall_announcements`, `announcementsStore.ts` | seeded/admin announcements |
| `pubmark_inventory`, `inventoryStore.ts` | inventory CRUD and low-stock derivation |
| `pubmark_archive`, `archiveStore.ts` | seeded archive, archive/delete/restore |
| `pubmark_perimeter`, `perimeterStore.ts` | one market boundary geometry |
| UI-only | `pubmark_seen_decisions`, `pubmark_pending_toast` |

`legacyMigration.ts` exports these records as versioned JSON, validates basic
shape, and downloads a backup. It does not yet perform MySQL import. See
`database.md` for exhaustive planned Supabase tables, SQL, Storage policies,
views, RLS sketch, and migration order.

## 7. API, authentication, and security

Only these API endpoints exist:

| Method/route | Auth | Purpose / result |
|---|---|---|
| `POST /api/auth/login` | none | `{email,password}`; bcrypt-compare `profiles.password_hash`; 401 invalid; returns `{profile}` and sets JWT cookie |
| `POST /api/auth/register` | none | vendor name/email/password/phone/address; validates required values/minimum password; 201 profile, 409 duplicate email |
| `GET /api/auth/me` | JWT cookie | returns current profile; 401 missing/invalid/account absent |
| `GET /api/auth/users/by-email?email=...` | JWT cookie | returns a matching profile for transfer lookup; 404 if no account exists |
| `POST /api/auth/logout` | none | clears cookie and returns `{ok:true}` |

`api.ts` uses `fetch` with `credentials: "include"`, JSON bodies, and a
required `VITE_API_BASE_URL`. Login/Register pages call it. The server signs a
JWT `{sub, role}` for 8 hours, stores it in the httpOnly `pubmark_session`
cookie, and sets `secure` only for production. The UI caches the server profile
in `pubmark_profile_cache` because `ProtectedRoute` is synchronous; this cache
is **not** authoritative and is not validated on application boot yet.

`ProtectedRoute.tsx` checks cached session and permits role(s), otherwise
redirecting to `/` or the role home: vendor `/dashboard`, officer `/officer`,
admin `/admin`, super-admin `/super-admin`. Current server authorization only
checks authentication; it has no role middleware on domain endpoints because
those endpoints do not exist yet.

Security concerns/technical debt: legacy `authStorage.ts` still stores plain
demo `passwordHash` values and remains consumed by old screens; remove it when
all data stores are API-backed. The API does not have rate limiting, CSRF
protection, password reset, email verification, cookie-parser middleware,
production error logging, upload validation, or role enforcement beyond JWT
issuance. Do not expose `MYSQL_PASSWORD` or `JWT_SECRET`.

## 8. Routes and user journeys

Public: `/` Login; `/register` Registration (optional `stallId` query);
`/map` Guest map. Vendor-only: `/dashboard`, `/dashboard/map`,
`/dashboard/applications`, `/dashboard/notices`, `/apply/:stallId`,
`/applications/:id`, `/transfer-accept/:transferId`. `/application/:id`
redirects to vendor dashboard. Admin-only: `/admin`, `/admin/map`,
`/admin/stalls`, `/admin/applications`, `/admin/vendors`,
`/admin/announcements`, `/admin/applications/:id`, `/admin/application/:id`,
`/admin/violations`, `/admin/check-requests`. Super-admin-only:
`/super-admin` plus `/users`, `/map`, `/settings`, `/violations`,
`/check-requests`, `/stalls`, `/applications`. Officer-only: `/officer`,
`/officer/map`, `/officer/violations`, `/officer/log`. Shared admin/super-admin:
`/analytics`, `/archive`.

```text
Guest → Login / Register / Guest Map
Vendor → Dashboard → Map → Application Form → Application Detail → Transfer/termination
Officer → Dashboard → Assigned checks/map → completion or violation report
Admin → Dashboard tabs → applications, maps/stalls, requests, announcements
Super-admin → dashboard tabs → users, map/perimeter, inventory, analytics/archive
```

## 9. Screens and important components

| File | Function and visual/UI notes |
|---|---|
| `pages/Login.tsx` | two-column teal brand card on large screens, single form on mobile; email/password, show-password, API errors, mock disabled Google button, demo-fill pills, guest/register links |
| `pages/Register.tsx` | matching responsive teal/auth layout; field-level name/email/PH-phone/address/password validation; required tenant-terms agreement; improved error focus/visibility; calls API, then redirect dashboard or selected stall |
| `pages/GuestMapView.tsx` | public Leaflet map of legacy drawn stalls; right-side detail/registration prompt |
| `pages/UserDashboard.tsx` | vendor mobile-first dashboard: welcome/stats, applications/notices/map tab, unread decision derivation, and combined transfer-vs-termination contract action flow |
| `pages/UserMapDashboard.tsx` | authenticated vendor map; colors from user application and global occupancy; stall selection/apply CTA |
| `pages/ApplicationForm.tsx` | vendor application form, contract-date calculation, duplicate active-application guard, file metadata only |
| `pages/ApplicationDetails.tsx` | phone-width detail view, status timeline/permit actions/withdraw and transfer/termination affordances |
| `pages/TransferAcceptForm.tsx` | vendor transfer accept/decline form and validation |
| `pages/AdminDashboard.tsx` | broad desktop operational dashboard: stat cards, app decisions, announcements, vendors, stalls/maps, violations and requests |
| `pages/AdminApplicationDetails.tsx` | review/decision detail for an application |
| `pages/OfficerDashboard.tsx` | officer work dashboard using map/check/violation state and file input for evidence |
| `pages/SuperAdminDashboard.tsx` | management dashboard for users, map/perimeter, stalls, inventory, violations, settings/analytics links |
| `pages/StallManagement.tsx` | stall list, contract expiry, filters and details |
| `pages/CheckRequests.tsx` | admin/super-admin inspection-request selection and actions |
| `pages/Analytics.tsx` | locally derived analytics with custom grouped/horizontal/donut charts and period selector |
| `pages/ArchiveManagement.tsx` | archived record list, restore/delete controls |
| `components/DashboardLayout.tsx` | shared role-aware desktop sidebar/header/user/logout shell; high-impact navigation component |
| `components/AdminMapView.tsx` | Leaflet draw/edit/delete stalls, contract modal, floor and perimeter display; writes legacy stores |
| `components/OfficerMapView.tsx` | map/selected-stall inspection and evidence workflow |
| `components/AdminCheckRequestMap.tsx` | map-based inspection-request creation |
| `components/SuperAdminMapEditor.tsx` | perimeter drawing/editing |
| `components/StallManagementPanel.tsx` | stall management panel/contract modal; `ContractModal.tsx` supports formal multi-page lease printing |
| `components/FloorSwitcher.tsx` | two-floor segmented selector/counts |
| `components/ProtectedRoute.tsx` | client role guard |
| `components/Toast.tsx` | event-driven bottom-right 4-second toast stack |
| `components/PWAInstallPrompt.tsx` | browser install prompt, bottom-left card |

`components/ui/` contains reusable generated shadcn-style primitives:
accordion, alert/alert-dialog, aspect-ratio, avatar, badge, breadcrumb,
button, calendar, card, carousel, chart, checkbox, collapsible, command,
context-menu, dialog, drawer, dropdown-menu, form, hover-card, input,
input-otp, label, menubar, navigation-menu, pagination, popover, progress,
radio-group, resizable, scroll-area, select, separator, sheet, sidebar,
skeleton, slider, sonner, switch, table, tabs, textarea, toggle,
toggle-group, tooltip, `use-mobile`, and class utility `utils.ts`. Inspect
their consumers before changing them; many are installed infrastructure rather
than used by all screens.

## 10. Design system

**Design language.** Professional, approachable municipal/market-management
UI: white surfaces on very pale gray/teal backgrounds, teal action hierarchy,
soft 12–16px rounded corners, thin gray borders, restrained shadows, Lucide
line icons, status-color badges, and dense but readable operations tables.
Desktop admin screens favor sidebar + content grids. Vendor detail/form pages
often constrain to `max-w-md` for phone-first use. Responsive utility use is
mostly `sm:` and `lg:`; exact breakpoints follow Tailwind defaults (640px and
1024px).

**Tokens (`src/styles/theme.css`).**

| Token | Light value |
|---|---|
| `--background`, `--foreground` | `#fafafa`, `#1f2937` |
| `--card`, `--popover` | `#ffffff` |
| `--primary`, `--ring` | `#14B8A6` |
| primary foreground | `#ffffff` |
| secondary/muted/accent | `#f3f4f6` / `#f9fafb` / `#e5e7eb` |
| muted text, border | `#6b7280`, `#e5e7eb` |
| destructive/success/warning | `#ef4444` / `#10b981` / `#f59e0b` |
| charts 1–5 | teal, blue `#3b82f6`, violet `#8b5cf6`, amber, red |
| base radius | `0.75rem` (12px) |

The action gradient repeatedly used by screens is `#14B8A6 → #0d9488`.
Dark token values exist under `.dark`, but no visible theme switch or persisted
dark-mode behavior is confirmed. Base font size is 16px; theme headings map
to Tailwind `2xl`, `xl`, `lg`, `base` with 500 weight and 1.5 line height.

**Typography and spacing.** `fonts.css` loads Inter weights 400–800, followed
by platform sans-serif fallbacks. Screens commonly use `text-xs`/`text-sm` for
labels and metadata, `text-2xl` for main headings, semibold/bold for important
figures, `p-4`/`p-5`/`p-6` cards, `gap-2`/`gap-3` controls, and `gap-4`/`gap-5`
section grids. Labels sit above inputs with ~6px bottom gap. Inputs generally
use `px-4 py-3`, gray-50 background, 1px gray-200 border, 12px radius, teal
2px focus ring. Form errors are red text and red-300/red-50 field treatment.

**Components/states.** Primary buttons are white text on teal gradient,
usually `py-3`/`py-3.5`, rounded-xl, teal shadow, hover larger shadow/very
small scale, and disabled opacity/cursor. Secondary controls are white/gray
or border outlines. Cards are white, `rounded-xl` or `rounded-2xl`,
`border-gray-200`, `shadow-sm`; hoverable cards gain shadow/border emphasis.
Status uses teal/emerald approval/success, amber pending/warning, red rejected
or destructive, violet for special transfer/contract contexts, and gray for
inactive values. Toasts are fixed bottom-right; install card bottom-left.
Animations include fade/zoom utilities at 200ms plus Tailwind transitions and
spinner classes. There are no page-transition animations.

**Navigation and responsiveness.** `DashboardLayout` has a role-sensitive
left sidebar and header for desktop. Auth branding panels are hidden below
`lg`; forms become full-width. Many mobile flows use `max-w-md mx-auto`,
stack buttons with `flex-col sm:flex-row`, and change grids from one/two
columns to four columns at desktop. Map views retain Leaflet interaction;
mobile evidence uses a normal file input (some flows programmatically click
it). No dedicated bottom-nav component is confirmed.

**Accessibility.** Native labels and semantic buttons/inputs are common;
Lucide controls sometimes have accessible text, and the PWA dismiss button has
`aria-label`. Existing issues: no systematic keyboard/focus audit, some icon
buttons may lack labels, custom Leaflet controls are not guaranteed accessible,
color may communicate state alongside text inconsistently, and disabled/mock
Google sign-in is visually present but nonfunctional.

## 11. Core workflows and business rules

- **Login:** form → `api.login` → API profile/password check → httpOnly cookie
  + profile cache → role-home navigation + pending success toast. Failure is an
  inline red error. The visible demo pills only fill credentials.
- **Registration:** client validates required fields, 11-digit `09…` phone,
  ≥6-character password, confirmation; API creates vendor profile with bcrypt
  hash; user is cached and navigated to dashboard or `/apply/:stallId`.
- **Legacy applications:** vendor selects a vacant drawn stall, form pre-fills
  legacy session identity, calculates end date with `addMonths`, rejects a
  second pending/approved application for the same stall, saves metadata; admin
  approves/rejects. Approval drives occupancy/UI colors. Actual binary files
  are not stored—only names/sizes.
- **Inspections/violations:** admin creates/assigns check requests; officer
  completes with notes/files and can report a violation; admin resolves or
  dismisses. These are local-only today.
- **Map management:** admins/super-admins draw polygons/rectangles and edit
  metadata; geometry is stored as JSON/GeoJSON-like objects. Floor defaults to
  `"1"`; perimeter is a separate single stored object.
- **Unread decisions:** application detail marks IDs in
  `pubmark_seen_decisions`; dashboard counts approved/rejected IDs not seen.

## 12. Known gaps, bugs, and safe modification guidance

### Confirmed incomplete work

1. Most domain stores/pages remain localStorage-backed; only auth reaches
   MySQL. Add authenticated role-checked endpoints and async repositories,
   then migrate one feature at a time.
2. MySQL server dependencies are not part of root install and must be installed
   inside `server`. The frontend build does not verify server runtime.
3. No legacy JSON import API, object/file upload API, test suite, PWA offline
   data support, password reset, email verification, or deployment config.
4. Supabase adapter/import function references future infrastructure and is
   unused; do not enable it without credentials/RLS/Edge Function deployment.

### Potential issues (verify before fixing)

- Cached UI profile can survive server-cookie expiry, so protected pages may
  render until a real API call fails. Add boot-time `/auth/me` validation.
- Existing logout callers invoke synchronous `clearSession()` and do not call
  API logout; update them when completing auth migration.
- `server/src/index.js` parses the cookie header manually rather than using a
  tested cookie middleware. Add CSRF/rate limiting before public deployment.
- The service worker caches shell/assets but intentionally does not cache API
  data; failed network fetches do not have a dedicated offline UI.
- Figma-derived source contains mojibake in some old comments/text. Check user
  visible strings before broad encoding edits.

### High-impact files

`routes.tsx` changes reach every navigation path. `authStorage.ts` and
`ProtectedRoute.tsx` affect access everywhere. `DashboardLayout.tsx`,
`theme.css`, `tailwind.css`, and `fonts.css` affect visual consistency.
Map components share geometry/storage assumptions. `mysql-schema.sql` and
`database.md` are database-sensitive; preserve IDs, relationships, and role
semantics. Inspect all imports/consumers before editing shared UI primitives.

## 13. Instructions for another AI session

1. Read this file first, then inspect the actual target files before editing.
2. Preserve current flows and teal/white Inter design unless redesign is
   explicitly requested. Reuse shared components and Tailwind patterns.
3. Treat the MySQL backend as authentication-only until an endpoint is proven
   in `server/src/index.js`; do not silently assume schema equals API support.
4. When migrating a local store, define typed API responses, implement server
   authentication and role authorization, migrate every consumer, and retain a
   validated backup/import path. Do not dual-write indefinitely.
5. Check all routes and role behavior after auth/layout changes. Never expose
   env secrets, hashes, JWT secrets, or database credentials.
6. Keep UUID IDs and snake_case database conventions to make the eventual
   Supabase migration straightforward. Update this document after material
   architecture, schema, route, or design-system changes.

## 14. Verification checklist

- Project overview, architecture, stack, structure, configuration, routes,
  auth, API, state, database, PWA, assets, and setup are documented.
- Design tokens, typography, layout, responsive behavior, components, states,
  accessibility, and screen-level behavior are documented.
- Confirmed facts are separated from planned MySQL/Supabase work and known
  gaps. Unknown deployment/testing infrastructure is explicitly identified.
