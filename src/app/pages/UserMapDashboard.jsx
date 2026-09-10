import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Store,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flag,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { useOccupiedStalls } from "../hooks/useOccupiedStalls";
import { getSession } from "../components/authStorage";
import { saveViolation } from "../components/violationsStore";
import { showToast } from "../components/Toast";
import { FloorSwitcher } from "../components/FloorSwitcher";
import { ImageViewerModal } from "../components/ImageViewerModal";
import { useMapFacilities } from "../hooks/useMapFacilities";
import { MapFacilitiesLayer, MapFacilitiesLegend } from "../components/MapFacilitiesLayer";
import { registerMapFloater } from "../components/mapFloaterDeclutter";

// ── CSS ──────────────────────────────────────────────────────────────────────
const MAP_CSS = `
  @keyframes userMarkerPulse {
    0%   { transform: scale(1); opacity: 0.7; }
    70%  { transform: scale(2.4); opacity: 0; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  .user-pulse { animation: userMarkerPulse 2.2s ease-out infinite; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// Returns the most recent non-rejected application for a stall, if any
function getActiveApp(stallId, applications) {
  return (
    applications
      .filter((a) => a.stallId === stallId && a.status !== "rejected")
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0] ??
    null
  );
}

// userApp = current user's app, globalOccupied = approved by anyone,
// globalPending = someone (not necessarily this user) has a pending
// application and nobody has been approved yet.
function stallStyle(userApp, globalOccupied, globalPending, isSelected) {
  if (userApp?.status === "approved") {
    return {
      color: isSelected ? "#4338ca" : "#6366f1",
      fillColor: isSelected ? "#4338ca" : "#6366f1",
      weight: isSelected ? 3 : 2,
      fillOpacity: isSelected ? 0.4 : 0.25,
    };
  }
  if (userApp?.status === "pending" || (globalPending && !globalOccupied)) {
    return {
      color: isSelected ? "#d97706" : "#f59e0b",
      fillColor: isSelected ? "#d97706" : "#f59e0b",
      weight: isSelected ? 3 : 2,
      fillOpacity: isSelected ? 0.4 : 0.25,
    };
  }
  if (globalOccupied) {
    return {
      color: isSelected ? "#6b7280" : "#9ca3af",
      fillColor: isSelected ? "#6b7280" : "#9ca3af",
      weight: isSelected ? 3 : 2,
      fillOpacity: isSelected ? 0.4 : 0.25,
    };
  }
  return {
    color: isSelected ? "#0d9488" : "#14B8A6",
    fillColor: isSelected ? "#0d9488" : "#14B8A6",
    weight: isSelected ? 3 : 2,
    fillOpacity: isSelected ? 0.35 : 0.2,
  };
}

function stallTooltipLabel(stall, userApp, globalOccupied, globalPending) {
  if (userApp?.status === "approved") return `<strong>${stall.stall_name}</strong> · Your stall`;
  if (userApp?.status === "pending")
    return `<strong>${stall.stall_name}</strong> · Your application pending`;
  if (globalOccupied) return `<strong>${stall.stall_name}</strong> · Occupied`;
  if (globalPending) return `<strong>${stall.stall_name}</strong> · Application pending`;
  return `<strong>${stall.stall_name}</strong> · Available`;
}

// ── Drawn stalls layer ───────────────────────────────────────────────────────
function DrawnStallsLayer({
  stalls,
  userApplications,
  occupiedStallIds,
  pendingStallIds,
  selectedId,
  selectedIds,
  multiSelectMode,
  onSelect,
}) {
  const map = useMap();

  useEffect(() => {
    const layers = [];
    const unregister = [];

    stalls.forEach((stall) => {
      const isSelected = multiSelectMode ? selectedIds.has(stall.id) : stall.id === selectedId;
      const userApp = getActiveApp(stall.id, userApplications);
      const globalOccupied = occupiedStallIds.has(stall.id);
      const globalPending = pendingStallIds.has(stall.id);
      const style = stallStyle(userApp, globalOccupied, globalPending, isSelected);

      const layer = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        { style: { ...style, opacity: 0.95 } },
      );
      layer.bindTooltip(`<span class="vendor-stall-floater-content"><span class="vendor-stall-status-dot" style="background:${style.fillColor}"></span>${stall.stall_name}</span>`, {
        permanent: true,
        direction: "center",
        className: "vendor-stall-floater",
        opacity: 0.95,
      });
      layer.on("click", () => onSelect(stall));
      layer.addTo(map);
      unregister.push(registerMapFloater(map, layer, { selected: isSelected }));
      layers.push(layer);
    });

    return () => {
      unregister.forEach((remove) => remove());
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [
    stalls,
    userApplications,
    occupiedStallIds,
    pendingStallIds,
    selectedId,
    selectedIds,
    multiSelectMode,
    map,
    onSelect,
  ]);

  return null;
}

// ── FlyTo ────────────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export function UserMapDashboard() {
  const navigate = useNavigate();
  const { stalls: storedStalls, loading: stallsLoading } = useStalls();
  // GET /api/applications is scoped to the caller for vendors, so it only
  // ever contains this vendor's own rows now — useOccupiedStalls fills the
  // gap for "is this stall taken by someone else", with no personal data.
  const { applications: allApplications } = useApplications();
  const { occupiedStallIds, pendingStallIds } = useOccupiedStalls();
  const [selected, setSelected] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);
  const [activeFloor, setActiveFloor] = useState("1");
  const { facilities } = useMapFacilities(activeFloor);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState("Other");
  const [reportDescription, setReportDescription] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session || (session.role !== "vendor" && session.role !== "user")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const session = getSession();
  const userApplications = session
    ? allApplications.filter((a) => a.userId === session.userId)
    : [];

  // Filter stalls by active floor
  const floorStalls = storedStalls.filter((s) => s.floor === activeFloor);

  const floorCounts = {
    1: storedStalls.filter((s) => s.floor === "1").length,
    2: storedStalls.filter((s) => s.floor === "2").length,
  };

  const selectedUserApp = selected ? getActiveApp(selected.id, userApplications) : null;
  const selectedGlobalOccupied = selected
    ? occupiedStallIds.has(selected.id)
    : false;
  const selectedGlobalPending = selected ? pendingStallIds.has(selected.id) : false;

  // A stall reads as "pending" if it's the user's own pending application, or
  // anyone else's — matching the amber colour on the map, which shows the
  // same regardless of who applied.
  const isPendingToUser = (s) =>
    getActiveApp(s.id, userApplications)?.status === "pending" ||
    (pendingStallIds.has(s.id) && !occupiedStallIds.has(s.id));

  // Stats based on current floor's stalls
  const vacant = floorStalls.filter(
    (s) => !occupiedStallIds.has(s.id) && !isPendingToUser(s),
  ).length;
  const pendingCount = floorStalls.filter(isPendingToUser).length;
  const yourStallCount = floorStalls.filter(
    (s) => getActiveApp(s.id, userApplications)?.status === "approved",
  ).length;
  const occupiedCount = floorStalls.filter(
    (s) => occupiedStallIds.has(s.id) && getActiveApp(s.id, userApplications)?.status !== "approved",
  ).length;

  const filteredStalls = searchQuery
    ? floorStalls.filter((s) => {
        const app = getActiveApp(s.id, allApplications);
        return (
          s.stall_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.business_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `section ${s.section}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app?.businessName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app?.applicantName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : floorStalls;

  const handleSelectStall = (stall) => {
    if (multiSelectMode) {
      // allApplications only ever contains this vendor's own rows now, so it
      // can't tell whether some other stall is approved — occupiedStallIds
      // covers that. Their own active application still blocks re-adding a
      // stall they've already applied for.
      const isOccupiedByOther = occupiedStallIds.has(stall.id);
      const isMyActiveApp = getActiveApp(stall.id, userApplications);
      if (isOccupiedByOther || isMyActiveApp) {
        showToast("That stall isn't available and can't be added to your selection.", "error");
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
  };

  const handleToggleMultiSelect = () => {
    setMultiSelectMode((prev) => !prev);
    setSelectedIds(new Set());
    setSelected(null);
  };

  const handleApplyToSelection = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    navigate(`/apply/${ids[0]}`, { state: { stallIds: ids } });
  };

  const handleSubmitReport = async () => {
    if (!selected || !reportDescription.trim()) return;
    const session = getSession();
    if (!session) return;

    const globalApp = getActiveApp(selected.id, allApplications);

    try {
      await saveViolation({
        stallId: selected.id,
        stallName: selected.stall_name,
        vendorName: globalApp?.applicantName || "Unknown",
        officerId: "44444444-4444-4444-8444-444444444444",
        officerName: "Carlos Reyes",
        category: reportCategory,
        description: reportDescription.trim(),
        status: "open",
        evidence: [],
        remarks: `Reported by: ${session.name} (${session.email})`,
      });

      showToast("Report submitted successfully.", "success");
      setShowReportModal(false);
      setReportCategory("Other");
      setReportDescription("");
      setSelected(null);
    } catch (error) {
      showToast(`Failed to submit report: ${error.message}`, "error");
    }
  };

  return (
    <div className="size-full relative overflow-hidden bg-gray-200 max-w-md mx-auto">
      <style>{MAP_CSS}</style>

      {/* ── Full-screen map ────────────────────────────── */}
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
            stalls={filteredStalls}
            userApplications={userApplications}
            occupiedStallIds={occupiedStallIds}
            pendingStallIds={pendingStallIds}
            selectedId={selected?.id ?? null}
            selectedIds={selectedIds}
            multiSelectMode={multiSelectMode}
            onSelect={handleSelectStall}
          />
          <FlyTo position={flyTarget} />
          <MapFacilitiesLayer facilities={facilities} />
        </MapContainer>
      </div>
      <MapFacilitiesLegend showStallStatuses className="absolute bottom-5 left-5 z-[900] space-y-1 rounded-xl border bg-white/95 p-3 shadow-lg" />

      {/* ── Top bar ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="p-3 flex items-center gap-2.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="pointer-events-auto w-11 h-11 bg-white/96 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100/80 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="pointer-events-auto flex items-center gap-2 flex-1 bg-white/96 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-gray-100/80">
            <div className="w-7 h-7 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stalls, owners..."
              className="bg-transparent flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Floor Switcher + Status chips */}
        <div className="px-3 flex gap-2 pointer-events-auto flex-wrap items-center">
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
            <span className="text-xs font-semibold text-gray-700">{vacant} Vacant</span>
          </div>
          {pendingCount > 0 && (
            <div className="bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{pendingCount} Pending</span>
            </div>
          )}
          {occupiedCount > 0 && (
            <div className="bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-xs font-semibold text-gray-700">{occupiedCount} Occupied by vendor</span>
            </div>
          )}
          {yourStallCount > 0 && (
            <div className="bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-gray-700">{yourStallCount} Your stall{yourStallCount === 1 ? "" : "s"}</span>
            </div>
          )}
          {searchQuery && (
            <div className="bg-[#14B8A6]/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">
                {filteredStalls.length} found
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Loading state ─────────────────────────────────── */}
      {stallsLoading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 backdrop-blur-[1px] pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
            <p className="text-sm font-medium text-gray-600">Loading stalls…</p>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {!stallsLoading && storedStalls.length === 0 && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl border border-gray-100 text-center mx-6">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">No stalls mapped yet</p>
            <p className="text-xs text-gray-400 mt-1">
              The admin hasn't drawn any stalls on the map.
            </p>
          </div>
        </div>
      )}

      {storedStalls.length > 0 && floorStalls.length === 0 && !searchQuery && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl border border-gray-100 text-center mx-6">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              No stalls on {activeFloor === "1" ? "1st" : "2nd"} Floor
            </p>
            <p className="text-xs text-gray-400 mt-1">Switch floors to see available stalls.</p>
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

      {/* ── Bottom stall sheet ──────────────────────────── */}
      {!multiSelectMode &&
        selected &&
        (() => {
          const isMyApproved = selectedUserApp?.status === "approved";
          const isMyPending = selectedUserApp?.status === "pending";
          const isOtherOccupied = selectedGlobalOccupied && !isMyApproved;
          // A stall someone else applied for still accepts further
          // applications until one is approved, but it should read as
          // "pending" to everyone, not just to whoever applied first.
          const isOtherPending = !isMyApproved && !isMyPending && !isOtherOccupied && selectedGlobalPending;
          // allApplications only ever contains this vendor's own rows now, so
          // this is never populated for a stall someone else applied for —
          // the body text below no longer depends on it, on purpose: showing
          // a stranger's business name to another vendor isn't something to
          // do without being asked.

          const headerBg = isMyApproved
            ? "bg-gradient-to-r from-indigo-50 to-purple-50"
            : isMyPending || isOtherPending
              ? "bg-gradient-to-r from-amber-50 to-yellow-50"
              : isOtherOccupied
                ? "bg-gradient-to-r from-gray-50 to-slate-50"
                : "bg-gradient-to-r from-teal-50 to-cyan-50";

          const iconBg = isMyApproved
            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
            : isMyPending || isOtherPending
              ? "bg-gradient-to-br from-amber-400 to-orange-500"
              : isOtherOccupied
                ? "bg-gray-400"
                : "bg-gradient-to-br from-[#14B8A6] to-[#0d9488]";

          const badge = isMyApproved ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Your Stall
            </span>
          ) : isMyPending ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          ) : isOtherOccupied ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Occupied
            </span>
          ) : isOtherPending ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-[#0d9488]">
              Available
            </span>
          );

          return (
            <div
              className="absolute z-[1000] left-3 right-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              style={{ bottom: "16px" }}
            >
              <div className={`px-5 py-4 flex items-start gap-4 ${headerBg}`}>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}
                >
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-base">{selected.stall_name}</p>
                    {badge}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Section {selected.section}
                    {selected.floor_area ? ` · ${selected.floor_area}` : ""} ·{" "}
                    {selected.floor === "1" ? "1st Floor" : "2nd Floor"}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl hover:bg-black/10 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-3">
                {selected.images?.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto mb-3 -mx-0.5 px-0.5">
                    {selected.images
                      .filter((img) => img.url)
                      .map((img, i, gallery) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setViewer({ images: gallery, index: i })}
                          className="flex-shrink-0"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                          />
                        </button>
                      ))}
                  </div>
                )}
                {isMyApproved && selectedUserApp ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {selectedUserApp.businessName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedUserApp.applicantName} · {selectedUserApp.businessType}
                      </p>
                    </div>
                  </div>
                ) : isMyPending && selectedUserApp ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {selectedUserApp.businessName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedUserApp.applicantName} · Application under review
                      </p>
                    </div>
                  </div>
                ) : isOtherOccupied ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Stall taken</p>
                      {/* No applicant details — allApplications only ever has this
                          vendor's own rows now, and another vendor's business
                          isn't something to show without being asked. */}
                      <p className="text-xs text-gray-500">Held by another vendor.</p>
                    </div>
                  </div>
                ) : isOtherPending ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Application pending</p>
                      <p className="text-xs text-gray-500">
                        Another vendor has applied — you can still apply too.
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
                      <p className="text-xs text-gray-500">No current owner · Stall is available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-1">
                {isMyApproved ? (
                  <div className="w-full py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium text-center">
                    This is your approved stall
                  </div>
                ) : isMyPending && selectedUserApp ? (
                  <>
                    <button
                      onClick={() => navigate(`/applications/${selectedUserApp.id}`)}
                      className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2"
                    >
                      <Clock className="w-4 h-4" />
                      View My Application
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report Violation
                    </button>
                  </>
                ) : isOtherOccupied ? (
                  <>
                    <div className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium text-center mb-2">
                      This stall is currently occupied
                    </div>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report Violation
                    </button>
                  </>
                ) : (
                  <>
                    {isOtherPending ? (
                      <div className="w-full py-2 mb-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs text-center">
                        Another vendor has already applied — admin hasn't decided yet.
                      </div>
                    ) : null}
                    <button
                      onClick={() => navigate(`/apply/${selected.id}`)}
                      className="w-full py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2"
                    >
                      Apply for This Stall
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report Violation
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      {/* Report Modal */}
      {showReportModal && selected && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Flag className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-white font-semibold">Report Violation</h2>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportDescription("");
                  setReportCategory("Other");
                }}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Reporting stall:</p>
                <p className="text-sm font-semibold text-gray-900">{selected.stall_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Violation Category
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Illegal Vending">Illegal Vending</option>
                  <option value="Health Violation">Health Violation</option>
                  <option value="Fire Hazard">Fire Hazard</option>
                  <option value="Unauthorized Expansion">Unauthorized Expansion</option>
                  <option value="Noise Violation">Noise Violation</option>
                  <option value="Improper Waste Disposal">Improper Waste Disposal</option>
                  <option value="Permit Expired">Permit Expired</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the violation in detail..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription("");
                    setReportCategory("Other");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportDescription.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ImageViewerModal
        images={viewer?.images ?? []}
        startIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </div>
  );
}
