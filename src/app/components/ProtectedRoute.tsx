import { Navigate } from "react-router";
import { getSession } from "./authStorage";

type UserRole = "super_admin" | "admin" | "vendor" | "officer";

const ROLE_HOME: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  vendor: "/dashboard",
  officer: "/officer",
};

interface Props {
  role: UserRole | UserRole[] | "user";
  children: React.ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  // "user" means any authenticated vendor (legacy compat)
  const allowedRoles: UserRole[] =
    role === "user"
      ? ["vendor"]
      : Array.isArray(role)
      ? role
      : [role];

  if (!allowedRoles.includes(session.role as UserRole)) {
    const home = ROLE_HOME[session.role] ?? "/dashboard";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
