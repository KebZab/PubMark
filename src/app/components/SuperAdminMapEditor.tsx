import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { MapPin, Trash2, CheckCircle, AlertTriangle, PenLine, RotateCcw } from "lucide-react";
import {
  getPerimeter, savePerimeter, clearPerimeter, type MarketPerimeter,
} from "./perimeterStore";
import { type PubMarkSession } from "./authStorage";
import { showToast } from "./Toast";

const EXTRA_CSS = `
  .perimeter-draw-toolbar .leaflet-draw-draw-rectangle {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Crect x='3' y='6' width='18' height='12' rx='1.5'/%3E%3C/svg%3E") !important;
    background-size: 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .perimeter-draw-toolbar .leaflet-draw-draw-polygon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Cpolygon points='12,3 21,8 18,20 6,20 3,8'/%3E%3C/svg%3E") !important;
    background-size: 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .perimeter-draw-toolbar .leaflet-draw-toolbar a { background-color: white !important; border-radius: 6px !important; }
  .perimeter-draw-toolbar .leaflet-draw-toolbar a:hover { background-color: #f5f3ff !important; }
  .perimeter-draw-toolbar .leaflet-draw-actions a { background-color: #7c3aed !important; color: white !important; }
  .perimeter-draw-toolbar .leaflet-draw-actions a:hover { background-color: #6d28d9 !important; }
`;

function PerimeterDrawControl({
  existing,
  onSave,
  session,
}: {
  existing: MarketPerimeter | null;
  onSave: (perimeter: MarketPerimeter) => void;
  session: PubMarkSession;
}) {
  const map = useMap();
  const fgRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [pendingGeometry, setPendingGeometry] = useState<object | null>(null);
  const [perimeterName, setPerimeterName] = useState(existing?.name ?? "Market Perimeter");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  useEffect(() => {
    const lineUtil = (L as any).LineUtil;
    if (lineUtil?.isFlat) {
      try {
        Object.defineProperty(lineUtil, "_flat", { value: lineUtil.isFlat, writable: true, configurable: true });
      } catch { /* ignore */ }
    }
    const util = (L as any).GeometryUtil;
    if (util?.readableArea) {
      const _orig = util.readableArea;
      util.readableArea = function (area: number, isMetric: boolean | string[], precision?: any) {
        try { return _orig.call(this, area, isMetric, precision); }
        catch { return `${Math.round(area)} m²`; }
      };
    }

    const fg = new L.FeatureGroup();
    map.addLayer(fg);
    fgRef.current = fg;

    const PERIMETER_STYLE = { color: "#7c3aed", weight: 3, opacity: 0.9, fillColor: "#7c3aed", fillOpacity: 0.08, dashArray: "8 4" };

    // Draw existing perimeter if any
    if (existing?.geometry) {
      try {
        const geo = L.geoJSON(
          { type: "Feature", properties: {}, geometry: existing.geometry as GeoJSON.Geometry },
          { style: PERIMETER_STYLE }
        );
        geo.eachLayer((l) => { (l as any)._isPerimeter = true; fg.addLayer(l as L.Layer); });
        const bounds = geo.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
      } catch { /* ignore */ }
    }

    // @ts-ignore
    const ctrl = new L.Control.Draw({
      position: "topleft",
      draw: {
        rectangle: { shapeOptions: PERIMETER_STYLE },
        polygon: { allowIntersection: false, showArea: false, shapeOptions: PERIMETER_STYLE },
        polyline: false, marker: false, circle: false, circlemarker: false,
      },
      edit: { featureGroup: fg },
    });
    const container = map.getContainer();
    container.classList.add("perimeter-draw-toolbar");
    map.addControl(ctrl);
    controlRef.current = ctrl;

    const onCreated = (e: L.LeafletEvent) => {
      const layer = (e as L.DrawEvents.Created).layer;
      const geoJson = (layer as any).toGeoJSON() as GeoJSON.Feature;
      setPendingGeometry(geoJson.geometry);
      setDrawing(false);
    };

    const onDrawStart = () => setDrawing(true);
    const onDrawStop = () => setDrawing(false);

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on("draw:drawstart", onDrawStart);
    map.on("draw:drawstop", onDrawStop);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off("draw:drawstart", onDrawStart);
      map.off("draw:drawstop", onDrawStop);
      if (controlRef.current) { try { map.removeControl(controlRef.current); } catch { /* ignore */ } }
      container.classList.remove("perimeter-draw-toolbar");
      map.removeLayer(fg);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    if (!pendingGeometry) {
      showToast("Please draw a perimeter boundary first.", "error");
      return;
    }
    if (!perimeterName.trim()) {
      showToast("Please enter a name for the perimeter.", "error");
      return;
    }
    const perimeter = savePerimeter({
      name: perimeterName.trim(),
      geometry: pendingGeometry,
      createdBy: session.userId,
      createdByName: session.name,
      notes: notes.trim(),
    });
    setPendingGeometry(null);

    // Re-render on map
    const fg = fgRef.current;
    if (fg) {
      fg.clearLayers();
      const PERIMETER_STYLE = { color: "#7c3aed", weight: 3, opacity: 0.9, fillColor: "#7c3aed", fillOpacity: 0.08, dashArray: "8 4" };
      const geo = L.geoJSON(
        { type: "Feature", properties: {}, geometry: perimeter.geometry as GeoJSON.Geometry },
        { style: PERIMETER_STYLE }
      );
      geo.eachLayer((l) => fg.addLayer(l as L.Layer));
    }

    onSave(perimeter);
    showToast("Market perimeter saved. Admins can now create stalls.", "success");
  }

  function handleClear() {
    clearPerimeter();
    fgRef.current?.clearLayers();
    setPendingGeometry(null);
    showToast("Perimeter cleared.", "success");
    onSave(null as any);
  }

  return (
    <div className="absolute bottom-5 left-5 z-[1000] flex flex-col gap-2 w-72">
      {/* Name / notes form */}
      <div className="bg-white rounded-2xl shadow-xl border border-purple-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">Market Perimeter</span>
        </div>
        <input
          type="text"
          value={perimeterName}
          onChange={(e) => setPerimeterName(e.target.value)}
          placeholder="Perimeter name"
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        {drawing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-200">
            <PenLine className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs text-purple-700">Drawing… click to place points, double-click to finish</span>
          </div>
        )}
        {pendingGeometry && !drawing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">Boundary drawn — save to confirm</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!pendingGeometry}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Save Perimeter
          </button>
          {(getPerimeter() || pendingGeometry) && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  session: PubMarkSession;
}

export function SuperAdminMapEditor({ session }: Props) {
  const [perimeter, setPerimeter] = useState<MarketPerimeter | null>(() => getPerimeter());

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="h-full relative flex flex-col">
      <style>{EXTRA_CSS}</style>

      {/* Status banner */}
      <div className={`flex-shrink-0 px-5 py-3 flex items-center gap-3 border-b ${
        perimeter
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}>
        {perimeter ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">
                Perimeter set: <span className="font-normal">{perimeter.name}</span>
              </p>
              <p className="text-xs text-green-600">
                Created by {perimeter.createdByName} · {formatDate(perimeter.createdAt)} · Admins can now create stalls
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">No perimeter defined yet</p>
              <p className="text-xs text-amber-600">Draw the market boundary below. Admins cannot create stalls until this is set.</p>
            </div>
          </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[10.6054, 123.0413]}
          zoom={18}
          maxZoom={22}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxNativeZoom={19}
            maxZoom={22}
          />
          <PerimeterDrawControl
            existing={perimeter}
            session={session}
            onSave={(p) => setPerimeter(p)}
          />
        </MapContainer>

        {/* Instructions overlay (top-center) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 px-4 py-2 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">
              Use the draw tools (top-left) to outline the market boundary
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
