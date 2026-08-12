# PubMark — Database Reference

> This document maps every localStorage store currently used in the app to its intended Supabase equivalent.
> Each section describes the schema, purpose, relationships, and the roles that interact with it.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Role Summary](#role-summary)
3. [System Flow](#system-flow)
4. [Session Progress - August 13, 2026](#session-progress---august-13-2026)
5. [Data Stores (localStorage → Supabase)](#data-stores)
   - [users](#1-users)
   - [sessions](#2-sessions)
   - [stalls](#3-stalls)
   - [applications](#4-applications)
   - [transfers](#5-transfers)
   - [termination_requests](#6-termination_requests)
   - [violations](#7-violations)
   - [violation_requests](#8-violation_requests)
   - [check_requests](#9-check_requests)
   - [announcements](#10-announcements)
   - [inventory](#11-inventory)
   - [archive](#12-archive)
   - [market_perimeter](#13-market_perimeter)
6. [UI/Ephemeral State Keys](#uiephemeral-state-keys)
7. [Entity Relationships](#entity-relationships)
8. [Supabase Migration Notes](#supabase-migration-notes)

---

## System Overview

**PubMark** is a public market stall management system that handles:
- Vendor registration, stall applications, contract management
- Officer-driven inspections, violation reporting, enforcement
- Admin oversight of all stall activity, announcements, and user management
- Super Admin control over the entire system including user accounts and analytics

All data is currently persisted in **browser localStorage** under `pubmark_*` keys. The target migration is **Supabase (PostgreSQL + Auth + Storage)**.

---

## Role Summary

| Role | Key Responsibilities |
|------|---------------------|
| **Super Admin** | Full system access: manage all users, stalls, view all reports & terminations, analytics |
| **Admin** | Manage stall applications, approve/reject, create check requests, manage violations, post announcements |
| **Officer** | Receive and complete check requests, report violations from the field, upload evidence |
| **Vendor (User)** | Apply for stalls, view application status, manage transfers, request termination |

---

## System Flow

```
VENDOR (User)
  │
  ├─► Register / Login
  │     └─ authStorage: pubmark_users, pubmark_session
  │
  ├─► Apply for Stall
  │     └─ applicationsStorage: pubmark_applications
  │
  ├─► View Decision (approved / rejected)
  │     └─ pubmark_seen_decisions (UI state)
  │
  ├─► Transfer Stall (to another vendor)
  │     └─ transferStorage: pubmark_transfers
  │
  └─► Request Termination (account or contract)
        └─ terminationRequestsStore: pubmark_termination_requests


ADMIN
  │
  ├─► Review Applications → Approve / Reject
  │     └─ applicationsStorage: pubmark_applications
  │
  ├─► Create Check Request for Officer
  │     └─ checkRequestsStore: pubmark_check_requests
  │
  ├─► Manage Violations (view, resolve, dismiss)
  │     └─ violationsStore: pubmark_violations
  │
  ├─► Review Termination Requests → Approve / Reject
  │     └─ terminationRequestsStore: pubmark_termination_requests
  │
  ├─► Post Announcements to Vendors
  │     └─ announcementsStore: stall_announcements
  │
  └─► Manage Transfers (view, accept, decline)
        └─ transferStorage: pubmark_transfers


OFFICER
  │
  ├─► View Assigned Check Requests
  │     └─ checkRequestsStore: pubmark_check_requests
  │
  ├─► Complete Check Request (upload evidence/notes)
  │     └─ checkRequestsStore: pubmark_check_requests
  │
  └─► Report Violation (from check request or independently)
        └─ violationsStore: pubmark_violations


SUPER ADMIN
  │
  ├─► All Admin capabilities (above)
  │
  ├─► Create / Edit / Delete Users (all roles)
  │     └─ authStorage: pubmark_users
  │
  ├─► Manage Stalls (add, edit, delete, map geometry)
  │     └─ stallsStorage: pubmark_stalls
  │     └─ perimeterStore: pubmark_perimeter
  │
  ├─► View Analytics (violations, stall occupancy, applications)
  │     └─ violationsStore, stallsStorage, applicationsStorage (read-only aggregation)
  │
  ├─► Manage Inventory
  │     └─ inventoryStore: pubmark_inventory
  │
  └─► Manage Archive (restore or delete archived records)
        └─ archiveStore: pubmark_archive
```

---

## Session Progress - August 13, 2026

This section summarizes the major implementation work completed during the current development session.

### Backend / Database Progress

- Announcements were moved from browser `localStorage` into the backend database.
- New API routes were added for announcements:
  - `GET /api/announcements`
  - `POST /api/announcements`
  - `DELETE /api/announcements/:id`
- The backend now auto-creates and seeds the `announcements` table with default records when needed.
- Officer/admin request flow was migrated to database-backed API routes:
  - `GET/POST/PATCH/DELETE /api/check-requests`
  - `GET/POST/PATCH /api/violation-requests`
  - `GET/POST/PATCH /api/violations`
  - `GET/POST/PATCH /api/termination-requests`
  - `GET /api/users`
- Supporting database helpers were added for:
  - `check_requests`
  - `check_request_files`
  - `violation_requests`
  - `violations`
  - `violation_evidence`
  - `termination_requests`
- Legacy request migration was added so old browser-stored data can be imported into the database.
- Violation requests are now mirrored into `check_requests` so officer completion reports can appear in admin inspection reports.

### Frontend Progress

- Admin and vendor announcements now load from the API instead of local browser storage.
- Officer check requests, violation requests, violations, and termination requests were migrated to API-backed stores.
- The following frontend data modules were updated to use the database:
  - `src/app/services/announcementsApi.ts`
  - `src/app/components/checkRequestsStore.ts`
  - `src/app/components/violationRequestStore.ts`
  - `src/app/components/violationsStore.ts`
  - `src/app/components/terminationRequestsStore.ts`
- Admin and Super Admin dashboards were updated so reports and requests load from API data.
- Dashboard report loaders were hardened so one failing endpoint no longer hides all report sections.
- Officer completion flow was updated so:
  - completion reports are submitted to the database
  - linked violation requests are marked completed
  - refreshed request lists come from API state instead of stale local values
- Officer violation submission was fixed to await the API response before refreshing the UI.
- Analytics was fixed to load violations asynchronously from the API instead of treating the API call like a local array.

### Application / Contract Workflow Progress

- Permit deadline handling was added for approved vendor applications missing a business permit.
- Admin can set and later move the business permit submission deadline.
- Applications can now be auto-terminated when the permit deadline expires without compliance.
- Termination approval logic was updated so approved termination actions mark the contract as terminated rather than appearing rejected in the vendor flow.
- Contract printing work continued through `ContractModal`, including type fixes to prevent route crashes from the modal component.

### UI / UX Fixes Completed

- Registration layout issues were addressed so the form no longer overflows the visible screen.
- Registration scrolling issues were addressed so upper form fields remain reachable.
- Officer request visibility issues were investigated and moved toward API-backed synchronization.
- Reports and request visibility for Admin and Super Admin were improved after the local-to-database migration.

### Current Notes

- The core reports data is now confirmed to exist in the database.
- Remaining issues are now mostly frontend integration issues rather than missing backend persistence.
- If another page still breaks after the storage migration, check first for any old synchronous store usage that now needs `await` and state loading.

---

## Data Stores

---

### 1. `users`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Primary key |
| `email` | `string` | Unique |
| `passwordHash` | `string` | Currently plain hash — use bcrypt/Supabase Auth |
| `name` | `string` | Full name |
| `address` | `string` | Residential address |
| `phone` | `string` | Contact number |
| `role` | `enum` | `super_admin`, `admin`, `vendor`, `officer` |
| `department` | `string?` | Optional, for admin/officer accounts |
| `createdAt` | `ISO string` | Account creation timestamp |

**localStorage Key:** `pubmark_users`  
**Store File:** `src/app/components/authStorage.ts`

**Purpose:** Stores all user accounts across all roles. Acts as the central identity record.

**Who reads it:**
- Super Admin — full CRUD (create, edit, delete, view all)
- Admin — read-only (to list vendors, officers)
- Officer — read-only (own profile only)
- Vendor — read-only (own profile only)

**Supabase Replacement:** `auth.users` (built-in) + a `profiles` table for extended fields (name, phone, address, role, department).

---

### 2. `sessions`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `string` | Foreign key → users.id |
| `role` | `enum` | Active role of session |
| `name` | `string` | Display name |
| `email` | `string` | User email |

**localStorage Key:** `pubmark_session`  
**Store File:** `src/app/components/authStorage.ts`

**Purpose:** Tracks the currently logged-in user across page refreshes. Single record (one active session per browser).

**Supabase Replacement:** Supabase Auth session (JWT stored in cookie/localStorage automatically). No separate table needed.

---

### 3. `stalls`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `stall_name` | `string` | Display name |
| `status` | `enum` | `vacant`, `occupied`, `unavailable` |
| `owner_name` | `string?` | Current occupant name |
| `business_type` | `string` | Type of business |
| `section` | `string` | Section label (e.g. "A", "B") |
| `floor` | `enum` | `"1"` or `"2"` |
| `floor_area` | `string` | Area in sqm |
| `notes` | `string` | Admin notes |
| `geometry` | `JSON` | GeoJSON geometry for map rendering |
| `created_at` | `ISO string` | Creation timestamp |

**localStorage Key:** `pubmark_stalls`  
**Store File:** `src/app/components/stallsStorage.ts`

**Purpose:** Master list of all market stalls. Includes physical layout data (geometry) used by the interactive map. Status reflects occupancy.

**Who reads it:**
- Super Admin — full CRUD + map geometry editing
- Admin — read-only (to list stalls for check requests)
- Vendor — read-only (to select stalls when applying)
- Officer — read-only (stall info in check requests)

**Supabase Replacement:** `stalls` table. Geometry can use `jsonb` or PostGIS `geometry` type.

---

### 4. `applications`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `userId` | `string` | FK → users.id |
| `stallId` | `string` | FK → stalls.id |
| `stallName` | `string` | Denormalized |
| `stallSection` | `string` | Denormalized |
| `floorArea` | `string` | Denormalized |
| `applicantName` | `string` | |
| `applicantEmail` | `string` | |
| `applicantAddress` | `string` | |
| `businessName` | `string` | |
| `businessType` | `string` | |
| `contractStart` | `date string` | |
| `contractTermMonths` | `string` | |
| `contractEnd` | `date string` | |
| `permitFileName` | `string?` | Business permit file name |
| `permitFileSize` | `string?` | |
| `additionalFileName` | `string?` | |
| `additionalFileSize` | `string?` | |
| `notes` | `string` | Applicant notes |
| `status` | `enum` | `pending`, `approved`, `rejected` |
| `dateApplied` | `ISO string` | |
| `adminRemarks` | `string` | Admin feedback |

**localStorage Key:** `pubmark_applications`  
**Store File:** `src/app/components/applicationsStorage.ts`

**Purpose:** Records vendor stall applications. Acts as the central contract record once approved. Admin approves/rejects with remarks.

**Who reads it:**
- Vendor — read their own applications, see status and remarks
- Admin — full CRUD (review, approve, reject, view details)
- Super Admin — read-only view

**Supabase Replacement:** `applications` table. Permit files → Supabase Storage bucket `permits/`.

---

### 5. `transfers`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `fromUserId` | `string` | FK → users.id |
| `fromUserName` | `string` | Denormalized |
| `fromUserEmail` | `string` | Denormalized |
| `toUserEmail` | `string` | Recipient email |
| `toUserId` | `string` | FK → users.id |
| `toUserName` | `string` | Denormalized |
| `stallId` | `string` | FK → stalls.id |
| `stallName` | `string` | Denormalized |
| `stallSection` | `string` | Denormalized |
| `stallFloor` | `enum` | `"1"` or `"2"` |
| `floorArea` | `string` | Denormalized |
| `originalApplicationId` | `string` | FK → applications.id |
| `status` | `enum` | `pending`, `accepted`, `declined` |
| `createdAt` | `ISO string` | |
| `respondedAt` | `ISO string?` | |

**localStorage Key:** `pubmark_transfers`  
**Store File:** `src/app/components/transferStorage.ts`

**Purpose:** Allows a vendor with an approved stall to transfer it to another registered vendor. Recipient must accept or decline.

**Who reads it:**
- Vendor — create transfer, see sent/received transfers
- Admin — read-only view (monitor transfers)
- Super Admin — read-only view

**Supabase Replacement:** `transfers` table with RLS so only sender and recipient can read/update.

---

### 6. `termination_requests`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `type` | `enum` | `account` or `contract` |
| `vendorId` | `string` | FK → users.id |
| `vendorName` | `string` | Denormalized |
| `vendorEmail` | `string` | Denormalized |
| `stallId` | `string?` | FK → stalls.id (for contract type) |
| `stallName` | `string?` | Denormalized |
| `reason` | `string` | Vendor-provided reason |
| `status` | `enum` | `pending`, `approved`, `rejected` |
| `createdAt` | `ISO string` | |
| `resolvedAt` | `ISO string?` | |

**localStorage Key:** `pubmark_termination_requests`  
**Store File:** `src/app/components/terminationRequestsStore.ts`

**Purpose:** Vendors submit requests to terminate either their entire account or a specific stall contract. Admin/Super Admin reviews and approves or rejects.

**Who reads it:**
- Vendor — submit termination requests
- Admin — review and act on pending requests
- Super Admin — review and act on pending requests

**Supabase Replacement:** `termination_requests` table.

---

### 7. `violations`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `stallId` | `string` | FK → stalls.id |
| `stallName` | `string` | Denormalized |
| `vendorName` | `string` | Denormalized |
| `officerId` | `string` | FK → users.id |
| `officerName` | `string` | Denormalized |
| `category` | `enum` | `Illegal Vending`, `Health Violation`, `Fire Hazard`, `Noise Complaint`, `Unauthorized Renovation`, `Other` |
| `description` | `string` | Detailed description |
| `status` | `enum` | `open`, `resolved`, `dismissed` |
| `evidence` | `ViolationEvidence[]` | Array of file metadata |
| `remarks` | `string` | Ongoing updates / resolution notes |
| `createdAt` | `ISO string` | |
| `resolvedAt` | `ISO string?` | |

**ViolationEvidence shape:**
```
{ name: string, type: "image" | "video" | "document", size: string }
```

**localStorage Key:** `pubmark_violations`  
**Store File:** `src/app/components/violationsStore.ts`

**Purpose:** Records violations reported by officers against stalls/vendors. Admin can view and update status. Officers can attach evidence.

**Who reads it:**
- Officer — create violations, add ongoing updates
- Admin — view, resolve, or dismiss violations
- Super Admin — view in reports and analytics

**Supabase Replacement:** `violations` table + `violation_evidence` child table. Evidence files → Supabase Storage `evidence/`.

---

### 8. `violation_requests`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `stallId` | `string` | FK → stalls.id |
| `stallName` | `string` | Denormalized |
| `requestedBy` | `string` | FK → users.id |
| `requestedByName` | `string` | Denormalized |
| `reason` | `string` | Reason for requesting check |
| `status` | `enum` | `pending`, `assigned`, `completed` |
| `assignedOfficerId` | `string?` | FK → users.id |
| `assignedOfficerName` | `string?` | Denormalized |
| `createdAt` | `ISO string` | |
| `completedAt` | `ISO string?` | |

**localStorage Key:** `pubmark_violation_requests`  
**Store File:** `src/app/components/violationRequestStore.ts`

**Purpose:** Admin requests an officer to check a specific stall for potential violations. Officer accepts and completes it.

**Who reads it:**
- Admin — create requests, track status
- Officer — view assigned requests, mark complete
- Super Admin — read-only overview

**Supabase Replacement:** `violation_requests` table.

---

### 9. `check_requests`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `stallId` | `string` | FK → stalls.id |
| `stallName` | `string` | Denormalized |
| `requestedBy` | `string` | FK → users.id |
| `requestedByName` | `string` | Denormalized |
| `assignedTo` | `string?` | FK → users.id |
| `assignedToName` | `string?` | Denormalized |
| `priority` | `enum` | `low`, `normal`, `high`, `urgent` |
| `reason` | `string` | |
| `notes` | `string` | Admin notes |
| `status` | `enum` | `pending`, `completed`, `cancelled` |
| `createdAt` | `ISO string` | |
| `completedAt` | `ISO string?` | |
| `completionNotes` | `string` | Officer notes on completion |
| `completionSummary` | `string` | Summary of findings |
| `completionFiles` | `CompletionFile[]` | Evidence uploaded on completion |

**CompletionFile shape:**
```
{ name: string, type: "image" | "video" | "document", size: string }
```

**localStorage Key:** `pubmark_check_requests`  
**Store File:** `src/app/components/checkRequestsStore.ts`

**Purpose:** Admin/Super Admin sends inspection requests to officers with priority levels. Officers complete them with notes and file evidence. Officers can also file a violation report from within a check request.

**Who reads it:**
- Admin / Super Admin — create, cancel, view results
- Officer — view pending assignments, complete with evidence, trigger violation reports

**Supabase Replacement:** `check_requests` table + `completion_files` child table or `jsonb` column. Evidence → Supabase Storage.

---

### 10. `announcements`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `title` | `string` | |
| `message` | `string` | Full announcement body |
| `type` | `enum` | `info`, `warning`, `urgent`, `success` |
| `createdAt` | `ISO string` | |
| `author` | `string` | Display name of admin who posted |

**localStorage Key:** `stall_announcements`  
**Store File:** `src/app/components/announcementsStore.ts`

> Note: This key does **not** use the `pubmark_` prefix — should be unified in Supabase.

**Purpose:** Admin posts notices visible to all vendors. Shown in the Vendor dashboard and Admin announcements panel.

**Who reads it:**
- Admin — full CRUD (create, delete, view)
- Super Admin — full CRUD
- Vendor — read-only (see latest announcements)

**Supabase Replacement:** `announcements` table. RLS: all authenticated users can read; only admin/super_admin can insert/delete.

---

### 11. `inventory`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `name` | `string` | Item name |
| `category` | `enum` | `Produce`, `Meat & Seafood`, `Dry Goods`, `Equipment`, `Supplies`, `Other` |
| `unit` | `string` | Unit of measure (kg, pcs, etc.) |
| `quantity` | `number` | Current stock count |
| `minQuantity` | `number` | Threshold for low-stock alert |
| `unitCost` | `number` | Cost per unit |
| `supplier` | `string` | Supplier name |
| `lastRestocked` | `date string` | |
| `notes` | `string` | |

**Computed:** `stockStatus` derived from `quantity` vs `minQuantity` → `in_stock`, `low_stock`, `out_of_stock`

**localStorage Key:** `pubmark_inventory`  
**Store File:** `src/app/components/inventoryStore.ts`

**Purpose:** Tracks market equipment and supply inventory managed by the Super Admin.

**Who reads it:**
- Super Admin — full CRUD

**Supabase Replacement:** `inventory_items` table.

---

### 12. `archive`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `type` | `enum` | `application`, `vendor`, `stall`, `violation` |
| `title` | `string` | Display title |
| `description` | `string` | Summary |
| `originalId` | `string` | Original record ID |
| `originalData` | `JSON` | Full snapshot of the original record |
| `archivedBy` | `string` | FK → users.id |
| `archivedByName` | `string` | Denormalized |
| `reason` | `string` | Why it was archived |
| `archivedAt` | `ISO string` | |
| `canRestore` | `boolean` | Whether restore is allowed |

**localStorage Key:** `pubmark_archive`  
**Store File:** `src/app/components/archiveStore.ts`

**Purpose:** Soft-delete archive for applications, vendors, stalls, and violations. Records can be restored or permanently deleted by Super Admin.

**Who reads it:**
- Super Admin — full access (view, restore, delete)

**Supabase Replacement:** `archive` table with `original_data jsonb`. Alternatively, add a `deleted_at` column to each original table for soft deletes.

---

### 13. `market_perimeter`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Primary key |
| `name` | `string` | Perimeter label |
| `geometry` | `JSON` | GeoJSON geometry of market boundary |
| `createdBy` | `string` | FK → users.id |
| `createdByName` | `string` | Denormalized |
| `createdAt` | `ISO string` | |
| `notes` | `string` | |

**localStorage Key:** `pubmark_perimeter`  
**Store File:** `src/app/components/perimeterStore.ts`

**Purpose:** Stores the drawn boundary of the market on the map. Single record — only one active perimeter at a time.

**Who reads it:**
- Super Admin — create, update, clear

**Supabase Replacement:** `market_perimeter` table (single-row via application logic) or PostGIS-enabled column.

---

## UI/Ephemeral State Keys

These keys are not part of the core data model — they are UI-only helpers and do not need a Supabase equivalent. They can remain in localStorage or be moved to sessionStorage.

| Key | Purpose | Shape |
|-----|---------|-------|
| `pubmark_pending_toast` | Show a toast message after a page redirect (e.g. post-login) | `{ message: string; type: "success" \| "error" }` |
| `pubmark_seen_decisions` | Track which application decision notifications a vendor has already read | `string[]` (array of application IDs) |

---

## Entity Relationships

```
users ──────────────────────────────────────┐
  │                                         │
  ├─► applications (userId → users.id)      │
  │     └─► transfers (originalApplicationId)│
  │                                         │
  ├─► transfers (fromUserId / toUserId)      │
  │                                         │
  ├─► termination_requests (vendorId)        │
  │                                         │
  ├─► violations (officerId)                 │
  │                                         │
  ├─► check_requests (requestedBy / assignedTo)
  │                                         │
  ├─► violation_requests (requestedBy / assignedOfficerId)
  │                                         │
  ├─► announcements (author)                │
  │                                         │
  └─► archive (archivedBy)                  │
                                            │
stalls ──────────────────────────────────── ┘
  │
  ├─► applications (stallId)
  ├─► violations (stallId)
  ├─► check_requests (stallId)
  ├─► violation_requests (stallId)
  └─► termination_requests (stallId, optional)
```

---

## Supabase Migration Notes

### Authentication
- Replace `pubmark_users` + `pubmark_session` with **Supabase Auth** (`auth.users`)
- Add a `profiles` table linked to `auth.users.id` for extended fields: `name`, `phone`, `address`, `role`, `department`
- Use Supabase Auth JWTs; the `role` field in `profiles` drives Row Level Security (RLS) policies

### File Storage
Currently, only file **metadata** (name, size, type) is stored — no actual files. For Supabase:
- Create a `permits` bucket for application permit uploads (applications)
- Create an `evidence` bucket for officer evidence uploads (violations, check_requests)
- Store file paths returned from Supabase Storage in the corresponding table rows

### Row Level Security (RLS) Policy Sketch
| Table | Vendor | Officer | Admin | Super Admin |
|-------|--------|---------|-------|-------------|
| `profiles` | own row only | own row only | read all | full access |
| `stalls` | read only | read only | read only | full CRUD |
| `applications` | own rows | — | full CRUD | read all |
| `transfers` | own rows | — | read all | read all |
| `termination_requests` | own rows | — | full CRUD | full CRUD |
| `violations` | — | insert + own | read + update | full CRUD |
| `check_requests` | — | read assigned + update | full CRUD | full CRUD |
| `violation_requests` | — | read + update | full CRUD | full CRUD |
| `announcements` | read only | read only | full CRUD | full CRUD |
| `inventory` | — | — | — | full CRUD |
| `archive` | — | — | — | full CRUD |
| `market_perimeter` | — | — | — | full CRUD |

### Naming Standardization
Before migration, unify these inconsistencies:
- `stall_announcements` key → rename to `pubmark_announcements`
- Mixed snake_case vs camelCase in stalls fields → standardize to snake_case in Supabase
- Denormalized `name` fields (e.g. `vendorName`, `stallName`) → remove from DB, join via foreign keys, keep in app state only

### Real-time Features (Post-Migration)
Once on Supabase, the following can use **Realtime subscriptions** instead of polling:
- New check requests assigned to an officer
- Application status changes for vendors
- New announcements posted by admin
- Termination request status updates

---

## SQL Schema

> Run these in order inside the **Supabase SQL Editor**. Each block is self-contained and idempotent (`CREATE TYPE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`).
> All primary keys use `uuid` generated by `gen_random_uuid()`. All timestamps are `timestamptz` stored in UTC.

---

### Step 0 — Enable Extensions

```sql
-- UUID generation (enabled by default in Supabase, included for completeness)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PostGIS for geometry (optional — only needed if you want native spatial queries)
-- CREATE EXTENSION IF NOT EXISTS postgis;
```

---

### Step 1 — Enum Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'officer',
  'vendor'
);

-- Stall occupancy status
CREATE TYPE stall_status AS ENUM (
  'vacant',
  'occupied',
  'unavailable'
);

-- Application / contract status
CREATE TYPE application_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Stall transfer status
CREATE TYPE transfer_status AS ENUM (
  'pending',
  'accepted',
  'declined'
);

-- Termination request type
CREATE TYPE termination_type AS ENUM (
  'account',
  'contract'
);

-- Generic pending/approved/rejected status (reused by termination)
CREATE TYPE resolution_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Violation category
CREATE TYPE violation_category AS ENUM (
  'Illegal Vending',
  'Health Violation',
  'Fire Hazard',
  'Noise Complaint',
  'Unauthorized Renovation',
  'Other'
);

-- Violation lifecycle status
CREATE TYPE violation_status AS ENUM (
  'open',
  'resolved',
  'dismissed'
);

-- Violation / check request evidence file type
CREATE TYPE evidence_file_type AS ENUM (
  'image',
  'video',
  'document'
);

-- Violation check request status (admin → officer pipeline)
CREATE TYPE violation_request_status AS ENUM (
  'pending',
  'assigned',
  'completed'
);

-- Officer check request priority
CREATE TYPE check_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Check request lifecycle status
CREATE TYPE check_request_status AS ENUM (
  'pending',
  'completed',
  'cancelled'
);

-- Announcement type / severity
CREATE TYPE announcement_type AS ENUM (
  'info',
  'warning',
  'urgent',
  'success'
);

-- Inventory stock status (computed, stored for fast filtering)
CREATE TYPE stock_status AS ENUM (
  'in_stock',
  'low_stock',
  'out_of_stock'
);

-- Inventory item category
CREATE TYPE item_category AS ENUM (
  'Produce',
  'Meat & Seafood',
  'Dry Goods',
  'Equipment',
  'Supplies',
  'Other'
);

-- Archive record source type
CREATE TYPE archive_type AS ENUM (
  'application',
  'vendor',
  'stall',
  'violation'
);
```

---

### Step 2 — `profiles` (extends `auth.users`)

```sql
-- Mirrors auth.users 1-to-1. Created automatically on user sign-up via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text          NOT NULL UNIQUE,
  name        text          NOT NULL DEFAULT '',
  address     text          NOT NULL DEFAULT '',
  phone       text          NOT NULL DEFAULT '',
  role        user_role     NOT NULL DEFAULT 'vendor',
  department  text,                                        -- optional, admin/officer only
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- Index for role-based queries (e.g. list all officers)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'vendor')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_read_all_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_full_super_admin"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
```

---

### Step 3 — `stalls`

```sql
CREATE TABLE IF NOT EXISTS public.stalls (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_name    text          NOT NULL,
  status        stall_status  NOT NULL DEFAULT 'vacant',
  owner_id      uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,  -- FK to current occupant
  business_type text          NOT NULL DEFAULT '',
  section       text          NOT NULL DEFAULT '',
  floor         text          NOT NULL CHECK (floor IN ('1', '2')),
  floor_area    text          NOT NULL DEFAULT '',
  notes         text          NOT NULL DEFAULT '',
  geometry      jsonb,                                      -- GeoJSON polygon for map rendering
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stalls_status   ON public.stalls(status);
CREATE INDEX IF NOT EXISTS idx_stalls_section  ON public.stalls(section);
CREATE INDEX IF NOT EXISTS idx_stalls_floor    ON public.stalls(floor);
CREATE INDEX IF NOT EXISTS idx_stalls_owner_id ON public.stalls(owner_id);

CREATE TRIGGER trg_stalls_updated_at
  BEFORE UPDATE ON public.stalls
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read stalls
CREATE POLICY "stalls_read_all"
  ON public.stalls FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super_admin can insert / update / delete
CREATE POLICY "stalls_write_super_admin"
  ON public.stalls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
```

---

### Step 4 — `applications`

```sql
CREATE TABLE IF NOT EXISTS public.applications (
  id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid                NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stall_id              uuid                NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  applicant_name        text                NOT NULL,
  applicant_email       text                NOT NULL,
  applicant_address     text                NOT NULL DEFAULT '',
  business_name         text                NOT NULL DEFAULT '',
  business_type         text                NOT NULL DEFAULT '',
  contract_start        date,
  contract_term_months  integer,
  contract_end          date,
  -- File metadata (actual files stored in Supabase Storage under permits/)
  permit_file_name      text,
  permit_file_size      text,
  permit_file_path      text,               -- storage path: permits/{application_id}/permit.pdf
  additional_file_name  text,
  additional_file_size  text,
  additional_file_path  text,
  notes                 text                NOT NULL DEFAULT '',
  status                application_status  NOT NULL DEFAULT 'pending',
  admin_remarks         text                NOT NULL DEFAULT '',
  date_applied          timestamptz         NOT NULL DEFAULT now(),
  resolved_at           timestamptz,
  resolved_by           uuid                REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            timestamptz         NOT NULL DEFAULT now(),
  updated_at            timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id  ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_stall_id ON public.applications(stall_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON public.applications(status);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Vendors see only their own applications
CREATE POLICY "applications_read_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can insert their own
CREATE POLICY "applications_insert_vendor"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin and super_admin can read and update all
CREATE POLICY "applications_admin_all"
  ON public.applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 5 — `transfers`

```sql
CREATE TABLE IF NOT EXISTS public.transfers (
  id                      uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id            uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id              uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_email           text              NOT NULL,       -- stored for lookup before user_id is resolved
  stall_id                uuid              NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  original_application_id uuid              NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
  status                  transfer_status   NOT NULL DEFAULT 'pending',
  created_at              timestamptz       NOT NULL DEFAULT now(),
  responded_at            timestamptz,
  updated_at              timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfers_from_user_id ON public.transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_user_id   ON public.transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_stall_id     ON public.transfers(stall_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status       ON public.transfers(status);

CREATE TRIGGER trg_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can read
CREATE POLICY "transfers_read_parties"
  ON public.transfers FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Only the sender can insert
CREATE POLICY "transfers_insert_sender"
  ON public.transfers FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Only the recipient can update (accept/decline)
CREATE POLICY "transfers_update_recipient"
  ON public.transfers FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Admin and super_admin read-only overview
CREATE POLICY "transfers_read_admin"
  ON public.transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 6 — `termination_requests`

```sql
CREATE TABLE IF NOT EXISTS public.termination_requests (
  id           uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  type         termination_type   NOT NULL,
  vendor_id    uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stall_id     uuid               REFERENCES public.stalls(id) ON DELETE SET NULL,  -- null for account terminations
  reason       text               NOT NULL DEFAULT '',
  status       resolution_status  NOT NULL DEFAULT 'pending',
  created_at   timestamptz        NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolved_by  uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at   timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_termination_vendor_id ON public.termination_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_termination_status    ON public.termination_requests(status);
CREATE INDEX IF NOT EXISTS idx_termination_type      ON public.termination_requests(type);

CREATE TRIGGER trg_termination_updated_at
  BEFORE UPDATE ON public.termination_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.termination_requests ENABLE ROW LEVEL SECURITY;

-- Vendors see only their own requests
CREATE POLICY "termination_read_own"
  ON public.termination_requests FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "termination_insert_vendor"
  ON public.termination_requests FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

-- Admin and super_admin full access
CREATE POLICY "termination_admin_all"
  ON public.termination_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 7 — `violations` + `violation_evidence`

```sql
CREATE TABLE IF NOT EXISTS public.violations (
  id           uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id     uuid                NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  vendor_id    uuid                REFERENCES public.profiles(id) ON DELETE SET NULL,
  officer_id   uuid                NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category     violation_category  NOT NULL,
  description  text                NOT NULL DEFAULT '',
  status       violation_status    NOT NULL DEFAULT 'open',
  remarks      text                NOT NULL DEFAULT '',    -- running notes / resolution summary
  created_at   timestamptz         NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  updated_at   timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_stall_id   ON public.violations(stall_id);
CREATE INDEX IF NOT EXISTS idx_violations_officer_id ON public.violations(officer_id);
CREATE INDEX IF NOT EXISTS idx_violations_status     ON public.violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_category   ON public.violations(category);

CREATE TRIGGER trg_violations_updated_at
  BEFORE UPDATE ON public.violations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Child table: one row per evidence file attached to a violation
CREATE TABLE IF NOT EXISTS public.violation_evidence (
  id            uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id  uuid                NOT NULL REFERENCES public.violations(id) ON DELETE CASCADE,
  file_name     text                NOT NULL,
  file_type     evidence_file_type  NOT NULL,
  file_size     text                NOT NULL DEFAULT '',
  file_path     text,                                      -- storage path: evidence/violations/{violation_id}/{file_name}
  uploaded_by   uuid                REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at   timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violation_evidence_violation_id ON public.violation_evidence(violation_id);

ALTER TABLE public.violations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_evidence ENABLE ROW LEVEL SECURITY;

-- Officers can insert violations and update their own
CREATE POLICY "violations_insert_officer"
  ON public.violations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'officer'
    )
  );

CREATE POLICY "violations_update_own_officer"
  ON public.violations FOR UPDATE
  USING (auth.uid() = officer_id);

-- Admin and super_admin full access
CREATE POLICY "violations_admin_all"
  ON public.violations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Evidence inherits violation access
CREATE POLICY "violation_evidence_read_admin_officer"
  ON public.violation_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'officer')
    )
  );

CREATE POLICY "violation_evidence_insert_officer"
  ON public.violation_evidence FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "violation_evidence_delete_admin"
  ON public.violation_evidence FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 8 — `violation_requests`

```sql
CREATE TABLE IF NOT EXISTS public.violation_requests (
  id                   uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id             uuid                       NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  requested_by         uuid                       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_officer_id  uuid                       REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason               text                       NOT NULL DEFAULT '',
  status               violation_request_status   NOT NULL DEFAULT 'pending',
  created_at           timestamptz                NOT NULL DEFAULT now(),
  completed_at         timestamptz,
  updated_at           timestamptz                NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violation_requests_stall_id            ON public.violation_requests(stall_id);
CREATE INDEX IF NOT EXISTS idx_violation_requests_requested_by        ON public.violation_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_violation_requests_assigned_officer_id ON public.violation_requests(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_violation_requests_status              ON public.violation_requests(status);

CREATE TRIGGER trg_violation_requests_updated_at
  BEFORE UPDATE ON public.violation_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.violation_requests ENABLE ROW LEVEL SECURITY;

-- Officers see requests assigned to them
CREATE POLICY "violation_requests_read_officer"
  ON public.violation_requests FOR SELECT
  USING (auth.uid() = assigned_officer_id);

-- Officers can update (mark complete) requests assigned to them
CREATE POLICY "violation_requests_update_officer"
  ON public.violation_requests FOR UPDATE
  USING (auth.uid() = assigned_officer_id);

-- Admin and super_admin full access
CREATE POLICY "violation_requests_admin_all"
  ON public.violation_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 9 — `check_requests` + `check_request_files`

```sql
CREATE TABLE IF NOT EXISTS public.check_requests (
  id                  uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id            uuid                  NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  requested_by        uuid                  NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_to         uuid                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority            check_priority        NOT NULL DEFAULT 'normal',
  reason              text                  NOT NULL DEFAULT '',
  notes               text                  NOT NULL DEFAULT '',
  status              check_request_status  NOT NULL DEFAULT 'pending',
  completion_notes    text                  NOT NULL DEFAULT '',
  completion_summary  text                  NOT NULL DEFAULT '',
  created_at          timestamptz           NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  updated_at          timestamptz           NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_requests_stall_id     ON public.check_requests(stall_id);
CREATE INDEX IF NOT EXISTS idx_check_requests_requested_by ON public.check_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_check_requests_assigned_to  ON public.check_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_check_requests_status       ON public.check_requests(status);
CREATE INDEX IF NOT EXISTS idx_check_requests_priority     ON public.check_requests(priority);

CREATE TRIGGER trg_check_requests_updated_at
  BEFORE UPDATE ON public.check_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Child table: files uploaded when an officer completes a check request
CREATE TABLE IF NOT EXISTS public.check_request_files (
  id               uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  check_request_id uuid                NOT NULL REFERENCES public.check_requests(id) ON DELETE CASCADE,
  file_name        text                NOT NULL,
  file_type        evidence_file_type  NOT NULL,
  file_size        text                NOT NULL DEFAULT '',
  file_path        text,                                    -- storage path: evidence/checks/{check_request_id}/{file_name}
  uploaded_by      uuid                REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at      timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_request_files_check_request_id ON public.check_request_files(check_request_id);

ALTER TABLE public.check_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_request_files ENABLE ROW LEVEL SECURITY;

-- Officers see requests assigned to them
CREATE POLICY "check_requests_read_officer"
  ON public.check_requests FOR SELECT
  USING (auth.uid() = assigned_to);

-- Officers can update requests assigned to them (mark complete, add notes)
CREATE POLICY "check_requests_update_officer"
  ON public.check_requests FOR UPDATE
  USING (auth.uid() = assigned_to);

-- Admin and super_admin full access
CREATE POLICY "check_requests_admin_all"
  ON public.check_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Check request files mirror check_request access
CREATE POLICY "check_request_files_read"
  ON public.check_request_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'officer')
    )
  );

CREATE POLICY "check_request_files_insert_officer"
  ON public.check_request_files FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);
```

---

### Step 10 — `announcements`

```sql
CREATE TABLE IF NOT EXISTS public.announcements (
  id          uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text               NOT NULL,
  message     text               NOT NULL DEFAULT '',
  type        announcement_type  NOT NULL DEFAULT 'info',
  author_id   uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  timestamptz        NOT NULL DEFAULT now(),
  updated_at  timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_author_id  ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type       ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read announcements
CREATE POLICY "announcements_read_all"
  ON public.announcements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin and super_admin can insert / update / delete
CREATE POLICY "announcements_write_admin"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

---

### Step 11 — `inventory_items`

```sql
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text           NOT NULL,
  category        item_category  NOT NULL DEFAULT 'Other',
  unit            text           NOT NULL DEFAULT 'pcs',
  quantity        numeric(10,2)  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity    numeric(10,2)  NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  unit_cost       numeric(12,2)  NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  supplier        text           NOT NULL DEFAULT '',
  last_restocked  date,
  notes           text           NOT NULL DEFAULT '',
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now(),

  -- Computed stock status stored as a generated column for fast filtering
  stock_status stock_status NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN quantity = 0             THEN 'out_of_stock'::stock_status
      WHEN quantity <= min_quantity THEN 'low_stock'::stock_status
      ELSE                               'in_stock'::stock_status
    END
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_inventory_category     ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_status ON public.inventory_items(stock_status);

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Only super_admin can access inventory
CREATE POLICY "inventory_super_admin_only"
  ON public.inventory_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
```

---

### Step 12 — `archive`

```sql
CREATE TABLE IF NOT EXISTS public.archive (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  type           archive_type  NOT NULL,
  title          text          NOT NULL,
  description    text          NOT NULL DEFAULT '',
  original_id    uuid          NOT NULL,                    -- original PK of the archived record (no FK — record may be deleted)
  original_data  jsonb         NOT NULL DEFAULT '{}',       -- full snapshot of the deleted/archived row
  archived_by    uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason         text          NOT NULL DEFAULT '',
  can_restore    boolean       NOT NULL DEFAULT true,
  archived_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archive_type        ON public.archive(type);
CREATE INDEX IF NOT EXISTS idx_archive_archived_by ON public.archive(archived_by);
CREATE INDEX IF NOT EXISTS idx_archive_archived_at ON public.archive(archived_at DESC);

ALTER TABLE public.archive ENABLE ROW LEVEL SECURITY;

-- Only super_admin can access the archive
CREATE POLICY "archive_super_admin_only"
  ON public.archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
```

---

### Step 13 — `market_perimeter`

```sql
CREATE TABLE IF NOT EXISTS public.market_perimeter (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text         NOT NULL DEFAULT 'Market Boundary',
  geometry    jsonb        NOT NULL,                         -- GeoJSON geometry (Polygon / MultiPolygon)
  created_by  uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes       text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),

  -- Enforce single active perimeter at the application level.
  -- This CHECK ensures the table never accidentally holds more than 1 row
  -- without extra application logic (use DELETE + INSERT to replace).
  CONSTRAINT single_perimeter CHECK (id IS NOT NULL)        -- placeholder; enforce via app or trigger below
);

CREATE TRIGGER trg_market_perimeter_updated_at
  BEFORE UPDATE ON public.market_perimeter
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enforce max 1 row via trigger
CREATE OR REPLACE FUNCTION public.enforce_single_perimeter()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.market_perimeter) >= 1 THEN
    RAISE EXCEPTION 'Only one market perimeter record is allowed. Delete the existing record first.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_perimeter
  BEFORE INSERT ON public.market_perimeter
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_perimeter();

ALTER TABLE public.market_perimeter ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage the perimeter
CREATE POLICY "perimeter_super_admin_only"
  ON public.market_perimeter FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
```

---

### Step 14 — Supabase Storage Buckets

> Run these in the **Storage** section of the Supabase dashboard, or via the management API.

```sql
-- Permit documents uploaded during stall applications
INSERT INTO storage.buckets (id, name, public)
VALUES ('permits', 'permits', false)
ON CONFLICT (id) DO NOTHING;

-- Evidence files for violations and check requests
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: permits bucket — vendors upload their own, admins read all
CREATE POLICY "permits_upload_vendor"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'permits'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "permits_read_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'permits'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "permits_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'permits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: evidence bucket — officers upload, admins and officers read
CREATE POLICY "evidence_upload_officer"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin', 'super_admin')
    )
  );

CREATE POLICY "evidence_read_staff"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin', 'super_admin')
    )
  );
```

---

### Step 15 — Helpful Views

```sql
-- Active stall occupancy summary (for analytics)
CREATE OR REPLACE VIEW public.stall_occupancy_summary AS
SELECT
  status,
  COUNT(*) AS count
FROM public.stalls
GROUP BY status;

-- Open violations per stall (for dashboard widgets)
CREATE OR REPLACE VIEW public.open_violations_per_stall AS
SELECT
  v.stall_id,
  s.stall_name,
  COUNT(*) AS open_count
FROM public.violations v
JOIN public.stalls s ON s.id = v.stall_id
WHERE v.status = 'open'
GROUP BY v.stall_id, s.stall_name
ORDER BY open_count DESC;

-- Pending work queue for officers
CREATE OR REPLACE VIEW public.officer_pending_work AS
SELECT
  'check_request'       AS source,
  cr.id,
  cr.stall_id,
  s.stall_name,
  cr.priority::text     AS priority,
  cr.created_at
FROM public.check_requests cr
JOIN public.stalls s ON s.id = cr.stall_id
WHERE cr.status = 'pending'

UNION ALL

SELECT
  'violation_request'   AS source,
  vr.id,
  vr.stall_id,
  s.stall_name,
  'normal'              AS priority,
  vr.created_at
FROM public.violation_requests vr
JOIN public.stalls s ON s.id = vr.stall_id
WHERE vr.status IN ('pending', 'assigned')
ORDER BY created_at ASC;

-- Applications with stall info (for admin review panel)
CREATE OR REPLACE VIEW public.applications_detail AS
SELECT
  a.*,
  s.stall_name,
  s.section    AS stall_section,
  s.floor      AS stall_floor,
  s.floor_area,
  p.name       AS applicant_profile_name
FROM public.applications a
JOIN public.stalls   s ON s.id = a.stall_id
JOIN public.profiles p ON p.id = a.user_id;
```
