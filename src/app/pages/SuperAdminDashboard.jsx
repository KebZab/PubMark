import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Users,
  ShieldCheck,
  Store,
  BarChart3,
  UserPlus,
  Trash2,
  Search,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Package,
  UserCog,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Map,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MapPin,
  User,
  Paperclip,
  FileText,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { AdminMapView } from "../components/AdminMapView";
import { getSession } from "../components/authStorage";
import { useStalls } from "../hooks/useStalls";
import { usePerimeters } from "../hooks/usePerimeters";
import { updateStall, getStallsPage } from "../services/stallsApi";
import { useApplications } from "../hooks/useApplications";
import { updateApplicationStatus, getApplicationsPage } from "../services/applicationsApi";
import {
  listUsers,
  listUsersPage,
  createUser,
  updateUserApi,
  deleteUserApi,
} from "../services/api";
import { TablePagination } from "../components/ui/TablePagination";
import { migrateLegacyRequests } from "../services/legacyRequestMigration";
import { getViolations, assignOfficer } from "../components/violationsStore";
import {
  getViolationRequests,
  createViolationRequest,
  assignRequestToOfficer,
  completeViolationRequest,
} from "../components/violationRequestStore";
import { getCheckRequests } from "../components/checkRequestsStore";
import {
  getTerminationRequests,
  updateTerminationStatus,
} from "../components/terminationRequestsStore";
import { getReceipts, reviewReceipt } from "../services/receiptsApi";
import { DashboardLayout } from "../components/DashboardLayout";
import { SuperAdminMapEditor } from "../components/SuperAdminMapEditor";
import { showToast } from "../components/Toast";
import { buildPermitDeadlineRemarks, parsePermitDeadlineMeta } from "../components/permitDeadline";
import { AttachmentLink } from "../components/AttachmentLink";

const ROLE_COLORS = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  vendor: "bg-teal-100 text-teal-700",
  officer: "bg-amber-100 text-amber-700",
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  vendor: "Vendor",
  officer: "Officer",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  role: "vendor",
  department: "",
};

export function SuperAdminDashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine tab from URL
  const getTabFromURL = (path) => {
    if (path.includes("/users")) return "users";
    if (path.includes("/map")) return "map";
    if (path.includes("/stalls")) return "stalls";
    if (path.includes("/applications")) return "applications";
    if (path.includes("/violations")) return "violations";
    if (path.includes("/check-requests")) return "check-requests";
    if (path.includes("/settings")) return "overview"; // Could add settings tab later
    return "overview";
  };

  const [tab, setTab] = useState(getTabFromURL(location.pathname));

  // Watch for URL changes
  useEffect(() => {
    setTab(getTabFromURL(location.pathname));
  }, [location.pathname]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [violationsList, setViolationsList] = useState([]);
  const [assigningViolation, setAssigningViolation] = useState(null);
  const [checkRequests, setCheckRequests] = useState([]);
  const [mapRequests, setMapRequests] = useState([]);
  const [expandedMapReq, setExpandedMapReq] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [selectedStallForRequest, setSelectedStallForRequest] = useState(null);
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [editingStall, setEditingStall] = useState(null);
  const [editStallData, setEditStallData] = useState({ status: "", business_type: "" });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [expandedViolation, setExpandedViolation] = useState(null);
  const [showStallMap, setShowStallMap] = useState(false);
  const [reportSubTab, setReportSubTab] = useState("violations");
  const [terminationsList, setTerminationsList] = useState([]);
  const [receiptsList, setReceiptsList] = useState([]);
  const [terminationActionConfirm, setTerminationActionConfirm] = useState(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [requestOfficers, setRequestOfficers] = useState([]);

  // Paginated table views (kept separate from the full-list `users`/`stalls`/`applications`
  // state below, which is still needed unpaginated for Overview stats, role/status counts,
  // "Recent…" widgets, and picker dropdowns elsewhere in this component).
  const TABLE_PAGE_SIZE = 10;
  const [tableUsers, setTableUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPageNum, setUsersPageNum] = useState(1);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");

  const [tableStalls, setTableStalls] = useState([]);
  const [stallsTotal, setStallsTotal] = useState(0);
  const [stallsPageNum, setStallsPageNum] = useState(1);
  const [stallSearch, setStallSearch] = useState("");
  const [debouncedStallSearch, setDebouncedStallSearch] = useState("");

  const [tableApplications, setTableApplications] = useState([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsPageNum, setApplicationsPageNum] = useState(1);
  const [appStatusFilter, setAppStatusFilter] = useState("all");

  const { stalls, refetch: refetchStalls } = useStalls();
  const { applications, refetch: refetchApplications } = useApplications();
  const { perimeters } = usePerimeters();
  const [allViolations, setAllViolations] = useState([]);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await listUsers();
      setUsers(
        response.users.map((user) => ({
          id: user.id,
          email: user.email,
          passwordHash: "",
          name: user.name,
          address: user.address || "",
          phone: user.phone || "",
          role: user.role,
          department: user.department,
          createdAt: user.createdAt || "",
        })),
      );
    } catch (error) {
      showToast(`Failed to load users: ${error.message}`, "error");
    }
  }

  async function loadUsersTable() {
    try {
      const result = await listUsersPage({
        role: roleFilter,
        search: debouncedUserSearch,
        sortField,
        sortDir: sortAsc ? "asc" : "desc",
        page: usersPageNum,
        pageSize: TABLE_PAGE_SIZE,
      });
      setTableUsers(result.users);
      setUsersTotal(result.total);
    } catch (error) {
      showToast(`Failed to load users: ${error.message}`, "error");
    }
  }

  async function loadStallsTable() {
    try {
      const result = await getStallsPage({
        search: debouncedStallSearch,
        page: stallsPageNum,
        pageSize: TABLE_PAGE_SIZE,
      });
      setTableStalls(result.stalls);
      setStallsTotal(result.total);
    } catch (error) {
      showToast(`Failed to load stalls: ${error.message}`, "error");
    }
  }

  async function loadApplicationsTable() {
    try {
      const result = await getApplicationsPage({
        status: appStatusFilter,
        page: applicationsPageNum,
        pageSize: TABLE_PAGE_SIZE,
      });
      setTableApplications(result.applications);
      setApplicationsTotal(result.total);
    } catch (error) {
      showToast(`Failed to load applications: ${error.message}`, "error");
    }
  }

  // Debounce free-text search inputs before they trigger a fetch.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStallSearch(stallSearch), 300);
    return () => clearTimeout(t);
  }, [stallSearch]);

  // Jump back to page 1 whenever a search/filter/sort changes the result set.
  useEffect(() => {
    setUsersPageNum(1);
  }, [debouncedUserSearch, roleFilter, sortField, sortAsc]);
  useEffect(() => {
    setStallsPageNum(1);
  }, [debouncedStallSearch]);
  useEffect(() => {
    setApplicationsPageNum(1);
  }, [appStatusFilter]);

  useEffect(() => {
    if (tab === "users") void loadUsersTable();
  }, [tab, usersPageNum, debouncedUserSearch, roleFilter, sortField, sortAsc]);

  useEffect(() => {
    if (tab === "stalls") void loadStallsTable();
  }, [tab, stallsPageNum, debouncedStallSearch]);

  useEffect(() => {
    if (tab === "applications") void loadApplicationsTable();
  }, [tab, applicationsPageNum, appStatusFilter]);

  async function loadRequestData() {
    const [violationRequestsResult, officerRequestsResult, officersResult, allUsersResult] =
      await Promise.allSettled([
        getViolationRequests(),
        getCheckRequests(),
        listUsers("officer"),
        listUsers(),
      ]);

    if (violationRequestsResult.status === "fulfilled") {
      setCheckRequests(violationRequestsResult.value);
    }
    if (officerRequestsResult.status === "fulfilled") {
      setMapRequests(officerRequestsResult.value);
    }
    if (officersResult.status === "fulfilled") {
      setRequestOfficers(officersResult.value.users);
    }

    if (allUsersResult.status === "fulfilled") {
      try {
        await migrateLegacyRequests(session.userId, allUsersResult.value.users);
        const [nextViolationRequestsResult, nextOfficerRequestsResult] = await Promise.allSettled([
          getViolationRequests(),
          getCheckRequests(),
        ]);
        if (nextViolationRequestsResult.status === "fulfilled") {
          setCheckRequests(nextViolationRequestsResult.value);
        }
        if (nextOfficerRequestsResult.status === "fulfilled") {
          setMapRequests(nextOfficerRequestsResult.value);
        }
      } catch (error) {
        showToast(`Failed to migrate request data: ${error.message}`, "error");
      }
    }

    const firstError = [
      violationRequestsResult,
      officerRequestsResult,
      officersResult,
      allUsersResult,
    ].find((result) => result.status === "rejected");
    if (firstError) {
      showToast(
        `Some request data could not be loaded: ${String(firstError.reason instanceof Error ? firstError.reason.message : firstError.reason)}`,
        "error",
      );
    }
  }

  useEffect(() => {
    if (tab === "violations") {
      void (async () => {
        const [
          violationsResult,
          checkRequestsResult,
          terminationsResult,
          receiptsResult,
          allUsersResult,
        ] = await Promise.allSettled([
          getViolations(),
          getCheckRequests(),
          getTerminationRequests(),
          getReceipts(),
          listUsers(),
        ]);

        if (violationsResult.status === "fulfilled") {
          setViolationsList(violationsResult.value);
          setAllViolations(violationsResult.value);
        }
        if (checkRequestsResult.status === "fulfilled") {
          setMapRequests(checkRequestsResult.value);
        }
        if (terminationsResult.status === "fulfilled") {
          setTerminationsList(terminationsResult.value);
        }
        if (receiptsResult.status === "fulfilled") {
          setReceiptsList(receiptsResult.value);
        }

        if (allUsersResult.status === "fulfilled") {
          try {
            await migrateLegacyRequests(session.userId, allUsersResult.value.users);
            const [nextViolationsResult, nextCheckRequestsResult, nextTerminationsResult] =
              await Promise.allSettled([
                getViolations(),
                getCheckRequests(),
                getTerminationRequests(),
              ]);
            if (nextViolationsResult.status === "fulfilled") {
              setViolationsList(nextViolationsResult.value);
              setAllViolations(nextViolationsResult.value);
            }
            if (nextCheckRequestsResult.status === "fulfilled") {
              setMapRequests(nextCheckRequestsResult.value);
            }
            if (nextTerminationsResult.status === "fulfilled") {
              setTerminationsList(nextTerminationsResult.value);
            }
          } catch (error) {
            showToast(`Failed to migrate reports data: ${error.message}`, "error");
          }
        }

        const firstError = [
          violationsResult,
          checkRequestsResult,
          terminationsResult,
          receiptsResult,
          allUsersResult,
        ].find((result) => result.status === "rejected");
        if (firstError) {
          showToast(
            `Some report data could not be loaded: ${String(firstError.reason instanceof Error ? firstError.reason.message : firstError.reason)}`,
            "error",
          );
        }
      })();
    } else if (tab === "check-requests") {
      void loadRequestData();
    } else if (tab === "users") {
      void loadUsers();
    }
  }, [tab]);

  const stats = {
    total: users.length,
    vendors: users.filter((u) => u.role === "vendor").length,
    officers: users.filter((u) => u.role === "officer").length,
    admins: users.filter((u) => u.role === "admin" || u.role === "super_admin").length,
    openViolations: allViolations.filter((v) => v.status === "open").length,
    pendingApps: applications.filter((a) => a.status === "pending").length,
    occupiedStalls: stalls.filter((s) => s.status === "occupied").length,
  };

  function openCreate() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowPw(false);
    setShowForm(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      address: u.address || "",
      password: "",
      role: u.role,
      department: u.department ?? "",
    });
    setFormErrors({});
    setShowPw(false);
    setShowForm(true);
  }

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    if (!editUser && !form.password) errs.password = "Password is required for new users.";
    if (form.password && form.password.length < 6) errs.password = "At least 6 characters.";
    return errs;
  }

  async function handleSave() {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      if (editUser) {
        await updateUserApi(editUser.id, {
          name: form.name,
          phone: form.phone,
          address: form.address,
          role: form.role,
          department: form.department || undefined,
          password: form.password || undefined,
        });
        showToast(`User "${form.name}" updated.`, "success");
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
          address: form.address,
          department: form.department || undefined,
        });
        showToast(`User "${form.name}" created.`, "success");
      }
      setShowForm(false);
      await Promise.all([loadUsersTable(), loadUsers()]);
    } catch (error) {
      showToast(`Failed to save user: ${error.message}`, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteUserApi(id);
      setDeleteConfirm(null);
      showToast("User deleted.", "success");
      await Promise.all([loadUsersTable(), loadUsers()]);
    } catch (error) {
      showToast(`Failed to delete user: ${error.message}`, "error");
    }
  }

  async function handleTerminationDecision() {
    if (!terminationActionConfirm) return;

    try {
      const request = terminationsList.find((item) => item.id === terminationActionConfirm.id);

      if (
        terminationActionConfirm.action === "approved" &&
        request?.type === "contract" &&
        request.stallId
      ) {
        const activeContract = applications
          .filter(
            (application) =>
              application.userId === request.vendorId &&
              application.stallId === request.stallId &&
              application.status === "approved",
          )
          .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0];

        if (activeContract) {
          const terminationRemarks = buildPermitDeadlineRemarks(
            parsePermitDeadlineMeta(activeContract.adminRemarks).visibleRemarks ||
              "Contract terminated by super admin approval.",
            {
              permitTerminatedAt: new Date().toISOString(),
            },
          );
          await updateApplicationStatus(activeContract.id, "rejected", terminationRemarks);
          await refetchApplications();
        }
      }

      await updateTerminationStatus(terminationActionConfirm.id, terminationActionConfirm.action);
      setTerminationsList(await getTerminationRequests());
      showToast(
        terminationActionConfirm.action === "approved"
          ? "Termination request approved."
          : "Termination request rejected.",
        terminationActionConfirm.action === "approved" ? "success" : "error",
      );
      setTerminationActionConfirm(null);
    } catch (error) {
      showToast(`Failed to process termination request: ${error.message}`, "error");
    }
  }

  async function handleReviewReceipt(id, status) {
    try {
      const updated = await reviewReceipt(id, status);
      setReceiptsList((current) => current.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Receipt ${status}.`, "success");
    } catch (error) {
      showToast(`Failed to update receipt: ${error.message}`, "error");
    }
  }

  async function handleAssignOfficer(violationId, officerId) {
    const officer = users.find((u) => u.id === officerId);
    if (!officer) return;
    try {
      await assignOfficer(violationId, officerId, officer.name);
      const refreshed = await getViolations();
      setViolationsList(refreshed);
      setAllViolations(refreshed);
      setAssigningViolation(null);
      showToast(`Officer "${officer.name}" assigned to violation.`, "success");
    } catch (error) {
      showToast(`Failed to assign violation: ${error.message}`, "error");
    }
  }

  async function handleCreateRequest() {
    if (!selectedStallForRequest || !requestReason.trim()) {
      showToast("Please select a stall and provide a reason.", "error");
      return;
    }
    const stall = stalls.find((s) => s.id === selectedStallForRequest);
    if (!stall) return;
    try {
      await createViolationRequest({
        stallId: stall.id,
        stallName: stall.stall_name,
        requestedBy: session.userId,
        requestedByName: session.name,
        reason: requestReason,
      });
      await loadRequestData();
      setShowRequestModal(false);
      setSelectedStallForRequest(null);
      setRequestReason("");
      showToast("Check request created successfully.", "success");
    } catch (error) {
      showToast(`Failed to create request: ${error.message}`, "error");
    }
  }

  async function handleAssignRequestOfficer(requestId, officerId) {
    const officer = requestOfficers.find((u) => u.id === officerId);
    if (!officer) return;
    try {
      await assignRequestToOfficer(requestId, officerId, officer.name);
      await loadRequestData();
      setAssigningRequest(null);
      showToast(`Officer "${officer.name}" assigned to check request.`, "success");
    } catch (error) {
      showToast(`Failed to assign request: ${error.message}`, "error");
    }
  }

  async function handleCompleteRequest(requestId) {
    try {
      await completeViolationRequest(requestId);
      await loadRequestData();
      showToast("Check request marked as completed.", "success");
    } catch (error) {
      showToast(`Failed to complete request: ${error.message}`, "error");
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-purple-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-purple-600" />
    );
  }

  // Handle tab changes and update URL
  function handleTabChange(newTab) {
    const paths = {
      overview: "/super-admin",
      users: "/super-admin/users",
      map: "/super-admin/map",
      stalls: "/super-admin/stalls",
      applications: "/super-admin/applications",
      violations: "/super-admin/violations",
      "check-requests": "/super-admin/check-requests",
    };
    navigate(paths[newTab]);
  }

  const openCheckRequestsCount = checkRequests.filter((r) => r.status === "pending").length;

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    {
      id: "map",
      label: "Map Editor",
      icon: Map,
      badge: perimeters.length > 0 ? "Set" : "Required",
    },
    { id: "stalls", label: "Stall Management", icon: Store },
    {
      id: "applications",
      label: "Applications",
      icon: Package,
      badge: stats.pendingApps > 0 ? stats.pendingApps : undefined,
    },
    {
      id: "violations",
      label: "Reports & Requests",
      icon: AlertTriangle,
      badge: stats.openViolations,
    },
    {
      id: "check-requests",
      label: "Send Request",
      icon: CheckCircle,
      badge: openCheckRequestsCount > 0 ? openCheckRequestsCount : undefined,
    },
  ];

  return (
    <DashboardLayout
      session={session}
      title="Super Admin"
      subtitle="System administration and user management"
      actions={
        tab === "users" ? (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </button>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      t.badge === "Set"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Users",
                  value: stats.total,
                  icon: Users,
                  color: "bg-purple-50 text-purple-700",
                  badge: "bg-purple-100",
                },
                {
                  label: "Vendors",
                  value: stats.vendors,
                  icon: Store,
                  color: "bg-teal-50 text-teal-700",
                  badge: "bg-teal-100",
                },
                {
                  label: "Open Violations",
                  value: stats.openViolations,
                  icon: AlertTriangle,
                  color: "bg-red-50 text-red-700",
                  badge: "bg-red-100",
                },
                {
                  label: "Pending Applications",
                  value: stats.pendingApps,
                  icon: Activity,
                  color: "bg-amber-50 text-amber-700",
                  badge: "bg-amber-100",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.badge}`}
                    >
                      <Icon className={`w-6 h-6 ${s.color.split(" ")[1]}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Role breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">User Breakdown by Role</h3>
              <div className="space-y-3">
                {["super_admin", "admin", "vendor", "officer"].map((r) => {
                  const count = users.filter((u) => u.role === r).length;
                  const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full w-24 text-center ${ROLE_COLORS[r]}`}
                      >
                        {ROLE_LABELS[r]}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Stalls",
                  value: stalls.length,
                  sub: `${stats.occupiedStalls} occupied`,
                },
                { label: "Officers", value: stats.officers, sub: "Market officers" },
                { label: "Admins", value: stats.admins, sub: "Admin accounts" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
                >
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Applications</h3>
                <button
                  onClick={() => handleTabChange("applications")}
                  className="text-xs text-purple-600 font-medium hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {applications
                  .sort(
                    (a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime(),
                  )
                  .slice(0, 5)
                  .map((app) => (
                    <div key={app.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {app.applicantName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {app.stallName} • {app.businessName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            app.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : app.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {app.status}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(app.dateApplied)}
                        </span>
                      </div>
                    </div>
                  ))}
                {applications.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No applications yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent users */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Users</h3>
                <button
                  onClick={() => handleTabChange("users")}
                  className="text-xs text-purple-600 font-medium hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {u.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                {["super_admin", "admin", "vendor", "officer"].map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {usersTotal} user{usersTotal !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => void loadUsersTable()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th
                        className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1.5">
                          Name
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th
                        className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-1.5">
                          Email
                          <SortIcon field="email" />
                        </div>
                      </th>
                      <th
                        className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("role")}
                      >
                        <div className="flex items-center gap-1.5">
                          Role
                          <SortIcon field="role" />
                        </div>
                      </th>
                      <th
                        className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("phone")}
                      >
                        <div className="flex items-center gap-1.5">
                          Phone
                          <SortIcon field="phone" />
                        </div>
                      </th>
                      <th
                        className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1.5">
                          Joined
                          <SortIcon field="createdAt" />
                        </div>
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">
                                {u.name[0]?.toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}
                          >
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{u.phone || "—"}</td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {u.createdAt ? formatDate(u.createdAt) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== session.userId && (
                              <button
                                onClick={() => setDeleteConfirm(u.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tableUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                          No users match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={usersPageNum}
                pageSize={TABLE_PAGE_SIZE}
                total={usersTotal}
                onPageChange={setUsersPageNum}
              />
            </div>
          </>
        )}

        {/* Map Editor tab — full-height, no padding wrapper */}
        {tab === "map" && (
          <div className="-m-6 mt-0" style={{ height: "calc(100vh - 8.5rem)" }}>
            <SuperAdminMapEditor session={session} />
          </div>
        )}

        {/* Stalls tab */}
        {tab === "stalls" && (
          <>
            {perimeters.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">No market zones set</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Define at least one market zone in the Map Editor tab before creating stalls.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Stall Map Editor</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Draw and manage stalls on the map
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStallMap((v) => !v)}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    <Map className="w-3.5 h-3.5" />
                    {showStallMap ? "Hide Map" : "Open Map Editor"}
                  </button>
                </div>
                {showStallMap && (
                  <div style={{ height: "70vh" }}>
                    <AdminMapView />
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">All Stalls</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{stallsTotal} total stalls</p>
                </div>
                <div className="relative sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stalls…"
                    value={stallSearch}
                    onChange={(e) => setStallSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">
                        Stall Name
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Section</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Floor</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">
                        Floor Area
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">
                        Business Type
                      </th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableStalls.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-gray-900">{s.stall_name}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{s.section || "—"}</td>
                        <td className="px-5 py-3 text-gray-700">Floor {s.floor}</td>
                        <td className="px-5 py-3 text-gray-700">{s.floor_area || "—"}</td>
                        <td className="px-5 py-3">
                          {editingStall === s.id ? (
                            <select
                              value={editStallData.status}
                              onChange={(e) =>
                                setEditStallData((prev) => ({ ...prev, status: e.target.value }))
                              }
                              className="text-[10px] px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                            >
                              <option value="vacant">Vacant</option>
                              <option value="occupied">Occupied</option>
                              <option value="unavailable">Unavailable</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                s.status === "vacant"
                                  ? "bg-green-100 text-green-700"
                                  : s.status === "occupied"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {editingStall === s.id ? (
                            <input
                              type="text"
                              value={editStallData.business_type}
                              onChange={(e) =>
                                setEditStallData((prev) => ({
                                  ...prev,
                                  business_type: e.target.value,
                                }))
                              }
                              className="text-[10px] px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                              placeholder="Business type"
                            />
                          ) : (
                            <span className="text-gray-600">{s.business_type || "—"}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {editingStall === s.id ? (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateStall(s.id, {
                                        status: editStallData.status,
                                        business_type: editStallData.business_type,
                                      });
                                      await Promise.all([refetchStalls(), loadStallsTable()]);
                                      setEditingStall(null);
                                      showToast("Stall updated successfully.", "success");
                                    } catch (error) {
                                      showToast(
                                        `Failed to update stall: ${error.message}`,
                                        "error",
                                      );
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white rounded-lg text-[10px] font-semibold hover:bg-green-600 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingStall(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded-lg text-[10px] font-semibold hover:bg-gray-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingStall(s.id);
                                  setEditStallData({
                                    status: s.status,
                                    business_type: s.business_type,
                                  });
                                }}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-semibold hover:bg-purple-200 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tableStalls.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                          No stalls found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={stallsPageNum}
                pageSize={TABLE_PAGE_SIZE}
                total={stallsTotal}
                onPageChange={setStallsPageNum}
              />
            </div>
          </>
        )}

        {/* Applications tab */}
        {tab === "applications" && (
          <div className="flex gap-5 h-[calc(100vh-14rem)]">
            {/* Left: Applications table */}
            <div
              className={`${selectedApplication ? "flex-1" : "w-full"} bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">All Applications</h3>
                  <p className="text-xs text-gray-500">{applicationsTotal} total applications</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAppStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        appStatusFilter === f
                          ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f !== "all" && (
                        <span className="ml-1.5 opacity-70">
                          ({applications.filter((a) => a.status === f).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Applicant</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Stall</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">
                        Business Name
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500">
                        Date Applied
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableApplications.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        className={`cursor-pointer transition-colors ${
                          selectedApplication?.id === app.id ? "bg-purple-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span className="font-semibold text-gray-900">{app.applicantName}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{app.stallName}</td>
                        <td className="px-5 py-3 text-gray-700">{app.businessName}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              app.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : app.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(app.dateApplied)}</td>
                      </tr>
                    ))}
                    {tableApplications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                          No applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={applicationsPageNum}
                pageSize={TABLE_PAGE_SIZE}
                total={applicationsTotal}
                onPageChange={setApplicationsPageNum}
              />
            </div>

            {/* Right: Application details panel */}
            {selectedApplication && (
              <div className="w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto flex flex-col">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex items-center justify-between flex-shrink-0">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedApplication.stallName}</p>
                    <p className="text-xs text-gray-500">{selectedApplication.businessName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                  {/* Status */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedApplication.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : selectedApplication.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedApplication.status.charAt(0).toUpperCase() +
                      selectedApplication.status.slice(1)}
                  </span>

                  {/* Applicant info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Applicant
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {selectedApplication.applicantName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedApplication.applicantEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600">
                          {selectedApplication.applicantAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Business Details
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                      <div>
                        <p className="text-[10px] text-gray-500">Business Name</p>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedApplication.businessName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Business Type</p>
                        <p className="text-sm text-gray-700">{selectedApplication.businessType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contract details */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Contract Details
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-gray-500">Start Date</p>
                          <p className="text-xs font-medium text-gray-800">
                            {formatDate(selectedApplication.contractStart)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">End Date</p>
                          <p className="text-xs font-medium text-gray-800">
                            {formatDate(selectedApplication.contractEnd)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Contract Term</p>
                        <p className="text-xs font-medium text-gray-800">
                          {selectedApplication.contractTermMonths} months
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stall details */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Stall Information
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                      <div>
                        <p className="text-[10px] text-gray-500">Stall</p>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedApplication.stallName}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-gray-500">Section</p>
                          <p className="text-xs text-gray-700">
                            {selectedApplication.stallSection || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Floor Area</p>
                          <p className="text-xs text-gray-700">
                            {selectedApplication.floorArea || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional notes */}
                  {selectedApplication.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Additional Notes
                      </p>
                      <div className="bg-gray-50 rounded-xl p-3.5">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {selectedApplication.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Admin remarks */}
                  {selectedApplication.adminRemarks && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Admin Remarks
                      </p>
                      <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200">
                        <p className="text-xs text-amber-900 leading-relaxed">
                          {selectedApplication.adminRemarks}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Date info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Timeline
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-xs text-gray-600">
                        Applied on {formatDate(selectedApplication.dateApplied)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedApplication.status === "pending" && (
                  <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await updateApplicationStatus(selectedApplication.id, "rejected");
                          await Promise.all([refetchApplications(), loadApplicationsTable()]);
                          setSelectedApplication(null);
                          showToast("Application rejected.", "error");
                        } catch (error) {
                          showToast(`Failed to reject application: ${error.message}`, "error");
                        }
                      }}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateApplicationStatus(selectedApplication.id, "approved");
                          await Promise.all([refetchApplications(), loadApplicationsTable()]);
                          setSelectedApplication(null);
                          showToast("Application approved.", "success");
                        } catch (error) {
                          showToast(`Failed to approve application: ${error.message}`, "error");
                        }
                      }}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports & Requests tab */}
        {tab === "violations" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Reports & Requests</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  All officer-submitted violation reports and inspection completion reports
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
              <button
                onClick={() => {
                  setReportSubTab("violations");
                  setReportSearch("");
                  setReportStatusFilter("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "violations" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Violation Reports ({violationsList.length})
              </button>
              <button
                onClick={() => {
                  setReportSubTab("inspections");
                  setReportSearch("");
                  setReportStatusFilter("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "inspections" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Inspection Reports (
                {mapRequests.filter((r) => r.status === "completed" && r.completionSummary).length})
              </button>
              <button
                onClick={() => {
                  setReportSubTab("terminations");
                  setReportSearch("");
                  setReportStatusFilter("all");
                  void getTerminationRequests()
                    .then(setTerminationsList)
                    .catch((error) => {
                      showToast(`Failed to load termination requests: ${error.message}`, "error");
                    });
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${reportSubTab === "terminations" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Termination Requests
                {terminationsList.filter((t) => t.status === "pending").length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold">
                    {terminationsList.filter((t) => t.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setReportSubTab("receipts");
                  setReportSearch("");
                  setReportStatusFilter("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${reportSubTab === "receipts" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Payment Receipts
                {receiptsList.filter((r) => r.status === "pending").length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold">
                    {receiptsList.filter((r) => r.status === "pending").length}
                  </span>
                )}
              </button>
            </div>

            {/* Search + Filter bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by stall, officer…"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              {reportSubTab === "violations" && (
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              )}
            </div>

            {/* ── Violation Reports ── */}
            {reportSubTab === "violations" &&
              (() => {
                const filtered = violationsList.filter((v) => {
                  const matchStatus =
                    reportStatusFilter === "all" || v.status === reportStatusFilter;
                  const matchSearch =
                    !reportSearch ||
                    v.stallName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    v.officerName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    v.category.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    v.vendorName.toLowerCase().includes(reportSearch.toLowerCase());
                  return matchStatus && matchSearch;
                });
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No violation reports found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((v) => {
                      const isExpanded = expandedViolation === v.id;
                      const statusCfg = {
                        open: { label: "Open", cls: "bg-red-100 text-red-700" },
                        resolved: { label: "Resolved", cls: "bg-green-100 text-green-700" },
                        dismissed: { label: "Dismissed", cls: "bg-gray-100 text-gray-600" },
                      }[v.status];
                      return (
                        <div
                          key={v.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <div
                            className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedViolation(isExpanded ? null : v.id)}
                          >
                            <div
                              className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${v.status === "open" ? "bg-red-500" : v.status === "resolved" ? "bg-green-500" : "bg-gray-400"}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {v.stallName}{" "}
                                    <span className="text-gray-400 font-normal">
                                      · {v.vendorName}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Officer:{" "}
                                    <span className="font-medium text-gray-700">
                                      {v.officerName}
                                    </span>{" "}
                                    · {formatDate(v.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.cls}`}
                                  >
                                    {statusCfg.label}
                                  </span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                    {v.category}
                                  </span>
                                  {v.evidence.length > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      📎 {v.evidence.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1.5 truncate">
                                {v.description}
                              </p>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Full Description
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {v.description}
                                  </p>
                                </div>
                                {v.remarks && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                      Officer Remarks
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {v.remarks}
                                    </p>
                                  </div>
                                )}
                                {v.resolvedAt && (
                                  <p className="text-[10px] text-gray-400">
                                    Status updated: {formatDate(v.resolvedAt)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Evidence ({v.evidence.length})
                                </p>
                                {v.evidence.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No files attached</p>
                                ) : (
                                  <div className="space-y-2">
                                    {v.evidence.map((ev, idx) => (
                                      <AttachmentLink
                                        key={ev.id ?? idx}
                                        name={ev.name}
                                        url={ev.url}
                                        mimeType={ev.type}
                                        caption={`Evidence${ev.size ? ` · ${ev.size}` : ""}`}
                                        tone="gray"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            {/* ── Inspection Completion Reports ── */}
            {reportSubTab === "inspections" &&
              (() => {
                const completedReqs = mapRequests.filter((r) => {
                  const hasReport = r.status === "completed" && r.completionSummary;
                  const matchSearch =
                    !reportSearch ||
                    r.stallName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    (r.assignedToName ?? "").toLowerCase().includes(reportSearch.toLowerCase()) ||
                    r.reason.toLowerCase().includes(reportSearch.toLowerCase());
                  return hasReport && matchSearch;
                });
                return completedReqs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No completed inspection reports yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Reports appear here after officers submit completion summaries
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedReqs.map((r) => {
                      const isExpanded = expandedMapReq === r.id;
                      const PRIORITY_CLS = {
                        low: "bg-gray-100 text-gray-500",
                        normal: "bg-blue-50 text-blue-700",
                        high: "bg-orange-100 text-orange-700",
                        urgent: "bg-red-100 text-red-700",
                      };
                      return (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <div
                            className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedMapReq(isExpanded ? null : r.id)}
                          >
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {r.stallName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Officer:{" "}
                                    <span className="font-medium text-gray-700">
                                      {r.assignedToName ?? "—"}
                                    </span>
                                    {" · "}Requested by:{" "}
                                    <span className="font-medium text-gray-700">
                                      {r.requestedByName}
                                    </span>
                                    {" · "}
                                    {r.completedAt
                                      ? formatDate(r.completedAt)
                                      : formatDate(r.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Completed
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_CLS[r.priority] ?? PRIORITY_CLS.normal}`}
                                  >
                                    {r.priority}
                                  </span>
                                  {r.completionFiles.length > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      📎 {r.completionFiles.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                <span className="font-medium">Reason:</span> {r.reason}
                              </p>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Inspection Reason
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {r.reason}
                                  </p>
                                </div>
                                {r.notes && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                      Admin Notes
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {r.notes}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Officer Summary Report
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {r.completionSummary}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Photo Evidence ({r.completionFiles.length})
                                </p>
                                {r.completionFiles.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No files attached</p>
                                ) : (
                                  <div className="space-y-2">
                                    {r.completionFiles.map((f, idx) => (
                                      <AttachmentLink
                                        key={f.id ?? idx}
                                        name={f.name}
                                        url={f.url}
                                        mimeType={f.type}
                                        caption={`Inspection photo${f.size ? ` · ${f.size}` : ""}`}
                                        tone="teal"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            {/* ── Termination Requests ── */}
            {reportSubTab === "terminations" && (
              <div className="space-y-3">
                {terminationsList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No termination requests submitted yet</p>
                  </div>
                ) : (
                  terminationsList.map((t) => {
                    const isPending = t.status === "pending";
                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "account" ? "bg-red-100" : "bg-orange-100"}`}
                          >
                            <AlertTriangle
                              className={`w-5 h-5 ${t.type === "account" ? "text-red-600" : "text-orange-600"}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {t.type === "account"
                                    ? "Account Termination"
                                    : "Contract Termination"}
                                  {t.stallName && (
                                    <span className="text-gray-400 font-normal ml-1">
                                      — {t.stallName}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-gray-700">{t.vendorName}</span>{" "}
                                  · {t.vendorEmail}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatDate(t.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                    t.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : t.status === "approved"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {t.status}
                                </span>
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.type === "account" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}
                                >
                                  {t.type === "account" ? "Account" : "Contract"}
                                </span>
                              </div>
                            </div>
                            {t.reason && (
                              <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                                <span className="font-medium">Reason:</span> {t.reason}
                              </p>
                            )}
                            {isPending && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() =>
                                    setTerminationActionConfirm({
                                      id: t.id,
                                      action: "approved",
                                      name: t.vendorName,
                                      type: t.type,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setTerminationActionConfirm({
                                      id: t.id,
                                      action: "rejected",
                                      name: t.vendorName,
                                      type: t.type,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Payment Receipts ── */}
            {reportSubTab === "receipts" &&
              (() => {
                const filtered = receiptsList.filter(
                  (r) =>
                    !reportSearch ||
                    r.stallName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    r.vendorName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    r.submittedByName.toLowerCase().includes(reportSearch.toLowerCase()),
                );
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <ReceiptIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No payment receipts submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ReceiptIcon className="w-5 h-5 text-purple-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {r.stallName}
                                  {r.amount !== null && (
                                    <span className="text-gray-400 font-normal ml-1">
                                      — ₱{r.amount.toLocaleString()}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-gray-700">{r.vendorName}</span>{" "}
                                  · Paid{" "}
                                  {new Date(r.receiptDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Submitted by {r.submittedByName}
                                  {r.submittedByRole === "officer" ? " (officer)" : ""} ·{" "}
                                  {formatDate(r.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                                  r.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : r.status === "verified"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                            {r.notes && (
                              <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                                {r.notes}
                              </p>
                            )}
                            {r.fileUrl && (
                              <a
                                href={r.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-purple-700 font-medium mt-2 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View receipt file
                              </a>
                            )}
                            {r.status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleReviewReceipt(r.id, "verified")}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleReviewReceipt(r.id, "rejected")}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
          </>
        )}

        {/* Check Requests tab */}
        {tab === "check-requests" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Send Request</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Request officers to check stalls for potential violations
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>

            {checkRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No requests sent yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Stall</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Requested By
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Assigned Officer
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {checkRequests.map((req) => {
                        const officers = requestOfficers;
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900">{req.stallName}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{req.requestedByName}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                              {req.reason}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  req.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : req.status === "assigned"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-green-100 text-green-700"
                                }`}
                              >
                                {req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {assigningRequest === req.id && req.status !== "completed" ? (
                                <select
                                  value={req.assignedOfficerId || ""}
                                  onChange={(e) =>
                                    handleAssignRequestOfficer(req.id, e.target.value)
                                  }
                                  className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  autoFocus
                                  onBlur={() => setAssigningRequest(null)}
                                >
                                  <option value="">Select Officer</option>
                                  {officers.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-700">
                                  {req.assignedOfficerName || "—"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(req.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {req.status !== "completed" && (
                                  <button
                                    onClick={() => setAssigningRequest(req.id)}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-lg hover:bg-purple-200 transition-colors"
                                  >
                                    Assign
                                  </button>
                                )}
                                {req.status === "assigned" && (
                                  <button
                                    onClick={() => handleCompleteRequest(req.id)}
                                    className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-semibold rounded-lg hover:bg-green-200 transition-colors"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Map-based officer requests with completion reports */}
            {mapRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Officer Completion Reports (Map Requests)
                </h3>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Stall</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Officer
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Report
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mapRequests.map((req) => {
                          const isExpanded = expandedMapReq === req.id;
                          return (
                            <React.Fragment key={req.id}>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                  {req.stallName}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {req.assignedToName ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                  {req.reason}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                      req.priority === "urgent"
                                        ? "bg-red-100 text-red-700"
                                        : req.priority === "high"
                                          ? "bg-orange-100 text-orange-700"
                                          : req.priority === "normal"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {req.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      req.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : req.status === "cancelled"
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {req.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {req.status === "completed" && req.completionSummary && (
                                    <button
                                      onClick={() => setExpandedMapReq(isExpanded ? null : req.id)}
                                      className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-lg hover:bg-purple-200 transition-colors"
                                    >
                                      {isExpanded ? "Hide" : "View"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && req.status === "completed" && (
                                <tr className="bg-purple-50">
                                  <td colSpan={7} className="px-6 py-4">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                      Officer Summary:
                                    </p>
                                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                      {req.completionSummary}
                                    </p>
                                    {req.completionFiles.length > 0 && (
                                      <>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">
                                          Attached Files ({req.completionFiles.length}):
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {req.completionFiles.map((f, i) => (
                                            /* Opens the stored file; plain text when none was saved. */
                                            <a
                                              key={f.id ?? i}
                                              href={f.url || undefined}
                                              target={f.url ? "_blank" : undefined}
                                              rel="noreferrer"
                                              title={f.url ? `Open ${f.name}` : "No file was stored for this record."}
                                              className={`flex items-center gap-1 px-2 py-1 bg-white border rounded-lg text-[10px] ${
                                                f.url
                                                  ? "border-purple-200 text-gray-700 hover:border-purple-400"
                                                  : "border-dashed border-gray-200 text-gray-400 cursor-default"
                                              }`}
                                            >
                                              <span>📎</span> {f.name}{" "}
                                              <span className="text-gray-400">({f.size})</span>
                                            </a>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Create Check Request</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedStallForRequest(null);
                  setRequestReason("");
                }}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Select Stall
                </label>
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {stalls.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStallForRequest(s.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                        selectedStallForRequest === s.id ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{s.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            s.status === "vacant"
                              ? "bg-green-100 text-green-700"
                              : s.status === "occupied"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Reason for Check
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Describe why this stall needs to be checked..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedStallForRequest(null);
                  setRequestReason("");
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editUser ? "Edit User" : "Add New User"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { field: "name", label: "Full Name", placeholder: "Juan dela Cruz", type: "text" },
                {
                  field: "email",
                  label: "Email Address",
                  placeholder: "user@example.com",
                  type: "email",
                },
                { field: "phone", label: "Phone Number", placeholder: "09XXXXXXXXX", type: "text" },
                {
                  field: "address",
                  label: "Address",
                  placeholder: "Street, City, Province",
                  type: "text",
                },
                {
                  field: "department",
                  label: "Department (optional)",
                  placeholder: "e.g. Market Operations",
                  type: "text",
                },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    disabled={field === "email" && !!editUser}
                    className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors[field] ? "border-red-300" : "border-gray-200"
                    } ${field === "email" && editUser ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {formErrors[field] && (
                    <p className="text-red-500 text-xs mt-1">{formErrors[field]}</p>
                  )}
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {["vendor", "officer", "admin", "super_admin"].map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {editUser ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={editUser ? "Leave blank to keep current" : "At least 6 characters"}
                    className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.password ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination action confirm modal */}
      {terminationActionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${terminationActionConfirm.action === "approved" ? "bg-green-100" : "bg-gray-100"}`}
            >
              {terminationActionConfirm.action === "approved" ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <X className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              {terminationActionConfirm.action === "approved"
                ? `Approve ${terminationActionConfirm.type === "account" ? "Account" : "Contract"} Termination?`
                : "Reject Termination Request?"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {terminationActionConfirm.action === "approved"
                ? `This will approve the termination request from ${terminationActionConfirm.name}. This action cannot be undone.`
                : `The termination request from ${terminationActionConfirm.name} will be rejected.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTerminationActionConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminationDecision}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors text-white ${terminationActionConfirm.action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-gray-500 hover:bg-gray-600"}`}
              >
                {terminationActionConfirm.action === "approved" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete User?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
