Project Overview
PubMark is a Smart Public Market Digital Mapping web app built in React + TypeScript + TailwindCSS using React Router for navigation. All state is persisted in localStorage. The design system uses teal (#14B8A6 / #0d9488) as the primary color.

1. Routes
/                  → Login (public)
/register          → Registration (public)
/map               → GuestMapView (public — browse-only, no account required)
/dashboard         → UserDashboard (protected — role: user)
/dashboard/map     → UserMapDashboard (protected — role: user)
/apply/:stallId    → ApplicationForm (protected — role: user)
/applications/:id  → ApplicationDetails (protected — role: user)
/admin             → AdminDashboard (protected — role: admin)
/admin/applications/:id → AdminApplicationDetails (protected — role: admin)
All protected routes check pubmark_session in localStorage. If no valid session exists, redirect to /. If role mismatches (user hitting /admin or admin hitting /dashboard), redirect to their respective home.

2. localStorage Data Structures
Use these exact keys and TypeScript interfaces. All arrays are JSON-serialized.
pubmark_users — Registered user accounts
typescriptinterface PubMarkUser {
  id: string;                // "user_<timestamp>_<random5>"
  email: string;
  passwordHash: string;      // store plain-text for demo (note: use bcrypt in Supabase future)
  name: string;
  address: string;
  phone: string;
  createdAt: string;         // ISO string
}
pubmark_session — Current active session
typescriptinterface PubMarkSession {
  userId: string;            // user id OR "admin_builtin"
  role: "user" | "admin";
  name: string;
  email: string;
}
pubmark_stalls — Stalls drawn by admin (already exists as stallsStorage.ts)
typescriptinterface StoredStall {
  id: string;                // "local_<timestamp>_<random5>"
  stall_name: string;
  status: "vacant";
  owner_name: null;
  business_type: string;
  section: string;
  floor_area: string;
  notes: string;
  geometry: object;          // GeoJSON geometry (Polygon or Point)
  created_at: string;        // ISO string
}
pubmark_applications — All stall applications (already exists as applicationsStorage.ts)
typescriptinterface StoredApplication {
  id: string;                // "app_<timestamp>_<random5>"
  userId: string;            // id of the user who applied (NEW — add this field)
  stallId: string;
  stallName: string;
  stallSection: string;
  floorArea: string;
  applicantName: string;
  applicantEmail: string;
  applicantAddress: string;
  businessName: string;
  businessType: string;
  contractStart: string;     // "YYYY-MM-DD"
  contractTermMonths: string;
  contractEnd: string;       // "YYYY-MM-DD"
  permitFileName: string | null;
  permitFileSize: string | null;
  additionalFileName: string | null;
  additionalFileSize: string | null;
  notes: string;
  status: "pending" | "approved" | "rejected";
  dateApplied: string;       // ISO string
  adminRemarks: string;
}
stall_announcements — Admin announcements (already exists as announcementsStore.ts)
typescriptinterface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  createdAt: string;
  author: string;
}

3. Seeded / Built-in Accounts
On app startup (e.g., in a top-level useEffect in App.tsx), check if seeded data exists. If not, seed it:
Admin account (built-in, never stored in pubmark_users)

Email: admin@pubmark.com
Password: admin123
userId: admin_builtin
role: admin
Hardcoded in the login handler — do NOT store in the users array.

Pre-seeded user account (stored in pubmark_users)
typescript{
  id: "user_seeded_001",
  email: "juan@example.com",
  passwordHash: "user123",
  name: "Juan dela Cruz",
  address: "123 Rizal St., Bacolod City, Negros Occidental",
  phone: "0917-123-4567",
  createdAt: "2026-01-01T00:00:00.000Z",
}

4. Auth Utilities (authStorage.ts)
Create src/components/authStorage.ts with:
typescriptexport function getSession(): PubMarkSession | null
export function setSession(session: PubMarkSession): void
export function clearSession(): void
export function getUsers(): PubMarkUser[]
export function getUserById(id: string): PubMarkUser | null
export function getUserByEmail(email: string): PubMarkUser | null
export function registerUser(data: Omit<PubMarkUser, "id" | "createdAt">): PubMarkUser
export function seedDefaultUsers(): void  // call on app init if no users exist

5. Login Page (Login.tsx) — Modify
The login page stays mostly the same. Apply these changes:
Login form behavior

When role = "user": Look up pubmark_users by email + password. If match found, call setSession({ userId: user.id, role: "user", name: user.name, email: user.email }) and navigate to /dashboard.
When role = "admin": Check hardcoded credentials (admin@pubmark.com / admin123). If match, call setSession({ userId: "admin_builtin", role: "admin", name: "Admin", email: "admin@pubmark.com" }) and navigate to /admin.
Show an error message (red banner under the form) if credentials are invalid: "Invalid email or password."

"Browse Available Stalls" button

Navigates to /map (GuestMapView). This is a read-only public map. No session is set.
The guest can view stall details, see availability, and see a "Apply for this Stall" CTA button. Clicking the CTA navigates them to /register?stallId=<stallId> so after registration they are redirected straight to /apply/<stallId>.

"Create account" link

Navigates to /register.


6. Registration Page (Register.tsx) — Create New
Route: /register (also accepts optional ?stallId=<id> query param)
This is a public page (no session needed). Layout matches the Login page style (two-column card, teal left panel).
Fields
FieldTypeRequiredFull Nametext✅Email Addressemail✅Phone Numbertext (e.g. 0917-xxx-xxxx)✅Addresstextarea✅Passwordpassword (min 6 chars)✅Confirm Passwordpassword✅
Behavior

Validate: email not already in pubmark_users, passwords match, all fields filled.
Show inline field-level validation errors (red text under each field).
On success: call registerUser(...), auto-login (set session), then:

If ?stallId param exists → navigate to /apply/<stallId>
Otherwise → navigate to /dashboard


Already have an account? Link to / (Login).


7. GuestMapView (GuestMapView.tsx) — Create New
Route: /map
This is a public Leaflet map showing all stalls from pubmark_stalls (localStorage). It is visually similar to UserMapDashboard but with these differences:

No apply button that works directly — if guest clicks "Apply for this Stall", show a modal/prompt: "You need an account to apply. [Create Account] [Log In]". "Create Account" links to /register?stallId=<stallId>. "Log In" links to /.
A top bar shows: PubMark logo + "Browse Available Stalls" title + "Log In" and "Register" buttons (teal outlined / filled).
Color coding: teal = vacant, gray = occupied. No pending color since guests can't see application state.
Stall info popup/panel: shows stall name, section, floor area, business type, notes, and an availability badge.
No sidebar; use a slide-in detail panel from the right.


8. UserDashboard (UserDashboard.tsx) — Modify
Session-awareness

On mount, read getSession(). If null or role !== "user", redirect to /.
Display the logged-in user's name in the avatar/profile area (replace hardcoded "Juan dela Cruz").
Logout button: call clearSession() then navigate to /.

Applications tab

Filter getStoredApplications() by userId === session.userId (only show the current user's own applications).
Currently the code shows ALL applications — fix this.

Map tab (inside UserDashboard)

The "Explore Map" button / Map tab should navigate to /dashboard/map (the UserMapDashboard).
This map is the authenticated version where users can apply for stalls.

Home tab

Welcome message: "Welcome back, <user.name>!" using session data.
Stats cards: count only the current user's own applications.


9. UserMapDashboard (UserMapDashboard.tsx) — Modify
Route: /dashboard/map
This is the authenticated map for logged-in users to browse stalls and apply.
Changes

On mount, check session. If not user, redirect to /.
"Apply for this Stall" button: navigate to /apply/<stallId>. No modal needed since user is logged in.
Show a legend: teal = vacant, amber = pending (you have a pending application), indigo = approved (you have an approved application). Only color-code based on the current user's applications.
Header: show "Back to Dashboard" button (ArrowLeft → navigate to /dashboard).


10. ApplicationForm (ApplicationForm.tsx) — Modify
Route: /apply/:stallId
This is the form a logged-in user submits to apply for a stall.
Key changes

On mount, read session. Pre-fill:

applicantName ← session.name (read-only display, not an input)
applicantEmail ← session.email (read-only display, not an input)
applicantAddress ← pre-fill from getUserById(session.userId).address as default value (still editable)


Remove the hardcoded applicantName: "Juan dela Cruz" and applicantEmail: "juan.delacruz@example.com".
Include userId: session.userId when calling saveStoredApplication(...).
After successful submission, navigate to /applications/<newApp.id>.
Check if user already has an active (pending/approved) application for this specific stall. If so, show a warning banner at the top: "You already have an active application for this stall." with a link to view it. Still allow them to see the form but disable submit.

Form validation

All required fields must be filled before enabling the "Submit Application" button.
Business permit file is required (already implemented).
Show field-specific error messages on blur.


11. ApplicationDetails (ApplicationDetails.tsx) — Modify
Route: /applications/:id

On mount, verify the app's userId matches session.userId. If not, redirect to /dashboard (users can't view other users' applications).
Withdraw button: only shown if app.status === "pending" (already implemented).


12. AdminDashboard (AdminDashboard.tsx) — Modify

On mount, check session. If role !== "admin", redirect to /.
Logout button: clearSession() then navigate to /.
In the Applications tab: show ALL applications (admin sees everything), include the applicant's name, email, and userId — all of which are already in the StoredApplication object.
In the stats cards: fix the hardcoded totalStalls: 45, occupied: 32, vacant: 13 — derive these from getStoredStalls() and getStoredApplications():

typescript  const storedStalls = getStoredStalls();
  const approvedStallIds = new Set(applications.filter(a => a.status === "approved").map(a => a.stallId));
  const totalStalls = storedStalls.length;
  const occupied = storedStalls.filter(s => approvedStallIds.has(s.id)).length;
  const vacant = totalStalls - occupied;

13. AdminApplicationDetails (AdminApplicationDetails.tsx) — No major changes

On mount, check session role === "admin". If not, redirect to /.
Already functional. No other changes needed.


14. Auth Guard / Route Protection
Create a ProtectedRoute component:
typescript// src/components/ProtectedRoute.tsx
interface Props {
  role: "user" | "admin";
  children: React.ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return <>{children}</>;
}
Wrap all protected routes in App.tsx:
tsx<Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
<Route path="/dashboard/map" element={<ProtectedRoute role="user"><UserMapDashboard /></ProtectedRoute>} />
<Route path="/apply/:stallId" element={<ProtectedRoute role="user"><ApplicationForm /></ProtectedRoute>} />
<Route path="/applications/:id" element={<ProtectedRoute role="user"><ApplicationDetails /></ProtectedRoute>} />
<Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
<Route path="/admin/applications/:id" element={<ProtectedRoute role="admin"><AdminApplicationDetails /></ProtectedRoute>} />
Public routes (/, /register, /map) have no wrapper.

15. App Initialization (App.tsx)
On mount (top-level useEffect with empty deps), call:
typescriptseedDefaultUsers();     // seeds the default Juan dela Cruz account if pubmark_users is empty
Also seed default announcements (already handled in announcementsStore.ts via getAnnouncements()).

16. Stall Management — Admin Draw & Edit
The existing StallManagement.tsx and StallManagementPanel.tsx + AdminMapView.tsx are for admin to draw stall polygons on the map and store them in pubmark_stalls. These should work as-is. Make sure:

Drawn stalls are saved with saveStoredStall(...).
The admin can edit stall metadata (name, section, floor area, business type, notes) via updateStoredStall(...).
The admin can delete stalls via deleteStoredStall(...).
These drawn stalls (from pubmark_stalls) are what appear on both the GuestMapView and UserMapDashboard — they are the "apply-able" stalls.
The stallsData.ts (static seed data) is separate reference data; the admin-drawn stalls in localStorage are what users interact with for applications.


17. Notification / Unread Badge
In UserDashboard, the bell icon should show an unread count badge:

Count = number of the user's applications where status !== "pending" AND the decision is "new" (not yet viewed).
Simple implementation: store a pubmark_seen_decisions array in localStorage containing application IDs the user has viewed in ApplicationDetails. Any approved/rejected app not in this list counts as unread. Mark as seen when ApplicationDetails mounts.


18. Toast Notifications
Add a lightweight toast system (can use a simple useState + useEffect with auto-dismiss). Show toasts for:

Successful login → "Welcome back, <name>!"
Successful registration → "Account created! Welcome to PubMark."
Application submitted → "Application submitted successfully!"
Application withdrawn → "Application withdrawn."
Admin approves → "Application approved."
Admin rejects → "Application rejected."
Logout → "You've been logged out."

Style: bottom-right fixed, teal for success, red for error, amber for warning.

19. Key Behavioral Rules
ScenarioBehaviorGuest clicks "Apply" on GuestMapViewModal: "Create an account or log in to apply"Logged-in user visits /mapRedirect to /dashboard/mapUser has pending app for a stallShow warning on ApplicationForm; disable submitUser tries to view another user's applicationRedirect to /dashboardAdmin visits /dashboardRedirect to /adminUser visits /adminRedirect to /dashboardSession expired (no pubmark_session)Redirect to / from any protected routeEmail already registered (registration)Show inline error: "This email is already in use."Passwords don't match (registration)Show inline error: "Passwords do not match."

20. Existing Files — Minimal Changes Summary
FileChangeLogin.tsxReal auth logic, error banner, link to /registerUserDashboard.tsxFilter by session.userId, show session name, logoutUserMapDashboard.tsxSession check, auth apply button, back buttonApplicationForm.tsxPre-fill from session, include userId, duplicate checkApplicationDetails.tsxOwnership check against sessionAdminDashboard.tsxSession check, dynamic stats, logoutAdminApplicationDetails.tsxSession role check onlyapplicationsStorage.tsAdd userId field to StoredApplicationApp.tsxAdd routes, ProtectedRoute, seed on init
New Files to Create
FilePurposesrc/components/authStorage.tsAll auth/session localStorage helperssrc/components/ProtectedRoute.tsxRoute guard componentsrc/pages/Register.tsxRegistration form pagesrc/pages/GuestMapView.tsxPublic stall browsing map

21. Design Consistency Rules

Always use #14B8A6 / #0d9488 for teal primary actions.
Buttons: bg-gradient-to-r from-[#14B8A6] to-[#0d9488] for primary CTA.
Focus rings: focus:ring-[#14B8A6].
Error states: red-500 text, red-200 border.
All cards: bg-white rounded-2xl shadow-sm border border-gray-200.
Mobile-first: use max-w-md mx-auto for user-facing mobile pages; max-w-4xl for admin pages.
All pages must fill the full viewport (size-full or min-h-screen).