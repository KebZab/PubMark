import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, AlertTriangle, Camera, Upload, Paperclip, Store, User } from "lucide-react";
import { FloorSwitcher } from "./FloorSwitcher";
import { useStalls } from "../hooks/useStalls";
import { type StoredStall } from "./stallsStorage";
import { useApplications } from "../hooks/useApplications";
import { type Application } from "../services/applicationsApi";
import {
  saveViolation, type ViolationCategory,
} from "./violationsStore";
import { showToast } from "./Toast";

const CATEGORIES: ViolationCategory[] = [
  "Illegal Vending", "Health Violation", "Fire Hazard",
  "Unauthorized Expansion", "Noise Violation", "Improper Waste Disposal",
  "Permit Expired", "Other",
];

function getActiveApp(stallId: string, applications: Application[]): Application | null {
  return (
    applications
      .filter((a) => a.stallId === stallId && a.status !== "rejected")
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0] ?? null
  );
}

interface StallLayer extends L.Path {
  _stallId?: string;
  _stallName?: string;
}

interface EvidenceFile {
  name: string;
  type: "image" | "video" | "document";
  size: string;
}

function StallMarkers({
  stalls,
  applications,
  currentFloor,
  selectedStallId,
  onSelectStall,
}: {
  stalls: StoredStall[];
  applications: Application[];
  currentFloor: "1" | "2";
  selectedStallId: string | null;
  onSelectStall: (stallId: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const layersMap = new Map<string, L.Path[]>();

    function stallColor(stallId: string): string {
      const app = getActiveApp(stallId, applications);
      if (app?.status === "approved") return "#ef4444";
      if (app?.status === "pending") return "#f59e0b";
      return "#22c55e";
    }

    function stallTooltip(stall: any): string {
      const app = getActiveApp(stall.id, applications);
      if (app?.status === "approved") return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Occupied)`;
      if (app?.status === "pending") return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Pending)`;
      return `<strong>${stall.stall_name}</strong> · Vacant`;
    }

    const filtered = stalls.filter((s) => s.floor === currentFloor);

    filtered.forEach((stall) => {
      const paths: L.Path[] = [];
      const isSelected = selectedStallId === stall.id;
      const color = isSelected ? "#3b82f6" : stallColor(stall.id);
      const geo = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry as GeoJSON.Geometry },
        {
          style: {
            color,
            weight: isSelected ? 3 : 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: isSelected ? 0.4 : 0.2,
          },
        }
      );
      geo.eachLayer((l) => {
        const path = l as StallLayer;
        path._stallId = stall.id;
        path._stallName = stall.stall_name;
        path.bindTooltip(stallTooltip(stall), { direction: "top", opacity: 0.95 });
        path.on("click", () => onSelectStall(stall.id));
        path.addTo(map);
        paths.push(path);
      });
      layersMap.set(stall.id, paths);
    });

    return () => {
      layersMap.forEach((paths) => {
        paths.forEach((p) => p.remove());
      });
      layersMap.clear();
    };
  }, [map, stalls, currentFloor, selectedStallId, onSelectStall]);

  return null;
}

export function OfficerMapView({
  officerId,
  officerName,
}: {
  officerId: string;
  officerName: string;
}) {
  const { stalls } = useStalls();
  const { applications } = useApplications();
  const [currentFloor, setCurrentFloor] = useState<"1" | "2">("1");
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [form, setForm] = useState({
    vendorName: "",
    category: "Health Violation" as ViolationCategory,
    description: "",
    remarks: "",
  });
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);

  const selectedStall = selectedStallId ? stalls.find((s) => s.id === selectedStallId) : null;
  const selectedApp = selectedStallId ? getActiveApp(selectedStallId, applications) : null;

  const handleSelectStall = useCallback((stallId: string) => {
    setSelectedStallId(stallId);
    const app = getActiveApp(stallId, applications);
    setForm((prev) => ({
      ...prev,
      vendorName: app?.applicantName || app?.businessName || "",
    }));
  }, [applications]);

  function handleReportViolation() {
    setShowReportModal(true);
  }

  function handleSubmitViolation() {
    if (!selectedStallId || !form.description.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    const stall = stalls.find((s) => s.id === selectedStallId);
    saveViolation({
      stallId: selectedStallId,
      stallName: stall?.stall_name ?? selectedStallId,
      vendorName: form.vendorName || selectedApp?.applicantName || "Unknown",
      officerId,
      officerName,
      category: form.category,
      description: form.description,
      status: "open",
      evidence,
      remarks: form.remarks,
    });
    showToast("Violation reported successfully.", "success");
    setShowReportModal(false);
    setSelectedStallId(null);
    setForm({ vendorName: "", category: "Health Violation", description: "", remarks: "" });
    setEvidence([]);
  }

  function handleAddEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const added: EvidenceFile[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setEvidence((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  return (
    <div className="h-full w-full relative max-w-md mx-auto">
      <style>{`
        .leaflet-container { z-index: 1; background: #e5e7eb; }
        .leaflet-pane { z-index: 400; }
        .leaflet-top, .leaflet-bottom { z-index: 1000; }
      `}</style>

      <MapContainer
        center={[10.6054, 123.0413]}
        zoom={18}
        maxZoom={22}
        className="h-full w-full rounded-2xl overflow-hidden shadow-lg"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={22}
        />
        <StallMarkers
          stalls={stalls}
          applications={applications}
          currentFloor={currentFloor}
          selectedStallId={selectedStallId}
          onSelectStall={handleSelectStall}
        />
      </MapContainer>

      {/* Floor switcher */}
      <div className="absolute top-4 left-4 z-[1001]">
        <FloorSwitcher floor={currentFloor} onChange={setCurrentFloor} />
      </div>

      {/* Selected stall info - Mobile optimized */}
      {selectedStall && (
        <div className="absolute bottom-3 left-3 right-3 z-[1001] bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto">
          <div className={`px-4 py-3.5 flex items-start gap-3 ${selectedApp ? "bg-gradient-to-r from-gray-50 to-slate-50" : "bg-gradient-to-r from-teal-50 to-cyan-50"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${selectedApp ? "bg-gray-400" : "bg-gradient-to-br from-[#14B8A6] to-[#0d9488]"}`}>
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight">{selectedStall.stall_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                Section {selectedStall.section} · {selectedStall.floor === "1" ? "1st Floor" : "2nd Floor"}
                {selectedStall.floor_area && ` · ${selectedStall.floor_area}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedStallId(null)}
              className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="px-4 py-3">
            {selectedApp ? (
              <div className="flex items-center gap-2.5 mb-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{selectedApp.businessName}</p>
                  <p className="text-xs text-gray-500">{selectedApp.applicantName} · {selectedApp.businessType}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 mb-3">
                <User className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Vacant Stall</p>
                  <p className="text-xs text-gray-500">No current occupant</p>
                </div>
              </div>
            )}

            <button
              onClick={handleReportViolation}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Violation
            </button>
          </div>
        </div>
      )}

      {/* Report Violation Modal */}
      {showReportModal && selectedStall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Report Violation - {selectedStall.stall_name}</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Vendor Name</label>
                <input
                  type="text"
                  value={form.vendorName}
                  onChange={(e) => setForm((p) => ({ ...p, vendorName: e.target.value }))}
                  placeholder="Name of vendor"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ViolationCategory }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the violation in detail…"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Remarks / Notes</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                  placeholder="Additional remarks…"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Evidence (optional)</label>
                <input
                  type="file"
                  id="officer-evidence"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleAddEvidence}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("officer-evidence")?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photos/Videos
                </button>
                {evidence.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {evidence.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-gray-400">{f.size}</span>
                        <button onClick={() => setEvidence((p) => p.filter((_, j) => j !== i))}>
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
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitViolation}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
