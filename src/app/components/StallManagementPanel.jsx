import { useState, useMemo, useEffect } from "react";
import {
  Store,
  Search,
  Filter,
  ScrollText,
  X,
  User,
  Building2,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { getStallsManagementPage } from "../services/applicationsApi";
import { TablePagination } from "./ui/TablePagination";
import { showToast } from "./Toast";
import { AttachmentLink } from "./AttachmentLink";

// ── Helpers ───────────────────────────────────────────────────────────────────
// Every active (non-rejected) application on a stall, oldest first. A stall
// stays open to further applications until one is approved, so more than one
// vendor can be waiting on the same stall at once — this is what lets admin
// actually see all of them instead of just whichever applied most recently.
function getActiveApps(stallId, apps) {
  return apps
    .filter((a) => a.stallId === stallId && a.status !== "rejected")
    .sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime());
}

// The one application that represents the stall's current state: the
// approved tenant if there is one, otherwise whoever applied first.
function getActiveApp(stallId, apps) {
  const active = getActiveApps(stallId, apps);
  return active.find((a) => a.status === "approved") ?? active[0] ?? null;
}

function daysUntilExpiry(dateStr) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TERM_LABELS = {
  6: "6 Months",
  12: "1 Year",
  24: "2 Years",
  36: "3 Years",
};

// ── Contract Modal ────────────────────────────────────────────────────────────
function ContractInfoModal({ stall, app, onClose }) {
  const days = daysUntilExpiry(app.contractEnd);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-5 flex items-center justify-between ${
            app.status === "approved"
              ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100"
              : "bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                app.status === "approved"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                  : "bg-gradient-to-br from-amber-400 to-orange-500"
              }`}
            >
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{stall.stall_name}</p>
              <p className="text-xs text-gray-500">
                {app.status === "approved" ? "Active Contract" : "Pending Application"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6 space-y-5">
          {/* Expiry banner (approved only) */}
          {app.status === "approved" && (
            <div
              className={`rounded-xl p-4 border flex items-center gap-3 ${
                isExpired
                  ? "bg-red-50 border-red-200"
                  : isExpiringSoon
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isExpired ? "bg-red-100" : isExpiringSoon ? "bg-amber-100" : "bg-emerald-100"
                }`}
              >
                {isExpired ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : isExpiringSoon ? (
                  <Clock className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${isExpired ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-emerald-700"}`}
                >
                  {isExpired
                    ? "Contract Expired"
                    : isExpiringSoon
                      ? `Expiring in ${days} day${days !== 1 ? "s" : ""}`
                      : `Active — ${days} days remaining`}
                </p>
                <p className="text-xs text-gray-500">Expires on {fmt(app.contractEnd)}</p>
              </div>
            </div>
          )}

          {/* Tenant info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Tenant Information
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {[
                { icon: User, label: "Name", value: app.applicantName },
                {
                  icon: Building2,
                  label: "Business",
                  value: `${app.businessName} · ${app.businessType}`,
                },
                { icon: MapPin, label: "Address", value: app.applicantAddress },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stall + contract grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Stall Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Stall", value: stall.stall_name },
                { label: "Section", value: `Section ${stall.section}` },
                { label: "Floor", value: stall.floor === "1" ? "1st Floor" : "2nd Floor" },
                { label: "Floor Area", value: stall.floor_area || "—" },
                { label: "Applied On", value: fmt(app.dateApplied) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contract Details
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Start Date
                </span>
                <span className="font-semibold text-gray-900">{fmt(app.contractStart)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  End Date
                </span>
                <span
                  className={`font-semibold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}
                >
                  {fmt(app.contractEnd)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Term
                </span>
                <span className="font-semibold text-gray-900">
                  {TERM_LABELS[app.contractTermMonths] ?? `${app.contractTermMonths} months`}
                </span>
              </div>
              {app.status === "approved" && (
                <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Days Remaining</span>
                  <span
                    className={`font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {isExpired ? `${Math.abs(days)} days overdue` : `${days} days`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {app.permitFileName && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Submitted Documents
              </p>
              <div className="space-y-2">
                <AttachmentLink
                  name={app.permitFileName}
                  url={app.permitUrl}
                  caption={`Business Permit${app.permitFileSize ? ` · ${app.permitFileSize}` : ""}`}
                  tone="teal"
                />
                {app.additionalFileName && (
                  <AttachmentLink
                    name={app.additionalFileName}
                    url={app.additionalFileUrl}
                    caption={`Additional Doc${app.additionalFileSize ? ` · ${app.additionalFileSize}` : ""}`}
                    tone="blue"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Competing Applicants Modal ──────────────────────────────────────────────
// Shown when a stall has more than one pending application. Nothing here
// picks a winner automatically — admin still decides — this only makes sure
// every applicant is visible, oldest first, instead of just the latest one.
function ApplicantsModal({ stall, apps, onClose, onOpenContract }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-amber-400 to-orange-500">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{stall.stall_name}</p>
              <p className="text-xs text-gray-500">{apps.length} applicants · none approved yet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6 space-y-3">
          <p className="text-xs text-gray-500 leading-5">
            This stall still accepts applications until one is approved, so more than one vendor
            can be waiting at once. Ordered by who applied first — approving one here does not
            reject the others automatically.
          </p>
          {apps.map((app, i) => (
            <button
              key={app.id}
              onClick={() => onOpenContract(app)}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.businessName}</p>
                    <p className="text-xs text-gray-500">
                      {app.applicantName} · {app.businessType}
                    </p>
                  </div>
                </div>
                {i === 0 && (
                  <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Applied first
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Applied {fmt(app.dateApplied)} at{" "}
                {new Date(app.dateApplied).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function StallManagementPanel() {
  const TABLE_PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [contractModal, setContractModal] = useState(null);
  const [applicantsModal, setApplicantsModal] = useState(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Kept unpaginated: the stat cards (Total/Vacant/Pending/Occupied) need full counts.
  // The table itself is fetched separately, page by page, via getStallsManagementPage below.
  const { stalls } = useStalls();
  const { applications } = useApplications();

  const enriched = useMemo(
    () => stalls.map((stall) => ({ stall, app: getActiveApp(stall.id, applications) })),
    [stalls, applications],
  );

  const stats = useMemo(
    () => ({
      total: enriched.length,
      vacant: enriched.filter(({ app }) => !app).length,
      pending: enriched.filter(({ app }) => app?.status === "pending").length,
      occupied: enriched.filter(({ app }) => app?.status === "approved").length,
    }),
    [enriched],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, filterFloor]);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getStallsManagementPage({
          status: filterStatus,
          floor: filterFloor,
          search: debouncedSearch,
          page,
          pageSize: TABLE_PAGE_SIZE,
        });
        setRows(result.items);
        setTotal(result.total);
      } catch (error) {
        showToast(`Failed to load stalls: ${error.message}`, "error");
      }
    })();
  }, [page, debouncedSearch, filterStatus, filterFloor]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Stalls", value: stats.total, color: "text-gray-900", dot: null },
          { label: "Vacant", value: stats.vacant, color: "text-[#14B8A6]", dot: "bg-[#14B8A6]" },
          { label: "Pending", value: stats.pending, color: "text-amber-500", dot: "bg-amber-400" },
          {
            label: "Occupied",
            value: stats.occupied,
            color: "text-indigo-600",
            dot: "bg-indigo-500",
          },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              {dot ? (
                <div className={`w-3 h-3 rounded-full ${dot}`} />
              ) : (
                <Store className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stall, tenant, business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all text-sm"
          >
            <option value="all">All Status</option>
            <option value="vacant">Vacant</option>
            <option value="pending">Pending</option>
            <option value="occupied">Occupied</option>
          </select>
          <div className="flex items-center gap-1.5 h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="bg-transparent focus:outline-none text-sm text-gray-700"
            >
              <option value="all">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1">
              {stalls.length === 0 ? "No stalls drawn yet" : "No stalls match your filter"}
            </p>
            <p className="text-sm text-gray-400">
              {stalls.length === 0
                ? "Draw stalls in the Stalls Map section first."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Stall
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Floor
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Tenant / Business
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Contract Period
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Expiry
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(({ stall, app }) => {
                    const isOccupied = app?.status === "approved";
                    const isPending = app?.status === "pending";
                    // Computed from the already-loaded `applications` (used
                    // for the stat cards above), independent of whatever the
                    // paginated `rows` endpoint returns for a single `app` —
                    // so every competing applicant shows up, not just one.
                    const apps = getActiveApps(stall.id, applications);
                    const hasCompetingApplicants = !isOccupied && apps.length > 1;
                    const days =
                      app?.status === "approved" ? daysUntilExpiry(app.contractEnd) : null;
                    const isExpired = days !== null && days < 0;
                    const isExpiringSoon = days !== null && days >= 0 && days <= 30;

                    return (
                      <tr key={stall.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isOccupied
                                  ? "bg-gradient-to-br from-indigo-100 to-purple-100"
                                  : isPending
                                    ? "bg-amber-100"
                                    : "bg-teal-50"
                              }`}
                            >
                              <Store
                                className={`w-5 h-5 ${isOccupied ? "text-indigo-600" : isPending ? "text-amber-600" : "text-[#14B8A6]"}`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {stall.stall_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Sec. {stall.section}
                                {stall.floor_area ? ` · ${stall.floor_area}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                            <Layers className="w-3 h-3" />
                            {stall.floor === "1" ? "1st Floor" : "2nd Floor"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isOccupied
                                ? "bg-indigo-100 text-indigo-700"
                                : isPending
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-teal-100 text-[#0d9488]"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${isOccupied ? "bg-indigo-500" : isPending ? "bg-amber-400" : "bg-[#14B8A6]"}`}
                            />
                            {isOccupied ? "Occupied" : isPending ? "Pending" : "Vacant"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {app ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-gray-900">
                                  {app.businessName}
                                </p>
                                {hasCompetingApplicants && (
                                  <button
                                    onClick={() => setApplicantsModal({ stall, apps })}
                                    title="More than one vendor has applied for this stall"
                                    className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                                  >
                                    +{apps.length - 1} more
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{app.applicantName}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No tenant</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {app ? (
                            <div>
                              <p className="text-sm text-gray-900">{fmt(app.contractStart)}</p>
                              <p className="text-xs text-gray-500">→ {fmt(app.contractEnd)}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {days !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                                isExpired
                                  ? "bg-red-100 text-red-700"
                                  : isExpiringSoon
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isExpired ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  {Math.abs(days)}d overdue
                                </>
                              ) : isExpiringSoon ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  {days}d left
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  {days}d left
                                </>
                              )}
                            </span>
                          ) : isPending ? (
                            <span className="text-xs text-amber-600 font-medium">
                              Awaiting approval
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {hasCompetingApplicants ? (
                            <button
                              onClick={() => setApplicantsModal({ stall, apps })}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                            >
                              <User className="w-3.5 h-3.5" />
                              Compare {apps.length}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : app ? (
                            <button
                              onClick={() => setContractModal({ stall, app })}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                            >
                              <ScrollText className="w-3.5 h-3.5" />
                              View Contract
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={TABLE_PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {contractModal && (
        <ContractInfoModal
          stall={contractModal.stall}
          app={contractModal.app}
          onClose={() => setContractModal(null)}
        />
      )}

      {/* Competing applicants modal — tapping one drills into its full
          detail via the same ContractInfoModal used everywhere else. */}
      {applicantsModal && (
        <ApplicantsModal
          stall={applicantsModal.stall}
          apps={applicantsModal.apps}
          onClose={() => setApplicantsModal(null)}
          onOpenContract={(app) => {
            setContractModal({ stall: applicantsModal.stall, app });
            setApplicantsModal(null);
          }}
        />
      )}
    </div>
  );
}
