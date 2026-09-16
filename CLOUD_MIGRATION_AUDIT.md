# Cloud migration status — September 16, 2026

Cloudflare launch integration has been removed. The direct-Supabase migration
is in progress and a replacement APK has been built. The Express-style
workflow API is now deployed as a Supabase Edge Function; local Node remains a
development option but is no longer required by the mobile production path.

## September 16 migration progress

- Connected to the live Supabase project and inspected schema metadata,
  migrations, Edge Functions, RLS policies, grants, Storage metadata, and
  security/performance advisors without printing row contents or credentials.
- Confirmed 21 public tables have RLS enabled but no policies. Default grants
  exist for `anon` and `authenticated`; RLS currently blocks Data API rows.
- Confirmed there were 41 legacy profiles and zero Supabase Auth users.
- Applied migration `add_auth_identity_mapping`, adding the nullable unique
  `profiles.auth_user_id` foreign key plus private profile-ID/role lookup
  helpers for future RLS policies. Existing profile IDs and business foreign
  keys were preserved.
- Imported and mapped 40 profiles whose stored passwords were valid bcrypt
  hashes. The one archived profile was imported and banned. One profile with
  a non-bcrypt credential was deliberately skipped and needs a controlled
  password reset.
- Added an idempotent, dry-run-by-default account migration script under
  `server/scripts/`. It never prints emails or password hashes.
- Configured the EAS `preview` profile explicitly for APK output. No APK should
  be built until a permanent cloud API/Auth path is ready and its public mobile
  environment values are configured.
- Deployed the existing 68-route API as the `api` Supabase Edge Function. It
  preserves the current request/response shapes, legacy authorization checks,
  workflow rules, and private signed-URL Storage access while removing the
  runtime dependency on a developer computer.
- Updated mobile production resolution to default to the permanent Edge URL.
  An explicit `EXPO_PUBLIC_API_BASE_URL` still overrides it for alternate
  deployments and testing.
- Live smoke tests passed for public stalls, facilities, and perimeter reads;
  protected routes reject requests without a valid session.
- EAS build `4b637c4a-03ff-4116-9129-36bf9f28cbeb` completed successfully using
  the existing Android signing identity. A local copy is stored at
  `mobile/builds/PubMark-supabase-preview-2026-09-16.apk` (SHA-256
  `FAB6C8F0F62DC33706A34B3082E2B58873542098847F2D767C0755CC5F12A255`).

## Inspection and dependency inventory

Repository-wide text searches covered application source, package scripts,
configuration examples, SQL migrations and documentation. Generated dependencies,
builds, private credentials and database dumps were excluded. This is a dependency
review, not a line-by-line audit of every UI file or a live Supabase security audit.

| Dependency | Location / behavior | Status |
| --- | --- | --- |
| Web Cloudflare tunnel | Root package scripts exposed Vite port 5173 | Removed |
| API Cloudflare tunnel | Server dev script started a tunnel and rewrote API_PUBLIC_URL | Launcher removed; dev now runs Node directly |
| Web local API fallback | src/app/services/api.js derives browser hostname plus port 4000 | Retained until compatible cloud API exists |
| Vite API proxy | vite.config.js proxies /api to localhost:4000 | Development only; retained |
| Mobile API discovery | mobile/src/services/apiBaseUrl.js derives Metro/browser hostname and port 4000 in development | Retained until migration; release uses EXPO_PUBLIC_API_BASE_URL |
| Domain and authentication calls | Web service modules and mobile/src/services/api.js call custom Express endpoints | Must migrate together with their authorization and business rules |
| Confirmation links | server/src/index.js uses API_PUBLIC_URL, falling back to localhost | Cloud implementation must generate permanent reachable links |
| Development CORS | Server permits loopback/private LAN origins only outside production | Development support, not cloud hosting |
| Environment examples | Root/server/mobile examples describe local or deployed Express API settings | Supabase Project URL is not a compatible API replacement |
| pg-cloudflare | Transitive pg dependency in server lockfile | Unrelated to tunnel; retained |
| Maps | Leaflet/OpenStreetMap plus API-backed stalls, facilities and perimeters | Preserve public map assets and API data access |
| Standalone map | local-stall-map.html stores edits in browser localStorage | Intentionally independent; no database migration |
| Historical documentation | CLAUDE.md and SYSTEM_HANDBOOK.md contain old tunnel instructions | Superseded by this status and AI_PROJECT_HANDOFF.md |

No hardcoded production cloud backend was established by this inspection.
Private environment values were not copied into this document.

## Why changing the URL is insufficient

Accounts use bcrypt password hashes in profiles and JWTs signed by the Express
server. They are not Supabase Auth sessions. Supabase REST endpoints do not
implement this application's /auth/login, /applications, /receipts or other
custom routes. Existing server checks reload roles and archived status for each
authenticated request. Uploads use a server-only Storage service-role key.

The current server also implements approvals, ownership filters, automatic
contract/permit termination, stall occupancy synchronization, invitation emails,
renewals, deadline extensions, transfers, archives and notification read state.
Moving database calls into the APK without migrating these checks would change
business behavior and could expose data.

## Required to complete direct cloud access safely

1. Design, apply, and test least-privilege RLS and Storage policies against each
   role and ownership relationship. The live audit found no policies on the 21
   public tables and no deployed Edge Functions.
2. Complete the account cutover: provide a controlled reset for the one skipped
   credential, migrate Google login and pending invitations, and switch clients
   only after role/archived-account enforcement is verified. Existing business
   profile IDs remain stable through `profiles.auth_user_id`.
3. Move the existing workflow rules to tested Supabase database functions and/or
   Edge Functions. Preserve request/response behavior for both web and mobile.
   Direct table writes must not bypass approvals, ownership or deadlines.
4. Test least-privilege RLS and private Storage policies against the actual
   schema, including cross-user denial and anonymous access restrictions.
   Never ship database credentials, JWT signing secrets or a service-role key in
   EXPO_PUBLIC_* or VITE_* variables. Only public project settings belong there.
5. Update clients to the deployed, verified cloud interfaces; configure release
   builds without Metro/LAN dependencies. Build an installable release APK using
   the existing Expo project and signing identity.
6. Verify on a physical phone using cellular data with the development computer
   off: existing and new login, all roles, archived accounts, uploads/downloads,
   maps, applications/approvals, renewals, transfers, notifications and admin
   workflows. Verify unauthorized requests fail independently of the UI.

Cloud provider runtime limits, email delivery and account availability must be
verified before promising continuous operation. No cloud deployment, Auth/data
migration, policy modification or APK build was performed by the tunnel removal.
