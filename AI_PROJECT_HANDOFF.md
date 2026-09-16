# PubMark — AI and device-transfer handoff

Reviewed: September 10, 2026.

September 16 update: Cloudflare launcher integration has been removed. Root
`npm run dev` starts web and API only; server `npm run dev` runs Node with watch.
The Supabase Auth identity mapping, 40 legacy Auth accounts, and the cloud Edge
API are now deployed. Mobile production defaults to that API, so it no longer
requires a local Node process. A signed replacement preview APK was built on
EAS and downloaded under `mobile/builds/`. The direct Data API/RLS cutover
remains incomplete. See
[CLOUD_MIGRATION_AUDIT.md](CLOUD_MIGRATION_AUDIT.md) for dependencies and blockers.
This update supersedes the historical tunnel descriptions below.

## Read this first

PubMark manages a public market in Murcia, Negros Occidental. It has a React web application, an Express API using PostgreSQL, an Expo mobile application, and a separate browser-only stall-map editor.

The four system roles are `vendor`, `officer`, `admin`, and `super_admin`. Authentication is custom bcrypt/JWT authentication, **not Supabase Auth**. Supabase supplies PostgreSQL hosting and private file storage. The standalone map does **not** use Supabase or the API.

This handoff is based on a repository inventory, a text-source scan, and inspection of important runtime, configuration, documentation, and migration paths. It is not a line-by-line security audit or a verification of the live database. Generated dependencies/builds, private environment files, credential files, and database dumps were excluded. Read the specific implementation before changing it.

### Five things the next AI must know

1. Root, `server/`, and `mobile/` are separate npm packages; install their dependencies separately.
2. Older documents describe obsolete MySQL, local-only archives, and cached-only authorization. Current code takes precedence.
3. Browser localStorage does not move with the project folder. Export the standalone map on the original device first.
4. The current generated map baseline is **300 stalls plus two non-stall facilities**. It is not a capture of the owner's current browser storage.
5. Database credentials may connect to shared real data. Do not seed, migrate, import, delete, or run business-flow checks against it without permission.

## Transfer to another device

### On the original device

- In the browser/profile where the standalone map was edited, open `local-stall-map.html`, then use **Export JSON** and **Export Markdown**. Keep both exports with the transfer. Export includes all floors, regardless of the current filter.
- Copy the project source, package manifests, lockfiles, migrations, assets, and this handoff. Preserve current uncommitted work; a clone alone will not include it.
- Do not copy `node_modules`, build outputs, `.expo`, or dependency caches. Reinstall on the destination.
- Review the transfer for private files. Share approved credentials separately and securely, not in this document or an ordinary project archive.
- If visual references are needed later, copy the original images separately. Several reference images are in the owner's Downloads folder, outside this repository.

### On the destination device

- Open the repository root in Codex. Root `AGENTS.md` directs the new agent to this file; if needed, explicitly ask it to read both.
- Install dependencies for each application being used, configure private environment files from the examples, and start the API and web app separately as described below.
- Open `local-stall-map.html` and **Import JSON** from the original browser export. Import replaces the destination map's objects; export any destination edits first.
- Compare the imported map and object counts with the original export. Merely seeing the default map does not prove custom edits were transferred.
- Configure Codex connectors and Expo account/build access independently. The original machine's credentials and sessions are not portable project configuration.

### Sensitive-file warning

`SECURITY_REMEDIATION_PLAN.md` identifies `mcpenv.txt` as containing credentials. Do not read its values into AI output or include it in a normal share. Existing Git history may contain secrets too; adding an ignore rule would not remove history.

The current `.gitignore` explicitly permits root `.env.local`; it also does not protect `mcpenv.txt`. Do not assume an archive or clone is secret-safe. Treat `.mcp.json`, real `.env*` files, and database dumps as private. Environment examples are safe templates, not working credentials. Credential rotation and history cleanup require separate coordination with the owner.

## Repository map

| Location | Purpose |
| --- | --- |
| `package.json`, `vite.config.js` | Web dependencies, commands, dev server and proxy |
| `src/main.jsx`, `src/app/App.jsx` | Web entry point and providers |
| `src/app/routes.jsx` | Web route and role definitions |
| `src/app/context/AuthContext.jsx` | Server-verified web session lifecycle |
| `src/app/services/` | API clients, auth storage, legacy migration helpers |
| `src/app/components/` | Dashboards, map editors, application and payment UI |
| `server/src/index.js` | Main Express API, authorization, workflows, uploads |
| `server/migrations/` | Incremental PostgreSQL migrations; not a full schema |
| `server/start-with-tunnel.js` | Optional API tunnel launcher that changes server env |
| `mobile/` | Separate Expo app with its own package and instructions |
| `local-stall-map.html` | Independent editable map with browser-local persistence |
| `scripts/export-local-map-markdown.mjs` | Default-map export generator and assertions |
| `LOCAL_STALL_LOCATIONS.md` | Large generated baseline coordinate/data reference |
| `local-map-assets/` | Earlier floor-plan reference assets |
| `SECURITY_REMEDIATION_PLAN.md` | Paused remediation proposal, not completed work |

Do not load the entire large coordinate markdown on every startup. Read it when coordinate/export work requires it.

## Local setup

### Runtime and packages

The review workstation used Node `24.15.0`; there is no single root workspace install. Keep the existing lockfiles and use `npm ci` in the relevant directories. Investigate lockfile errors instead of deleting locks or forcing upgrades. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

```powershell
# From the repository root
npm ci
npm ci --prefix server
# Only needed when working on mobile
npm ci --prefix mobile
```

Create private root `.env` and `server/.env` files using the corresponding `.env.example` files as templates. For mobile, use `mobile/.env.example`. Never put database passwords, JWT secrets, or Supabase service-role keys in `VITE_*` or `EXPO_PUBLIC_*` variables.

Root environment names:

- `VITE_API_BASE_URL`: API URL or `/api` when deliberately using a same-origin proxy.
- `VITE_GOOGLE_CLIENT_ID`: optional Google web OAuth client ID.

Server environment names:

- `PORT` (example: `4000`) and `CLIENT_ORIGIN` (comma-separated permitted web origins).
- `DATABASE_URL` and `JWT_SECRET`: required at startup; obtain approved values privately.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: server-only Storage access.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`: optional confirmation-email delivery.
- `API_PUBLIC_URL`: reachable API base for confirmation links when needed.
- `GOOGLE_CLIENT_ID`: Google token audience; coordinate with web/mobile IDs.

Without mail configuration, confirmation links may be logged. Those links contain authorization material; do not share logs casually.

### Start web and API without public exposure

Run these in two terminals from the repository root:

```powershell
npm run dev:server
```

```powershell
npm run dev:web
```

Web uses port `5173`; API defaults to `4000`. Root `npm run build` builds the web app.

**Root `npm run dev` also launches a public Cloudflare tunnel.** It is not just the two local services. In `server/`, `npm run dev` uses the separate API-tunnel launcher; `npm run dev:no-tunnel` runs the watched API only. `npm start` runs the API without watch. Do not automatically run `npm run seed` against a shared database.

### Networking details that commonly cause confusion

Vite binds to the network, uses strict port `5173`, and proxies `/api` to `http://localhost:4000`. However, the current web API resolver treats a configured localhost/127.0.0.1 API URL specially: it builds a URL using the browser's hostname and port `4000`. It does not automatically use Vite's proxy.

Set `VITE_API_BASE_URL=/api` when intentionally using the Vite same-origin proxy, including a web HTTPS tunnel. A deployed build needs its own reverse proxy for that path. The default hostname-plus-4000 behavior is not sufficient for an HTTPS web tunnel.

Server CORS permits configured origins and certain development localhost/private-LAN ports. It does not grant blanket permission to all tunnel hosts. The server tunnel launcher requires `cloudflared` on PATH, exposes port `4000`, and writes `API_PUBLIC_URL` in `server/.env`. Root's tunnel command exposes web port `5173` instead.

For a physical phone, use the development machine's LAN address, not the phone's `localhost`; allow API and Expo ports through the firewall as needed. An Expo tunnel does not also expose the API.

## Web application

The web stack is React 18, React Router 7, Vite 6, Tailwind 4, TanStack Query 5, and Leaflet with leaflet-draw. Source is JavaScript/JSX, not TypeScript. The main visual language is teal (`#14B8A6`), white, and Inter, with amber officer accents.

Provider order is optional Google OAuth provider, QueryClient provider, Auth provider, then router and toast UI. `AuthContext` checks `/auth/me` on startup. Protected routes use the verified session role, including loading/error states; they no longer simply trust a cached profile. API requests include cookies. A 401 clears the web cached session and notifies the auth layer; logout also clears query cache.

Important route groups:

- Public: `/`, `/register`, `/map`.
- Vendor: `/dashboard` and map/applications/notices children, `/apply/:stallId`, `/applications/:id`, `/transfer-accept/:transferId`.
- Admin: `/admin` and map/stalls/applications/vendors/walk-in/announcements/violations/receipts/renewals/check-requests children.
- Super admin: `/super-admin` and users/map/violations/receipts/renewals/check-requests/stalls/applications children.
- Officer: `/officer` and map/violations/log/receipts children.
- Admin/super-admin shared: `/analytics`, `/archive`.

Check `routes.jsx` for exact guards and aliases. Several routes render different panels of the same large dashboard component; do not assume each URL has a separate page file.

High-impact UI includes `AdminDashboard`, `SuperAdminDashboard`, `OfficerDashboard`, `UserDashboard`, `AdminMapView`, `ApplicationDetails`, `WalkInApplication`, and `StallManagementPanel`. Map-related components include `SuperAdminMapEditor`, `FacilityMapEditor`, `MapFacilitiesLayer`, `AddStallMapPicker`, and role-specific map views. Shared workflows include `ContractModal`, `PaymentReceiptsPanel`, and `ContractRenewalsPanel`.

Most operational data is API-backed, including **archives**, receipts, transfers, applications, requests, violations, announcements, stalls, perimeters, and facilities. Some legacy browser helpers remain. `applicationsStorage.js` is a local helper; inspect callers before assuming it represents current application persistence. `legacyRequestMigration.js` can import older browser requests/violations into the API. Do not remove it merely because it looks old.

Browser-local state also includes cached display/session data (`pubmark_session`), decision-read state, pending toasts, and migration flags. `legacyMigration.js` does not export the standalone map's storage key.

Query defaults include short stale times, with map datasets cached longer. Preserve query invalidation and clear-on-logout behavior. Client field naming is mixed: stall data often uses snake_case, while workflow records use camelCase. Do not blanket-convert every response.

## API and database

`server/src/index.js` is the large central implementation. It uses `pg.Pool` for relational data and the Supabase SDK for Storage. Required base tables must already exist; starting the server does not create the schema.

JWT sessions last eight hours. Web uses the HTTP-only `pubmark_session` cookie, SameSite lax and secure in production. Mobile can supply a bearer token. Authorization reloads the user's role and archived state from `profiles`, rather than relying solely on token claims. Google sign-in verifies the ID token audience and verified email; new-user confirmation uses `pending_user_creations`.

API families include auth/users/pending-users, notification-read-state, announcements, stalls, applications, contract-renewals, receipts, archive, transfers, check-requests, violation-requests, violations, termination-requests, map-facilities, and perimeters. Read individual handlers for role and ownership checks.

Business rules worth preserving:

- Applications can be pending/approved/rejected. Approved applications determine occupancy; synchronization preserves deliberately unavailable stalls.
- Renewal deadlines normally derive from contract end plus seven days. Pending renewals affect auto-termination. Super-admin deadline extensions require a reason and are not themselves contract extensions.
- Missing business permits can trigger deadline-based rejection. Some workflow metadata is encoded in `admin_remarks` and parsed by client utilities.
- **`GET /api/applications` can run automatic deadline/contract termination logic.** Do not assume every GET is harmless against shared data.
- Occupied stalls cannot simply be deleted. Related-record and attachment cleanup must remain consistent.
- Payments are recorded through receipt upload/review, not a payment gateway.
- Restoring an archive is not one atomic generic restore endpoint: deletion of the archive and recreation of the original record involve caller logic.

### Files and photos

Current private Storage bucket: `attachments`. The old receipts-only description is obsolete. Uploads allow configured image formats and PDF with a 5 MB per-file limit; signed download URLs expire after 600 seconds. `virtual://` is a legacy marker, not an uploaded binary.

Most uploads go through server processing; stall photos also have a signed direct-upload path. Keep user-prefix/object-existence checks. New stall creation requires real photo data as well as stall name, business type, section, floor, and floor area.

### Import limitations

`POST /api/stalls/import` generates fresh UUIDs and returns an ID map. Repeating the import can duplicate data. It does not preserve all standalone metadata such as building/kind/source numbering, and it differs from normal photo-required creation. Design explicit field mapping and idempotency before importing the local map.

An `importApplications` client wrapper exists without a matching `/applications/import` server implementation found during this review. Do not assume the wrapper proves that workflow is supported.

### Schema and migrations

The checked-in migrations are incremental, not a complete database bootstrap. `server/mysql-schema.sql` is obsolete and must not be used for the current PostgreSQL server. For an isolated database, obtain an authorized current base schema, then review which migrations are already applied. Storage objects need separate handling from database backups.

Review migrations in dependency order:

1. `2026-08-23-payment-receipts.sql`
2. `2026-09-06-contract-renewals.sql`
3. `2026-09-06-followup-request-links.sql`
4. `2026-09-07-map-facilities.sql`
5. `2026-09-07-map-facilities-office.sql`
6. `2026-09-08-application-status-timestamps.sql`
7. `2026-09-08-technical-room-and-office-polygons.sql`
8. `2026-09-09-google-signup-pending-user-creations-nullable.sql`

The facility create migration must precede the office alteration even if a lexical filename sort puts them in the opposite order. There is no automatic migration runner. Live schema, indexes, and RLS were not inspected in this documentation task.

System map facilities support `entrance`, `cr`, `stairs`, `office`, and `technical_room`. CR/office/technical room use polygons; entrance/stairs use points. Facilities are separate from rentable stalls, with super-admin write access.

## Mobile application

Read `mobile/AGENTS.md` before mobile implementation: it requires consulting exact Expo v57 documentation. The current app uses Expo 57, React 19, React Native 0.86, React Navigation 7, TanStack Query, NativeWind 4/Tailwind 3, SecureStore, WebView, and native Google sign-in. Do not apply web Tailwind 4 assumptions to mobile.

`mobile/COMMANDS.txt` describes the dev-client workflow (`npx expo start --dev-client`). Native Google sign-in requires an appropriate development build, not ordinary Expo Go. EAS configuration belongs to an existing project/account; obtain access instead of silently creating or replacing it. Native dependency changes can require a new build.

Mobile public environment variables include `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. In development, API host discovery from the browser/Expo host takes precedence over the explicit URL in common cases; inspect `apiBaseUrl.js` when debugging.

Tokens live in SecureStore on native and localStorage on web (`pubmark_token`, `pubmark_profile`). Mobile is intended for vendor/officer workflows. Native maps use Leaflet inside a WebView with OpenStreetMap; web map implementations intentionally use a list fallback. Do not infer a Google Maps key requirement from installed dependencies.

Tenant-terms content exists separately in web and mobile; keep both aligned when changing it. Preserve foreground refetch and logout cache clearing.

## Standalone local stall map — current approved state

Open `local-stall-map.html` directly, or serve it from the development web server. It is independent of React, authentication, and the database. Internet access is still needed for CDN Leaflet/leaflet-draw and OpenStreetMap tiles. It is not automatically a separate output of the normal Vite production build.

### Baseline counts

| Building | Regular stalls | Table stalls | Non-stall facilities | Total objects |
| --- | ---: | ---: | ---: | ---: |
| Main Building — top, Rizal Street | 36 | 0 | 0 | 36 |
| Dry Store Building — middle | 84 | 22 | 1 technical room | 107 |
| Wet Store Building — bottom, Dinsay Street | 48 | 110 | 1 CR | 159 |
| **Total** | **168** | **132** | **2** | **302** |

Thus the generated baseline contains **300 rentable/table stalls**, excluding the technical room and CR. User edits in browser storage may change these totals. Baseline objects are on floor `"1"`; the editor also supports another floor.

### User decisions to preserve

- Main Building has nine columns by two rows on each side of an open central hallway. The hallway is not a stall.
- The Dry Store Building was corrected from an upside-down layout. Stall 1 is at the upper-left and the technical room is lower-left. Do not restore the old rotation.
- The Wet Store Building follows the later wet-market reference, not a duplicate dry-market layout.
- Wet outer stalls repeat numbers 1–12 across NW/NE/SW/SE groups; prefixes disambiguate them.
- Small wet counters on the left were replaced with larger stalls mirroring the right: two rows of ten large table stalls on the left. Middle fish counters remain smaller.
- The central wet box is a **Comfort Room (CR), not stairs**.
- Building categories persist on objects and are available in the editor/filter/export.
- Floor-plan pictures were removed from the visible map after tracing; keep the editable polygons without restoring the image overlay.
- Labels are compact and hidden below zoom 20 to reduce clutter.

Some table/main numbering is locally assigned rather than verified against readable printed numbers. Geometry is aligned from images/map footprints, not a survey.

### Data and coordinate conventions

Main storage key: `pubmark_local_stall_mapper_v1`.

Other migration/backup keys include the seed key `pubmark_local_stall_mapper_plan_seed_v1` and the main-key suffixes `_alignment`, `_before_alignment_v2`, `_before_buildings_v3`, `_buildings_v3`, `_middle_features_v1`, `_wet_reference_v4`, `_before_wet_reference_v4`, `_wet_mirrored_v5`, `_before_wet_mirrored_v5`, `_wet_cr_v6`, and `_before_wet_cr_v6`.

Existing browser data is migrated using flags; changing a default generator alone does not necessarily update an existing saved map. Preserve custom shapes and backups when adding migrations, and test repeat loads. Some backup values have different shapes; the CR backup is not necessarily an entire stall array.

JSON export contains `{ version: 1, exported_at, stalls: [...] }`. Browser Markdown export includes saved data and storage details. The checked-in `LOCAL_STALL_LOCATIONS.md` is a **generated baseline**, not a dump of the original device's actual localStorage.

GeoJSON coordinates are WGS84 `[longitude, latitude]`, with closed polygon rings. Leaflet coordinates are `[latitude, longitude]`. Placement calculations use projected map points. Do not swap these orders.

Important inline functions include `makePlanStalls`, `makeOtherBuildings`, `makeMiddleFeatures`, `makeWetBuilding`, `planPoint`, `buildingPoint`, `load`, and `buildLayoutMarkdown`. IDs include `main_*`, `plan_*`, `plan_table_*`, `plan_technical_room`, `wet_v5_*`, and `wet_v5_comfort_room`.

The standalone facility kind `comfort_room` must map to system facility type `cr` if an import is later authorized. Regular dry stalls may lack `kind`. Default business type can be blank, and displayed computed area is not automatically a persisted system `floor_area`. Do not blindly submit exported objects to the system API.

`scripts/export-local-map-markdown.mjs` derives the baseline from HTML functions, validates geometry/IDs/counts/migrations, and prints Markdown to stdout. It does not read browser localStorage or automatically write a file. Some older explanatory prose still mentions a stairwell; the current CR object and latest user instruction are authoritative.

Original external references include `Untitled design (1).png`, `Image (1).jpg`, `Untitled design (3).png`, and `775047548_1355790473373932_7238331607465683801_n.jpg` in the original owner's Downloads folder. Copy separately if future tracing work needs them.

## Historical documents and open risks

Use old docs for history, not as an unconditional specification:

- `README.md` and `PROJECT_CONTEXT.md` contain older MySQL/local-state assumptions.
- `CLAUDE.md` contains useful history but some obsolete archive/inventory/auth descriptions and removed module names.
- `server/README.md` describes an older receipts-only upload approach; current shared bucket is `attachments`.
- `SUPABASE_MIGRATION.md` and `database.md` are not an authoritative complete current schema.
- `SUPABASE_FUTURE_OPTIMIZATION.md` mixes proposals with work now partly implemented. Check source and live schema before asserting completion.
- Older map totals and stairwell descriptions are superseded by the baseline and decisions above.

`SECURITY_REMEDIATION_PLAN.md` was marked paused/not implemented. This handoff does not authorize executing it. Issues to reverify before deployment include tracked credentials, PostgreSQL TLS certificate verification currently disabled in the pool, rate limiting, target-role authorization, map tooltip interpolation, and mobile session/error races. Historical dependency-audit counts are not a current audit result.

## Verification and working-tree handoff

Checks run during this documentation review:

```powershell
node --check server/src/index.js
node --test mobile/tests/useApiData.test.cjs
node scripts/export-local-map-markdown.mjs | Measure-Object -Line
```

Results: server syntax passed; all seven mobile hook tests passed; map export assertions passed and produced 13,804 lines. These do not verify live API behavior, browser rendering, database schema/RLS, or native builds. No production web build or live database operation was run during this review. Root/server currently have no general npm test/lint scripts.

Before this documentation task, these files already had user changes; preserve them:

- `LOCAL_STALL_LOCATIONS.md`
- `local-stall-map.html`
- `mobile/package-lock.json`
- `scripts/export-local-map-markdown.mjs`

This task adds only the handoff and root agent entry point. For the next task, inspect `git status`, read the relevant current source, confirm whether the target is the standalone map or the shared system, and make only the requested changes.
