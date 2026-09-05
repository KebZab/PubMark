import { createBrowserRouter, Navigate } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { GuestMapView } from "./pages/GuestMapView";
import { UserMapDashboard } from "./pages/UserMapDashboard";
import { ApplicationForm } from "./pages/ApplicationForm";
import { UserDashboard } from "./pages/UserDashboard";
import { ApplicationDetails } from "./pages/ApplicationDetails";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminApplicationDetails } from "./pages/AdminApplicationDetails";
import { TransferAcceptForm } from "./pages/TransferAcceptForm";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { OfficerDashboard } from "./pages/OfficerDashboard";
import { Analytics } from "./pages/Analytics";
import { ArchiveManagement } from "./pages/ArchiveManagement";
import { CheckRequests } from "./pages/CheckRequests";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/map",
    Component: GuestMapView,
  },

  // ── Vendor routes ────────────────────────────────────
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute role="vendor">
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/map",
    element: (
      <ProtectedRoute role="vendor">
        <UserMapDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/applications",
    element: (
      <ProtectedRoute role="vendor">
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/notices",
    element: (
      <ProtectedRoute role="vendor">
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/apply/:stallId",
    element: (
      <ProtectedRoute role="vendor">
        <ApplicationForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/applications/:id",
    element: (
      <ProtectedRoute role="vendor">
        <ApplicationDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/application/:id",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/transfer-accept/:transferId",
    element: (
      <ProtectedRoute role="vendor">
        <TransferAcceptForm />
      </ProtectedRoute>
    ),
  },

  // ── Admin routes ─────────────────────────────────────
  {
    path: "/admin",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/map",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stalls",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/applications",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/vendors",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/announcements",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/applications/:id",
    element: (
      <ProtectedRoute role="admin">
        <AdminApplicationDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/application/:id",
    element: (
      <ProtectedRoute role="admin">
        <AdminApplicationDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/violations",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/receipts",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  { path: "/admin/renewals", element: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute> },
  {
    path: "/admin/check-requests",
    element: (
      <ProtectedRoute role="admin">
        <CheckRequests />
      </ProtectedRoute>
    ),
  },

  // ── Super Admin routes ───────────────────────────────
  {
    path: "/super-admin",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/users",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/map",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/settings",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/violations",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/receipts",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  { path: "/super-admin/renewals", element: <ProtectedRoute role="super_admin"><SuperAdminDashboard /></ProtectedRoute> },
  {
    path: "/super-admin/check-requests",
    element: (
      <ProtectedRoute role="super_admin">
        <CheckRequests />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/stalls",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/super-admin/applications",
    element: (
      <ProtectedRoute role="super_admin">
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },

  // ── Officer routes ───────────────────────────────────
  {
    path: "/officer",
    element: (
      <ProtectedRoute role="officer">
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/officer/map",
    element: (
      <ProtectedRoute role="officer">
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/officer/violations",
    element: (
      <ProtectedRoute role="officer">
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/officer/log",
    element: (
      <ProtectedRoute role="officer">
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/officer/receipts",
    element: (
      <ProtectedRoute role="officer">
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },

  // ── Shared routes (admin + super_admin) ──────────────
  {
    path: "/analytics",
    element: (
      <ProtectedRoute role={["admin", "super_admin"]}>
        <Analytics />
      </ProtectedRoute>
    ),
  },
  {
    path: "/archive",
    element: (
      <ProtectedRoute role={["admin", "super_admin"]}>
        <ArchiveManagement />
      </ProtectedRoute>
    ),
  },
]);
