# Temporary MySQL backend

PubMark currently uses a MySQL API as its transitional backend. The browser
connects only to `VITE_API_BASE_URL`; MySQL credentials and session signing
secrets belong in `server/.env` and must never be committed.

`server/mysql-schema.sql` mirrors the entities in `database.md` with MySQL
types. Use UUID strings (`CHAR(36)`) so records can be imported into the
future Supabase/PostgreSQL schema without identifier changes.

When moving to Supabase, retain the React service interfaces and replace the
HTTP implementation with the Supabase client/Edge Functions. Migrate rows in
this order: profiles, stalls, applications, transfers, termination requests,
violations/evidence, inspection requests/files, announcements, inventory,
archive, then perimeter. File objects should move from the temporary object
storage provider to Supabase Storage before their database paths are updated.

## Current migration progress

- Authentication is already connected to the MySQL backend:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `GET /api/auth/users/by-email`
- Transfer email lookup was updated to use the backend user lookup route so transfer requests can find accounts that exist in the MySQL `profiles` table.
- Frontend auth calls live in `src/app/services/api.ts`.

## Map and stall migration progress

- Map-related screens are being refactored away from direct `localStorage` reads and toward shared hooks such as:
  - `src/app/hooks/useStalls.ts`
  - `src/app/hooks/useApplications.ts`
  - `src/app/hooks/usePerimeter.ts`
- Stall CRUD is being moved into API-backed services in:
  - `src/app/services/stallsApi.ts`
  - `src/app/services/applicationsApi.ts`
  - `src/app/services/perimeterApi.ts`
- `AdminMapView` now performs create, update, geometry update, delete, and bulk delete through the newer stall service flow instead of only mutating legacy browser storage.
- Admin stall drawing now auto-calculates floor area from the drawn polygon/shape.
- `SuperAdminDashboard` now includes an import path for browser-saved stalls so legacy map data can be pushed into MySQL.
- Several map consumers including admin, officer, guest, vendor, stall management, and dashboard views now consume the newer hooks instead of only the legacy local store utilities.

## Remaining transition note

The map/stall migration is still in progress. Some legacy storage modules remain in the codebase for compatibility and import/migration support, so do not assume the entire map domain is fully database-backed yet.
