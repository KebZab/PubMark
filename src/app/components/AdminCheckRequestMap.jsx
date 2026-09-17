import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Send, Loader2 } from "lucide-react";
import { FloorSwitcher } from "./FloorSwitcher";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { saveCheckRequest } from "./checkRequestsStore";
import { listUsers } from "../services/api";
import { showToast } from "./Toast";
import { useMapFacilities } from "../hooks/useMapFacilities";
import { MapFacilitiesLayer, MapFacilitiesLegend, stallFloaterHtml } from "./MapFacilitiesLayer";
import { registerMapFloater } from "./mapFloaterDeclutter";
import { NotifyVendorChoice } from "./NotifyVendorChoice";

// The one application that represents a stall's current state: the approved
// tenant if there is one, otherwise whoever applied first — matches how
// every other admin map resolves this.
function getActiveApp(stallId, applications) {
  const active = applications
    .filter((a) => a.stallId === stallId && a.status !== "rejected")
    .sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime());
  return active.find((a) => a.status === "approved") ?? active[0] ?? null;
}

// Common reasons an admin sends an officer to check a stall. "Other" reveals
// a free-text field so nothing is forced into the wrong bucket.
const REASON_OPTIONS = [
  { value: "Routine inspection", label: "Routine inspection" },
  { value: "Complaint received", label: "Complaint received" },
  { value: "Suspected violation", label: "Suspected violation" },
  { value: "Safety or sanitation concern", label: "Safety or sanitation concern" },
  { value: "Lease/contract verification", label: "Lease or contract verification" },
  { value: "Vacancy verification", label: "Vacancy verification" },
  { value: "Follow-up on previous report", label: "Follow-up on previous report" },
  { value: "other", label: "Other (specify below)" },
];

function StallMarkers({ stalls, applications, currentFloor, selectedStallId, onSelectStall }) {
  const map = useMap();

  useEffect(() => {
    const renderedLayers = [];
    const unregister = [];
    function stallColor(stallId) {
      const app = getActiveApp(stallId, applications);
      if (app?.status === "approved") return "#ef4444";
      if (app?.status === "pending") return "#f59e0b";
      return "#22c55e";
    }

    function stallTooltip(stall) {
      const app = getActiveApp(stall.id, applications);
      if (app?.status === "approved")
        return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Occupied)`;
      if (app?.status === "pending")
        return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Pending)`;
      return `<strong>${stall.stall_name}</strong> · Vacant`;
    }

    const filtered = stalls.filter((s) => s.floor === currentFloor);

    filtered.forEach((stall) => {
      const isSelected = selectedStallId === stall.id;
      const color = isSelected ? "#3b82f6" : stallColor(stall.id);
      const geo = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        {
          style: {
            color,
            weight: isSelected ? 3 : 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: isSelected ? 0.35 : 0.2,
          },
        },
      );
      geo.eachLayer((l) => {
        const layer = l;
        layer.bindTooltip(stallFloaterHtml(stall.stall_name, color), { permanent: true, direction: "center", className: "vendor-stall-floater", opacity: 0.95 });
        layer.on("click", () => onSelectStall(stall.id));
        map.addLayer(layer);
        unregister.push(registerMapFloater(map, layer, { selected: isSelected }));
        renderedLayers.push(layer);
      });
    });

    return () => {
      unregister.forEach((remove) => remove());
      renderedLayers.forEach((layer) => map.removeLayer(layer));
    };
  }, [map, stalls, applications, currentFloor, selectedStallId, onSelectStall]);

  return null;
}

export function AdminCheckRequestMap({ userId, userName, onRequestCreated }) {
  const { stalls } = useStalls();
  const { applications } = useApplications();
  const [activeFloor, setActiveFloor] = useState("1");
  const { facilities } = useMapFacilities(activeFloor);
  const [selectedStallId, setSelectedStallId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyVendor, setNotifyVendor] = useState(null);
  const [vendorNoticeMessage, setVendorNoticeMessage] = useState("");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [officers, setOfficers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedStall = stalls.find((s) => s.id === selectedStallId) ?? null;

  const floorCounts = {
    1: stalls.filter((s) => s.floor === "1").length,
    2: stalls.filter((s) => s.floor === "2").length,
  };

  useEffect(() => {
    let cancelled = false;
    async function loadOfficers() {
      try {
        const response = await listUsers("officer");
        if (cancelled) return;
        setOfficers(response.users);
        setAssignedOfficer((current) => current || response.users[0]?.id || "");
      } catch (error) {
        if (!cancelled) showToast(`Failed to load officers: ${error.message}`, "error");
      }
    }
    void loadOfficers();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleStallClick(stallId) {
    setSelectedStallId(stallId);
    setShowForm(true);
    setReason("");
    setCustomReason("");
    setNotes("");
    setNotifyVendor(null);
    setVendorNoticeMessage("");
    setPriority("normal");
    setAssignedOfficer(officers[0]?.id ?? "");
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!selectedStall || submitting) return;
    const finalReason = reason === "other" ? customReason.trim() : reason;
    if (!finalReason) {
      showToast(
        reason === "other"
          ? "Please specify the reason for the check request."
          : "Please choose a reason for the check request.",
        "error",
      );
      return;
    }
    if (notifyVendor === null) {
      showToast("Choose whether to notify the vendor.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await saveCheckRequest({
        stallId: selectedStall.id,
        stallName: selectedStall.stall_name,
        requestedBy: userId,
        requestedByName: userName,
        assignedTo: assignedOfficer || null,
        assignedToName: officers.find((o) => o.id === assignedOfficer)?.name ?? null,
        priority,
        reason: finalReason,
        notes: notes.trim(),
        notifyVendor,
        vendorNoticeMessage,
        status: "pending",
        completionNotes: "",
      });

      showToast("Officer check request created.", "success");
      setShowForm(false);
      setSelectedStallId(null);
      if (onRequestCreated) onRequestCreated();
    } catch (error) {
      showToast(`Failed to create check request: ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const PRIORITY_OPTIONS = [
    { value: "low", label: "Low", color: "text-gray-600" },
    { value: "normal", label: "Normal", color: "text-blue-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Officer Check Requests</p>
            <p className="text-xs text-gray-500">Click a stall to request an officer inspection</p>
          </div>
        </div>
        <FloorSwitcher floor={activeFloor} onChange={setActiveFloor} counts={floorCounts} />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[10.6054, 123.0413]}
          zoom={18}
          maxZoom={22}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            maxNativeZoom={19}
            maxZoom={22}
          />
          <StallMarkers
            stalls={stalls}
            applications={applications}
            currentFloor={activeFloor}
            selectedStallId={selectedStallId}
            onSelectStall={handleStallClick}
          />
          <MapFacilitiesLayer facilities={facilities} />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2.5 space-y-1.5 text-xs z-[1000]">
          <p className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide mb-1">
            Legend
          </p>
          <MapFacilitiesLegend className="mb-2 space-y-1 border-b pb-2" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 rounded border-2 border-green-500 bg-green-500/20" />
            <span className="text-gray-700">Vacant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 rounded border-2 border-amber-400 bg-amber-400/20" />
            <span className="text-gray-700">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 rounded border-2 border-red-500 bg-red-500/20" />
            <span className="text-gray-700">Occupied</span>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showForm && selectedStall && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Request Officer Check</h2>
                <p className="text-blue-100 text-xs mt-0.5">{selectedStall.stall_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedStallId(null);
                }}
                disabled={submitting}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select a reason
                  </option>
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {reason === "other" && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify the reason"
                    className="mt-2 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {officers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Assign to Officer
                  </label>
                  <select
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <NotifyVendorChoice
                notifyVendor={notifyVendor}
                vendorNoticeMessage={vendorNoticeMessage}
                onChange={(patch) => {
                  if (patch.notifyVendor !== undefined) setNotifyVendor(patch.notifyVendor);
                  if (patch.vendorNoticeMessage !== undefined) setVendorNoticeMessage(patch.vendorNoticeMessage);
                }}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedStallId(null);
                }}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || notifyVendor === null}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
