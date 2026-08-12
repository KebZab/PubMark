import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, CheckCircle, XCircle, Clock, Plus, Search,
  Filter, Eye, Paperclip, X, Check, FileText, Map, ClipboardList,
  LayoutDashboard, Camera, Upload, User, ChevronDown, Settings,
  LogOut, Bell, Megaphone,
} from "lucide-react";
import {
  getViolations, saveViolation, updateViolationStatus, addOngoingUpdate,
  type Violation, type ViolationCategory, type ViolationStatus,
} from "../components/violationsStore";
import {
  getCheckRequests, updateCheckRequestStatus, type OfficerCheckRequest, type CompletionFile,
} from "../components/checkRequestsStore";
import { getViolationRequests, completeViolationRequest } from "../components/violationRequestStore";
import { useStalls } from "../hooks/useStalls";
import { getSession, clearSession, type PubMarkSession } from "../components/authStorage";
import { OfficerMapView } from "../components/OfficerMapView";
import { showToast } from "../components/Toast";
import { useNavigate } from "react-router";

const CATEGORIES: ViolationCategory[] = [
  "Illegal Vending", "Health Violation", "Fire Hazard",
  "Unauthorized Expansion", "Noise Violation", "Improper Waste Disposal",
  "Permit Expired", "Other",
];

const STATUS_CONFIG: Record<ViolationStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: "Open", color: "bg-red-100 text-red-700", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const CATEGORY_COLORS: Record<ViolationCategory, string> = {
  "Illegal Vending": "bg-red-100 text-red-700",
  "Health Violation": "bg-orange-100 text-orange-700",
  "Fire Hazard": "bg-red-200 text-red-800",
  "Unauthorized Expansion": "bg-yellow-100 text-yellow-700",
  "Noise Violation": "bg-blue-100 text-blue-700",
  "Improper Waste Disposal": "bg-teal-100 text-teal-700",
  "Permit Expired": "bg-purple-100 text-purple-700",
  "Other": "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

async function loadOfficerCheckRequests(officerId: string, officerName: string): Promise<OfficerCheckRequest[]> {
  const normalizedOfficerName = officerName.trim().toLowerCase();
  const allCheckRequests = await getCheckRequests();
  const allViolationRequests = await getViolationRequests();
  const assignedRequests = allCheckRequests.filter((request) => {
    const assignedName = request.assignedToName?.trim().toLowerCase() ?? "";
    return (
      request.assignedTo === officerId ||
      (!!normalizedOfficerName && assignedName === normalizedOfficerName) ||
      (!request.assignedTo && !request.assignedToName)
    );
  });
  const syncedIds = new Set(assignedRequests.map((request) => request.id));
  const legacyAdminRequests = allViolationRequests
    .filter((request) => {
      const assignedName = request.assignedOfficerName?.trim().toLowerCase() ?? "";
      return (
        request.assignedOfficerId === officerId ||
        (!!normalizedOfficerName && assignedName === normalizedOfficerName) ||
        (!request.assignedOfficerId && !request.assignedOfficerName)
      );
    })
    .filter((request) => !syncedIds.has(request.id))
    .map<OfficerCheckRequest>((request) => ({
      id: request.id,
      stallId: request.stallId,
      stallName: request.stallName,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName,
      assignedTo: request.assignedOfficerId ?? null,
      assignedToName: request.assignedOfficerName ?? null,
      priority: "normal",
      reason: request.reason,
      notes: "",
      status: request.status === "completed" ? "completed" : "pending",
      createdAt: request.createdAt,
      completedAt: request.completedAt,
      completionNotes: "",
      completionSummary: "",
      completionFiles: [],
      requestSource: "violation",
    }));

  return [
    ...assignedRequests.map((request) => ({ ...request, requestSource: "check" as const })),
    ...legacyAdminRequests,
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

type Tab = "dashboard" | "map" | "requests" | "log";

interface EvidenceFile {
  name: string;
  type: "image" | "video" | "document";
  size: string;
}

export function OfficerDashboard() {
  const navigate = useNavigate();
  const { stalls } = useStalls();
  const [session, setSession] = useState<PubMarkSession | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | "all">("all");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [resolveModal, setResolveModal] = useState<{ id: string; action: "resolved" | "dismissed" | "ongoing" } | null>(null);
  const [resolveRemarks, setResolveRemarks] = useState("");
  const [resolveEvidence, setResolveEvidence] = useState<EvidenceFile[]>([]);
  const resolveEvidenceRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLInputElement>(null);

  const [newForm, setNewForm] = useState({
    stallId: "",
    vendorName: "",
    category: "Health Violation" as ViolationCategory,
    description: "",
    remarks: "",
  });
  const [newEvidence, setNewEvidence] = useState<EvidenceFile[]>([]);
  const [checkRequests, setCheckRequests] = useState<OfficerCheckRequest[]>([]);
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [logSubTab, setLogSubTab] = useState<"requests" | "reports">("requests");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [completeModal, setCompleteModal] = useState<string | null>(null);
  const [completeSummary, setCompleteSummary] = useState("");
  const [completeFiles, setCompleteFiles] = useState<CompletionFile[]>([]);
  const completeFileRef = useRef<HTMLInputElement>(null);

  // Report violation from a check request
  const [reqViolationModal, setReqViolationModal] = useState<{ stallId: string; stallName: string } | null>(null);
  const [reqViolationForm, setReqViolationForm] = useState({ category: "Other" as ViolationCategory, description: "" });
  const reqViolEvidenceRef = useRef<HTMLInputElement>(null);
  const [reqViolEvidence, setReqViolEvidence] = useState<EvidenceFile[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "officer") { navigate("/", { replace: true }); return; }
    setSession(s);
  }, [navigate]);

  useEffect(() => {
    const s = getSession();
    void getViolations().then(setViolations).catch((error) => {
      showToast(`Failed to load violations: ${(error as Error).message}`, "error");
    });
    if (s) {
      void loadOfficerCheckRequests(s.userId, s.name)
        .then(setCheckRequests)
        .catch((error) => {
          showToast(`Failed to load check requests: ${(error as Error).message}`, "error");
        });
    }
  }, [activeTab]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = violations.filter((v) => {
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    const matchSearch =
      !search ||
      v.stallName.toLowerCase().includes(search.toLowerCase()) ||
      v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: violations.length,
    open: violations.filter((v) => v.status === "open").length,
    resolved: violations.filter((v) => v.status === "resolved").length,
    dismissed: violations.filter((v) => v.status === "dismissed").length,
  };

  function handleAddEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const added: EvidenceFile[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setNewEvidence((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  async function handleSubmitViolation() {
    if (!newForm.stallId || !newForm.description.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    const stall = stalls.find((s) => s.id === newForm.stallId);
    try {
      await saveViolation({
        stallId: newForm.stallId,
        stallName: stall?.stall_name ?? newForm.stallId,
        vendorName: newForm.vendorName || "Unknown",
        officerId: session!.userId,
        officerName: session!.name,
        category: newForm.category,
        description: newForm.description,
        status: "open",
        evidence: newEvidence,
        remarks: newForm.remarks,
      });
      setViolations(await getViolations());
      setShowNewForm(false);
      setNewForm({ stallId: "", vendorName: "", category: "Health Violation", description: "", remarks: "" });
      setNewEvidence([]);
      showToast("Request recorded.", "success");
    } catch (error) {
      showToast(`Failed to record request: ${(error as Error).message}`, "error");
    }
  }

  function handleAddResolveEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const added: EvidenceFile[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setResolveEvidence((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  async function handleResolve() {
    if (!resolveModal) return;
    try {
      if (resolveModal.action === "ongoing") {
        if (!resolveRemarks.trim() && resolveEvidence.length === 0) {
          showToast("Please add a status note or proof image.", "error");
          return;
        }
        await addOngoingUpdate(resolveModal.id, resolveRemarks, resolveEvidence);
      } else {
        if (resolveEvidence.length === 0) {
          showToast("Please upload at least one proof image.", "error");
          return;
        }
        await updateViolationStatus(resolveModal.id, resolveModal.action, resolveRemarks, resolveEvidence);
      }
      const refreshed = await getViolations();
      setViolations(refreshed);
      if (selectedViolation?.id === resolveModal.id) {
        setSelectedViolation(refreshed.find((v) => v.id === resolveModal.id) ?? null);
      }
      const actionLabel = resolveModal.action === "ongoing" ? "marked as ongoing" : resolveModal.action;
      setResolveModal(null);
      setResolveRemarks("");
      setResolveEvidence([]);
      showToast(`Request ${actionLabel}.`, "success");
    } catch (error) {
      showToast(`Failed to update request: ${(error as Error).message}`, "error");
    }
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setShowDropdown(false);
  };

  return (
    <div className="size-full flex flex-col bg-gray-50 max-w-md mx-auto relative overflow-hidden">
      {/* ── Top Header ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-4 pt-10 pb-3">
          {/* Left — user dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500 leading-none mb-0.5">Officer</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-gray-900 leading-none">{session?.name ?? "..."}</p>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
                </div>
              </div>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-900">{session?.name ?? ""}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{session?.email ?? ""}</p>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  Profile Settings
                </button>
                <button
                  onClick={() => { clearSession(); showToast("You've been logged out.", "success"); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Right — notification bell */}
          <button
            className="relative w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {stats.open > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{stats.open}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── DASHBOARD TAB ─────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="pb-24">
            {/* Hero banner */}
            <div className="mx-4 mt-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg shadow-amber-500/20 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -right-2 w-16 h-16 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-100" />
                  <span className="text-xs font-medium text-amber-100">PubMark Officer Portal</span>
                </div>
                <p className="text-white font-bold text-lg leading-snug">Good day, {session?.name?.split(" ")[0] ?? ""}! 👮</p>
                <p className="text-amber-100 text-xs mt-1">Monitor violations and enforce market regulations.</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="px-4 mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-red-500">{stats.open}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Open</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-emerald-500">{stats.resolved}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Resolved</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-gray-500">{stats.dismissed}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Dismissed</div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="px-4 mt-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Requests by Category</h2>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="space-y-2.5">
                  {CATEGORIES.map((cat) => {
                    const count = violations.filter((v) => v.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full w-44 truncate ${CATEGORY_COLORS[cat]}`}>
                          {cat}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                            style={{ width: `${Math.min(100, (count / violations.length) * 100 * 2)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent requests */}
            <div className="px-4 mt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Recent Check Requests</h2>
                <button
                  onClick={() => switchTab("requests")}
                  className="text-xs text-amber-600 font-medium hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {checkRequests.slice(0, 4).map((r) => {
                  const REQ_STATUS_DASH: Record<string, { label: string; color: string }> = {
                    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
                    completed: { label: "Completed", color: "bg-green-100 text-green-700" },
                    cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
                  };
                  const cfg = REQ_STATUS_DASH[r.status] ?? REQ_STATUS_DASH.pending;
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3 cursor-pointer"
                      onClick={() => switchTab("requests")}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{r.stallName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.reason} · {formatDate(r.createdAt)}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
                {checkRequests.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No check requests assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MAP TAB ──────────────────────────────────── */}
        {activeTab === "map" && (
          <div className="h-full flex flex-col -mt-px">
            <OfficerMapView officerId={session?.userId ?? ""} officerName={session?.name ?? ""} />
          </div>
        )}

        {/* ── REQUESTS TAB ────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="p-4 space-y-4 pb-24">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests…"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <select
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value as typeof reqStatusFilter)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {checkRequests
                .filter((r) => {
                  const matchStatus = reqStatusFilter === "all" || r.status === reqStatusFilter;
                  const matchSearch =
                    !reqSearch ||
                    r.stallName.toLowerCase().includes(reqSearch.toLowerCase()) ||
                    r.requestedByName.toLowerCase().includes(reqSearch.toLowerCase()) ||
                    r.reason.toLowerCase().includes(reqSearch.toLowerCase());
                  return matchStatus && matchSearch;
                })
                .map((r) => {
                  const REQ_STATUS: Record<string, { label: string; color: string }> = {
                    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
                    completed: { label: "Completed", color: "bg-green-100 text-green-700" },
                    cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
                  };
                  const cfg = REQ_STATUS[r.status] ?? REQ_STATUS.pending;
                  const PRIORITY_COLOR: Record<string, string> = {
                    low: "bg-gray-100 text-gray-500",
                    normal: "bg-blue-100 text-blue-600",
                    high: "bg-orange-100 text-orange-600",
                    urgent: "bg-red-100 text-red-600",
                  };
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.stallName}</p>
                          <p className="text-xs text-gray-500">Requested by {r.requestedByName}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[r.priority] ?? PRIORITY_COLOR.normal}`}>
                          {r.priority} priority
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{r.reason}</p>
                      {r.notes && <p className="text-xs text-gray-500"><strong>Notes:</strong> {r.notes}</p>}
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setReqViolationModal({ stallId: r.stallId, stallName: r.stallName });
                              setReqViolationForm({ category: "Other", description: "" });
                              setReqViolEvidence([]);
                            }}
                            className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Report Violation
                          </button>
                          <button
                            onClick={() => { setCompleteModal(r.id); setCompleteSummary(""); setCompleteFiles([]); }}
                            className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                          >
                            Submit Report & Complete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              {checkRequests.filter((r) => {
                const matchStatus = reqStatusFilter === "all" || r.status === reqStatusFilter;
                const matchSearch =
                  !reqSearch ||
                  r.stallName.toLowerCase().includes(reqSearch.toLowerCase()) ||
                  r.requestedByName.toLowerCase().includes(reqSearch.toLowerCase()) ||
                  r.reason.toLowerCase().includes(reqSearch.toLowerCase());
                return matchStatus && matchSearch;
              }).length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-900 mb-1">No check requests</p>
                  <p className="text-sm text-gray-500">Admin-assigned requests will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG TAB ────────────────────────────── */}
        {activeTab === "log" && (
          <div className="pb-24">
            {/* Sub-tab pills */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setLogSubTab("requests")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${logSubTab === "requests" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500"}`}
                >
                  Requests ({checkRequests.length})
                </button>
                <button
                  onClick={() => setLogSubTab("reports")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${logSubTab === "reports" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500"}`}
                >
                  Reports ({violations.length})
                </button>
              </div>
            </div>

            {/* ── Requests sub-tab ── */}
            {logSubTab === "requests" && (
              <div className="px-4 space-y-2.5">
                {checkRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No check requests</p>
                    <p className="text-xs text-gray-500">Admin-assigned requests will appear here</p>
                  </div>
                ) : (
                  checkRequests.map((r) => {
                    const REQ_STATUS: Record<string, { label: string; color: string }> = {
                      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
                      completed: { label: "Completed", color: "bg-green-100 text-green-700" },
                      cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
                    };
                    const cfg = REQ_STATUS[r.status] ?? REQ_STATUS.pending;
                    const PRIORITY_COLOR: Record<string, string> = {
                      low: "bg-gray-100 text-gray-500",
                      normal: "bg-blue-100 text-blue-600",
                      high: "bg-orange-100 text-orange-600",
                      urgent: "bg-red-100 text-red-600",
                    };
                    return (
                      <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{r.stallName}</p>
                            <p className="text-xs text-gray-500">Requested by {r.requestedByName}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[r.priority] ?? PRIORITY_COLOR.normal}`}>
                            {r.priority} priority
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{r.reason}</p>
                        {r.notes && <p className="text-xs text-gray-500"><strong>Notes:</strong> {r.notes}</p>}
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setReqViolationModal({ stallId: r.stallId, stallName: r.stallName }); setReqViolationForm({ category: "Other", description: "" }); setReqViolEvidence([]); }}
                              className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Report Violation
                            </button>
                            <button
                              onClick={() => { setCompleteModal(r.id); setCompleteSummary(""); setCompleteFiles([]); }}
                              className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                            >
                              Submit Report & Complete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Reports sub-tab ── */}
            {logSubTab === "reports" && (
              <div className="px-4 space-y-2.5">
                {violations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No reports yet</p>
                    <p className="text-xs text-gray-500">Violation reports you file will appear here</p>
                  </div>
                ) : (
                  violations.slice().reverse().map((v) => {
                    const cfg = STATUS_CONFIG[v.status];
                    const StatusIcon = cfg.icon;
                    const isExpanded = expandedReport === v.id;
                    return (
                      <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Header row — tap to expand */}
                        <button
                          className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedReport(isExpanded ? null : v.id)}
                        >
                          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-900 truncate">{v.stallName}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{v.category} · {formatDate(v.createdAt)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{v.description}</p>
                          </div>
                          <span className="text-gray-300 text-xs flex-shrink-0 mt-1">{isExpanded ? "▲" : "▼"}</span>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 bg-gray-50">
                            {/* Vendor + Officer */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Vendor</p>
                                <p className="font-medium text-gray-800">{v.vendorName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Officer</p>
                                <p className="font-medium text-gray-800">{v.officerName}</p>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-xs text-gray-700 leading-relaxed">{v.description}</p>
                            </div>

                            {/* Remarks */}
                            {v.remarks && (
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Remarks</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{v.remarks}</p>
                              </div>
                            )}

                            {/* Evidence / Images */}
                            {v.evidence.length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                  Evidence ({v.evidence.length})
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {v.evidence.map((ev, idx) => (
                                    <div
                                      key={idx}
                                      className={`rounded-xl overflow-hidden border ${ev.type === "image" ? "border-amber-200" : ev.type === "video" ? "border-blue-200" : "border-gray-200"}`}
                                    >
                                      {ev.type === "image" ? (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <Camera className="w-6 h-6 text-amber-400" />
                                          <span className="text-[9px] font-medium text-amber-600">Photo</span>
                                        </div>
                                      ) : ev.type === "video" ? (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-20 flex flex-col items-center justify-center gap-1">
                                          <FileText className="w-6 h-6 text-blue-400" />
                                          <span className="text-[9px] font-medium text-blue-600">Video</span>
                                        </div>
                                      ) : (
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-20 flex flex-col items-center justify-center gap-1">
                                          <Paperclip className="w-6 h-6 text-gray-400" />
                                          <span className="text-[9px] font-medium text-gray-500">Document</span>
                                        </div>
                                      )}
                                      <div className="bg-white px-2 py-1.5">
                                        <p className="text-[9px] text-gray-700 font-medium truncate">{ev.name}</p>
                                        <p className="text-[9px] text-gray-400">{ev.size}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {v.evidence.length === 0 && (
                              <p className="text-[10px] text-gray-400 italic">No evidence attached</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Nav Bar ──────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex pb-safe">
          <button
            onClick={() => switchTab("dashboard")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "dashboard" ? "text-amber-500" : "text-gray-400"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => switchTab("map")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "map" ? "text-amber-500" : "text-gray-400"
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] font-medium">Map</span>
          </button>
          <button
            onClick={() => switchTab("requests")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
              activeTab === "requests" ? "text-amber-500" : "text-gray-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            {stats.open > 0 && (
              <span className="absolute top-2.5 right-[calc(50%-10px)] w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{stats.open}</span>
              </span>
            )}
            <span className="text-[10px] font-medium">Requests</span>
          </button>
          <button
            onClick={() => switchTab("log")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "log" ? "text-amber-500" : "text-gray-400"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Log</span>
          </button>
        </div>
      </div>

      {/* ── Report Violation from Check Request Modal ──── */}
      {reqViolationModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-semibold">Report Violation</h2>
              </div>
              <button
                onClick={() => setReqViolationModal(null)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">Reporting stall:</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{reqViolationModal.stallName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Violation Category</label>
                <select
                  value={reqViolationForm.category}
                  onChange={(e) => setReqViolationForm((p) => ({ ...p, category: e.target.value as ViolationCategory }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={reqViolationForm.description}
                  onChange={(e) => setReqViolationForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the violation in detail..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div>
                <input type="file" ref={reqViolEvidenceRef} multiple accept="image/*,video/*,.pdf" className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    const added: EvidenceFile[] = Array.from(files).map((f) => ({
                      name: f.name,
                      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
                      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                    }));
                    setReqViolEvidence((p) => [...p, ...added]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => reqViolEvidenceRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-red-200 rounded-xl text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Attach Evidence (optional)
                </button>
                {reqViolEvidence.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {reqViolEvidence.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                        <button onClick={() => setReqViolEvidence((p) => p.filter((_, j) => j !== i))}>
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setReqViolationModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!reqViolationForm.description.trim()) {
                    showToast("Please describe the violation.", "error");
                    return;
                  }
                  try {
                    await saveViolation({
                      stallId: reqViolationModal.stallId,
                      stallName: reqViolationModal.stallName,
                      vendorName: "Unknown",
                      officerId: session!.userId,
                      officerName: session!.name,
                      category: reqViolationForm.category,
                      description: reqViolationForm.description,
                      status: "open",
                      evidence: reqViolEvidence,
                      remarks: "",
                    });
                    setViolations(await getViolations());
                    setReqViolationModal(null);
                    setReqViolationForm({ category: "Other", description: "" });
                    setReqViolEvidence([]);
                    showToast("Violation reported successfully.", "success");
                  } catch (error) {
                    showToast(`Failed to report violation: ${(error as Error).message}`, "error");
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Violation Form Modal ──────────────────── */}
      {showNewForm && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Report Request</h2>
              <button
                onClick={() => setShowNewForm(false)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Stall *</label>
                <select
                  value={newForm.stallId}
                  onChange={(e) => setNewForm((p) => ({ ...p, stallId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select stall</option>
                  {stalls.map((s) => (
                    <option key={s.id} value={s.id}>{s.stall_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Vendor Name</label>
                <input
                  type="text"
                  value={newForm.vendorName}
                  onChange={(e) => setNewForm((p) => ({ ...p, vendorName: e.target.value }))}
                  placeholder="Name of vendor"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={newForm.category}
                  onChange={(e) => setNewForm((p) => ({ ...p, category: e.target.value as ViolationCategory }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  value={newForm.description}
                  onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the request…"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Evidence</label>
                <input
                  type="file"
                  ref={evidenceRef}
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleAddEvidence}
                />
                <button
                  type="button"
                  onClick={() => evidenceRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photos/Videos
                </button>
                {newEvidence.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {newEvidence.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                        <button onClick={() => setNewEvidence((p) => p.filter((_, j) => j !== i))}>
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitViolation}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Modal ──────────────────────────────── */}
      {resolveModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {resolveModal.action === "resolved"
                ? "Mark as Resolved"
                : resolveModal.action === "ongoing"
                ? "Mark as Still Ongoing"
                : "Dismiss Request"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {resolveModal.action === "ongoing"
                ? "Provide a status update and proof image."
                : "Upload a proof image to confirm the status."}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {resolveModal.action === "ongoing" ? "Status Note" : "Remarks"}
              </label>
              <textarea
                rows={3}
                value={resolveRemarks}
                onChange={(e) => setResolveRemarks(e.target.value)}
                placeholder={resolveModal.action === "ongoing" ? "What's the current situation?" : "Add any notes…"}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Proof Image {resolveModal.action !== "ongoing" && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                ref={resolveEvidenceRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleAddResolveEvidence}
              />
              <button
                type="button"
                onClick={() => resolveEvidenceRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Upload Proof Image
              </button>
              {resolveEvidence.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {resolveEvidence.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                      <button onClick={() => setResolveEvidence((p) => p.filter((_, j) => j !== i))}>
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResolveModal(null); setResolveRemarks(""); setResolveEvidence([]); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  resolveModal.action === "resolved"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : resolveModal.action === "ongoing"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                Submit Status
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Complete Request Modal ──────────────────────────── */}
      {completeModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Submit Completion Report</h3>
            <p className="text-xs text-gray-500 mb-4">Provide a summary and attach photo evidence before completing this request.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Summary Report <span className="text-red-500">*</span></label>
                <textarea
                  value={completeSummary}
                  onChange={(e) => setCompleteSummary(e.target.value)}
                  rows={4}
                  placeholder="Describe what you found and the actions taken…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Photo Evidence <span className="text-red-500">*</span></label>
                <input
                  ref={completeFileRef}
                  type="file"
                  accept="image/*,video/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    const added: CompletionFile[] = Array.from(files).map((f) => ({
                      name: f.name,
                      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
                      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                    }));
                    setCompleteFiles((prev) => [...prev, ...added]);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => completeFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Attach Photo / File
                </button>
                {completeFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {completeFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                        <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="text-[9px] text-gray-400">{f.size}</span>
                        <button onClick={() => setCompleteFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setCompleteModal(null); setCompleteSummary(""); setCompleteFiles([]); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!completeSummary.trim()) { showToast("Please provide a summary report.", "error"); return; }
                  if (completeFiles.length === 0) { showToast("Please attach at least one photo.", "error"); return; }
                  try {
                    const activeRequest = checkRequests.find((request) => request.id === completeModal);
                    if (!activeRequest) {
                      showToast("Request not found.", "error");
                      return;
                    }
                    await updateCheckRequestStatus(completeModal, "completed", "", completeSummary.trim(), completeFiles);
                    if (activeRequest.requestSource === "violation") {
                      await completeViolationRequest(completeModal);
                    }
                    const s = getSession();
                    if (s) {
                      setCheckRequests(await loadOfficerCheckRequests(s.userId, s.name));
                    }
                    setCompleteModal(null);
                    setCompleteSummary("");
                    setCompleteFiles([]);
                    showToast("Request completed and report submitted.", "success");
                  } catch (error) {
                    showToast(`Failed to complete request: ${(error as Error).message}`, "error");
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                Submit & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
