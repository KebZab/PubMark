# Bug and security remediation plan

Review date: 2026-09-08

Status: **Not implemented.** The user paused implementation and requested this handoff document. Resume only when requested. No security fixes or dependency updates have been applied.

## Existing work to preserve

An earlier cleanup removed 23 verified unused files and fixed request races in `mobile/src/hooks/useApiData.js`. Seven regression tests in `mobile/tests/useApiData.test.cjs` pass. These changes remain uncommitted and must not be reverted or confused with security remediation.

The cleanup web build produced byte-identical output to its baseline. Source parsing and import resolution passed for web, Android, and iOS. Full mobile bundles were not run: the installed NativeWind/CSS interop Metro configuration writes caches inside `node_modules`. No browser was connected for interactive smoke tests.

## Constraints and approved scope

- Server/API source changes and compatible dependency manifest/lockfile changes are included in the future remediation scope.
- Do not modify installed `node_modules`, existing Markdown/text files, or environment files. The user explicitly requested this new Markdown handoff as an exception for documentation.
- Preserve working features, role workflows, styling, and existing cleanup changes.
- Do not install packages, apply forced dependency fixes, downgrade Expo/navigation, or make major dependency migrations.
- No production deployment, credential rotation, live database changes, or destructive tests against real accounts are authorized by this plan.
- The user explicitly chose to keep `mcpenv.txt` unchanged even after credential exposure was reported. Never copy its secret values into reports, tests, logs, or this document.

## Findings and evidence

Line references describe the reviewed source and may shift during implementation.

| Priority | Finding | Evidence and qualification |
| --- | --- | --- |
| Urgent | Tracked credentials | `mcpenv.txt:4` contains a non-placeholder-looking database password; line 19 contains a JWT whose decoded payload declares `service_role`. The file is tracked by Git. Credential validity and repository exposure were not tested. |
| High | Account-management authorization bypass | `server/src/index.js:995` permits an admin to update another admin/super-admin's password when the body omits `role`; the target's current role is not checked. The delete route at line 1022 has the same target-authorization gap. Both handlers accepted an admin targeting a mock super-admin and issued database writes. Real database constraints might block some deletions, but are not an authorization control. |
| High | Unescaped map HTML | `src/app/pages/UserMapDashboard.jsx:140` interpolates `stall.stall_name` into a Leaflet tooltip. `src/app/components/SuperAdminMapEditor.jsx:100` interpolates `zone.name` into popup HTML and passes it directly to a tooltip at line 111. These are source-confirmed unsafe sinks; no browser exploit was run. |
| Medium | Personal-information exposure | `server/src/index.js:868`, `/api/auth/users/by-email`, requires authentication but no staff role and returns another user's address, phone, and other profile fields. No active screen calls this endpoint; the web API wrapper remains defined. |
| Medium | Database certificate verification disabled | `server/src/index.js:18` sets `ssl: { rejectUnauthorized: false }`. Deployment certificates and external network protections were not inspected. |
| Medium | No application-level authentication throttling | No limiter was found on login or registration. External gateway protections, if any, remain unknown. |
| Medium | Unsafe database error paths | Termination and archive handlers release connections in validation branches and again in `finally`; both double releases were reproduced with a mock connection. Termination, renewal, and archive handlers also acquire connections outside `try`. Express 4 does not automatically forward rejected async-handler promises. Other transaction catches attempt rollback without tracking whether a transaction began or committed. |
| Medium | Mobile session loss during outages | `mobile/src/context/AuthContext.jsx:39` clears saved credentials for every restoration error, including network/server failures. `mobile/src/services/api.js` discards HTTP status/error code when throwing. Unsupported mobile roles are rejected by the login screen only after `signIn` has published the user. |
| Reliability | Stale session responses | Web session refresh and mobile restoration/sign-in can complete after logout or account switching. Session operations need explicit invalidation so stale results cannot restore an old user. |

### Dependency audit results

Read-only `npm audit --package-lock-only --ignore-scripts --json` checks succeeded after sandbox network escalation. No installation or audit fix was run.

| Project | Moderate affected-package count | High/critical count |
| --- | --- | --- |
| Web | 0 | 0 |
| Server | 3 | 0 |
| Mobile | 18 | 0 |

Counts include transitive dependents, not separate confirmed exploitable vulnerabilities. Installed/runtime reachability must be distinguished from lockfile advisory matches.

- Server: `express` 4.22.2 and `body-parser` 1.20.6 depend on `qs` 6.15.3. Target patched `qs` 6.16.0. Advisories: [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) and [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx). Exploitability of the documented parse/stringify and parser-option paths in this app was not established.
- Mobile: `decode-uri-component` 0.2.2 is pulled through `query-string` and React Navigation. [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) identifies 0.5.0 as patched, outside the current `^0.2.2` range.
- Mobile: `uuid` 7.0.3 is pulled through `xcode` and Expo tooling. [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) concerns specific UUID methods with caller-provided buffers; the reviewed source did not establish that path is reachable here. Patched versions require a compatibility review beyond the installed `^7.0.3` range.
- Defer incompatible mobile changes. npm suggested Expo/navigation downgrades; do not apply them or use `npm audit fix --force`.

## Implementation checklist

### 1. Account permissions and personal information

- [ ] Check the target account's current role before updates and deletion.
- [ ] Allow admins to manage vendors/officers and edit their own non-role details. Require a super-admin to manage another admin or any super-admin.
- [ ] Retain validation of requested role assignments and the existing prohibition on deleting one's own account.
- [ ] Make the permission check and write safe against concurrent target-role changes, using a transaction/row lock or equivalent guarded write.
- [ ] Restrict `/api/auth/users/by-email` to admin and super-admin callers; preserve the response structure for authorized callers.

### 2. Map rendering

- [ ] Use the existing `stallFloaterHtml` helper from `src/app/components/MapFacilitiesLayer.jsx` in the vendor map; it already escapes names.
- [ ] Escape perimeter names in popup HTML and use text nodes or escaped text for perimeter tooltips.
- [ ] Keep geometry, styles, labels, and click behavior unchanged. Do not strip ordinary punctuation from stored names.

### 3. Database reliability and transport

- [ ] Acquire connections inside guarded error handling.
- [ ] Release each acquired connection exactly once in `finally`; remove early manual releases.
- [ ] Track transaction state: roll back only after a successful BEGIN and before a successful COMMIT/ROLLBACK.
- [ ] Handle rollback failures without losing the original failure or leaving a rejected promise outside Express error handling. Discard unusable connections rather than returning them as healthy.
- [ ] Apply this consistently to transaction handlers, including attachment cleanup paths; preserve existing business operations and cleanup behavior.
- [ ] Return HTTP 400 for malformed JSON, retain existing 413 handling, and keep unexpected errors generic to clients.
- [ ] Enable database certificate verification with optional deployment-provided CA configuration. Do not modify real environment files or silently fall back to disabled verification.
- [ ] Require a successful trusted staging connection before any later rollout. Staging access and rollout are not part of the current authorization.

### 4. Authentication throttling

- [ ] Limit failed logins to 10 per normalized account/IP pair in 15 minutes.
- [ ] Limit all login attempts to 100 per IP in 15 minutes.
- [ ] Limit registrations to 10 per IP per hour.
- [ ] Use bounded storage with expiry; avoid an unbounded map keyed by attacker-controlled addresses/emails.
- [ ] Return HTTP 429 and `Retry-After`; verify expiration and successful-login behavior.
- [ ] Use the actual trusted request address. Do not trust arbitrary forwarded-IP headers or enable unrestricted proxy trust.
- [ ] Clearly identify any single-process limiter limitation; do not claim distributed enforcement without a shared store or gateway configuration.

### 5. Session handling

- [ ] Preserve mobile API error HTTP status and server error code on thrown errors.
- [ ] On network/server restoration failures, retain saved credentials but show a locked retry state; do not show protected content based only on cached identity.
- [ ] Clear credentials on confirmed invalid or terminated sessions.
- [ ] Reject unsupported mobile roles before storing/publishing an authenticated user. Preserve the vendor/officer-only mobile policy.
- [ ] Invalidate in-flight restoration/refresh/sign-in operations on logout or account switching in both clients.
- [ ] Prevent stale failures from clearing a newer session and stale successes from restoring a previous account. Include asynchronous storage writes in the ordering analysis.
- [ ] Clear account-specific query caches during logout/switching and clean up registered authentication callbacks on unmount.

### 6. Compatible dependency remediation

- [ ] Update only the server manifest/lockfile as necessary to resolve `qs` to 6.16.0, using a scoped override if required.
- [ ] Use package-lock-only operations with lifecycle scripts disabled and a cache outside `node_modules`.
- [ ] Inspect the lockfile diff and avoid unrelated upgrades.
- [ ] Repeat advisory checks and report remaining mobile findings as deferred compatibility work.
- [ ] State explicitly that installed packages remain unchanged; a lockfile update does not patch the currently installed runtime.

## Verification checklist

- [ ] Test every caller/target role combination for account updates and deletion, including a password-only body without `role`, self-editing, forbidden promotions, and self-deletion.
- [ ] Verify vendors/officers cannot use the email lookup and authorized staff retain the expected response.
- [ ] Verify names containing markup, quotes, ampersands, and Unicode display literally in map labels/popups.
- [ ] Exercise connection acquisition failure, BEGIN failure, validation exits, missing records, query/COMMIT failure, rollback failure, and successful operations; assert exactly one release where acquired.
- [ ] Test malformed JSON returns 400 without exposing internal error details.
- [ ] Test throttling limits, expiration, retry headers, successful logins, concurrent attempts, bounded storage, and spoofed forwarded headers.
- [ ] Test offline mobile startup, server failure, valid retry, invalid/terminated tokens, unsupported roles, logout during a pending session check, and account switching while old requests/storage operations are pending.
- [ ] Retain all seven passing request-race tests: `node --test mobile/tests/useApiData.test.cjs`.
- [ ] Repeat the web production build and web/Android/iOS source parsing/import resolution.
- [ ] Repeat lockfile audits without installing packages. Treat audit counts as advisory matches, not proof of runtime exploitability.
- [ ] Run interactive/browser/device and isolated database integration checks when those environments are available. Never target live accounts with destructive tests.
- [ ] Review `git diff --check`, the full diff, and protected-file status before delivery.

### Validation notes for the next session

- Read `mobile/AGENTS.md` and the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before mobile edits.
- PowerShell blocks `npm.ps1` here; use `npm.cmd` rather than changing execution policy.
- NativeWind's installed `react-native-css-interop/dist/metro/index.js` creates and writes `.cache` inside its package. Do not run the normal mobile bundle command while the no-`node_modules`-writes constraint remains.
- Vite's runner config loader fails on this project's existing `__dirname` usage. The earlier read-only-dependency build used the programmatic API from the repository root:

  ```powershell
  node --input-type=module -e "globalThis.__dirname=process.cwd(); const {default:config}=await import('./vite.config.js'); const {build}=await import('vite'); await build({...config,configFile:false,build:{outDir:'dist/security-validation'}});"
  ```

- The hook regression tests use a lightweight lifecycle harness with installed Babel dependencies; they do not substitute for real React/device integration tests.
- The earlier authorization and connection-release reproductions evaluated extracted handlers with mock database objects. They did not open a real database connection or alter any account.

## Unresolved owner actions

Credential exposure in `mcpenv.txt` remains unresolved by explicit user instruction. The owner must rotate/revoke the potentially exposed credentials, update the systems that use them, and address repository-history exposure separately. Redaction alone would not revoke credentials, and this plan does not authorize rotation or history rewriting.

Further investigation is needed before calling the entire system secure: deployed database constraints, storage policies, gateway protections, trusted TLS configuration, and browser/device behavior were not verified. The review also noticed application-approval/renewal concurrency and upload-verification paths that merit separate investigation; they are not established vulnerabilities or authorized business-rule changes in this implementation checklist.
