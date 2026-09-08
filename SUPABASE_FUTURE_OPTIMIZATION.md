# Future Supabase Optimization Plan

> Status (updated 2026-09-08): Phases 1–3 are implemented. Phase 4 has one
> pilot flow implemented (stall photo uploads); the other 8 upload flows and
> all of mobile still use the original base64 path by design, not omission.
> Phase 5's cleanup items are implemented except retiring
> `legacyRequestMigration.js`, deliberately left in place — see CLAUDE.md's
> 2026-09-08 session log entry for exactly what changed and why each
> deviation from this doc's original wording was made (e.g. offset-based
> pagination instead of cursor-based, to match the pattern already shipped
> for users/stalls/applications; no ETag on `/api/stalls` because signed
> image URLs make it a no-op). Treat the plan below as the original design
> intent, and CLAUDE.md as the source of truth for current reality.

## Summary

Keep the current secure architecture: web and mobile call the Express API, while only the server accesses Supabase PostgreSQL and its service-role Storage client. Do not connect either frontend directly to database tables.

Improve performance through shared client caching, request deduplication, indexed and paginated SQL queries, transactional writes, and direct signed uploads to the private Storage bucket.

## Recommended Changes

### Shared query caching

- Introduce TanStack Query in both web and mobile.
- Use stable query keys for applications, stalls, facilities, reservations, announcements, transfers, violations, receipts, and requests.
- Deduplicate identical requests made by multiple mounted components.
- Cache stalls, facilities, and perimeters for five minutes; announcements for one minute; workflow data for 15 seconds.
- Refetch active data when a screen regains focus.
- Invalidate only affected query keys after successful writes instead of refetching complete dashboards.
- Preserve existing hook return shapes during migration so screens can move incrementally.

### Efficient API reads

- Add cursor pagination with a default limit of 50 and a maximum of 100 to users, applications, violations, receipts, archive, transfers, and administrative request lists.
- Return `{ items, nextCursor, total }` from paginated management endpoints.
- Keep map endpoints as complete lightweight collections because maps require all geometry for the selected floor.
- Add `ETag` and conditional responses to stalls, facilities, perimeters, and public reservation summaries.
- Select only the fields required by each view.
- Generate attachment download URLs in batches where practical.

### PostgreSQL improvements

- Add indexes aligned with actual filters, joins, and ordering.
- Prioritize compound indexes for application user/status/date, stall/status/date, transfer participant/status/date, request assignee/status/date, and facility floor/type queries.
- Use transactions and row locks for transfers, terminations, renewals, archive operations, bulk geometry updates, and database-plus-file finalization.
- Add database constraints preventing conflicting approved contracts, duplicate pending transfers, and duplicate pending renewal requests after auditing existing rows.
- Configure the `pg` pool with explicit connection, idle, statement, and query timeouts suitable for Supabase's connection pooler.

### Signed direct attachment uploads

- Add authenticated `POST /api/uploads/sign` accepting `{ purpose, fileName, mimeType, fileSize }`.
- Validate the caller's role, upload purpose, extension, MIME type, and the existing 5 MB limit before signing an upload.
- Generate randomized, user-scoped paths in the private `attachments` bucket.
- Return `{ path, token, signedUrl }` without exposing the service-role key.
- Upload the original browser `File` directly from web.
- Upload the local file URI as a streamed request from mobile without converting it to base64.
- Pass `{ path, fileName, mimeType, fileSize }` to the relevant domain create or update request after upload.
- Verify server-side that the path belongs to the requesting user and the object exists before saving its database reference.
- Continue using short-lived signed URLs for downloads.
- Delete uploaded objects when their associated database write fails.
- Periodically remove signed uploads that were uploaded but never attached to a database record.

### Configuration and legacy cleanup

- Keep `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` only in the server environment.
- Never expose the Supabase service-role key through Vite or Expo variables.
- Remove the unused frontend Supabase client and obsolete frontend Supabase variables after confirming no imports remain.
- Retire legacy local-storage persistence and migration helpers after the migration window closes.
- Update architecture and database documentation so it consistently describes PostgreSQL, Row Level Security, and Storage behavior.

## Proposed Interfaces

### Upload authorization

`POST /api/uploads/sign`

Request:

```json
{
  "purpose": "permit",
  "fileName": "permit.pdf",
  "mimeType": "application/pdf",
  "fileSize": 123456
}
```

Response:

```json
{
  "path": "generated-private-storage-path",
  "token": "short-lived-upload-token",
  "signedUrl": "short-lived-signed-upload-url"
}
```

### Paginated lists

- Accept `limit`, `cursor`, existing filters, and allowlisted sort fields.
- Return `{ items, nextCursor, total }`.
- Temporarily retain existing unpaginated service functions as compatibility wrappers while screens migrate.

## Implementation Phases

### Phase 1: Baseline and database safety

- Record current endpoint response times, query counts, and slow SQL statements.
- Audit existing rows for duplicates and constraint conflicts.
- Add non-breaking performance indexes through a reversible migration.
- Configure safe PostgreSQL pool and statement timeouts.
- Add transaction coverage to existing multi-step writes.

### Phase 2: Client query caching

- Install and configure TanStack Query separately in web and mobile.
- Migrate shared stalls, facilities, applications, and announcements hooks first.
- Add focus-based refresh and mutation invalidation.
- Migrate the remaining workflow screens after confirming compatible behavior.

### Phase 3: Pagination and conditional reads

- Add cursor pagination without changing map endpoints.
- Migrate management tables one at a time.
- Add conditional caching headers to stable public resources.
- Measure payload size and query-time improvements before continuing.

### Phase 4: Signed Storage uploads

- Add the authenticated signing endpoint and strict upload validation.
- Implement web direct uploads, then mobile streamed uploads.
- Update domain writes to finalize uploaded objects safely.
- Add rollback and abandoned-upload cleanup.
- Remove base64 upload paths only after all supported clients have migrated.

### Phase 5: Cleanup and documentation

- Remove compatibility wrappers and unused frontend Supabase code.
- Remove expired local-storage migration code.
- Reconcile all Supabase and system architecture documentation.
- Run complete role-based regression and production-build verification.

## Test Plan

- Confirm simultaneous components requesting the same resource produce one network request.
- Confirm mutation invalidation refreshes only affected screens.
- Test cursor pagination with empty, first, middle, and final pages, including filters and sorting.
- Compare query plans before and after indexes.
- Verify rollback for partial multi-table writes and concurrent approval, transfer, termination, and renewal attempts.
- Upload every supported file type from web, Android, and iOS.
- Reject oversized, mismatched, expired, reused, and unauthorized uploads.
- Confirm private attachments cannot be opened without a signed download URL.
- Confirm failed domain writes and cleanup jobs remove orphaned files.
- Run server tests, the web production build, the mobile Expo export, and role-based regression tests.

## Assumptions

- Express remains the sole authorization and database boundary.
- Existing JWT and cookie authentication remains unchanged.
- Refresh-on-focus with cached reads is preferred over Supabase Realtime.
- The private `attachments` bucket remains the single file bucket with purpose-based paths.
- Schema changes are additive and reversible, and production data is audited before adding uniqueness constraints.
