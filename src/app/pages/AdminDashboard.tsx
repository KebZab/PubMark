import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Users,
  User,
  Check,
  X,
  Eye,
  Search,
  Store,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Megaphone,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  PartyPopper,
  AlertCircle,
  Printer,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { AdminMapView } from "../components/AdminMapView";
import { StallManagementPanel } from "../components/StallManagementPanel";
import { ContractModal, type ContractData } from "../components/ContractModal";
import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from "../components/announcementsStore";
import { useApplications } from "../hooks/useApplications";
import { updateApplicationStatus, type Application } from "../services/applicationsApi";
import { useStalls, type Stall } from "../hooks/useStalls";
import { type StoredStall } from "../components/stallsStorage";
import { getSession, getAllUsers, type PubMarkUser } from "../components/authStorage";
import { getViolations, assignOfficer, type Violation } from "../components/violationsStore";
import { getViolationRequests, createViolationRequest, assignRequestToOfficer, type ViolationCheckRequest } from "../components/violationRequestStore";
import { getCheckRequests, type OfficerCheckRequest } from "../components/checkRequestsStore";
import { getTerminationRequests, updateTerminationStatus, type TerminationRequest } from "../components/terminationRequestsStore";
import { DashboardLayout } from "../components/DashboardLayout";
import { showToast } from "../components/Toast";

type Tab = "dashboard" | "stalls" | "applications" | "announcements" | "stall-management" | "violations" | "check-requests";

const TERM_LABELS: Record<string, string> = {
  "6": "6 Months", "12": "1 Year", "24": "2 Years", "36": "3 Years",
};

const announcementTypeConfig = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", label: "Notice" },
  urgent: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", label: "Urgent" },
  success: { icon: PartyPopper, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Update" },
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession()!;

  // Determine tab from URL
  const getTabFromURL = (path: string): Tab => {
    if (path.includes("/map")) return "stalls";
    if (path.includes("/applications")) return "applications";
    if (path.includes("/vendors")) return "stall-management";
    if (path.includes("/announcements")) return "announcements";
    if (path.includes("/violations")) return "violations";
    if (path.includes("/check-requests")) return "check-requests";
    return "dashboard";
  };

  const [tab, setTab] = useState<Tab>(getTabFromURL(location.pathname));

  // Watch for URL changes
  useEffect(() => {
    setTab(getTabFromURL(location.pathname));
  }, [location.pathname]);

  const { applications, refetch } = useApplications();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [contractApp, setContractApp] = useState<Application | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<Announcement["type"]>("info");
  const [appStatusFilter, setAppStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [violationsList, setViolationsList] = useState<Violation[]>([]);
  const [assigningViolation, setAssigningViolation] = useState<string | null>(null);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);
  const [users, setUsers] = useState<PubMarkUser[]>([]);
  const [appSortField, setAppSortField] = useState<"date" | "stall" | "status">("date");
  const [appSortAsc, setAppSortAsc] = useState(false);
  const [checkRequests, setCheckRequests] = useState<ViolationCheckRequest[]>([]);
  const [mapRequests, setMapRequests] = useState<OfficerCheckRequest[]>([]);
  const [expandedMapReq, setExpandedMapReq] = useState<string | null>(null);
  const [reportSubTab, setReportSubTab] = useState<"violations" | "inspections" | "terminations">("violations");
  const [terminationsList, setTerminationsList] = useState<TerminationRequest[]>([]);
  const [announcementDeleteConfirm, setAnnouncementDeleteConfirm] = useState<string | null>(null);
  const [terminationActionConfirm, setTerminationActionConfirm] = useState<{ id: string; action: "approved" | "rejected"; name: string; type: string } | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStallForRequest, setSelectedStallForRequest] = useState<StoredStall | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const [assigningRequest, setAssigningRequest] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") { navigate("/", { replace: true }); }
  }, [navigate]);

  const { stalls: storedStalls } = useStalls();
  const approvedStallIds = new Set(applications.filter((a) => a.status === "approved").map((a) => a.stallId));
  const totalStalls = storedStalls.length;
  const occupiedCount = storedStalls.filter((s) => approvedStallIds.has(s.id)).length;
  const vacantCount = totalStalls - occupiedCount;

  const stats = {
    totalApplications: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    totalStalls,
    occupied: occupiedCount,
    vacant: vacantCount,
  };

  const handleApprove = async (id: string) => {
    try {
      await updateApplicationStatus(id, "approved", remarksInput || undefined);
      await refetch();
      if (selectedApp?.id === id) setSelectedApp((prev) => prev ? { ...prev, status: "approved", adminRemarks: remarksInput } : null);
      setRemarksInput("");
      showToast("Application approved.", "success");
    } catch (error) {
      showToast(`Failed to approve application: ${(error as Error).message}`, "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateApplicationStatus(id, "rejected", remarksInput || undefined);
      await refetch();
      if (selectedApp?.id === id) setSelectedApp((prev) => prev ? { ...prev, status: "rejected", adminRemarks: remarksInput } : null);
      setRemarksInput("");
      showToast("Application rejected.", "error");
    } catch (error) {
      showToast(`Failed to reject application: ${(error as Error).message}`, "error");
    }
  };

  function buildContract(app: Application): ContractData {
    return {
      applicationId: app.id,
      stallName: app.stallName,
      stallSection: app.stallSection,
      floorArea: app.floorArea,
      applicantName: app.applicantName,
      applicantAddress: app.applicantAddress,
      businessName: app.businessName,
      businessType: app.businessType,
      startDate: app.contractStart,
      endDate: app.contractEnd,
      approvedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
  }

  useEffect(() => {
    if (tab === "announcements" || tab === "dashboard") {
      setAnnouncements(getAnnouncements());
    }
    if (tab === "applications" || tab === "dashboard") {
      refetch();
    }
    if (tab === "violations") {
      setViolationsList(getViolations());
      setMapRequests(getCheckRequests());
      setUsers(getAllUsers());
      setTerminationsList(getTerminationRequests());
    }
    if (tab === "check-requests") {
      setCheckRequests(getViolationRequests());
      setMapRequests(getCheckRequests());
      setUsers(getAllUsers());
    }
  }, [tab]);

  function handlePostAnnouncement() {
    if (!newTitle.trim() || !newMessage.trim()) return;
    const updated = addAnnouncement({ title: newTitle.trim(), message: newMessage.trim(), type: newType });
    setAnnouncements(updated);
    setNewTitle("");
    setNewMessage("");
    setNewType("info");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = deleteAnnouncement(id);
    setAnnouncements(updated);
  }

  function handleAssignOfficer(violationId: string, officerId: string) {
    const officer = users.find((u) => u.id === officerId);
    if (!officer) return;
    const updated = assignOfficer(violationId, officerId, officer.name);
    if (updated) {
      setViolationsList(getViolations());
      setAssigningViolation(null);
      showToast(`Officer "${officer.name}" assigned to violation.`, "success");
    }
  }

  function sortApplications(apps: Application[]): Application[] {
    const sorted = [...apps];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (appSortField === "date") {
        comparison = new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime();
      } else if (appSortField === "stall") {
        comparison = a.stallName.localeCompare(b.stallName);
      } else if (appSortField === "status") {
        const statusOrder = { pending: 1, approved: 2, rejected: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      }
      return appSortAsc ? comparison : -comparison;
    });
    return sorted;
  }

  function handleAppSort(field: "date" | "stall" | "status") {
    if (appSortField === field) {
      setAppSortAsc(!appSortAsc);
    } else {
      setAppSortField(field);
      setAppSortAsc(true);
    }
  }

  function handleCreateCheckRequest() {
    if (!selectedStallForRequest || !requestReason.trim()) return;
    const sess = getSession();
    if (!sess) return;

    createViolationRequest({
      stallId: selectedStallForRequest.id,
      stallName: selectedStallForRequest.stall_name,
      requestedBy: sess.userId,
      requestedByName: sess.name,
      reason: requestReason.trim(),
    });

    showToast("Violation check request created.", "success");
    setShowRequestModal(false);
    setSelectedStallForRequest(null);
    setRequestReason("");
    setCheckRequests(getViolationRequests());
  }

  function handleAssignCheckRequest(requestId: string, officerId: string) {
    const officer = users.find((u) => u.id === officerId);
    if (!officer) return;
    const updated = assignRequestToOfficer(requestId, officerId, officer.name);
    if (updated) {
      setCheckRequests(getViolationRequests());
      setAssigningRequest(null);
      showToast(`Officer "${officer.name}" assigned to check request.`, "success");
    }
  }

  // Handle tab changes and update URL
  function handleTabChange(newTab: Tab) {
    const paths: Record<Tab, string> = {
      dashboard: "/admin",
      stalls: "/admin/map",
      applications: "/admin/applications",
      "stall-management": "/admin/vendors",
      announcements: "/admin/announcements",
      violations: "/admin/violations",
      "check-requests": "/admin/check-requests",
    };
    navigate(paths[newTab]);
  }

  const openViolations = getViolations().filter((v) => v.status === "open").length;
  const pendingRequests = getViolationRequests().filter((r) => r.status === "pending").length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "stalls", label: "Stall Map", icon: MapPin },
    { id: "applications", label: "Applications", icon: FileText, badge: stats.pending },
    { id: "stall-management", label: "Stall Management", icon: Store },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "violations", label: "Reports & Requests", icon: AlertTriangle, badge: openViolations },
    { id: "check-requests", label: "Send Request", icon: Search, badge: pendingRequests },
  ];

  return (
    <DashboardLayout
      session={session}
      title="Admin Dashboard"
      subtitle="Manage applications, stalls, and announcements"
      actions={
        tab === "announcements" ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9488] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Announcement
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
                    ? "border-[#14B8A6] text-[#14B8A6]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge && t.badge > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`p-6 space-y-5 ${tab === "stalls" ? "!p-0" : ""}`}>
        {/* Dashboard */}
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">Total Applications</div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalApplications}</div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">Pending</div>
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600 mb-1">{stats.pending}</div>
                <div className="text-sm text-gray-500">Awaiting review</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">Approved</div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.approved}</div>
                <div className="text-sm text-gray-500">Successfully approved</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">Rejected</div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">{stats.rejected}</div>
                <div className="text-sm text-gray-500">Not approved</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                <button
                  onClick={() => handleTabChange("applications")}
                  className="text-sm text-[#14B8A6] hover:text-[#0d9488] font-medium"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Stall</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Applicant</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications
                      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
                      .slice(0, 5)
                      .map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{app.stallName}</td>
                        <td className="px-6 py-4 text-gray-600">{app.applicantName}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              app.status === "pending"
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                : app.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                            }`}
                          >
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(app.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/application/${app.id}`)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(app.id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {app.status === "approved" && (
                              <button
                                onClick={() => setContractApp(app)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                                title="Print Contract"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Contract
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Make Announcement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6]/20 to-teal-100 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-4.5 h-4.5 text-[#14B8A6]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Make Announcement</h2>
                    <p className="text-xs text-gray-500">Broadcast a message to all users</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("announcements")}
                  className="text-sm text-[#14B8A6] hover:text-[#0d9488] font-medium flex items-center gap-1"
                >
                  View All
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Type selector */}
                <div className="flex gap-2 flex-wrap">
                  {(["info", "warning", "urgent", "success"] as const).map((t) => {
                    const cfg = announcementTypeConfig[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          newType === t
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                  />
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your message here..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm resize-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""} published</p>
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={!newTitle.trim() || !newMessage.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    <Megaphone className="w-4 h-4" />
                    Post Announcement
                  </button>
                </div>
              </div>

              {/* Recent announcements preview */}
              {announcements.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {announcements.slice(0, 3).map((item) => {
                      const cfg = announcementTypeConfig[item.type];
                      const Icon = cfg.icon;
                      return (
                        <div key={item.id} className="px-6 py-3.5 flex items-center gap-4 group hover:bg-gray-50 transition-colors">
                          <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                          </div>
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <button
                            onClick={() => setAnnouncementDeleteConfirm(item.id)}
                            className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {announcements.length > 3 && (
                    <div className="px-6 py-3 border-t border-gray-100">
                      <button
                        onClick={() => handleTabChange("announcements")}
                        className="text-xs text-[#14B8A6] font-medium hover:underline"
                      >
                        +{announcements.length - 3} more — view all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Stalls */}
        {tab === "stalls" && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* Compact stats bar */}
            <div className="flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#14B8A6]" />
                <span className="text-sm text-gray-600">Total: <strong className="text-gray-900">{stats.totalStalls}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Occupied: <strong className="text-emerald-600">{stats.occupied}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></div>
                <span className="text-sm text-gray-600">Vacant: <strong className="text-[#14B8A6]">{stats.vacant}</strong></span>
              </div>
              <div className="ml-auto text-xs text-gray-400">Click a marker to view owner details</div>
            </div>
            {/* Map fills rest */}
            <div className="flex-1 min-h-0">
              <AdminMapView />
            </div>
          </div>
        )}

        {/* Stall Management */}
        {tab === "stall-management" && (
          <StallManagementPanel />
        )}

        {/* Applications */}
        {tab === "applications" && (
          <div className="flex gap-6 h-full">
            {/* Left: application list */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Filter bar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAppStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      appStatusFilter === f
                        ? "bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== "all" && (
                      <span className="ml-1.5 opacity-70">
                        ({applications.filter((a) => f === "all" || a.status === f).length})
                      </span>
                    )}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-400">{applications.length} total</span>
              </div>

              {applications.filter((a) => appStatusFilter === "all" || a.status === appStatusFilter).length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">No applications yet</p>
                  <p className="text-sm text-gray-400">Applications submitted by users will appear here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            <button onClick={() => handleAppSort("stall")} className="flex items-center gap-1 hover:text-gray-700">
                              Stall <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Applicant</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            <button onClick={() => handleAppSort("status")} className="flex items-center gap-1 hover:text-gray-700">
                              Status <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            <button onClick={() => handleAppSort("date")} className="flex items-center gap-1 hover:text-gray-700">
                              Applied <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortApplications(applications.filter((a) => appStatusFilter === "all" || a.status === appStatusFilter))
                          .map((app) => (
                            <tr
                              key={app.id}
                              onClick={() => { setSelectedApp(app); setRemarksInput(app.adminRemarks || ""); }}
                              className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedApp?.id === app.id ? "bg-teal-50/50" : ""}`}
                            >
                              <td className="px-5 py-3.5 font-medium text-gray-900 text-sm">{app.stallName}</td>
                              <td className="px-5 py-3.5 text-sm text-gray-600">{app.applicantName}</td>
                              <td className="px-5 py-3.5 text-sm text-gray-500">{app.businessName}</td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  app.status === "pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                  : app.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                  : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                }`}>
                                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-gray-500">
                                {new Date(app.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {app.status === "pending" && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleApprove(app.id); }}
                                        className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                                        title="Approve"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleReject(app.id); }}
                                        className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                        title="Reject"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  {app.status === "approved" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setContractApp(app); }}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-lg text-xs font-medium"
                                    >
                                      <Printer className="w-3 h-3" /> Contract
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            {selectedApp && (
              <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto flex flex-col">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between flex-shrink-0">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedApp.stallName}</p>
                    <p className="text-xs text-gray-500">{selectedApp.businessName}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                  {/* Status */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedApp.status === "pending" ? "bg-amber-100 text-amber-700"
                    : selectedApp.status === "approved" ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                  </span>

                  {/* Applicant info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Applicant</p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{selectedApp.applicantName}</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-5">{selectedApp.applicantEmail}</p>
                      <p className="text-xs text-gray-500 pl-5">{selectedApp.applicantAddress}</p>
                    </div>
                  </div>

                  {/* Contract info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contract Details</p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Business</span>
                        <span className="font-medium text-gray-800">{selectedApp.businessName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-gray-800">{selectedApp.businessType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Term</span>
                        <span className="font-medium text-gray-800">{TERM_LABELS[selectedApp.contractTermMonths] ?? selectedApp.contractTermMonths + " mo."}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Start</span>
                        <span className="font-medium text-gray-800">{new Date(selectedApp.contractStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">End</span>
                        <span className="font-medium text-gray-800">{new Date(selectedApp.contractEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submitted documents */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Submitted Documents</p>
                    <div className="space-y-2">
                      {selectedApp.permitFileName ? (
                        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                          <div className="w-8 h-8 bg-[#14B8A6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-[#14B8A6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{selectedApp.permitFileName}</p>
                            <p className="text-[10px] text-gray-500">Business Permit{selectedApp.permitFileSize ? ` · ${selectedApp.permitFileSize}` : ""}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium flex-shrink-0">Required</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No permit uploaded.</p>
                      )}
                      {selectedApp.additionalFileName && (
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{selectedApp.additionalFileName}</p>
                            <p className="text-[10px] text-gray-500">Additional Doc{selectedApp.additionalFileSize ? ` · ${selectedApp.additionalFileSize}` : ""}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes from applicant */}
                  {selectedApp.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Applicant Notes</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{selectedApp.notes}</p>
                    </div>
                  )}

                  {/* Admin remarks input */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Admin Remarks</p>
                    {selectedApp.status !== "pending" ? (
                      <div className={`rounded-xl p-3 border text-sm ${
                        selectedApp.status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                      }`}>
                        {selectedApp.adminRemarks || <span className="italic text-gray-400">No remarks provided.</span>}
                      </div>
                    ) : (
                      <textarea
                        value={remarksInput}
                        onChange={(e) => setRemarksInput(e.target.value)}
                        placeholder="Optional remarks for the applicant..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none transition-all"
                      />
                    )}
                  </div>

                  {/* Action buttons */}
                  {selectedApp.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedApp.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                  {selectedApp.status === "approved" && (
                    <button
                      onClick={() => setContractApp(selectedApp)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
                    >
                      <Printer className="w-4 h-4" /> Print Contract
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Announcements */}
        {tab === "announcements" && (
          <>
            {/* Create Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-[#14B8A6]/30 overflow-hidden mb-5">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#14B8A6]/20 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-[#14B8A6]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Create New Announcement</h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Type selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="flex gap-2">
                      {(["info", "warning", "urgent", "success"] as const).map((t) => {
                        const cfg = announcementTypeConfig[t];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              newType === t
                                ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Announcement title..."
                      className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write your announcement here..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostAnnouncement}
                      disabled={!newTitle.trim() || !newMessage.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Announcement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">No announcements yet</p>
                <p className="text-sm text-gray-500">Create your first announcement to notify users</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => {
                  const cfg = announcementTypeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm border ${cfg.border} overflow-hidden group`}
                    >
                      <div className={`${cfg.bg} px-6 py-4 flex items-start gap-4`}>
                        <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Posted by {item.author} · {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => setAnnouncementDeleteConfirm(item.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="px-6 py-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reports & Requests tab */}
        {tab === "violations" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Reports & Requests</h2>
                <p className="text-xs text-gray-500 mt-0.5">All officer-submitted violation reports and inspection completion reports</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
              <button
                onClick={() => { setReportSubTab("violations"); setReportSearch(""); setReportStatusFilter("all"); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "violations" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Violation Reports ({violationsList.length})
              </button>
              <button
                onClick={() => { setReportSubTab("inspections"); setReportSearch(""); setReportStatusFilter("all"); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "inspections" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Inspection Reports ({mapRequests.filter(r => r.status === "completed" && r.completionSummary).length})
              </button>
              <button
                onClick={() => { setReportSubTab("terminations"); setReportSearch(""); setReportStatusFilter("all"); setTerminationsList(getTerminationRequests()); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${reportSubTab === "terminations" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Termination Requests
                {terminationsList.filter(t => t.status === "pending").length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold">
                    {terminationsList.filter(t => t.status === "pending").length}
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
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
              {reportSubTab === "violations" && (
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              )}
            </div>

            {/* ── Violation Reports ── */}
            {reportSubTab === "violations" && (() => {
              const filtered = violationsList.filter((v) => {
                const matchStatus = reportStatusFilter === "all" || v.status === reportStatusFilter;
                const matchSearch = !reportSearch ||
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
                      <div key={v.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div
                          className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedViolation(isExpanded ? null : v.id)}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${v.status === "open" ? "bg-red-500" : v.status === "resolved" ? "bg-green-500" : "bg-gray-400"}`} style={{ marginTop: 6 }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{v.stallName} <span className="text-gray-400 font-normal">· {v.vendorName}</span></p>
                                <p className="text-xs text-gray-500 mt-0.5">Officer: <span className="font-medium text-gray-700">{v.officerName}</span> · {formatDate(v.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>{statusCfg.label}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{v.category}</span>
                                {v.evidence.length > 0 && <span className="text-[10px] text-gray-400">📎 {v.evidence.length}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 truncate">{v.description}</p>
                          </div>
                          <span className="text-gray-400 text-xs flex-shrink-0">{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Description</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{v.description}</p>
                              </div>
                              {v.remarks && (
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Officer Remarks</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{v.remarks}</p>
                                </div>
                              )}
                              {v.resolvedAt && (
                                <p className="text-[10px] text-gray-400">Status updated: {formatDate(v.resolvedAt)}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Evidence ({v.evidence.length})
                              </p>
                              {v.evidence.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No files attached</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {v.evidence.map((ev, idx) => (
                                    <div key={idx} className={`rounded-xl overflow-hidden border ${ev.type === "image" ? "border-amber-200" : ev.type === "video" ? "border-blue-200" : "border-gray-200"}`}>
                                      {ev.type === "image" ? (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <Eye className="w-6 h-6 text-amber-400" />
                                          <span className="text-[9px] font-medium text-amber-600">Photo</span>
                                        </div>
                                      ) : ev.type === "video" ? (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <FileText className="w-6 h-6 text-blue-400" />
                                          <span className="text-[9px] font-medium text-blue-600">Video</span>
                                        </div>
                                      ) : (
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-20 flex flex-col items-center justify-center gap-1">
                                          <FileText className="w-6 h-6 text-gray-400" />
                                          <span className="text-[9px] font-medium text-gray-500">Document</span>
                                        </div>
                                      )}
                                      <div className="bg-white px-2 py-1.5 border-t border-gray-100">
                                        <p className="text-[9px] text-gray-700 font-medium truncate">{ev.name}</p>
                                        <p className="text-[9px] text-gray-400">{ev.size}</p>
                                      </div>
                                    </div>
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
            {reportSubTab === "inspections" && (() => {
              const completedReqs = mapRequests.filter((r) => {
                const hasReport = r.status === "completed" && r.completionSummary;
                const matchSearch = !reportSearch ||
                  r.stallName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                  (r.assignedToName ?? "").toLowerCase().includes(reportSearch.toLowerCase()) ||
                  r.reason.toLowerCase().includes(reportSearch.toLowerCase());
                return hasReport && matchSearch;
              });
              return completedReqs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No completed inspection reports yet</p>
                  <p className="text-xs text-gray-400 mt-1">Reports appear here after officers submit completion summaries</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedReqs.map((r) => {
                    const isExpanded = expandedMapReq === r.id;
                    const PRIORITY_CLS: Record<string, string> = {
                      low: "bg-gray-100 text-gray-500",
                      normal: "bg-blue-50 text-blue-700",
                      high: "bg-orange-100 text-orange-700",
                      urgent: "bg-red-100 text-red-700",
                    };
                    return (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div
                          className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedMapReq(isExpanded ? null : r.id)}
                        >
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{r.stallName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Officer: <span className="font-medium text-gray-700">{r.assignedToName ?? "—"}</span>
                                  {" · "}Requested by: <span className="font-medium text-gray-700">{r.requestedByName}</span>
                                  {" · "}{r.completedAt ? formatDate(r.completedAt) : formatDate(r.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completed</span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_CLS[r.priority] ?? PRIORITY_CLS.normal}`}>{r.priority}</span>
                                {r.completionFiles.length > 0 && <span className="text-[10px] text-gray-400">📎 {r.completionFiles.length}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate"><span className="font-medium">Reason:</span> {r.reason}</p>
                          </div>
                          <span className="text-gray-400 text-xs flex-shrink-0">{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Inspection Reason</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{r.reason}</p>
                              </div>
                              {r.notes && (
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{r.notes}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Officer Summary Report</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{r.completionSummary}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Photo Evidence ({r.completionFiles.length})
                              </p>
                              {r.completionFiles.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No files attached</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {r.completionFiles.map((f, idx) => (
                                    <div key={idx} className={`rounded-xl overflow-hidden border ${f.type === "image" ? "border-teal-200" : f.type === "video" ? "border-blue-200" : "border-gray-200"}`}>
                                      {f.type === "image" ? (
                                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <Eye className="w-6 h-6 text-teal-400" />
                                          <span className="text-[9px] font-medium text-teal-600">Photo</span>
                                        </div>
                                      ) : f.type === "video" ? (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <FileText className="w-6 h-6 text-blue-400" />
                                          <span className="text-[9px] font-medium text-blue-600">Video</span>
                                        </div>
                                      ) : (
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-20 flex flex-col items-center justify-center gap-1">
                                          <FileText className="w-6 h-6 text-gray-400" />
                                          <span className="text-[9px] font-medium text-gray-500">Document</span>
                                        </div>
                                      )}
                                      <div className="bg-white px-2 py-1.5 border-t border-gray-100">
                                        <p className="text-[9px] text-gray-700 font-medium truncate">{f.name}</p>
                                        <p className="text-[9px] text-gray-400">{f.size}</p>
                                      </div>
                                    </div>
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
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "account" ? "bg-red-100" : "bg-orange-100"}`}>
                            <AlertTriangle className={`w-5 h-5 ${t.type === "account" ? "text-red-600" : "text-orange-600"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {t.type === "account" ? "Account Termination" : "Contract Termination"}
                                  {t.stallName && <span className="text-gray-400 font-normal ml-1">— {t.stallName}</span>}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-gray-700">{t.vendorName}</span> · {t.vendorEmail}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                  t.status === "pending" ? "bg-amber-100 text-amber-700"
                                  : t.status === "approved" ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                                }`}>
                                  {t.status}
                                </span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.type === "account" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>
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
                                  onClick={() => setTerminationActionConfirm({ id: t.id, action: "approved", name: t.vendorName, type: t.type })}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setTerminationActionConfirm({ id: t.id, action: "rejected", name: t.vendorName, type: t.type })}
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
          </>
        )}

        {/* Check Requests tab */}
        {tab === "check-requests" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Send Request</h2>
                <p className="text-xs text-gray-500 mt-0.5">Request officers to check specific stalls for violations</p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9488] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>

            {checkRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No requests sent yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Stall</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Requested By</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Assigned Officer</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {checkRequests.map((req) => {
                        const officers = users.filter((u) => u.role === "officer");
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900">{req.stallName}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{req.requestedByName}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                req.status === "pending" ? "bg-amber-100 text-amber-700" :
                                req.status === "assigned" ? "bg-blue-100 text-blue-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                {req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {req.status === "pending" && assigningRequest === req.id ? (
                                <select
                                  value={req.assignedOfficerId || ""}
                                  onChange={(e) => handleAssignCheckRequest(req.id, e.target.value)}
                                  className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                  autoFocus
                                  onBlur={() => setAssigningRequest(null)}
                                >
                                  <option value="">Select Officer</option>
                                  {officers.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-700">{req.assignedOfficerName || "Not assigned"}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(req.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              {req.status === "pending" && (
                                <button
                                  onClick={() => setAssigningRequest(req.id)}
                                  className="px-2 py-1 bg-[#14B8A6] bg-opacity-20 text-[#14B8A6] text-[10px] font-semibold rounded-lg hover:bg-opacity-30 transition-colors"
                                >
                                  Assign
                                </button>
                              )}
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
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Officer Completion Reports (Map Requests)</h3>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Stall</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Officer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mapRequests.map((req) => {
                          const isExpanded = expandedMapReq === req.id;
                          return (
                            <React.Fragment key={req.id}>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900">{req.stallName}</td>
                                <td className="px-4 py-3 text-gray-700">{req.assignedToName ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                    req.priority === "urgent" ? "bg-red-100 text-red-700" :
                                    req.priority === "high" ? "bg-orange-100 text-orange-700" :
                                    req.priority === "normal" ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-600"
                                  }`}>{req.priority}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    req.status === "completed" ? "bg-green-100 text-green-700" :
                                    req.status === "cancelled" ? "bg-gray-100 text-gray-600" :
                                    "bg-amber-100 text-amber-700"
                                  }`}>{req.status.toUpperCase()}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-center">
                                  {req.status === "completed" && req.completionSummary && (
                                    <button
                                      onClick={() => setExpandedMapReq(isExpanded ? null : req.id)}
                                      className="px-2 py-1 bg-[#14B8A6] bg-opacity-20 text-[#14B8A6] text-[10px] font-semibold rounded-lg hover:bg-opacity-30 transition-colors"
                                    >
                                      {isExpanded ? "Hide" : "View"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && req.status === "completed" && (
                                <tr className="bg-teal-50">
                                  <td colSpan={7} className="px-6 py-4">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Officer Summary:</p>
                                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">{req.completionSummary}</p>
                                    {req.completionFiles.length > 0 && (
                                      <>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Attached Files ({req.completionFiles.length}):</p>
                                        <div className="flex flex-wrap gap-2">
                                          {req.completionFiles.map((f, i) => (
                                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white border border-teal-200 rounded-lg text-[10px] text-gray-700">
                                              <span>📎</span> {f.name} <span className="text-gray-400">({f.size})</span>
                                            </span>
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

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#14B8A6] to-[#0d9488] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-white font-semibold">Request Violation Check</h2>
              </div>
              <button onClick={() => { setShowRequestModal(false); setSelectedStallForRequest(null); setRequestReason(""); }} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Stall from Map</label>
                <div className="h-64 border border-gray-300 rounded-xl overflow-hidden relative bg-gray-100">
                  {/* Simple stall selector list */}
                  <div className="h-full overflow-y-auto p-3 space-y-2">
                    {storedStalls.map((stall) => (
                      <button
                        key={stall.id}
                        onClick={() => setSelectedStallForRequest(stall)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedStallForRequest?.id === stall.id
                            ? "bg-[#14B8A6] text-white"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {stall.stall_name} <span className="text-xs opacity-75">({stall.section})</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedStallForRequest && (
                  <p className="text-xs text-[#14B8A6] font-medium mt-1">Selected: {selectedStallForRequest.stall_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Check</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Describe why this stall should be checked..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRequestModal(false); setSelectedStallForRequest(null); setRequestReason(""); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheckRequest}
                  disabled={!selectedStallForRequest || !requestReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Delete Confirm */}
      {announcementDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Announcement?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This announcement will be permanently removed and vendors will no longer see it.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAnnouncementDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDelete(announcementDeleteConfirm); setAnnouncementDeleteConfirm(null); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Action Confirm */}
      {terminationActionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${terminationActionConfirm.action === "approved" ? "bg-red-100" : "bg-gray-100"}`}>
              <AlertTriangle className={`w-6 h-6 ${terminationActionConfirm.action === "approved" ? "text-red-600" : "text-gray-600"}`} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              {terminationActionConfirm.action === "approved"
                ? `Approve ${terminationActionConfirm.type === "account" ? "Account" : "Contract"} Termination?`
                : "Reject Termination Request?"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {terminationActionConfirm.action === "approved"
                ? `This will approve the termination request submitted by ${terminationActionConfirm.name}. This action cannot be undone.`
                : `The termination request from ${terminationActionConfirm.name} will be rejected and they will be notified.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTerminationActionConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateTerminationStatus(terminationActionConfirm.id, terminationActionConfirm.action);
                  setTerminationsList(getTerminationRequests());
                  showToast(terminationActionConfirm.action === "approved" ? "Termination request approved." : "Termination request rejected.", terminationActionConfirm.action === "approved" ? "success" : "error");
                  setTerminationActionConfirm(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors text-white ${terminationActionConfirm.action === "approved" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {terminationActionConfirm.action === "approved" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contractApp && (
        <ContractModal
          contract={buildContract(contractApp)}
          onClose={() => setContractApp(null)}
        />
      )}
    </DashboardLayout>
  );
}
