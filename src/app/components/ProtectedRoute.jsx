import { Navigate } from "react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  super_admin: "/super-admin",
  admin: "/admin",
  vendor: "/dashboard",
  officer: "/officer",
};

export function ProtectedRoute({ role, children }) {
  const { profile, status, refreshSession } = useAuth();
  if (status === "checking") {
    return <div className="min-h-screen grid place-items-center bg-gray-50"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-600" /><p className="mt-3 text-sm text-gray-500">Verifying your session…</p></div></div>;
  }
  if (status === "error") {
    return <div className="min-h-screen grid place-items-center bg-gray-50 p-6"><div className="max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm"><ShieldAlert className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-3 font-semibold text-gray-900">Unable to verify your session</p><p className="mt-1 text-sm text-gray-500">Protected content stays locked until the server can confirm your account.</p><button onClick={() => void refreshSession()} className="mt-4 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white">Retry</button></div></div>;
  }
  if (status !== "authenticated" || !profile) return <Navigate to="/" replace />;

  // "user" means any authenticated vendor (legacy compat)
  const allowedRoles = role === "user" ? ["vendor"] : Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(profile.role)) {
    const home = ROLE_HOME[profile.role] ?? "/";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
