import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, ChevronRight } from "lucide-react";
import { FloorSwitcher } from "./FloorSwitcher";
import { useMapFacilities } from "../hooks/useMapFacilities";
import { MapFacilitiesLayer, stallFloaterHtml } from "./MapFacilitiesLayer";
import { registerMapFloater } from "./mapFloaterDeclutter";

function getApprovedApp(stallId, apps) {
  return apps.find((a) => a.stallId === stallId && a.status === "approved") ?? null;
}

function PickerStallsLayer({ stalls, applications, disabledIds, stagedIds, onToggle }) {
  const map = useMap();
  useEffect(() => {
    const layers = [];
    const unregister = [];
    stalls.forEach((stall) => {
      const occupied = !!getApprovedApp(stall.id, applications);
      const alreadyPicked = disabledIds.has(stall.id);
      const disabled = occupied || alreadyPicked;
      const isStaged = stagedIds.has(stall.id);
      const color = disabled ? "#9ca3af" : isStaged ? "#0d9488" : "#14B8A6";
      const fillOpacity = isStaged ? 0.45 : disabled ? 0.15 : 0.22;
      const layer = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        {
          style: { color, fillColor: color, weight: isStaged ? 3 : 2, opacity: 0.95, fillOpacity },
        },
      );
      const status = occupied
        ? "Occupied"
        : alreadyPicked
          ? "Already in your application"
          : isStaged
            ? "Selected"
            : "Available";
      layer.bindTooltip(stallFloaterHtml(stall.stall_name, color), {
        permanent: true,
        direction: "center",
        className: "vendor-stall-floater",
        opacity: 0.95,
      });
      if (!disabled) layer.on("click", () => onToggle(stall));
      layer.addTo(map);
      unregister.push(registerMapFloater(map, layer, { selected: isStaged }));
      layers.push(layer);
    });
    return () => {
      unregister.forEach((remove) => remove());
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [stalls, applications, disabledIds, stagedIds, map, onToggle]);
  return null;
}

export function AddStallMapPicker({ stalls, applications, alreadyPickedIds, onConfirm, onClose }) {
  const [activeFloor, setActiveFloor] = useState("1");
  const { facilities } = useMapFacilities(activeFloor);
  const [stagedIds, setStagedIds] = useState(new Set());

  const disabledIds = new Set(alreadyPickedIds);
  const floorStalls = stalls.filter((s) => s.floor === activeFloor);
  const floorCounts = {
    1: stalls.filter((s) => s.floor === "1").length,
    2: stalls.filter((s) => s.floor === "2").length,
  };

  function toggleStall(stall) {
    setStagedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stall.id)) next.delete(stall.id);
      else next.add(stall.id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900">Add Stalls from Map</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-0">
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
            <PickerStallsLayer
              stalls={floorStalls}
              applications={applications}
              disabledIds={disabledIds}
              stagedIds={stagedIds}
              onToggle={toggleStall}
            />
            <MapFacilitiesLayer facilities={facilities} />
          </MapContainer>

          <div className="absolute top-3 left-3 z-[1000]">
            <FloorSwitcher floor={activeFloor} onChange={setActiveFloor} counts={floorCounts} />
          </div>
          <div className="absolute top-3 right-3 z-[1000] bg-white/96 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-gray-100/80">
            <span className="text-xs font-semibold text-gray-700">Tap a stall to select</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
            {stagedIds.size} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={stagedIds.size === 0}
            onClick={() => onConfirm(Array.from(stagedIds))}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Add {stagedIds.size > 0 ? `${stagedIds.size} ` : ""}Stall
            {stagedIds.size === 1 ? "" : "s"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
