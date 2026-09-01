import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Store, X, LogIn, UserPlus, User, ChevronRight, CheckSquare } from "lucide-react";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { FloorSwitcher } from "../components/FloorSwitcher";
import { showToast } from "../components/Toast";

const MAP_CSS = `
  .leaflet-container { background: #e5e7eb; }
`;

function getGeometryCentroid(geometry) {
  try {
    if (geometry?.type === "Polygon" && geometry.coordinates?.[0]?.length > 0) {
      const coords = geometry.coordinates[0];
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      return [lat, lng];
    }
  } catch {
    /* empty */
  }
  return null;
}

function getApprovedApp(stallId, apps) {
  return apps.find((a) => a.stallId === stallId && a.status === "approved") ?? null;
}

function DrawnStallsLayer({
  stalls,
  applications,
  selectedId,
  selectedIds,
  multiSelectMode,
  onSelect,
}) {
  const map = useMap();
  useEffect(() => {
    const layers = [];
    stalls.forEach((stall) => {
      const occupied = !!getApprovedApp(stall.id, applications);
      const isSelected = multiSelectMode ? selectedIds.has(stall.id) : stall.id === selectedId;
      const color = occupied ? "#9ca3af" : isSelected ? "#0d9488" : "#14B8A6";
      const fillOpacity = isSelected ? 0.4 : 0.22;
      const layer = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        {
          style: {
            color,
            fillColor: color,
            weight: isSelected ? 3 : 2,
            opacity: 0.95,
            fillOpacity,
          },
        },
      );
      layer.bindTooltip(
        `<strong>${stall.stall_name}</strong> · ${occupied ? "Occupied" : "Available"}`,
        { direction: "top", opacity: 0.95 },
      );
      layer.on("click", () => onSelect(stall));
      layer.addTo(map);
      layers.push(layer);
    });
    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [stalls, applications, selectedId, selectedIds, multiSelectMode, map, onSelect]);
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  const prev = useRef("");
  useEffect(() => {
    if (!position) return;
    const key = `${position[0]},${position[1]}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo(position, map.getZoom(), { duration: 0.6 });
  }, [position, map]);
  return null;
}

export function GuestMapView() {
  const navigate = useNavigate();
  const { stalls, loading } = useStalls();
  const { applications } = useApplications();
  const [selected, setSelected] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [flyTarget, setFlyTarget] = useState(null);
  const [pendingStallIds, setPendingStallIds] = useState(null);
  const [activeFloor, setActiveFloor] = useState("1");

  const floorStalls = stalls.filter((s) => s.floor === activeFloor);

  function handleSelectStall(stall) {
    if (multiSelectMode) {
      if (getApprovedApp(stall.id, applications)) {
        showToast("That stall is occupied and can't be added to your selection.", "error");
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(stall.id)) next.delete(stall.id);
        else next.add(stall.id);
        return next;
      });
      return;
    }
    if (selected?.id === stall.id) {
      setSelected(null);
      return;
    }
    setSelected(stall);
    const center = getGeometryCentroid(stall.geometry);
    if (center) setFlyTarget(center);
  }

  function handleToggleMultiSelect() {
    setMultiSelectMode((prev) => !prev);
    setSelectedIds(new Set());
    setSelected(null);
  }

  function handleApplyToSelection() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPendingStallIds(ids);
  }

  const approvedApp = selected ? getApprovedApp(selected.id, applications) : null;
  const selectedOccupied = !!approvedApp;
  const vacantCount = floorStalls.filter((s) => !getApprovedApp(s.id, applications)).length;
  const occupiedCount = floorStalls.length - vacantCount;

  const floorCounts = {
    1: stalls.filter((s) => s.floor === "1").length,
    2: stalls.filter((s) => s.floor === "2").length,
  };

  return (
    <div className="size-full relative overflow-hidden bg-gray-200 max-w-md mx-auto">
      <style>{MAP_CSS}</style>

      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[10.6054, 123.0413]}
          zoom={18}
          maxZoom={22}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxNativeZoom={19}
            maxZoom={22}
          />
          <DrawnStallsLayer
            stalls={floorStalls}
            applications={applications}
            selectedId={selected?.id ?? null}
            selectedIds={selectedIds}
            multiSelectMode={multiSelectMode}
            onSelect={handleSelectStall}
          />
          <FlyTo position={flyTarget} />
        </MapContainer>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="pointer-events-auto bg-white/96 backdrop-blur-md border-b border-gray-200/80 shadow-sm px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-gray-900 leading-tight">PubMark</span>
              <span className="text-[10px] text-gray-400 block leading-tight">
                Browse Available Stalls
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#14B8A6] text-[#14B8A6] rounded-xl text-xs font-semibold hover:bg-teal-50 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-xs font-semibold shadow hover:shadow-md transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </Link>
          </div>
        </div>

        {/* Floor Switcher + Status chips */}
        <div className="px-3 pt-2 flex gap-2 pointer-events-auto flex-wrap items-center">
          <FloorSwitcher
            floor={activeFloor}
            onChange={(f) => {
              setActiveFloor(f);
              setSelected(null);
            }}
            counts={floorCounts}
          />
          <button
            onClick={handleToggleMultiSelect}
            className={`bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border flex items-center gap-1.5 transition-colors ${
              multiSelectMode
                ? "border-[#14B8A6] text-[#0d9488]"
                : "border-gray-100/80 text-gray-700"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">
              {multiSelectMode ? "Cancel" : "Select Multiple"}
            </span>
          </button>
          <div className="bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" />
            <span className="text-xs font-semibold text-gray-700">{vacantCount} Vacant</span>
          </div>
          {occupiedCount > 0 && (
            <div className="bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-xs font-semibold text-gray-700">{occupiedCount} Occupied</span>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && stalls.length === 0 && (
        <div
          className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none"
          style={{ top: "80px" }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl border border-gray-100 text-center mx-6">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">No stalls available</p>
            <p className="text-xs text-gray-400 mt-1">Check back later for available stalls.</p>
          </div>
        </div>
      )}

      {stalls.length > 0 && floorStalls.length === 0 && (
        <div
          className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none"
          style={{ top: "100px" }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl border border-gray-100 text-center mx-6">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              No stalls on {activeFloor === "1" ? "1st" : "2nd"} Floor
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try switching floors to see available stalls.
            </p>
          </div>
        </div>
      )}

      {/* ── Multi-select action bar ───────────────────────── */}
      {multiSelectMode && selectedIds.size > 0 && (
        <div
          className="absolute z-[1000] left-3 right-3 flex items-center gap-2.5 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3"
          style={{ bottom: "16px" }}
        >
          <div className="bg-[#14B8A6]/90 backdrop-blur-md rounded-xl px-3 py-2 flex-shrink-0">
            <span className="text-xs font-semibold text-white">{selectedIds.size} selected</span>
          </div>
          <button
            onClick={handleApplyToSelection}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Apply to {selectedIds.size} Stall{selectedIds.size === 1 ? "" : "s"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Bottom sheet (mobile) ─────────────────────── */}
      {!multiSelectMode && selected && (
        <div
          className="absolute z-[1000] left-3 right-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ bottom: "16px" }}
        >
          {/* Header */}
          <div
            className={`px-5 py-4 flex items-start gap-4 ${selectedOccupied ? "bg-gradient-to-r from-gray-50 to-slate-50" : "bg-gradient-to-r from-teal-50 to-cyan-50"}`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${selectedOccupied ? "bg-gray-400" : "bg-gradient-to-br from-[#14B8A6] to-[#0d9488]"}`}
            >
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-gray-900 text-base">{selected.stall_name}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedOccupied ? "bg-gray-100 text-gray-600" : "bg-teal-100 text-teal-700"}`}
                >
                  {selectedOccupied ? "Occupied" : "Available"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Section {selected.section}
                {selected.floor_area ? ` · ${selected.floor_area}` : ""} ·{" "}
                {selected.floor === "1" ? "1st Floor" : "2nd Floor"}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-8 h-8 rounded-xl hover:bg-black/10 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Body — owner info or stall details */}
          <div className="px-5 py-3">
            {selectedOccupied && approvedApp ? (
              <div className="flex items-center gap-3 py-1">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{approvedApp.businessName}</p>
                  <p className="text-xs text-gray-500">
                    {approvedApp.applicantName} · {approvedApp.businessType}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {selected.business_type || "General"}
                  </p>
                  <p className="text-xs text-gray-500">No current owner · Open for applications</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="px-5 pb-4 pt-1">
            {selectedOccupied ? (
              <div className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium text-center">
                This stall is currently occupied
              </div>
            ) : (
              <button
                onClick={() => setPendingStallIds([selected.id])}
                className="w-full py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Apply for This Stall
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Login prompt modal */}
      {pendingStallIds && pendingStallIds.length > 0 && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-[#14B8A6]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Account Required</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              You need an account to apply for{" "}
              {pendingStallIds.length > 1 ? `these ${pendingStallIds.length} stalls` : "a stall"}.
              Create a free account or log in to continue.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(`/register?stallId=${pendingStallIds.join(",")}`)}
                className="w-full py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
              <button
                onClick={() => navigate(`/?stallId=${pendingStallIds.join(",")}`)}
                className="w-full py-3 border border-[#14B8A6] text-[#14B8A6] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>
            </div>
            <button
              onClick={() => setPendingStallIds(null)}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
