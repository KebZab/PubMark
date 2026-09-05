
  # Stall Management System Wireframe

  This is a code bundle for Stall Management System Wireframe. The original project is available at https://www.figma.com/design/0acwrbz7RhTzw6DZlhzwn3/Stall-Management-System-Wireframe.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Current progress

  Recent updates in the current workspace:

  - Restored treasurer-issued receipt submission across vendor web/mobile and officer web/mobile, with dedicated Admin and Super Admin review pages.
  - Added contract-expiration banners, a seven-day renewal grace period, vendor renewal requests, Admin/Super Admin decisions, automatic termination after the final deadline, and audited Super Admin deadline extensions.
  - New Supabase environments must apply `server/migrations/2026-09-06-contract-renewals.sql` before using the renewal API.

  - Login and registration are now connected to the temporary MySQL backend in `server/`.
  - Registration now includes a required Terms and Agreement section using the tenant rules content in `src/app/content/tenantTerms.ts`.
  - Signup validation was improved so blocked account creation shows clearer errors and scrolls to the first missing field.
  - Contract transfer now asks users whether they want to `Transfer Contract` or `Terminate Contract` when they start a contract-termination flow from the vendor dashboard.
  - Contract transfer email lookup now checks the backend database instead of only browser `localStorage`, so registered MySQL users can be found correctly.
  - The printable contract layout in `src/app/components/ContractModal.tsx` was reworked to follow the scanned lease pages provided in the project discussion.

  ## Map migration progress

  The map modules are actively being moved from browser-only storage to shared hooks and API-backed services:

  - `AdminMapView`, `AdminCheckRequestMap`, `OfficerMapView`, `UserMapDashboard`, `GuestMapView`, `StallManagement`, `AdminDashboard`, `OfficerDashboard`, and `SuperAdminDashboard` now use the newer map/application hooks in different parts of the UI.
  - Stall management actions are being routed through `src/app/services/stallsApi.ts` instead of relying only on `stallsStorage.ts`.
  - Application-aware map coloring and contract state lookups are now using the newer application service types in several map screens.
  - Admin stall drawing now includes automatic floor-area calculation from the drawn geometry.
  - Super admin now has a visible stall-import path for migrating browser-saved stalls into MySQL.

  ## Notes

  The project is still in transition. Authentication is already API-backed, but several operational flows are still being migrated from `localStorage` to backend services.
  
