import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import {
  X, Store, Calendar, MapPin,
  Building2, FileText, Trash2, PenLine,
  ChevronLeft, Plus, Edit3,
  ScrollText, User, Clock, AlertTriangle, CheckCircle, Layers,
} from "lucide-react";
import { FloorSwitcher } from "./FloorSwitcher";
import {
  getStoredStalls, saveStoredStall, deleteStoredStall,
  updateStoredStallGeometry, updateStoredStall, type StoredStall,
} from "./stallsStorage";
import { getStoredApplications, type StoredApplication } from "./applicationsStorage";
import { getPerimeter } from "./perimeterStore";
import { showToast } from "./Toast";

function getActiveApp(stallId: string, applications: StoredApplication[]): StoredApplication | null {
  return (
    applications
      .filter((a) => a.stallId === stallId && a.status !== "rejected")
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0] ?? null
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const EXTRA_CSS = `
  .leaflet-draw-draw-rectangle {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Crect x='3' y='6' width='18' height='12' rx='1.5'/%3E%3C/svg%3E") !important;
    background-size: 18px 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .leaflet-draw-draw-polygon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Cpolygon points='12,3 21,8 18,20 6,20 3,8'/%3E%3C/svg%3E") !important;
    background-size: 18px 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .leaflet-draw-edit-edit {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z'/%3E%3C/svg%3E") !important;
    background-size: 18px 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .leaflet-draw-edit-remove {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2'%3E%3Cpolyline points='3 6 5 6 21 6'/%3E%3Cpath d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'/%3E%3C/svg%3E") !important;
    background-size: 18px 18px !important; background-repeat: no-repeat !important; background-position: center !important;
  }
  .leaflet-draw-toolbar a { background-color: white !important; border-radius: 6px !important; }
  .leaflet-draw-toolbar a:hover { background-color: #f0fdfa !important; }
  .leaflet-draw-toolbar { border-radius: 10px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.13) !important; }
  .leaflet-draw-actions a { background-color: #14B8A6 !important; color: white !important; }
  .leaflet-draw-actions a:hover { background-color: #0d9488 !important; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGeometryCentroid(geometry: any): [number, number] | null {
  try {
    if (geometry?.type === "Polygon" && geometry.coordinates?.[0]?.length > 0) {
      const coords: number[][] = geometry.coordinates[0];
      return [
        coords.reduce((s, c) => s + c[1], 0) / coords.length,
        coords.reduce((s, c) => s + c[0], 0) / coords.length,
      ];
    }
  } catch { /* empty */ }
  return null;
}

// ── DrawControl API ───────────────────────────────────────────────────────────
interface DrawControlAPI {
  showDrawToolbar: () => void;
  hideDrawToolbar: () => void;
  addStall: (stall: StoredStall) => void;
  highlightStall: (id: string | null) => void;
  enableEditMode: () => void;
  disableEditMode: () => void;
}

function DrawControl({
  initialStalls, apiRef,
  onCreated, onEdited, onDeleted, onSelectStall,
  onToolbarHidden, onEditModeStop,
}: {
  initialStalls: StoredStall[];
  apiRef: React.MutableRefObject<DrawControlAPI | null>;
  onCreated: (layer: L.Layer) => void;
  onEdited: (updates: Array<{ id: string; geometry: object }>) => void;
  onDeleted: (ids: string[]) => void;
  onSelectStall: (stallId: string) => void;
  onToolbarHidden: () => void;
  onEditModeStop: () => void;
}) {
  const map = useMap();
  const cbRef = useRef({ onCreated, onEdited, onDeleted, onSelectStall, onToolbarHidden, onEditModeStop });
  useEffect(() => { cbRef.current = { onCreated, onEdited, onDeleted, onSelectStall, onToolbarHidden, onEditModeStop }; });

  useEffect(() => {
    // Silence leaflet-draw's use of the deprecated L.LineUtil._flat getter
    // by redefining it as a plain value so Leaflet's deprecation getter is bypassed.
    const lineUtil = (L as any).LineUtil;
    if (lineUtil?.isFlat) {
      try {
        Object.defineProperty(lineUtil, "_flat", {
          value: lineUtil.isFlat,
          writable: true,
          configurable: true,
        });
      } catch { /* ignore if already non-configurable */ }
    }

    // Patch broken readableArea in leaflet-draw ESM bundle
    const util = (L as any).GeometryUtil;
    if (util?.readableArea) {
      const _orig = util.readableArea;
      util.readableArea = function (area: number, isMetric: boolean | string[], precision?: any) {
        try { return _orig.call(this, area, isMetric, precision); }
        catch {
          const m = Array.isArray(isMetric) ? true : isMetric;
          return m ? (area >= 10000 ? `${(area / 10000).toFixed(2)} ha` : `${Math.round(area)} m²`) : `${(area * 0.000247105).toFixed(2)} ac`;
        }
      };
    }

    const fg = new L.FeatureGroup();
    map.addLayer(fg);

    const layersMap = new Map<string, L.Path[]>();
    let mainControl: any = null;
    // toolbarForDraw = control was opened via "Create New Stall"
    let toolbarForDraw = false;
    let inEditMode = false;

    const SHAPE_OPTS = { color: "#22c55e", weight: 2, opacity: 0.9, fillColor: "#22c55e", fillOpacity: 0.25 };

    function ensureControl() {
      if (!mainControl) {
        // @ts-ignore
        mainControl = new L.Control.Draw({
          position: "topleft",
          draw: {
            rectangle: { shapeOptions: SHAPE_OPTS },
            polygon: { allowIntersection: false, showArea: false, shapeOptions: SHAPE_OPTS },
            polyline: false, marker: false, circle: false, circlemarker: false,
          },
          edit: { featureGroup: fg },
        });
        map.addControl(mainControl);
      }
    }

    function removeControlIfIdle() {
      if (!toolbarForDraw && !inEditMode && mainControl) {
        const ctrl = mainControl;
        mainControl = null;
        try { map.removeControl(ctrl); } catch { /* ignore */ }
        cbRef.current.onToolbarHidden();
      }
    }

    function stallColor(stallId: string): string {
      const app = getActiveApp(stallId, getStoredApplications());
      if (app?.status === "approved") return "#ef4444";
      if (app?.status === "pending") return "#f59e0b";
      return "#22c55e";
    }

    function stallTooltip(stall: StoredStall): string {
      const app = getActiveApp(stall.id, getStoredApplications());
      if (app?.status === "approved") return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Occupied)`;
      if (app?.status === "pending") return `<strong>${stall.stall_name}</strong> · ${app.businessName} (Pending)`;
      return `<strong>${stall.stall_name}</strong> · Vacant`;
    }

    function addStallToFG(stall: StoredStall) {
      const paths: L.Path[] = [];
      const color = stallColor(stall.id);
      const geo = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry as GeoJSON.Geometry },
        { style: { color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.2 } }
      );
      geo.eachLayer((l) => {
        const path = l as L.Path;
        (path as any)._stallId = stall.id;
        (path as any)._stallName = stall.stall_name;
        path.bindTooltip(stallTooltip(stall), { direction: "top", opacity: 0.95 });
        path.on("click", () => cbRef.current.onSelectStall(stall.id));
        fg.addLayer(path);
        paths.push(path);
      });
      layersMap.set(stall.id, paths);
    }

    initialStalls.forEach(addStallToFG);

    apiRef.current = {
      // Show toolbar without auto-starting any draw — user picks the shape
      showDrawToolbar: () => {
        ensureControl();
        toolbarForDraw = true;
      },
      hideDrawToolbar: () => {
        toolbarForDraw = false;
        removeControlIfIdle();
      },
      addStall: (stall) => addStallToFG(stall),
      highlightStall: (id) => {
        layersMap.forEach((paths, stallId) => {
          const sel = stallId === id;
          const baseColor = stallColor(stallId);
          paths.forEach((p) => (p as any).setStyle({
            color: sel ? "#1d4ed8" : baseColor,
            fillColor: sel ? "#1d4ed8" : baseColor,
            fillOpacity: sel ? 0.35 : 0.2,
            weight: sel ? 3 : 2,
          }));
        });
      },
      enableEditMode: () => { ensureControl(); inEditMode = true; },
      disableEditMode: () => {
        inEditMode = false;
        removeControlIfIdle();
        cbRef.current.onEditModeStop();
      },
    };

    const onDrawCreated = (e: L.LeafletEvent) => cbRef.current.onCreated((e as L.DrawEvents.Created).layer);

    const onDrawEdited = (e: L.LeafletEvent) => {
      const updates: Array<{ id: string; geometry: object }> = [];
      (e as L.DrawEvents.Edited).layers.eachLayer((l: any) => {
        if (l._stallId) updates.push({ id: l._stallId, geometry: l.toGeoJSON().geometry });
      });
      if (updates.length > 0) cbRef.current.onEdited(updates);
    };

    const onDrawDeleted = (e: L.LeafletEvent) => {
      const ids: string[] = [];
      (e as L.DrawEvents.Deleted).layers.eachLayer((l: any) => {
        if (l._stallId) { ids.push(l._stallId); layersMap.delete(l._stallId); }
      });
      if (ids.length > 0) cbRef.current.onDeleted(ids);
    };

    // After a draw completes/cancels, hide the toolbar
    const onDrawStop = () => { toolbarForDraw = false; removeControlIfIdle(); };
    const onEditStop = () => { inEditMode = false; removeControlIfIdle(); cbRef.current.onEditModeStop(); };

    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on("draw:drawstop", onDrawStop);
    map.on("draw:editstop", onEditStop);
    map.on("draw:deletestop", onEditStop);

    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off("draw:drawstop", onDrawStop);
      map.off("draw:editstop", onEditStop);
      map.off("draw:deletestop", onEditStop);
      if (mainControl) { try { map.removeControl(mainControl); } catch { /* ignore */ } }
      map.removeLayer(fg);
      apiRef.current = null;
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Contract Info Modal ───────────────────────────────────────────────────────
const TERM_MAP: Record<string, string> = {
  "6": "6 Months", "12": "1 Year", "24": "2 Years", "36": "3 Years",
};

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StallContractModal({
  stall, app, onClose,
}: {
  stall: StoredStall;
  app: StoredApplication;
  onClose: () => void;
}) {
  const days = app.status === "approved" ? daysUntilExpiry(app.contractEnd) : null;
  const isExpired = days !== null && days < 0;
  const isExpiringSoon = days !== null && days >= 0 && days <= 30;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between border-b ${
          app.status === "approved" ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-100"
          : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              app.status === "approved" ? "bg-gradient-to-br from-red-500 to-red-600"
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

        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-5 space-y-4">
          {/* Expiry banner */}
          {days !== null && (
            <div className={`rounded-xl p-3.5 border flex items-center gap-3 ${
              isExpired ? "bg-red-50 border-red-200"
              : isExpiringSoon ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isExpired ? "bg-red-100" : isExpiringSoon ? "bg-amber-100" : "bg-emerald-100"
              }`}>
                {isExpired ? <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
                : isExpiringSoon ? <Clock className="w-4.5 h-4.5 text-amber-600" />
                : <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isExpired ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-emerald-700"}`}>
                  {isExpired ? `Contract Expired · ${Math.abs(days)} days overdue`
                  : isExpiringSoon ? `Expiring in ${days} day${days !== 1 ? "s" : ""}`
                  : `Active · ${days} days remaining`}
                </p>
                <p className="text-xs text-gray-500">Expires {fmtDate(app.contractEnd)}</p>
              </div>
            </div>
          )}

          {/* Tenant */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Tenant</p>
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Business</p>
                  <p className="text-sm font-semibold text-gray-900">{app.businessName} · {app.businessType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-semibold text-gray-900">{app.applicantAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contract */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Contract</p>
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Term</span>
                <span className="font-semibold text-gray-900">{TERM_MAP[app.contractTermMonths] ?? `${app.contractTermMonths} mo.`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Start</span>
                <span className="font-semibold text-gray-900">{fmtDate(app.contractStart)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">End / Expiry</span>
                <span className={`font-semibold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
                  {fmtDate(app.contractEnd)}
                </span>
              </div>
              {days !== null && (
                <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Days Remaining</span>
                  <span className={`font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-emerald-600"}`}>
                    {isExpired ? `${Math.abs(days)} days overdue` : `${days} days`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {app.permitFileName && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Submitted Documents</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <FileText className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{app.permitFileName}</p>
                    <p className="text-[10px] text-gray-500">Business Permit{app.permitFileSize ? ` · ${app.permitFileSize}` : ""}</p>
                  </div>
                </div>
                {app.additionalFileName && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
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
  );
}

// ── FlyTo ────────────────────────────────────────────────────────────────────
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    if (!target) return;
    const key = `${target[0]},${target[1]}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo(target, Math.max(map.getZoom(), 20), { duration: 0.8 });
  }, [target, map]);
  return null;
}

// ── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Stall form ────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  "Food & Beverage", "Retail", "Services", "Hardware",
  "Pharmacy", "Electronics", "General", "Vegetables", "Meat & Seafood", "Fruits",
];

interface StallFields { stall_name: string; section: string; floor: "1" | "2"; floor_area: string; business_type: string; notes: string; }

function StallForm({ title, subtitle, initialValues, defaultFloor, onSave, onCancel }: {
  title: string; subtitle: string; initialValues?: Partial<StallFields>; defaultFloor?: "1" | "2";
  onSave: (f: StallFields) => void; onCancel: () => void;
}) {
  const [stallName, setStallName] = useState(initialValues?.stall_name ?? "");
  const [section, setSection] = useState(initialValues?.section ?? "A");
  const [floor, setFloor] = useState<"1" | "2">(initialValues?.floor ?? defaultFloor ?? "1");
  const [floorArea, setFloorArea] = useState(initialValues?.floor_area ?? "");
  const [businessType, setBusinessType] = useState(initialValues?.business_type ?? "General");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (stallName.trim()) onSave({ stall_name: stallName.trim(), section, floor, floor_area: floorArea, business_type: businessType, notes }); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stall Name <span className="text-red-500">*</span></label>
            <input type="text" value={stallName} onChange={(e) => setStallName(e.target.value)} placeholder="e.g. Stall A-201" required autoFocus
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all">
                {["A","B","C","D","E","F"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Floor</label>
              <div className="flex gap-2">
                {(["1","2"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setFloor(f)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      floor === f
                        ? "bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white border-transparent shadow-md"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#14B8A6]"
                    }`}>
                    {f === "1" ? "1st Floor" : "2nd Floor"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Floor Area</label>
              <div className="flex gap-1 mb-1.5">
                {[{ label: "S", value: "10 sqm", title: "Small – 10 sqm" }, { label: "M", value: "25 sqm", title: "Medium – 25 sqm" }, { label: "L", value: "50 sqm", title: "Large – 50 sqm" }].map((t) => (
                  <button key={t.label} type="button" title={t.title} onClick={() => setFloorArea(t.value)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      floorArea === t.value
                        ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#14B8A6]"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <input type="text" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} placeholder="e.g. 25 sqm"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type</label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all">
                {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all resize-none" />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-teal-50 rounded-xl border border-teal-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#14B8A6] rounded-full" />
              <span className="text-xs font-medium text-teal-700">Status: <strong>Vacant</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">{floor === "1" ? "1st Floor" : "2nd Floor"}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={!stallName.trim()} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Save Stall</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Perimeter overlay ─────────────────────────────────────────────────────────
function PerimeterLayer({ geometry }: { geometry: object }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(
      { type: "Feature", properties: {}, geometry: geometry as GeoJSON.Geometry },
      { style: { color: "#7c3aed", weight: 3, opacity: 0.7, fillColor: "#7c3aed", fillOpacity: 0.04, dashArray: "8 4" } }
    );
    map.addLayer(layer);
    return () => { map.removeLayer(layer); };
  }, [map, geometry]);
  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export function AdminMapView() {
  const perimeter = getPerimeter();
  const [storedStalls, setStoredStalls] = useState<StoredStall[]>(() => getStoredStalls());
  const [applications, setApplications] = useState<StoredApplication[]>(() => getStoredApplications());
  const [contractModal, setContractModal] = useState<{ stall: StoredStall; app: StoredApplication } | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);
  const [editingStall, setEditingStall] = useState<StoredStall | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [activeFloor, setActiveFloor] = useState<"1" | "2">("1");

  const drawApiRef = useRef<DrawControlAPI | null>(null);
  const floorStalls = storedStalls.filter((s) => s.floor === activeFloor);
  const floorStallIds = new Set(floorStalls.map((s) => s.id));
  const selectedStall = storedStalls.find((s) => s.id === selectedStallId) ?? null;

  const handleSelectStall = useCallback((stallId: string) => {
    setSelectedStallId(stallId);
    drawApiRef.current?.highlightStall(stallId);
    const stall = getStoredStalls().find((s) => s.id === stallId);
    if (stall) {
      const center = getGeometryCentroid(stall.geometry);
      if (center) setFlyToTarget(center);
    }
  }, []);

  // Check if a layer is within the perimeter boundary
  const isWithinPerimeter = useCallback((layer: L.Layer): boolean => {
    if (!perimeter) return true; // If no perimeter set, allow anywhere

    try {
      const stallGeoJson = (layer as any).toGeoJSON() as GeoJSON.Feature;
      const perimeterLayer = L.geoJSON({ type: "Feature", properties: {}, geometry: perimeter.geometry as GeoJSON.Geometry });
      const stallLayer = L.geoJSON(stallGeoJson);

      // Check if all points of the stall polygon are within the perimeter
      let allPointsInside = true;
      stallLayer.eachLayer((l: any) => {
        if (l.getLatLngs) {
          const coords = l.getLatLngs()[0];
          coords.forEach((coord: L.LatLng) => {
            let inside = false;
            perimeterLayer.eachLayer((pLayer: any) => {
              if (pLayer.getBounds && pLayer.getBounds().contains(coord)) {
                // More precise check using ray casting
                if (pLayer.getLatLngs) {
                  const polyCoords = pLayer.getLatLngs()[0];
                  if (isPointInPolygon(coord, polyCoords)) {
                    inside = true;
                  }
                }
              }
            });
            if (!inside) allPointsInside = false;
          });
        }
      });

      return allPointsInside;
    } catch (error) {
      console.error("Boundary check error:", error);
      return true; // On error, allow the operation
    }
  }, [perimeter]);

  // Ray casting algorithm for point-in-polygon test
  function isPointInPolygon(point: L.LatLng, polygon: L.LatLng[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  const handleDrawCreated = useCallback((layer: L.Layer) => {
    // Validate that the stall is within the perimeter
    if (!isWithinPerimeter(layer)) {
      showToast("Stall must be drawn within the market perimeter boundary.", "error");
      return; // Don't set pending layer if outside boundary
    }
    setPendingLayer(layer);
  }, [isWithinPerimeter]);

  const handleFormSave = (fields: StallFields) => {
    if (!pendingLayer) return;
    const geoJson = (pendingLayer as any).toGeoJSON() as GeoJSON.Feature;
    const saved = saveStoredStall({
      stall_name: fields.stall_name, status: "vacant", owner_name: null,
      business_type: fields.business_type, section: fields.section,
      floor: fields.floor, floor_area: fields.floor_area, notes: fields.notes, geometry: geoJson.geometry,
    });
    setStoredStalls((prev) => [...prev, saved]);
    if (saved.floor === activeFloor) {
      drawApiRef.current?.addStall(saved);
    }
    setPendingLayer(null);
  };

  const refreshAll = () => {
    setStoredStalls(getStoredStalls());
    setApplications(getStoredApplications());
  };

  const handleEdited = useCallback((updates: Array<{ id: string; geometry: object }>) => {
    // Validate each edited stall is still within perimeter
    for (const update of updates) {
      const layer = L.geoJSON({ type: "Feature", properties: {}, geometry: update.geometry as GeoJSON.Geometry });
      let isValid = true;
      layer.eachLayer((l) => {
        if (!isWithinPerimeter(l)) {
          isValid = false;
        }
      });
      if (!isValid) {
        showToast("Stall cannot be moved outside the market perimeter boundary.", "error");
        refreshAll(); // Revert changes by refreshing from storage
        return;
      }
    }
    updates.forEach(({ id, geometry }) => updateStoredStallGeometry(id, geometry));
    refreshAll();
  }, [isWithinPerimeter]);

  const handleDeleted = useCallback((ids: string[]) => {
    ids.forEach((id) => deleteStoredStall(id));
    refreshAll();
    setSelectedStallId((prev) => (prev && ids.includes(prev) ? null : prev));
  }, []);

  const handleDeleteStall = (id: string) => {
    deleteStoredStall(id);
    setStoredStalls((prev) => prev.filter((s) => s.id !== id));
    setSelectedStallId(null);
    drawApiRef.current?.highlightStall(null);
  };

  const handleEditInfoSave = (fields: StallFields) => {
    if (!editingStall) return;
    updateStoredStall(editingStall.id, { stall_name: fields.stall_name, section: fields.section, floor: fields.floor, floor_area: fields.floor_area, business_type: fields.business_type, notes: fields.notes });
    setStoredStalls(getStoredStalls());
    setEditingStall(null);
  };

  const handleCreateStall = () => {
    if (!perimeter) return;
    setIsToolbarVisible(true);
    drawApiRef.current?.showDrawToolbar();
  };

  const handleCancelDraw = () => {
    setIsToolbarVisible(false);
    drawApiRef.current?.hideDrawToolbar();
  };

  // Precompute detail-panel vars to avoid IIFE in JSX
  const detailApp = selectedStall ? getActiveApp(selectedStall.id, applications) : null;
  const detailIsOccupied = detailApp?.status === "approved";
  const detailIsPending  = detailApp?.status === "pending";
  const detailHeroBg  = detailIsOccupied ? "from-red-50 to-rose-50" : detailIsPending ? "from-amber-50 to-yellow-50" : "from-green-50 to-teal-50";
  const detailIconBg  = detailIsOccupied ? "from-red-500 to-red-600" : detailIsPending ? "from-amber-400 to-orange-500" : "from-green-500 to-green-600";
  const detailBadge   = detailIsOccupied
    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" />Occupied</span>
    : detailIsPending
    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Pending</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" />Vacant</span>;

  // Live counts for header (floor-specific)
  const floorOccupied = applications.filter((a) => a.status === "approved" && floorStallIds.has(a.stallId)).length;
  const floorPending  = applications.filter((a) => a.status === "pending" && floorStallIds.has(a.stallId)).length;
  const subtitleText  = storedStalls.length === 0
    ? "No stalls yet"
    : floorStalls.length === 0
    ? `No stalls on ${activeFloor === "1" ? "1st" : "2nd"} Floor`
    : `${floorStalls.length} stall${floorStalls.length !== 1 ? "s" : ""} · ${floorOccupied} occupied · ${floorPending} pending`;

  return (
    <div className="flex h-full relative">
      <style>{EXTRA_CSS}</style>

      {/* ── Map (full area) ──────────────────────────── */}
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
          <DrawControl
            key={activeFloor}
            initialStalls={floorStalls}
            apiRef={drawApiRef}
            onCreated={handleDrawCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            onSelectStall={handleSelectStall}
            onToolbarHidden={() => setIsToolbarVisible(false)}
            onEditModeStop={() => setIsEditMode(false)}
          />
          {perimeter && <PerimeterLayer geometry={perimeter.geometry} />}
          <FlyTo target={flyToTarget} />
        </MapContainer>

        {/* ── Top-center: Floor Switcher ── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <FloorSwitcher
            floor={activeFloor}
            onChange={(f) => { setActiveFloor(f); setSelectedStallId(null); }}
            counts={{ 1: storedStalls.filter((s) => s.floor === "1").length, 2: storedStalls.filter((s) => s.floor === "2").length }}
          />
        </div>

        {/* ── Bottom-left: Legend + Create Stall button ── */}
        <div className="absolute bottom-5 left-5 z-[1000] flex flex-col gap-2 items-start">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Legend</p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-4 rounded border-2 border-green-500 bg-green-500/20" />
              <span className="text-xs font-medium text-gray-700">Vacant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-4 rounded border-2 border-amber-400 bg-amber-400/20" />
              <span className="text-xs font-medium text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-4 rounded border-2 border-red-500 bg-red-500/20" />
              <span className="text-xs font-medium text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-4 rounded border-2 border-gray-400 bg-gray-400/20" />
              <span className="text-xs font-medium text-gray-700">Unavailable</span>
            </div>
          </div>

          {/* Perimeter required notice or Create / Cancel button */}
          {!perimeter ? (
            <div className="bg-white rounded-xl shadow-lg border border-amber-200 px-4 py-3 max-w-52">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">No market perimeter set</p>
                  <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                    Super Admin must define the market boundary before stalls can be created.
                  </p>
                </div>
              </div>
            </div>
          ) : isToolbarVisible ? (
            <button
              onClick={handleCancelDraw}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium shadow-lg hover:bg-gray-50 transition-all"
            >
              <X className="w-4 h-4 text-red-500" />
              Cancel Drawing
            </button>
          ) : (
            <button
              onClick={handleCreateStall}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Create New Stall
            </button>
          )}
        </div>

        {/* Edit mode banner */}
        {isEditMode && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5" />
            Edit mode — drag vertices to reshape stalls
            <button onClick={() => { drawApiRef.current?.disableEditMode(); setIsEditMode(false); }}
              className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Stall list + details ────────── */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-sm z-10">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Stalls</p>
                <p className="text-xs text-gray-500">{subtitleText}</p>
              </div>
            </div>
            {selectedStall && (
              <button onClick={() => { setSelectedStallId(null); drawApiRef.current?.highlightStall(null); }}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {storedStalls.length > 0 && !selectedStall && (
            <button
              onClick={() => { drawApiRef.current?.enableEditMode(); setIsEditMode(true); }}
              className="w-full mt-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-[#14B8A6]" />
              Edit Stall Shapes
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!selectedStall ? (
            /* ── Stall list ── */
            storedStalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <PenLine className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No stalls drawn yet</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {perimeter
                    ? 'Click "Create New Stall" on the map to draw stall boundaries.'
                    : "Super Admin must set the market perimeter before stalls can be created."}
                </p>
              </div>
            ) : floorStalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Layers className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No stalls on {activeFloor === "1" ? "1st" : "2nd"} Floor</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Switch floors or draw stalls here.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {floorStalls.map((stall) => {
                  const app = getActiveApp(stall.id, applications);
                  const isOccupied = app?.status === "approved";
                  const isPending = app?.status === "pending";
                  const iconBg = isOccupied ? "from-red-500 to-red-600" : isPending ? "from-amber-400 to-orange-500" : "from-green-500 to-green-600";
                  const badge = isOccupied
                    ? <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium flex-shrink-0">Occupied</span>
                    : isPending
                    ? <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium flex-shrink-0">Pending</span>
                    : <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">Vacant</span>;
                  return (
                    <button key={stall.id} onClick={() => handleSelectStall(stall.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${selectedStallId === stall.id ? "bg-teal-50 ring-1 ring-[#14B8A6]/30" : "hover:bg-gray-50"}`}>
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{stall.stall_name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {app ? app.businessName : `Sec. ${stall.section} · ${stall.business_type}`}
                        </p>
                      </div>
                      {badge}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* ── Stall detail ── */
            <div className="p-4 space-y-4">
              {/* Compact horizontal stall header */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${detailHeroBg} border border-gray-100`}>
                <div className={`w-10 h-10 bg-gradient-to-br ${detailIconBg} rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm`}>
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{selectedStall.stall_name}</p>
                  <div className="mt-0.5">{detailBadge}</div>
                  {detailApp && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{detailApp.businessName} · {detailApp.applicantName}</p>
                  )}
                </div>
              </div>

              {/* Key/value info rows */}
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                <div className="flex items-start gap-3 px-3.5 py-2.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Section</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">
                      Section {selectedStall.section}{selectedStall.floor_area ? ` · ${selectedStall.floor_area}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-3.5 py-2.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Business Type</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{selectedStall.business_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-3.5 py-2.5">
                  <Layers className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Floor</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{selectedStall.floor === "1" ? "1st Floor" : "2nd Floor"}</p>
                  </div>
                </div>
                {selectedStall.notes && (
                  <div className="flex items-start gap-3 px-3.5 py-2.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notes</p>
                      <p className="text-xs font-medium text-gray-800 mt-0.5">{selectedStall.notes}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 px-3.5 py-2.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Created</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">
                      {new Date(selectedStall.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary action: View Contract / Pending Application */}
              {detailApp && (
                <button
                  onClick={() => setContractModal({ stall: selectedStall, app: detailApp })}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    detailIsOccupied
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-red-500/30 hover:shadow-md"
                      : "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-amber-500/30 hover:shadow-md"
                  }`}
                >
                  <ScrollText className="w-4 h-4" />
                  {detailIsOccupied ? "View Contract & Tenant" : "View Pending Application"}
                </button>
              )}

              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditingStall(selectedStall)}
                  className="py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#14B8A6]" />
                  Edit Info
                </button>
                <button
                  onClick={() => handleDeleteStall(selectedStall.id)}
                  className="py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────── */}
      {pendingLayer && (
        <StallForm title="New Stall" subtitle="Fill in the stall details"
          defaultFloor={activeFloor}
          onSave={handleFormSave} onCancel={() => setPendingLayer(null)} />
      )}
      {editingStall && (
        <StallForm title="Edit Stall Info" subtitle="Update the stall details"
          initialValues={editingStall}
          onSave={handleEditInfoSave} onCancel={() => setEditingStall(null)} />
      )}
      {contractModal && (
        <StallContractModal
          stall={contractModal.stall}
          app={contractModal.app}
          onClose={() => setContractModal(null)}
        />
      )}
    </div>
  );
}
