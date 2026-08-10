import { useState, useEffect } from "react";
import {
  Archive, RotateCcw, Trash2, Search, Filter, X, Check,
  FileText, Users, Store, AlertTriangle, Calendar, User,
} from "lucide-react";
import {
  getArchivedRecords, deleteArchivedRecord, restoreArchivedRecord,
  type ArchivedRecord, type ArchiveType,
} from "../components/archiveStore";
import { getSession } from "../components/authStorage";
import { DashboardLayout } from "../components/DashboardLayout";
import { showToast } from "../components/Toast";

const TYPE_CONFIG: Record<ArchiveType, { label: string; icon: React.ElementType; color: string }> = {
  application: { label: "Application", icon: FileText, color: "bg-blue-100 text-blue-700" },
  vendor: { label: "Vendor", icon: Users, color: "bg-teal-100 text-teal-700" },
  stall: { label: "Stall", icon: Store, color: "bg-purple-100 text-purple-700" },
  violation: { label: "Violation", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ArchiveManagement() {
  const session = getSession()!;
  const [records, setRecords] = useState<ArchivedRecord[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ArchiveType | "all">("all");
  const [selectedRecord, setSelectedRecord] = useState<ArchivedRecord | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<ArchivedRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ArchivedRecord | null>(null);

  useEffect(() => {
    setRecords(getArchivedRecords());
  }, []);

  const filtered = records.filter((r) => {
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.archivedByName.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  function handleRestore(record: ArchivedRecord) {
    const restored = restoreArchivedRecord(record.id);
    if (restored) {
      setRecords(getArchivedRecords());
      setRestoreConfirm(null);
      setSelectedRecord(null);
      showToast(`"${record.title}" restored successfully.`, "success");
    } else {
      showToast("Restore failed. Record may not be restorable.", "error");
    }
  }

  function handleDelete(record: ArchivedRecord) {
    deleteArchivedRecord(record.id);
    setRecords(getArchivedRecords());
    setDeleteConfirm(null);
    setSelectedRecord(null);
    showToast("Record permanently deleted.", "success");
  }

  const typeCounts = {
    application: records.filter((r) => r.type === "application").length,
    vendor: records.filter((r) => r.type === "vendor").length,
    stall: records.filter((r) => r.type === "stall").length,
    violation: records.filter((r) => r.type === "violation").length,
  };

  return (
    <DashboardLayout
      session={session}
      title="Archive"
      subtitle="Archived records — applications, vendors, and stalls"
    >
      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["application", "vendor", "stall", "violation"] as ArchiveType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                className={`bg-white rounded-2xl border p-4 shadow-sm text-left transition-all hover:shadow ${
                  typeFilter === t ? "border-teal-400 ring-2 ring-teal-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color.split(" ")[0]}`}>
                    <Icon className={`w-5 h-5 ${cfg.color.split(" ")[1]}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{typeCounts[t]}</p>
                    <p className="text-xs text-gray-500">{cfg.label}s</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search archive…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ArchiveType | "all")}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Types</option>
            <option value="application">Applications</option>
            <option value="vendor">Vendors</option>
            <option value="stall">Stalls</option>
            <option value="violation">Violations</option>
          </select>
        </div>

        {/* Records list */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const cfg = TYPE_CONFIG[r.type];
            const Icon = cfg.icon;
            const isSelected = selectedRecord?.id === r.id;
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  isSelected ? "border-teal-400 ring-2 ring-teal-100" : "border-gray-200"
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedRecord(isSelected ? null : r)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color.split(" ")[0]}`}>
                      <Icon className={`w-5 h-5 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{r.title}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {r.canRestore && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Restorable
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" /> {r.archivedByName}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(r.archivedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 mt-1">
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Archive Reason</p>
                      <p className="text-sm text-gray-700">{r.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      {r.canRestore && (
                        <button
                          onClick={() => setRestoreConfirm(r)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(r)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
              <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No archived records found.</p>
              <p className="text-xs text-gray-400 mt-1">
                {search || typeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Archive is empty. Records archived from the system will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Restore confirm */}
      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Restore Record?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">"{restoreConfirm.title}"</p>
            <p className="text-xs text-gray-400 text-center mb-6">This will remove it from the archive.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setRestoreConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(restoreConfirm)}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Permanently?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">"{deleteConfirm.title}"</p>
            <p className="text-xs text-red-400 text-center mb-6">This action cannot be undone.</p>
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
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
