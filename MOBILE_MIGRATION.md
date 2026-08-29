# Migrating vendor and officer to a React Native (Expo) mobile app

> Working through this phase by phase — check off progress here as each one
> completes. Companion doc to `SUPABASE_MIGRATION.md` (the backend migration,
> now complete).

## Context

Right now, all four roles — vendor, officer, admin, super-admin — run in the
same React + Vite **web** app, backed by the Express + Supabase server.

The goal: move **vendor and officer** to a real native mobile app built with
React Native + Expo. Admin and super-admin stay on web, untouched.

### Why a native app instead of just making the website mobile-friendly

Both options were considered. Making the existing web app installable (a
"PWA") would have been faster — the vendor and officer screens are already
built phone-shaped, so much of it would have worked as-is. But a native app
was chosen for real App Store presence and full access to native phone
features (camera, secure storage, notifications later).

The tradeoff being accepted: a second codebase to maintain, and one small
backend change (see Phase 0b).

### One app, not two

A single Expo app that shows **vendor screens or officer screens depending on
who logs in** — the same role-based pattern the web app already uses. Not two
separate apps. One codebase, one build process, less to maintain.

### What does NOT change

- The Supabase database and everything in it
- Every existing API route in `server/src/index.js`
- The entire admin / super-admin web experience

The mobile app is a **new client talking to the same already-working API**.
Nothing that currently works gets rebuilt or put at risk.

### The one backend change needed

Logging in currently stores your session in a browser cookie. That works
perfectly in a web browser — but React Native's networking handles cookies
unreliably, especially on Android. Login would appear to work in testing and
then randomly fail on real phones.

The fix is **additive, not a rewrite**: login will *also* return a token in
the response, which the mobile app stores and sends back with each request.
The web app keeps using cookies exactly as it does today — nothing about the
current behavior changes.

---

## How we work through this

For each phase:
1. Plain-language explanation of what's happening first — no jargon dumps.
2. Small pieces, tested as we go, not one giant leap.
3. The web app keeps working the entire time. Nothing gets broken while
   we're mid-migration.

---

## Phase 0a — This document

**Claude does:** writes this file.

- [x] Phase 0a complete

---

## Phase 0b — Backend auth change

The only backend change in this whole plan. Makes login work reliably from a
phone without breaking how the website logs in.

**Claude does:**
- Update `server/src/index.js` so login returns a token alongside the
  existing cookie, and so protected routes accept *either* one.
- Test both paths: a `curl` request using the token, and confirm nothing
  about the existing cookie path changed.

**YOU do:**
- Log into the **web app** as admin and confirm it still works normally.
  (This is the safety check — the whole point is that web is unaffected.)

**Verified:** login/register now return a token alongside the cookie;
`requireAuth` accepts either. Tested across all 7 protected GET routes
(identical responses via cookie vs. bearer), plus writes via bearer, plus
role enforcement (vendor and officer both correctly blocked from admin-only
routes with 403), plus rejection of garbage/missing tokens with 401.

- [x] Phase 0b complete

---

## Phase 1 — Expo project setup

Creating the mobile app's foundation. Nothing visible yet — this is
scaffolding.

**Where it lives:** a new `mobile/` folder at the repo root, next to `src/`
and `server/`. It has its own dependencies, completely separate from the web
app's — deliberately, to avoid the dependency conflicts that come from trying
to share them.

**Design:** the mobile app uses the **same colors and typography as the web
app** — teal `#14B8A6`, Inter font, same status colors (amber = pending,
green = approved, red = rejected). It should look like the same product, not
a different one.

**Claude does:**
- Create the Expo app on the latest stable SDK.
- Set up NativeWind (lets us use the same Tailwind-style classes as web).
- Build the API client that talks to the existing server.

**Done:** Expo SDK 57 / React Native 0.86 / React 19. NativeWind configured
with the web app's palette (primary `#14B8A6`, status colors). API client
in `mobile/src/services/` sends the bearer token from Phase 0b. Verified: a
full production bundle compiles (972 modules), TypeScript is clean, and the
API server responds on the LAN IP.

### Running it on your phone

Both devices must be on the **same Wi-Fi**.

1. Install **Expo Go** from the App Store / Play Store.
2. Start the API server (from the project root): `npm run dev`
3. In a second terminal: `cd mobile` then `npx expo start`
4. Scan the QR code — iPhone: Camera app. Android: the Expo Go app's scanner.

You should see a "setup check" screen. Both rows should read green
(**NativeWind styling: working**, **API connection: connected**).

> **The API address is worked out automatically.** The app reuses whatever
> host your phone used to reach the Expo dev server and swaps in port 4000,
> so a new Wi-Fi network, a router reboot, or a new DHCP lease all just work
> — there is no IP to keep updating by hand.
>
> **If the connection still fails,** it's almost always Windows Firewall
> blocking port 4000 from other devices. One-time fix, in an **Administrator**
> PowerShell:
>
> ```powershell
> New-NetFirewallRule -DisplayName "PubMark API (dev) - TCP 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
> ```
>
> Also confirm the phone is on the same Wi-Fi — not mobile data, and not a
> "Guest" network, which isolates devices from each other by design.

- [x] Phase 1 complete

---

## Phase 2 — Login + navigation

The first thing you'll actually be able to see and tap.

**Claude does:**
- Login screen.
- Secure token storage (using the phone's encrypted storage, not plain
  storage — it's an auth token, it gets treated like a password).
- Role-based routing: vendor logs in → vendor screens; officer logs in →
  officer screens.

**Done:** Login screen (matching the web app's teal branding), session stored
in the phone's encrypted keystore, session restored on app launch and
re-validated against the server so an expired token can't leave you stuck
"logged in". Role routing: vendor and officer each get their own bottom tabs;
admin/super-admin are signed back out with a "use the web app" message, since
this app has no admin screens. Tab screens are placeholders until Phases 3–4.

Verified: bundle compiles, TypeScript clean, and login + session-restore
tested against the real API for all three role types.

**YOU do:**
- Log in on your phone as `juan@example.com` / `user123` (vendor) — should
  land on vendor tabs: Home / Applications / Notices / Map.
- Sign out, log in as `officer@pubmark.com` / `officer123` — should land on
  officer tabs: Violations / Checks / Map / Receipts.
- Optional: try `admin@pubmark.com` / `admin123` — should refuse with a
  message pointing you to the web app.
- Close the app fully and reopen it — you should still be signed in.

- [x] Phase 2 complete

---

## Phase 3 — Vendor screens

Built one screen at a time, each tested before moving on.

| Screen | What it does |
|---|---|
| Dashboard | Home / applications / notices, with bottom tabs |
| Map | Browse stalls, colored by availability |
| Application form | Apply for a stall, upload permit (camera or file) |
| Application details | View and manage one application |
| Transfer accept | Accept a stall transferred from another vendor |

**YOU do, per screen:** open it on your phone, compare against the same
screen in the web app logged in as the same account — the data should match
exactly.

> **Transfers are blocked, and not by anything we did.** The web app's stall
> transfer feature stores everything in browser `localStorage` — there is no
> `/api/transfers` route on the server. So there is nothing for the mobile app
> to call. Making transfers work on mobile means first building that API (a
> separate piece of work, roughly the size of Phase 0b). Flagging rather than
> silently skipping it.

> **Map note:** the first attempt used `react-native-maps` (Google Maps) and
> rendered a black screen — the map itself loaded, but Google returns no map
> imagery without an API key. Rather than require a Google Cloud account, the
> map now runs **Leaflet with OpenStreetMap tiles inside a WebView**: the exact
> same library and tiles the web app already uses. No API key, no Google
> account, and it looks like the web version because it *is* the web version.
>
> In a plain browser the Map tab shows a stall list instead, since nesting a
> web page inside a web page is pointless. The real map needs a phone.
>
> **Bonus for Phase 5:** because there is no Google dependency, the standalone
> build needs no Maps API key either.

- [x] Dashboard — Home, Applications, Notices
- [x] Map — Leaflet + OpenStreetMap in a WebView, same as web
- [x] Application form — camera or file permit, contract term picker
- [x] Application details — permit upload, transfer offer
- [x] Transfer accept — Transfers tab, accept/decline, history
- [x] Phase 3 complete

---

## Phase 4 — Officer screens

| Screen | What it does |
|---|---|
| Dashboard | Violations / check requests / log / receipts, bottom tabs |
| Map | Inspect stalls, report violations with evidence photos |
| Violation reporting | Snap evidence photos directly from the camera |
| Receipts | Upload and view payment receipts |

**YOU do, per screen:** same as Phase 3 — open on phone, compare to web as
the same officer account.

- [x] Violations — report with camera evidence, resolve/dismiss
- [x] Check requests — complete inspections with findings + photos
- [x] Map — stalls flagged by open violations
- [x] Receipts — filename only, no real upload (same as permits/evidence)
- [x] Phase 4 complete

---

## Phase 5 — Building the actual installable app

Turning the code into a real `.apk` (Android) / `.ipa` (iOS) file people can
install directly — **not** an app store submission. That stays optional and
later.

**Claude does:** configure the build.

**YOU do:**
- Create a free Expo account (needed for their build service).
- Install the resulting `.apk` on a real Android phone and confirm it works —
  a real device, not just an emulator.

- [ ] Phase 5 complete

---

## Notes

- **Testing philosophy:** every screen gets checked against the *real*
  Supabase-backed API using the real seeded accounts — no mock data, no
  separate test backend. Same approach that caught real bugs during the
  backend migration.
- **Shared database reminder:** the mobile app talks to the same live
  Supabase database as the web app. Data created on the phone shows up on
  the web immediately, and vice versa.

---

## Where we left off

Paused mid-Phase 3. Everything below is working and tested — nothing is
half-finished or broken.

### Working today

- **Backend** — all routes on Supabase. Login returns a token *and* the old
  cookie, so web and mobile both work.
- **Mobile (vendor)** — login, role routing, Home, Applications, Notices, Map,
  and the application form (with camera permit capture).
- **Web** — unchanged from the user's point of view, but transfers and archive
  now use the database instead of browser storage.

### To resume

Two vendor screens finish Phase 3:
1. **Application details** — open one application, upload a permit if missing.
2. **Transfer accept** — accept or decline a stall offer. The `/api/transfers`
   routes already exist, so this is mobile-side work only.

Then Phase 4 (officer screens) and Phase 5 (installable APK).

### Two things to know before continuing

**Officer receipts is the one genuinely tricky screen left.** Every other
"file" in this app stores only a filename — no bytes move. Receipts are the
exception: they upload real files to Supabase Storage. That needs one-time
setup (a `receipts` storage bucket, plus `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in `server/.env`) — see `server/README.md`. Worth
confirming that's done before building the screen.

**`CLAUDE.md` is out of date.** It still describes the pre-Supabase, pre-mobile
layout, so a fresh session would start with a materially wrong picture. Worth
updating before handing this to anyone (or to a new session).

### Starting it up

```
npm run dev          # project root — starts both API and web app
cd mobile && npx expo start   # separate terminal, for the phone
```

If the phone can't reach the API, it is almost always Windows Firewall on port
4000 — see the Phase 1 notes above.
