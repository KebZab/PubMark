# PubMark — How the system works today

> Snapshot of the whole system as it actually is, verified against the running
> code and database rather than written from memory. If you read one file to
> understand PubMark, read this one.
>
> Companion docs: `SUPABASE_MIGRATION.md` (how the database moved off MySQL)
> and `MOBILE_MIGRATION.md` (how the mobile app was built).

---

## The shape of it

Three pieces, one database:

```
   WEB (React + Vite)              MOBILE (React Native + Expo)
   admin · super-admin             vendor · officer
        │                                  │
        │  cookie session                  │  bearer token
        └──────────────┬───────────────────┘
                       ▼
          EXPRESS SERVER  (server/src/index.js)
          the only thing that talks to the database
                       │
                       ▼
              SUPABASE (PostgreSQL)
              15 tables, hosted, shared
```

**The single most important rule:** no frontend ever talks to the database
directly. Everything goes through the Express server, which is where all the
role checks live. Supabase is reached only by that server.

---

## Who uses what

| Role | Where they work | Why |
|---|---|---|
| **Vendor** | Mobile app | Out at the market, applying for stalls, photographing permits |
| **Officer** | Mobile app | Walking the market, reporting violations with photos, collecting payments |
| **Admin** | Web | Desk work — reviewing applications, managing stalls |
| **Super-admin** | Web | Same, plus users, map editing, analytics, archive |

Admins who try to log into the mobile app are refused and pointed at the web
app. The mobile app has no admin screens.

---

## 1. Backend — the Express server

**File:** `server/src/index.js` · **Runs on:** port 4000 · **Database client:** `pg`

### How a request works

1. Request arrives with either a **session cookie** (web) or an
   **`Authorization: Bearer` token** (mobile).
2. `requireAuth` accepts either one and decodes the JWT to get the user's id
   and role.
3. `requireRole(...)` rejects anyone whose role isn't allowed on that route.
4. The route runs plain SQL against Supabase and returns JSON.

### Why two kinds of login

Cookies work perfectly in a browser but React Native doesn't persist them
reliably, especially on Android — login would appear to work in testing and
then fail on real devices. So login returns **both**: it sets the cookie for
the web and returns the same JWT in the response body for mobile. One login
route, two clients, no duplicated auth logic.

### Routes (48 total)

| Group | Routes |
|---|---|
| Auth | `login`, `register`, `logout`, `me`, `users/by-email` |
| Users | list, create, update, delete |
| Stalls | list, create, update, delete, bulk delete, geometry, import, management view |
| Applications | list, create, update, delete, permit upload |
| Transfers | list, create, respond |
| Violations | list, create, update |
| Violation requests | list, create, update |
| Check requests | list, create, update, delete |
| Termination requests | list, create, update |
| Announcements | list, create, delete |
| Receipts | list, create, verify/reject |
| Perimeters | list, create, delete |
| Archive | list, create, delete |

---

## 2. Supabase — the database

**15 tables, every one with Row Level Security enabled.**

RLS is on with **no policies**, which is deliberate: it closes Supabase's
public API completely. The Express server connects with a privileged role that
RLS doesn't restrict, so the server keeps full access while nobody can reach
the data directly with an anon key.

| Table | Holds |
|---|---|
| `profiles` | Every account — email, password hash, name, role |
| `stalls` | Stalls with map geometry, section, floor, status |
| `applications` | Vendor applications, contract terms, permits |
| `transfers` | Stall handovers between vendors |
| `termination_requests` | Requests to end a contract or account |
| `violations` + `violation_evidence` | Officer-reported violations and attachments |
| `violation_requests` | Admin asking an officer to check a stall |
| `check_requests` + `check_request_files` | Inspection assignments and findings |
| `announcements` | Notices from the market office |
| `payment_receipts` | Payments collected from vendors |
| `market_perimeter` | The market boundary polygon |
| `archive` | Archived records |
| `inventory_items` | Table exists; no feature uses it yet |

### Files: what's real and what isn't

Worth understanding, because it surprises people:

- **Permits, violation evidence, inspection photos, receipts** — only the
  **file name** is stored. No actual image or PDF is uploaded anywhere. The
  name is a label for a human to recognise.
- **Receipts can optionally hold a real file.** The server supports uploading
  to Supabase Storage if the client sends the file contents. The web app does;
  the mobile app deliberately does not, so it needs no Storage setup. One
  route handles both.

---

## 3. Web app (React + Vite)

**Serves:** admin and super-admin (vendor and officer pages still exist and
work, but those roles are expected to use the mobile app).

Sixteen pages under `src/app/pages/`, including dashboards for each role, the
Leaflet map views, application review, stall management, analytics, archive,
and check requests.

**Session:** an httpOnly cookie set by the server. A small copy of the user's
name and role is cached in the browser so the UI can render instantly on load
— the cookie remains the source of truth.

---

## 4. Mobile app (React Native + Expo)

**Location:** `mobile/` · **Expo SDK 57 · React Native 0.86 · React 19**

Its own dependencies, deliberately separate from the web app's — sharing them
caused version conflicts.

### Vendor (teal)

| Tab | What it does |
|---|---|
| Home | Greeting, application counts, recent activity |
| Applications | Full list; tap through to details and permit upload |
| Transfers | Offers received and sent; accept or decline |
| Notices | Announcements |
| Map | Browse stalls; apply for a vacant one |

### Officer (amber)

| Tab | What it does |
|---|---|
| Violations | Report with camera evidence, resolve, dismiss |
| Checks | Assigned inspections; complete with findings and photos |
| Map | Stalls flagged by open violations |
| Receipts | Record payments collected |

Sign-out is in the header of every officer screen. Vendors sign out from the
bottom of the Home tab.

### The map

Both maps run **Leaflet with OpenStreetMap tiles inside a WebView** — the same
library and tiles the web app uses. The first attempt used Google Maps and
rendered black, because Google serves no tiles without an API key. Leaflet
needs no key, no Google account, and looks like the web version because it *is*
the same thing.

In a plain browser the Map tab shows a stall list instead, since nesting a web
page inside a web page is pointless. The real map needs a phone.

### Finding the server

In development the app works out the API address itself: it reuses whatever
host the phone used to reach the Expo dev server and swaps in port 4000. New
Wi-Fi, a router reboot, a new DHCP lease — all handled with nothing to edit.
`EXPO_PUBLIC_API_BASE_URL` is only for a production build, where there is no
dev server to ask.

---

## 5. Browser and device storage

Everything meaningful lives in Supabase. What remains local is UI state, and
it belongs there — putting it in a database would add latency for no benefit.

### Web browser

| Key | Purpose | Why it's local |
|---|---|---|
| `pubmark_profile_cache` | Cached name and role | Renders the UI instantly on load; the cookie is still the real session |
| `pubmark_toast`, `pubmark_pending_toast` | Notification messages | Carries a message across a page navigation |
| `pubmark_seen_decisions` | Which decisions a vendor has been shown | Per-person UI state, meaningless to anyone else |
| `pubmark_users` | Legacy user cache in `authStorage.ts` | Left over from the pre-API era — see below |

### Mobile device

| What | Where |
|---|---|
| Auth token and profile | The phone's **encrypted keystore** (Keychain on iOS, Keystore on Android) — it's a credential, treated like one |
| Same, running in a browser | `localStorage`, because the encrypted store has no web implementation |

### What used to be here and no longer is

Transfers, archive, inventory, announcements, perimeters, and stalls all used
to live in browser storage. They are all on Supabase now, and the five dead
storage modules were deleted.

**Transfers were the important one** — that wasn't a tidy-up, it was a live
bug. A transfer offer was saved to the **sender's browser only**, so the
recipient looked in their own browser and found nothing. The feature could not
work between two people. It works now.

---

## Known loose ends

Small, none of them breaking anything:

- **`pubmark_users`** in `authStorage.ts` still reads and writes a local user
  list, left from before the API existed. Users come from the API now, so this
  is redundant.
- **`services/supabase.ts`** is imported by nothing — a leftover from the
  original Supabase plan.
- **`legacyMigration.ts` / `legacyRequestMigration.ts`** still run on the admin
  dashboards, migrating pre-API `localStorage` data on page load. Harmless, and
  eventually pointless once no browser has that old data.
- **`applicationsStorage.ts` and `stallsStorage.ts`** still exist, but live code
  only imports pure helpers (`addMonths`, `formatFileSize`) and a type from
  them — no storage code runs.
- **The mobile app is not yet installable.** It runs through Expo Go. Packaging
  it into an `.apk` is the last remaining phase.

---

## Running it

```bash
npm run dev              # project root — starts the API and the web app together
cd mobile && npx expo start   # separate terminal, then scan the QR code
```

**Setup on a new machine:** copy `server/.env.example` to `server/.env` and
fill in the real `DATABASE_URL` and `JWT_SECRET` — ask the project owner, and
never send them through git. See `server/README.md`.

**If the phone can't reach the API,** it is almost always Windows Firewall
blocking port 4000. One-time fix, in an Administrator PowerShell:

```powershell
New-NetFirewallRule -DisplayName "PubMark API (dev) - TCP 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
```
