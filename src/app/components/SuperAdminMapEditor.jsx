import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { MapPin, Trash2, CheckCircle, AlertTriangle, PenLine, X, Loader2 } from "lucide-react";
import { createPerimeter, deletePerimeter } from "../services/perimeterApi";
import { usePerimeters } from "../hooks/usePerimeters";
import { showToast } from "./Toast";
import { FacilityMapEditor } from "./FacilityMapEditor";

const PERIMETER_STYLE = {
  color: "#7c3aed",
  weight: 3,
  opacity: 0.9,
  fillColor: "#7c3aed",
  fillOpacity: 0.08,
  dashArray: "8 4",
};
const DEFAULT_NAME = "Market Perimeter";

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
  .leaflet-tooltip.perimeter-zone-label {
    padding: 7px 12px; border: 2px solid rgba(255,255,255,.92); border-radius: 999px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white;
    box-shadow: 0 5px 14px rgba(76,29,149,.28); font: 700 11px/1.1 ui-sans-serif,system-ui,sans-serif;
    letter-spacing: .015em; text-shadow: 0 1px 1px rgba(0,0,0,.18);
  }
  .leaflet-tooltip.perimeter-zone-label::before { display: none; }
`;

function calculatePerimeterMetrics(geometry) {
  if (geometry.type !== "Polygon") return { perimeter: 0, area: 0 };

  const coords = geometry.coordinates[0];
  let perimeter = 0;
  let area = 0;

  // Calculate perimeter (sum of edge distances)
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = L.latLng(coords[i][1], coords[i][0]);
    const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
    perimeter += p1.distanceTo(p2);
  }

  // Calculate area using Shoelace formula (in square meters, approximate)
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = L.latLng(coords[i][1], coords[i][0]);
    const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
    area += p1.lng * p2.lat - p2.lng * p1.lat;
  }
  area = (Math.abs(area) * 40075000 * 40075000) / (360 * 360) / 2; // Rough approximation

  return { perimeter, area };
}

function formatDistance(meters) {
  if (meters > 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatArea(sqMeters) {
  if (sqMeters > 10000) return `${(sqMeters / 10000).toFixed(2)} ha`;
  if (sqMeters > 1000000) return `${(sqMeters / 1000000).toFixed(2)} km²`;
  return `${Math.round(sqMeters)} m²`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderZonesOnLayer(layer, zones) {
  layer.clearLayers();
  zones.forEach((zone) => {
    try {
      const geo = L.geoJSON(
        { type: "Feature", properties: {}, geometry: zone.geometry },
        { style: PERIMETER_STYLE },
      );
      const metrics = calculatePerimeterMetrics(zone.geometry);
      const popupContent = `
        <div style="font-size: 13px; min-width: 150px;">
          <strong>${zone.name}</strong>
          <div style="margin-top: 6px; border-top: 1px solid #ddd; padding-top: 6px;">
            <div>📐 Perimeter: <strong>${formatDistance(metrics.perimeter)}</strong></div>
            <div>📍 Area: <strong>${formatArea(metrics.area)}</strong></div>
          </div>
        </div>
      `;
      geo.eachLayer((l) => {
        l.bindPopup(popupContent);
        l.bindTooltip(zone.name, {
          permanent: true,
          direction: "center",
          className: "perimeter-zone-label",
        });
        layer.addLayer(l);
      });
    } catch {
      /* ignore malformed geometry */
    }
  });
}

function PerimeterDrawControl({ existing, onCreated, isSaving }) {
  const map = useMap();
  const fgRef = useRef(null);
  const savedPerimeterLayerRef = useRef(null);
  const controlRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [pendingGeometry, setPendingGeometry] = useState(null);
  const [zoneName, setZoneName] = useState(DEFAULT_NAME);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const lineUtil = L.LineUtil;
    if (lineUtil?.isFlat) {
      try {
        Object.defineProperty(lineUtil, "_flat", {
          value: lineUtil.isFlat,
          writable: true,
          configurable: true,
        });
      } catch {
        /* ignore */
      }
    }
    const util = L.GeometryUtil;
    if (util?.readableArea) {
      const _orig = util.readableArea;
      util.readableArea = function (area, isMetric, precision) {
        try {
          return _orig.call(this, area, isMetric, precision);
        } catch {
          return `${Math.round(area)} m²`;
        }
      };
    }

    // Separate layer for saved zones (always visible, not editable by Leaflet-draw)
    const savedPerimeterLayer = new L.FeatureGroup();
    map.addLayer(savedPerimeterLayer);
    savedPerimeterLayerRef.current = savedPerimeterLayer;

    renderZonesOnLayer(savedPerimeterLayer, existing);
    const bounds = savedPerimeterLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

    // Separate FeatureGroup for drawing (Leaflet-draw editing layer)
    const fg = new L.FeatureGroup();
    map.addLayer(fg);
    fgRef.current = fg;

    // @ts-ignore
    const ctrl = new L.Control.Draw({
      position: "topleft",
      draw: {
        rectangle: { shapeOptions: PERIMETER_STYLE },
        polygon: { allowIntersection: false, showArea: true, shapeOptions: PERIMETER_STYLE },
        polyline: false,
        marker: false,
        circle: false,
        circlemarker: false,
      },
      edit: { featureGroup: fg },
    });
    const container = map.getContainer();
    container.classList.add("perimeter-draw-toolbar");
    map.addControl(ctrl);
    controlRef.current = ctrl;

    const onDrawCreated = (e) => {
      const layer = e.layer;
      // leaflet-draw does not keep the finished shape on the map by itself —
      // it must be added to the editable feature group or it visually vanishes
      // the instant drawing finishes, even though it was captured correctly.
      fg.clearLayers();
      fg.addLayer(layer);
      const geoJson = layer.toGeoJSON();
      setPendingGeometry(geoJson.geometry);
      setDrawing(false);
    };

    const onDrawStart = () => setDrawing(true);
    const onDrawStop = () => setDrawing(false);

    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on("draw:drawstart", onDrawStart);
    map.on("draw:drawstop", onDrawStop);

    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off("draw:drawstart", onDrawStart);
      map.off("draw:drawstop", onDrawStop);
      if (controlRef.current) {
        try {
          map.removeControl(controlRef.current);
        } catch {
          /* ignore */
        }
      }
      container.classList.remove("perimeter-draw-toolbar");
      map.removeLayer(fg);
      if (savedPerimeterLayerRef.current) map.removeLayer(savedPerimeterLayerRef.current);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync the saved zones layer whenever the zone list changes (after refetch)
  useEffect(() => {
    const savedLayer = savedPerimeterLayerRef.current;
    if (!savedLayer) return;
    renderZonesOnLayer(savedLayer, existing);
  }, [existing]);

  function discardDraft() {
    fgRef.current?.clearLayers();
    setPendingGeometry(null);
  }

  async function handleSave() {
    if (!pendingGeometry) {
      showToast("Please draw a zone boundary first.", "error");
      return;
    }
    if (!zoneName.trim()) {
      showToast("Please enter a name for the zone.", "error");
      return;
    }
    try {
      await createPerimeter({
        name: zoneName.trim(),
        geometry: pendingGeometry,
        notes: notes.trim(),
      });
      await onCreated();
      discardDraft();
      setZoneName(DEFAULT_NAME);
      setNotes("");
      showToast("Zone saved. Admins can now create stalls inside it.", "success");
    } catch (error) {
      showToast(`Failed to save zone: ${error.message}`, "error");
    }
  }

  return (
    <div className="absolute bottom-5 left-5 z-[1000] flex flex-col gap-2 w-72">
      {/* Name / notes form */}
      <div className="bg-white rounded-2xl shadow-xl border border-purple-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">New Zone</span>
        </div>
        <input
          type="text"
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          placeholder="Zone name"
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
            <span className="text-xs text-purple-700">
              Drawing… click to place points, double-click to finish
            </span>
          </div>
        )}
        {pendingGeometry && !drawing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">Boundary drawn — save to add it</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!pendingGeometry || isSaving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save Zone"}
          </button>
          {pendingGeometry && (
            <button
              onClick={discardDraft}
              disabled={isSaving}
              className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Discard this unsaved boundary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SuperAdminMapEditor({ session }) {
  const { perimeters, refetch, loading: perimetersLoading } = usePerimeters();
  const isSaving = false;
  const [deletingId, setDeletingId] = useState(null);
  const [editorTab, setEditorTab] = useState("zones");

  const handleCreated = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleDeleteZone = useCallback(
    async (zone) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the zone "${zone.name}"? Stalls previously validated against it will no longer be protected by this boundary.`,
      );
      if (!confirmDelete) return;
      setDeletingId(zone.id);
      try {
        await deletePerimeter(zone.id);
        await refetch();
        showToast("Zone deleted.", "success");
      } catch (error) {
        showToast(`Failed to delete zone: ${error.message}`, "error");
      } finally {
        setDeletingId(null);
      }
    },
    [refetch],
  );

  return (
    <div className="h-full flex flex-col">
      <style>{EXTRA_CSS}</style>
      <div className="flex flex-shrink-0 gap-2 border-b bg-white px-5 py-2">
        <button onClick={() => setEditorTab("zones")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${editorTab === "zones" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}>Market Zones</button>
        <button onClick={() => setEditorTab("facilities")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${editorTab === "facilities" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>Map Facilities</button>
      </div>

      {editorTab === "facilities" ? <div className="min-h-0 flex-1"><FacilityMapEditor /></div> : <>

      {/* Status banner */}
      <div
        className={`flex-shrink-0 px-5 py-3 flex items-center gap-3 border-b ${
          perimeters.length > 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        {perimeters.length > 0 ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">
                {perimeters.length} zone{perimeters.length === 1 ? "" : "s"} defined
              </p>
              <p className="text-xs text-green-600">
                Admins can create stalls inside any defined zone.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">No zones defined yet</p>
              <p className="text-xs text-amber-600">
                Draw at least one market boundary below. Admins cannot create stalls until one
                exists.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Map + Right Panel */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          {perimetersLoading && (
            <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-white/70 backdrop-blur-[1px] pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
                <p className="text-sm font-medium text-gray-600">Loading zones…</p>
              </div>
            </div>
          )}
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
              existing={perimeters}
              isSaving={isSaving}
              onCreated={handleCreated}
            />
          </MapContainer>

          {/* Instructions overlay (top-center) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white rounded-xl shadow-lg border border-purple-200 px-4 py-2 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">
                Use the draw tools (top-left) to outline a market zone
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel - Zone List */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Market Zones</h3>
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          {perimeters.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {perimeters.map((zone) => {
                const metrics = calculatePerimeterMetrics(zone.geometry);
                return (
                  <div key={zone.id} className="bg-purple-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{zone.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteZone(zone)}
                        disabled={deletingId === zone.id}
                        className="flex items-center justify-center p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        title={`Delete "${zone.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-purple-200 space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">📐 Perimeter Length</p>
                        <p className="text-sm font-semibold text-purple-600">
                          {formatDistance(metrics.perimeter)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">📍 Area Enclosed</p>
                        <p className="text-sm font-semibold text-purple-600">
                          {formatArea(metrics.area)}
                        </p>
                      </div>
                    </div>

                    {zone.notes && (
                      <div className="pt-3 border-t border-purple-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                        <p className="text-xs text-gray-700 mt-1">{zone.notes}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-purple-200">
                      <p className="text-xs text-gray-600">
                        Created by <strong>{zone.createdByName}</strong>
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(zone.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center">
              <div>
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No zones defined yet</p>
                <p className="text-xs text-gray-500 mt-1">Draw a boundary on the map to add one</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </>}
    </div>
  );
}
