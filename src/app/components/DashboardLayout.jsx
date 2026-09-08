import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  MapPin,
  Users,
  FileText,
  BarChart3,
  Archive,
  Bell,
  LogOut,
  Menu,
  X,
  Store,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  Megaphone,
  Map,
  UserCog,
  Inbox,
  Receipt,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { showToast } from "./Toast";

function getNavItems(role) {
  switch (role) {
    case "super_admin":
      return [
        { label: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
        { label: "Map Editor", icon: Map, path: "/super-admin/map" },
        { label: "User Management", icon: Users, path: "/super-admin/users" },
        { label: "Stall Management", icon: Store, path: "/super-admin/stalls" },
        { label: "Applications", icon: FileText, path: "/super-admin/applications" },
        { label: "Payment Receipts", icon: Receipt, path: "/super-admin/receipts" },
        { label: "Contract Renewals", icon: ClipboardList, path: "/super-admin/renewals" },
        { label: "Reports & Requests", icon: Inbox, path: "/super-admin/violations" },
        { label: "Send Request", icon: ClipboardList, path: "/super-admin/check-requests" },
        { label: "Analytics", icon: BarChart3, path: "/analytics" },
        { label: "Archive", icon: Archive, path: "/archive" },
      ];
    case "admin":
      return [
        { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { label: "Stall Map", icon: MapPin, path: "/admin/map" },
        { label: "Applications", icon: FileText, path: "/admin/applications" },
        { label: "Vendors", icon: Users, path: "/admin/vendors" },
        { label: "Walk-in Application", icon: UserPlus, path: "/admin/walk-in" },
        { label: "Payment Receipts", icon: Receipt, path: "/admin/receipts" },
        { label: "Contract Renewals", icon: ClipboardList, path: "/admin/renewals" },
        { label: "Reports & Requests", icon: Inbox, path: "/admin/violations" },
        { label: "Send Request", icon: ClipboardList, path: "/admin/check-requests" },
        { label: "Analytics", icon: BarChart3, path: "/analytics" },
        { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
        { label: "Archive", icon: Archive, path: "/archive" },
      ];
    case "vendor":
      return [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Browse Stalls", icon: MapPin, path: "/dashboard/map" },
        { label: "My Applications", icon: FileText, path: "/dashboard/applications" },
        { label: "Announcements", icon: Bell, path: "/dashboard/notices" },
      ];
    case "officer":
      return [
        { label: "Dashboard", icon: LayoutDashboard, path: "/officer" },
        { label: "Map Monitor", icon: Map, path: "/officer/map" },
        { label: "Violations", icon: AlertTriangle, path: "/officer/violations" },
        { label: "Payment Receipts", icon: Receipt, path: "/officer/receipts" },
        { label: "Activity Log", icon: ClipboardList, path: "/officer/log" },
      ];
  }
}

function getRoleLabel(role) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "vendor":
      return "Vendor";
    case "officer":
      return "Officer";
  }
}

function getRoleColor(role) {
  switch (role) {
    case "super_admin":
      return "bg-purple-100 text-purple-700";
    case "admin":
      return "bg-blue-100 text-blue-700";
    case "vendor":
      return "bg-teal-100 text-teal-700";
    case "officer":
      return "bg-amber-100 text-amber-700";
  }
}

function getRoleIcon(role) {
  switch (role) {
    case "super_admin":
      return ShieldCheck;
    case "admin":
      return UserCog;
    case "vendor":
      return Store;
    case "officer":
      return AlertTriangle;
  }
}

export function DashboardLayout({ session, children, title, subtitle, actions, navBadges = {} }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session.role;
  const navItems = getNavItems(role).map((item) => ({
    ...item,
    badge: navBadges[item.path] ?? item.badge,
  }));
  const RoleIcon = getRoleIcon(role);

  async function handleLogout() {
    await signOut();
    showToast("Logged out successfully.", "success");
    navigate("/");
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">PubMark</p>
            <p className="text-teal-200 text-[10px] mt-0.5">Market Management</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <RoleIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{session.name}</p>
            <span
              className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${getRoleColor(role)}`}
            >
              {getRoleLabel(role)}
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-scroll flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isRoleRoot = item.path === "/admin" || item.path === "/super-admin";
          const active =
            location.pathname === item.path ||
            (!isRoleRoot && location.pathname.startsWith(item.path + "/"));
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-white text-[#0d9488] font-semibold shadow-sm"
                  : "text-teal-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-teal-200 hover:bg-white/10 hover:text-white transition-all text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-gradient-to-b from-[#0d9488] to-[#0f766e] flex-col flex-shrink-0 shadow-xl min-h-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-gradient-to-b from-[#0d9488] to-[#0f766e] flex flex-col shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          {role !== "admin" && role !== "super_admin" && (
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
