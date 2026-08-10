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
