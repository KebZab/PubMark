import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Store, Search, Filter, ScrollText, X,
  User, Building2, CalendarDays, Clock, FileText, AlertTriangle,
  CheckCircle, MapPin, ChevronRight,
} from "lucide-react";
import { useStalls, type Stall } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { type StoredStall } from "../components/stallsStorage";
import { type Application } from "../services/applicationsApi";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getActiveApp(stallId: string, apps: Application[]): Application | null {
  return (
    apps
      .filter((a) => a.stallId === stallId && a.status !== "rejected")
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0] ?? null
  );
}

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TERM_LABELS: Record<string, string> = {
  "6": "6 Months", "12": "1 Year", "24": "2 Years", "36": "3 Years",
};

// ── Contract Info Modal ───────────────────────────────────────────────────────
function ContractModal({
  stall, app, onClose,
}: {
  stall: StoredStall;
  app: Application;
  onClose: () => void;
}) {
  const days = daysUntilExpiry(app.contractEnd);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between ${
          app.status === "approved"
            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100"
            : "bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              app.status === "approved"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}>
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{stall.stall_name}</p>
              <p className="text-xs text-gray-500">{app.status === "approved" ? "Active Contract" : "Pending Application"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="p-6 space-y-5">

            {/* Expiry banner (approved only) */}
            {app.status === "approved" && (
              <div className={`rounded-xl p-4 border flex items-center gap-3 ${
                isExpired
                  ? "bg-red-50 border-red-200"
                  : isExpiringSoon
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isExpired ? "bg-red-100" : isExpiringSoon ? "bg-amber-100" : "bg-emerald-100"
                }`}>
                  {isExpired
                    ? <AlertTriangle className="w-5 h-5 text-red-600" />
                    : isExpiringSoon
                    ? <Clock className="w-5 h-5 text-amber-600" />
                    : <CheckCircle className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isExpired ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-emerald-700"}`}>
                    {isExpired ? "Contract Expired" : isExpiringSoon ? `Expiring in ${days} day${days !== 1 ? "s" : ""}` : `Active — ${days} days remaining`}
                  </p>
                  <p className="text-xs text-gray-500">Expires on {fmt(app.contractEnd)}</p>
                </div>
              </div>
            )}

            {/* Tenant info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tenant Information</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Applicant Name</p>
                    <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Business Name</p>
                    <p className="text-sm font-semibold text-gray-900">{app.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Business Type</p>
                    <p className="text-sm font-semibold text-gray-900">{app.businessType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{app.applicantAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stall info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Stall Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Stall Name</p>
                  <p className="text-sm font-semibold text-gray-900">{stall.stall_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Section</p>
                  <p className="text-sm font-semibold text-gray-900">Section {stall.section}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Floor Area</p>
                  <p className="text-sm font-semibold text-gray-900">{stall.floor_area || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Applied On</p>
                  <p className="text-sm font-semibold text-gray-900">{fmt(app.dateApplied)}</p>
                </div>
              </div>
            </div>

            {/* Contract details */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contract Details</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Start Date</span>
                  <span className="font-semibold text-gray-900">{fmt(app.contractStart)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> End Date</span>
                  <span className={`font-semibold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
                    {fmt(app.contractEnd)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Term</span>
                  <span className="font-semibold text-gray-900">{TERM_LABELS[app.contractTermMonths] ?? `${app.contractTermMonths} months`}</span>
                </div>
                {app.status === "approved" && (
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                    <span className="text-gray-500">Days Remaining</span>
                    <span className={`font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-emerald-600"}`}>
                      {isExpired ? `${Math.abs(days)} days overdue` : `${days} days`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submitted documents */}
            {app.permitFileName && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Submitted Documents</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#14B8A6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{app.permitFileName}</p>
                      <p className="text-[10px] text-gray-500">Business Permit{app.permitFileSize ? ` · ${app.permitFileSize}` : ""}</p>
                    </div>
                  </div>
                  {app.additionalFileName && (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{app.additionalFileName}</p>
                        <p className="text-[10px] text-gray-500">Additional Doc{app.additionalFileSize ? ` · ${app.additionalFileSize}` : ""}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function StallManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "vacant" | "pending" | "occupied">("all");
  const [contractModal, setContractModal] = useState<{ stall: any; app: Application } | null>(null);

  const { stalls } = useStalls();
  const { applications } = useApplications();

  const enriched = useMemo(() =>
    stalls.map((stall) => ({ stall, app: getActiveApp(stall.id, applications) })),
    [stalls, applications]
  );

  const stats = useMemo(() => ({
    total: enriched.length,
    vacant: enriched.filter(({ app }) => !app).length,
    pending: enriched.filter(({ app }) => app?.status === "pending").length,
    occupied: enriched.filter(({ app }) => app?.status === "approved").length,
  }), [enriched]);

  const filtered = enriched.filter(({ stall, app }) => {
    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "vacant" && !app) ||
      (filterStatus === "pending" && app?.status === "pending") ||
      (filterStatus === "occupied" && app?.status === "approved");

    const q = searchQuery.toLowerCase();
    const textMatch =
      stall.stall_name.toLowerCase().includes(q) ||
      stall.business_type.toLowerCase().includes(q) ||
      `section ${stall.section}`.toLowerCase().includes(q) ||
      (app?.businessName ?? "").toLowerCase().includes(q) ||
      (app?.applicantName ?? "").toLowerCase().includes(q);

    return statusMatch && (!searchQuery || textMatch);
  });

  return (
    <div className="size-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
        <button
          onClick={() => navigate("/admin")}
          className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center mr-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stall Management</h1>
            <p className="text-sm text-gray-600">{stats.total} stalls · {stats.occupied} occupied · {stats.vacant} vacant</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Stalls</span>
              <Store className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Vacant</span>
              <div className="w-3 h-3 rounded-full bg-[#14B8A6]" />
            </div>
            <div className="text-3xl font-bold text-[#14B8A6]">{stats.vacant}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Pending</span>
              <div className="w-3 h-3 rounded-full bg-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-500">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Occupied</span>
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-indigo-600">{stats.occupied}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
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
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all text-sm"
            >
              <option value="all">All Status</option>
              <option value="vacant">Vacant</option>
              <option value="pending">Pending</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Stall</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Tenant / Business</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Contract Period</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Expiry</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(({ stall, app }) => {
                    const isOccupied = app?.status === "approved";
                    const isPending = app?.status === "pending";
                    const days = app?.status === "approved" ? daysUntilExpiry(app.contractEnd) : null;
                    const isExpired = days !== null && days < 0;
                    const isExpiringSoon = days !== null && days >= 0 && days <= 30;

                    return (
                      <tr key={stall.id} className="hover:bg-gray-50 transition-colors">
                        {/* Stall name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isOccupied ? "bg-gradient-to-br from-indigo-100 to-purple-100"
                              : isPending ? "bg-amber-100"
                              : "bg-teal-50"
                            }`}>
                              <Store className={`w-5 h-5 ${isOccupied ? "text-indigo-600" : isPending ? "text-amber-600" : "text-[#14B8A6]"}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{stall.stall_name}</p>
                              <p className="text-xs text-gray-400">Sec. {stall.section}{stall.floor_area ? ` · ${stall.floor_area}` : ""}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOccupied ? "bg-indigo-100 text-indigo-700"
                            : isPending ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-[#0d9488]"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOccupied ? "bg-indigo-500" : isPending ? "bg-amber-400" : "bg-[#14B8A6]"}`} />
                            {isOccupied ? "Occupied" : isPending ? "Pending" : "Vacant"}
                          </span>
                        </td>

                        {/* Tenant */}
                        <td className="px-5 py-4">
                          {app ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{app.businessName}</p>
                              <p className="text-xs text-gray-500">{app.applicantName}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No tenant</span>
                          )}
                        </td>

                        {/* Contract period */}
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

                        {/* Expiry */}
                        <td className="px-5 py-4">
                          {days !== null ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                              isExpired ? "bg-red-100 text-red-700"
                              : isExpiringSoon ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {isExpired
                                ? <><AlertTriangle className="w-3 h-3" />{Math.abs(days)}d overdue</>
                                : isExpiringSoon
                                ? <><Clock className="w-3 h-3" />{days}d left</>
                                : <><CheckCircle className="w-3 h-3" />{days}d left</>}
                            </span>
                          ) : isPending ? (
                            <span className="text-xs text-amber-600 font-medium">Awaiting approval</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {app ? (
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
          )}
        </div>
      </div>

      {/* Contract modal */}
      {contractModal && (
        <ContractModal
          stall={contractModal.stall}
          app={contractModal.app}
          onClose={() => setContractModal(null)}
        />
      )}
    </div>
  );
}
