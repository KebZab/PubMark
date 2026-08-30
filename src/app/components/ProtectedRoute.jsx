import { Navigate } from "react-router";
import { getSession } from "./authStorage";

const ROLE_HOME = {
  super_admin: "/super-admin",
  admin: "/admin",
  vendor: "/dashboard",
  officer: "/officer",
};

export function ProtectedRoute({ role, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  // "user" means any authenticated vendor (legacy compat)
  const allowedRoles = role === "user" ? ["vendor"] : Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.role)) {
    const home = ROLE_HOME[session.role] ?? "/dashboard";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
