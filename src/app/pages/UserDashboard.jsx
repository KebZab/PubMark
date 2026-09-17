import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  MapPin,
  Bell,
  Megaphone,
  AlertTriangle,
  Info,
  PartyPopper,
  ChevronRight,
  User,
  Store,
  LogOut,
  Settings,
  LayoutDashboard,
  TrendingUp,
  ChevronDown,
  Sparkles,
  ArrowRightLeft,
  X,
  Mail,
  Layers,
  ShieldOff,
  FileX,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { useNotices } from "../hooks/useNotices";
import { useNoticesBadge } from "../hooks/useNoticesBadge";
import { useMapFacilities } from "../hooks/useMapFacilities";
import { MapFacilitiesLayer, stallFloaterHtml } from "../components/MapFacilitiesLayer";
import { registerMapFloater } from "../components/mapFloaterDeclutter";
import { useAuth } from "../context/AuthContext";

import { showToast } from "../components/Toast";

import {
  getTransfersByToEmail,
  getTransfersByFromUserId,
  createTransferRequest,
  updateTransferStatus,
} from "../services/transfersApi";
import { saveTerminationRequest } from "../components/terminationRequestsStore";
import {
  formatPermitDeadline,
  getContractEndStatus,
  getApplicationDisplayStatus,
  parsePermitDeadlineMeta,
} from "../components/permitDeadline";

function getVendorStatusLabel(status) {
  return status === "terminated" ? "Terminated" : status.charAt(0).toUpperCase() + status.slice(1);
}

function getActiveApp(stallId, applications) {
  return (
    applications
      .filter((a) => a.stallId === stallId && (a.status === "pending" || a.status === "approved"))
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0] ??
    null
  );
}

function MiniDrawnStallsLayer({ stalls, applications }) {
  const map = useMap();
  useEffect(() => {
    const layers = [];
    const unregister = [];
    stalls.forEach((stall) => {
      const app = getActiveApp(stall.id, applications);
      const color =
        app?.status === "approved" ? "#6366f1" : app?.status === "pending" ? "#f59e0b" : "#14B8A6";
      const layer = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        { style: { color, weight: 1.5, opacity: 0.9, fillColor: color, fillOpacity: 0.25 } },
      );
      layer.bindTooltip(stallFloaterHtml(stall.stall_name, color), {
        permanent: true,
        direction: "center",
        className: "vendor-stall-floater",
        opacity: 0.95,
      });
      layer.addTo(map);
      unregister.push(registerMapFloater(map, layer));
      layers.push(layer);
    });
    return () => {
      unregister.forEach((remove) => remove());
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [stalls, applications, map]);
  return null;
}

function formatRelativeTime(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const typeConfig = {
  info: {
    icon: Info,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "Notice",
  },
  urgent: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Urgent",
  },
  success: {
    icon: PartyPopper,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Update",
  },
};

function MapTabContent({ navigate }) {
  const { stalls: storedStalls, loading: stallsLoading } = useStalls();
  const { applications } = useApplications();
  const [activeFloor, setActiveFloor] = useState("1");
  const { facilities } = useMapFacilities(activeFloor);

  const floorStalls = storedStalls.filter((s) => s.floor === activeFloor);
  const floorCounts = {
    1: storedStalls.filter((s) => s.floor === "1").length,
    2: storedStalls.filter((s) => s.floor === "2").length,
  };

  const vacantCount = floorStalls.filter((s) => !getActiveApp(s.id, applications)).length;
  const pendingCount = floorStalls.filter(
    (s) => getActiveApp(s.id, applications)?.status === "pending",
  ).length;
  const occupiedCount = floorStalls.filter(
    (s) => getActiveApp(s.id, applications)?.status === "approved",
  ).length;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Title row + floor switcher inline */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-700">Stall Map</h2>
              <p className="text-[10px] text-gray-400">
                {vacantCount} vacant · {pendingCount} pending · {occupiedCount} occupied
              </p>
            </div>
          </div>
          {/* Compact floor pill */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5">
            {["1", "2"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFloor(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFloor === f
                    ? "bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}F
                <span
                  className={`ml-1 text-[10px] ${activeFloor === f ? "text-teal-100" : "text-gray-400"}`}
                >
                  {floorCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend row */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2.5 rounded border border-[#14B8A6] bg-[#14B8A6]/25" />
            <span className="text-[10px] text-gray-500">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2.5 rounded border border-amber-400 bg-amber-400/25" />
            <span className="text-[10px] text-gray-500">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2.5 rounded border border-indigo-500 bg-indigo-500/25" />
            <span className="text-[10px] text-gray-500">Occupied</span>
          </div>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <MapContainer
          key={activeFloor}
          center={[10.6054, 123.0413]}
          zoom={18}
          maxZoom={22}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            maxNativeZoom={19}
            maxZoom={22}
          />
          <MiniDrawnStallsLayer stalls={floorStalls} applications={applications} />
          <MapFacilitiesLayer facilities={facilities} />
        </MapContainer>

        {stallsLoading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              <p className="text-[11px] font-medium text-gray-600">Loading stalls…</p>
            </div>
          </div>
        )}

        {!stallsLoading && storedStalls.length === 0 && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow border border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-600">No stalls mapped yet</p>
            </div>
          </div>
        )}

        {storedStalls.length > 0 && floorStalls.length === 0 && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow border border-gray-100 text-center">
              <Layers className="w-5 h-5 text-gray-300 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-600">
                No stalls on {activeFloor === "1" ? "1st" : "2nd"} Floor
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard/map")}
          className="absolute bottom-4 right-4 z-[1000] px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-xs font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5"
        >
          <Store className="w-3.5 h-3.5" />
          Open Full Map
        </button>
      </div>
    </div>
  );
}

export function UserDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const session = profile ? { ...profile, userId: profile.id } : null;
  const [activeTab, setActiveTab] = useState("home");
  const {
    notices: announcements,
    loading: announcementsLoading,
    error: announcementsError,
    refetch: refetchAnnouncements,
  } = useNotices();
  const { unreadCount: unreadAnnouncements, markSeen: markNoticesSeen } = useNoticesBadge();
  const { applications } = useApplications();
  useStalls();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [appSortField, setAppSortField] = useState("date");
  const [appSortAsc, setAppSortAsc] = useState(false);
  const [appFilter, setAppFilter] = useState("all");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [terminateAccountConfirm, setTerminateAccountConfirm] = useState(false);
  const [contractActionModal, setContractActionModal] = useState(null);
  const [terminateContractModal, setTerminateContractModal] = useState(null);
  const [terminateReason, setTerminateReason] = useState("");

  // Transfer states
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [transferModal, setTransferModal] = useState(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    // Transfers come from the API now, so both lists load asynchronously.
    (async () => {
      try {
        const [incoming, outgoing] = await Promise.all([
          getTransfersByToEmail(session.email),
          getTransfersByFromUserId(session.userId),
        ]);
        if (cancelled) return;
        setIncomingTransfers(incoming);
        setOutgoingTransfers(outgoing);
      } catch {
        if (cancelled) return;
        setIncomingTransfers([]);
        setOutgoingTransfers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, session?.email, session?.userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userApplications = session ? applications.filter((a) => a.userId === session.userId) : [];
  const filteredUserApplications = userApplications.filter((application) =>
    appFilter === "all" ? true : getApplicationDisplayStatus(application) === appFilter,
  );
  const pendingIncomingTransfers = incomingTransfers.filter((t) => t.status === "pending");
  const transferHistory = [...incomingTransfers.filter((t) => t.status !== "pending"), ...outgoingTransfers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: userApplications.length,
    pending: userApplications.filter((a) => a.status === "pending").length,
    approved: userApplications.filter((a) => a.status === "approved").length,
    rejected: userApplications.filter((a) => a.status === "rejected").length,
  };

  const seenDecisions = (() => {
    try {
      return JSON.parse(localStorage.getItem("pubmark_seen_decisions") ?? "[]");
    } catch {
      return [];
    }
  })();
  const unreadDecisions = userApplications.filter(
    (a) => a.status !== "pending" && !seenDecisions.includes(a.id),
  ).length;

  const pendingPermitUploads = userApplications.filter(
    (a) => a.status === "approved" && !a.permitFileName,
  ).length;
  const totalBadge =
    unreadDecisions + unreadAnnouncements + pendingIncomingTransfers.length + pendingPermitUploads;

  const switchTab = (tab) => {
    setActiveTab(tab);
    setShowDropdown(false);
    if (tab === "announcements") {
      void refetchAnnouncements();
      void markNoticesSeen().catch(() => {
        showToast("Notices opened, but the read status could not be saved.", "error");
      });
    }
  };

  const vendorHeader = {
    applications: { title: "My Applications", subtitle: `${stats.total} total` },
    transfers: {
      title: "Transfers",
      subtitle: pendingIncomingTransfers.length > 0
        ? `${pendingIncomingTransfers.length} offer(s) awaiting your decision`
        : "Stall handovers",
    },
    announcements: { title: "Notices", subtitle: "Announcements and private vendor notices" },
    map: { title: "Market Map", subtitle: "Browse available stalls" },
  }[activeTab];

  function sortApplications(apps) {
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

  function handleAppSort(field) {
    if (appSortField === field) {
      setAppSortAsc(!appSortAsc);
    } else {
      setAppSortField(field);
      setAppSortAsc(true);
    }
  }

  function handleInitiateTransfer(app) {
    setTransferModal(app);
    setTransferEmail("");
    setTransferError("");
    setContractActionModal(null);
  }

  async function handleTransferSubmit() {
    if (!session || !transferModal) return;
    const email = transferEmail.trim().toLowerCase();
    if (!email) {
      setTransferError("Please enter an email address.");
      return;
    }
    if (email === session.email.toLowerCase()) {
      setTransferError("You cannot transfer to yourself.");
      return;
    }

    setTransferSubmitting(true);
    try {
      // The server resolves the recipient, verifies you hold this stall, and
      // rejects a duplicate pending offer — so only the essentials go up.
      const transfer = await createTransferRequest({
        stallId: transferModal.stallId,
        toUserEmail: email,
        originalApplicationId: transferModal.id,
      });

      setTransferModal(null);
      setTransferEmail("");
      showToast(`Transfer offer sent to ${transfer.toUserName}!`, "success");
      setOutgoingTransfers((prev) => [transfer, ...prev]);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "Failed to find the account.");
    } finally {
      setTransferSubmitting(false);
    }
  }

  async function handleDeclineTransfer(transferId) {
    try {
      await updateTransferStatus(transferId, "declined");
      setIncomingTransfers((prev) =>
        prev.map((transfer) =>
          transfer.id === transferId
            ? { ...transfer, status: "declined", respondedAt: new Date().toISOString() }
            : transfer,
        ),
      );
      showToast("Transfer offer declined.", "success");
    } catch (error) {
      // Don't drop it from the list if the server rejected the change.
      showToast(`Failed to decline: ${error.message}`, "error");
    }
  }

  async function handleAcceptTransfer(transferId) {
    try {
      await updateTransferStatus(transferId, "accepted");
      setIncomingTransfers((prev) =>
        prev.map((transfer) =>
          transfer.id === transferId
            ? { ...transfer, status: "accepted", respondedAt: new Date().toISOString() }
            : transfer,
        ),
      );
      showToast("Transfer accepted. You can apply for the stall from the Map tab.", "success");
    } catch (error) {
      showToast(`Failed to accept: ${error.message}`, "error");
    }
  }

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
              <div className="w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500 leading-none mb-0.5">
                  {activeTab === "home" ? "Welcome back" : vendorHeader?.subtitle}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-gray-900 leading-none">
                    {activeTab === "home" ? (session?.name ?? "...") : vendorHeader?.title}
                  </p>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                  />
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
                  onClick={() => {
                    setShowDropdown(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </div>
                  Profile Settings
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    showToast("You've been logged out.", "success");
                    navigate("/");
                  }}
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

          {totalBadge > 0 && activeTab === "home" && (
            <button
              onClick={() => switchTab("announcements")}
              className="relative w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Open notices"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{totalBadge}</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* ── HOME TAB ─────────────────────────────────── */}
        {activeTab === "home" && (
          <div className="pb-24">
            {/* Hero banner */}
            <div className="mx-4 mt-4 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] rounded-2xl p-5 shadow-lg shadow-teal-500/20 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -right-2 w-16 h-16 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-100" />
                  <span className="text-xs font-medium text-teal-100">
                    PubMark — Smart Public Market
                  </span>
                </div>
                <p className="text-white font-bold text-lg leading-snug">
                  Good day, {session?.name?.split(" ")[0] ?? ""}!
                </p>
                <p className="text-teal-100 text-xs mt-1">
                  Here's a summary of your stall activity.
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="px-4 mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-amber-500">{stats.pending}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Pending</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-emerald-500">{stats.approved}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Approved</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-red-500">{stats.rejected}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Rejected</div>
              </div>
            </div>

            {/* Incoming Transfer Offers */}
            {pendingIncomingTransfers.length > 0 && (
              <div className="hidden px-4 mt-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">Ownership Transfer Offers</h2>
                  <span className="ml-auto flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">
                      {pendingIncomingTransfers.length}
                    </span>
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingIncomingTransfers.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {t.stallName}
                          </p>
                          <p className="text-xs text-gray-500">
                            From {t.fromUserName} · Section {t.stallSection}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Offer
                        </span>
                      </div>
                      <div className="px-4 py-3 text-xs text-gray-500">
                        {t.fromUserName} wants to transfer ownership of{" "}
                        <strong>{t.stallName}</strong> to you. To accept, you'll fill out a stall
                        application form.
                      </div>
                      <div className="px-4 pb-3 flex gap-2">
                        <button
                          onClick={() => handleDeclineTransfer(t.id)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => navigate(`/transfer-accept/${t.id}`)}
                          className="flex-[2] py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-xs font-semibold shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept &amp; Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="px-4 mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/dashboard/map")}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-[#14B8A6]/40 transition-all"
              >
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-4.5 h-4.5 text-[#14B8A6]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800">Browse Stalls</p>
                  <p className="text-[10px] text-gray-400">Find available</p>
                </div>
              </button>
              <button
                onClick={() => switchTab("applications")}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-[#14B8A6]/40 transition-all"
              >
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4.5 h-4.5 text-[#14B8A6]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800">My Applications</p>
                  <p className="text-[10px] text-gray-400">{stats.total} total</p>
                </div>
              </button>
            </div>

            {/* Recent Notices */}
            <div className="px-4 mt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#14B8A6]" />
                  <h2 className="text-sm font-semibold text-gray-800">Recent Notices</h2>
                </div>
                <button
                  onClick={() => switchTab("announcements")}
                  className="flex items-center gap-1 text-xs text-[#14B8A6] font-medium"
                >
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {announcements.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <Bell className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">No notices yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {announcements.slice(0, 2).map((item) => {
                    const cfg = typeConfig[item.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                      >
                        <div className={`${cfg.bg} px-4 py-2.5 flex items-center gap-3`}>
                          <div className="w-7 h-7 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {formatRelativeTime(item.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="px-4 py-2.5">
                          {item.message ? (
                            <p className="text-xs text-gray-500 line-clamp-2">{item.message}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {announcements.length > 2 && (
                    <button
                      onClick={() => switchTab("announcements")}
                      className="w-full py-2 text-xs text-[#14B8A6] font-medium bg-teal-50/60 rounded-xl border border-teal-100 hover:bg-teal-50 transition-colors"
                    >
                      +{announcements.length - 2} more notices
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Permit upload nudge on home tab */}
            {applications.filter((a) => a.status === "approved" && !a.permitFileName).length >
              0 && (
              <div className="px-4 mt-4">
                <button
                  onClick={() => switchTab("applications")}
                  className="w-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-amber-900">
                      Action required — upload permit
                    </p>
                    <p className="text-[10px] text-amber-700">
                      Your approved stall needs a business permit on file.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Recent Applications */}
            <div className="px-4 mt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#14B8A6]" />
                  <h2 className="text-sm font-semibold text-gray-800">Recent Applications</h2>
                </div>
                <button
                  onClick={() => switchTab("applications")}
                  className="flex items-center gap-1 text-xs text-[#14B8A6] font-medium"
                >
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5">
                {applications
                  .sort(
                    (a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime(),
                  )
                  .slice(0, 3)
                  .map((app) => {
                    const displayStatus = getApplicationDisplayStatus(app);
                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3"
                      >
                        <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-[#14B8A6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {app.stallName}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Applied{" "}
                            {new Date(app.dateApplied).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            displayStatus === "pending"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              : displayStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : displayStatus === "terminated"
                                  ? "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20"
                                  : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                          }`}
                        >
                          {displayStatus === "pending" && <Clock className="w-2.5 h-2.5" />}
                          {displayStatus === "approved" && <CheckCircle className="w-2.5 h-2.5" />}
                          {(displayStatus === "rejected" || displayStatus === "terminated") && (
                            <XCircle className="w-2.5 h-2.5" />
                          )}
                          {getVendorStatusLabel(displayStatus)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── APPLICATIONS TAB ─────────────────────────── */}
        {activeTab === "applications" && (
          <div className="p-4 space-y-4 pb-24">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-amber-500">{stats.pending}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Pending</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-emerald-500">{stats.approved}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Approved</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-red-500">{stats.rejected}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Rejected</div>
              </div>
            </div>

            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {["all", "pending", "approved", "rejected"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAppFilter(filter)}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition-colors ${
                    appFilter === filter ? "bg-white text-[#0d9488] shadow-sm" : "text-gray-500"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Permit upload alert for approved apps missing a permit */}
            {applications
              .filter((a) => a.status === "approved" && !a.permitFileName)
              .map((a) => (
                <div
                  key={`permit-alert-${a.id}`}
                  className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Upload className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">Business permit required</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-snug">
                      Your application for <strong>{a.stallName}</strong> was approved. Please
                      upload your business permit to complete your records.
                    </p>
                    <button
                      onClick={() => navigate(`/applications/${a.id}`)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline underline-offset-2"
                    >
                      <Upload className="w-3 h-3" />
                      Upload permit now →
                    </button>
                  </div>
                </div>
              ))}

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Application History</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-gray-500">Sort:</span>
                  <button
                    onClick={() => handleAppSort("date")}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${appSortField === "date" ? "bg-[#14B8A6] text-white" : "text-gray-600"}`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => handleAppSort("stall")}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${appSortField === "stall" ? "bg-[#14B8A6] text-white" : "text-gray-600"}`}
                  >
                    Stall
                  </button>
                  <button
                    onClick={() => handleAppSort("status")}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${appSortField === "status" ? "bg-[#14B8A6] text-white" : "text-gray-600"}`}
                  >
                    Status
                  </button>
                </div>
                <span className="text-xs text-gray-400">{userApplications.length} total</span>
              </div>
            </div>

            {filteredUserApplications.length > 0 ? (
              <div className="space-y-3">
                {sortApplications(filteredUserApplications).map((app) => {
                  const outgoing = outgoingTransfers.find(
                    (t) => t.originalApplicationId === app.id && t.status === "pending",
                  );
                  const displayStatus = getApplicationDisplayStatus(app);
                  const permitMeta = parsePermitDeadlineMeta(app.adminRemarks);
                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#14B8A6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {app.stallName}
                            </p>
                            <span
                              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                displayStatus === "pending"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                  : displayStatus === "approved"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : displayStatus === "terminated"
                                      ? "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20"
                                      : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                              }`}
                            >
                              {displayStatus === "pending" && <Clock className="w-3 h-3" />}
                              {displayStatus === "approved" && <CheckCircle className="w-3 h-3" />}
                              {(displayStatus === "rejected" || displayStatus === "terminated") && (
                                <XCircle className="w-3 h-3" />
                              )}
                              {getVendorStatusLabel(displayStatus)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Applied{" "}
                            {new Date(app.dateApplied).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {displayStatus === "approved" &&
                            !app.permitFileName &&
                            permitMeta.permitDeadlineAt && (
                              <p className="text-[10px] text-amber-700 mt-1">
                                Permit due {formatPermitDeadline(permitMeta.permitDeadlineAt)}
                              </p>
                            )}
                          {displayStatus === "approved" &&
                            (() => {
                              const contractStatus = getContractEndStatus(app.contractEnd);
                              if (contractStatus.urgency === "none") return null;
                              const text =
                                contractStatus.urgency === "expired"
                                  ? "Contract term has ended"
                                  : `Contract ends in ${contractStatus.daysRemaining} day${contractStatus.daysRemaining === 1 ? "" : "s"}`;
                              const colorClass =
                                contractStatus.urgency === "notice"
                                  ? "text-amber-700"
                                  : "text-red-700";
                              return <p className={`text-[10px] ${colorClass} mt-1`}>{text}</p>;
                            })()}
                          {outgoing && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-purple-600">
                              <ArrowRightLeft className="w-3 h-3" />
                              Transfer pending · To {outgoing.toUserName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        {app.status === "approved" && !app.permitFileName && !outgoing && (
                          <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-400 text-white rounded-lg text-xs font-medium hover:bg-amber-500 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload Permit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">
                  {appFilter === "all" ? "No applications yet" : `No ${appFilter} applications`}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {appFilter === "all" ? "Start by exploring available stalls" : "Try another status filter"}
                </p>
                <button
                  onClick={() => navigate("/dashboard/map")}
                  className="px-6 py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform"
                >
                  Browse Stalls
                </button>
              </div>
            )}
          </div>
        )}

        {/* Web mirrors Expo's dedicated Transfers tab. */}
        {activeTab === "transfers" && (
          <div className="p-4 pb-24">
            {pendingIncomingTransfers.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Awaiting your decision</h3>
                <div className="space-y-3">
                  {pendingIncomingTransfers.map((transfer) => (
                    <div key={transfer.id} className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
                      <div className="bg-teal-50 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{transfer.stallName}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          From {transfer.fromUserName} · Section {transfer.stallSection}
                        </p>
                      </div>
                      <p className="px-4 py-3 text-xs leading-5 text-gray-600">
                        {transfer.fromUserName} wants to hand {transfer.stallName} over to you.
                      </p>
                      <div className="flex gap-2 px-4 pb-4">
                        <button
                          onClick={() => handleDeclineTransfer(transfer.id)}
                          className="flex-1 rounded-xl bg-gray-100 py-3 text-xs font-semibold text-gray-700"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptTransfer(transfer.id)}
                          className="flex-[2] rounded-xl bg-[#14B8A6] py-3 text-xs font-semibold text-white"
                        >
                          Accept stall
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {transferHistory.length > 0 && (
              <section className={pendingIncomingTransfers.length > 0 ? "mt-7" : ""}>
                <h3 className="mb-3 text-sm font-semibold text-gray-800">History</h3>
                <div className="space-y-3">
                  {transferHistory.map((transfer) => {
                    const sentByMe = transfer.fromUserId === session?.userId;
                    const statusStyle = {
                      pending: "bg-amber-100 text-amber-700",
                      accepted: "bg-emerald-100 text-emerald-700",
                      declined: "bg-gray-200 text-gray-600",
                    }[transfer.status] ?? "bg-gray-100 text-gray-600";
                    return (
                      <div key={transfer.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{transfer.stallName}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {sentByMe ? `To ${transfer.toUserName}` : `From ${transfer.fromUserName}`}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusStyle}`}>
                            {transfer.status}
                          </span>
                        </div>
                        <p className="mt-3 text-[11px] text-gray-400">
                          Sent {new Date(transfer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {pendingIncomingTransfers.length === 0 && transferHistory.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
                <ArrowRightLeft className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-semibold text-gray-700">No transfers</p>
                <p className="mt-1.5 text-xs text-gray-400">Stall handover offers will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ────────────────────────── */}
        {activeTab === "announcements" && (
          <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Notices</h2>
                <p className="text-xs text-gray-400">{announcements.length} notices</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-sm">
                <Megaphone className="w-4 h-4 text-white" />
              </div>
            </div>

            {announcementsLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-teal-500" />
                <p className="text-sm text-gray-400">Loading notices…</p>
              </div>
            ) : announcementsError ? (
              <div className="rounded-2xl border border-red-100 bg-white px-5 py-12 text-center shadow-sm">
                <Bell className="mx-auto mb-3 h-8 w-8 text-red-300" />
                <p className="text-sm font-semibold text-gray-700">Could not load notices</p>
                <p className="mt-1.5 text-xs text-gray-400">{announcementsError}</p>
                <button
                  type="button"
                  onClick={() => void refetchAnnouncements()}
                  className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">No notices yet</p>
                <p className="text-sm text-gray-500">Announcements and private notices will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => {
                  const cfg = typeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className={`${cfg.bg} px-4 py-3 flex items-center gap-3`}>
                        <div className="w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {formatRelativeTime(item.createdAt)} · by {item.author}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {item.message ? (
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-600 leading-relaxed">{item.message}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MAP TAB ──────────────────────────────────── */}
        {activeTab === "map" && <MapTabContent navigate={navigate} />}
      </div>

      {/* ── Bottom Nav Bar ──────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex pb-safe">
          {[
            { id: "home", label: "Home", Icon: LayoutDashboard },
            { id: "applications", label: "Applications", Icon: FileText },
            { id: "transfers", label: "Transfers", Icon: ArrowRightLeft },
            { id: "announcements", label: "Notices", Icon: Bell },
            { id: "map", label: "Map", Icon: MapPin },
          ].map(({ id, label, Icon }) => {
            const badge = id === "transfers" ? pendingIncomingTransfers.length : id === "announcements" ? unreadAnnouncements : 0;
            return (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  activeTab === id ? "text-[#14B8A6]" : "text-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute top-2 right-[calc(50%-11px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                    {badge}
                  </span>
                )}
                <span className="text-[9px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden pb-safe">
          <button
            onClick={() => switchTab("home")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "home" ? "text-[#14B8A6]" : "text-gray-400"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => switchTab("applications")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "applications" ? "text-[#14B8A6]" : "text-gray-400"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Applications</span>
          </button>
          <button
            onClick={() => switchTab("announcements")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
              activeTab === "announcements" ? "text-[#14B8A6]" : "text-gray-400"
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadAnnouncements > 0 && (
              <span className="absolute top-2.5 right-[calc(50%-10px)] w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{unreadAnnouncements}</span>
              </span>
            )}
            <span className="text-[10px] font-medium">Notices</span>
          </button>
          <button
            onClick={() => switchTab("map")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "map" ? "text-[#14B8A6]" : "text-gray-400"
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-medium">Map</span>
          </button>
        </div>
      </div>

      {/* ── Profile Settings Modal ─────────────────────── */}
      {showProfileModal && (
        <div className="absolute inset-0 z-[2000] flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{session?.name}</p>
                  <p className="text-xs text-gray-400">{session?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Profile info fields (static) */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Account Info
                </p>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{session?.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Email Address</p>
                    <p className="text-sm font-medium text-gray-900">{session?.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Role</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{session?.role}</p>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="border border-red-100 rounded-2xl overflow-hidden">
                <div className="bg-red-50 px-4 py-2.5 border-b border-red-100">
                  <p className="text-xs font-semibold text-red-700">Danger Zone</p>
                </div>
                <div className="p-4">
                  {!terminateAccountConfirm ? (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldOff className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Terminate Account</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          Submits a request to close your PubMark account. This will be reviewed by
                          admin.
                        </p>
                        <button
                          onClick={() => setTerminateAccountConfirm(true)}
                          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                          Request Account Termination
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 leading-relaxed">
                        Are you sure? This will submit a termination request to the admin for
                        review.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTerminateAccountConfirm(false)}
                          className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!session) return;
                            try {
                              await saveTerminationRequest({
                                type: "account",
                                vendorId: session.userId,
                                vendorName: session.name,
                                vendorEmail: session.email,
                                reason: "User-initiated account termination request",
                              });
                              setTerminateAccountConfirm(false);
                              setShowProfileModal(false);
                              showToast("Account termination request submitted.", "success");
                            } catch (error) {
                              showToast(
                                `Failed to submit termination request: ${error.message}`,
                                "error",
                              );
                            }
                          }}
                          className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                          Confirm Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contract Action Choice Modal ───────────────── */}
      {contractActionModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Contract Request</p>
                <p className="text-slate-200 text-xs">{contractActionModal.stallName}</p>
              </div>
              <button
                onClick={() => setContractActionModal(null)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed">
                Do you want to transfer this contract to another PubMark user, or submit a request
                to terminate it?
              </div>

              {outgoingTransfers.some(
                (t) => t.originalApplicationId === contractActionModal.id && t.status === "pending",
              ) ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700 leading-relaxed">
                  A transfer request for this contract is already pending. You can wait for the
                  recipient to respond, or submit a termination request instead.
                </div>
              ) : (
                <button
                  onClick={() => handleInitiateTransfer(contractActionModal)}
                  className="w-full flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4 text-left hover:bg-purple-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Transfer Contract</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Send this contract to another registered user.
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setTerminateContractModal(contractActionModal);
                  setContractActionModal(null);
                  setTerminateReason("");
                }}
                className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-left hover:bg-red-100 transition-colors"
              >
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileX className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Apply for Termination</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send a termination request to the admin for review.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Terminate Contract Modal ────────────────────── */}
      {terminateContractModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileX className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Terminate Contract</p>
                  <p className="text-red-100 text-xs">{terminateContractModal.stallName}</p>
                </div>
              </div>
              <button
                onClick={() => setTerminateContractModal(null)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                Submitting this request will notify the admin to review your contract termination.
                The admin will process your request accordingly.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Reason for Termination
                </label>
                <textarea
                  rows={3}
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="Please state your reason for terminating the contract..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setTerminateContractModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!session || !terminateContractModal) return;
                  try {
                    await saveTerminationRequest({
                      type: "contract",
                      vendorId: session.userId,
                      vendorName: session.name,
                      vendorEmail: session.email,
                      stallId: terminateContractModal.stallId,
                      stallName: terminateContractModal.stallName,
                      reason: terminateReason.trim() || "No reason provided",
                    });
                    setTerminateContractModal(null);
                    setTerminateReason("");
                    showToast("Contract termination request submitted.", "success");
                  } catch (error) {
                    showToast(`Failed to submit termination request: ${error.message}`, "error");
                  }
                }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Initiation Modal ──────────────────── */}
      {transferModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Transfer Ownership</p>
                <p className="text-xs text-gray-500 truncate">{transferModal.stallName}</p>
              </div>
              <button
                onClick={() => setTransferModal(null)}
                className="w-8 h-8 rounded-xl hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 leading-relaxed">
                The new owner will need to fill out an application form. Your existing application
                will be voided once they confirm.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Owner's Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => {
                      setTransferEmail(e.target.value);
                      setTransferError("");
                    }}
                    placeholder="Enter their registered email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  />
                </div>
                {transferError && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {transferError}
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setTransferModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={transferSubmitting || !transferEmail.trim()}
                className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Send Transfer Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
