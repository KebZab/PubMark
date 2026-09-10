import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMapFacilities } from "../hooks/useMapFacilities";
import { useStalls } from "../hooks/useStalls";
import { createMapFacility, deleteMapFacility, updateMapFacility } from "../services/mapFacilitiesApi";
import { FACILITY_META, FacilityIcon, MapFacilitiesLayer, stallFloaterHtml } from "./MapFacilitiesLayer";
import { registerMapFloater } from "./mapFloaterDeclutter";
import { FloorSwitcher } from "./FloorSwitcher";
import { showToast } from "./Toast";

const EMPTY_FORM = { type: "entrance", floor: "1", connectedFloors: [], isAccessible: false, notes: "" };

function StallContextLayer({ stalls, floor }) {
  const map = useMap();
  useEffect(() => {
    const group = L.featureGroup().addTo(map);
    const unregister = [];
    stalls.filter((stall) => stall.floor === floor).forEach((stall) => {
      if (stall.geometry?.type !== "Polygon") return;
      const layer = L.geoJSON(
        { type: "Feature", properties: {}, geometry: stall.geometry },
        { interactive: false, style: { color: "#64748b", fillColor: "#94a3b8", weight: 2, opacity: 0.9, fillOpacity: 0.2 } },
      );
      layer.bindTooltip(stallFloaterHtml(stall.stall_name, "#64748b"), {
        permanent: true,
        direction: "center",
        className: "vendor-stall-floater facility-editor-stall-label",
        interactive: false,
      });
      layer.addTo(group);
      unregister.push(registerMapFloater(map, layer));
    });
    return () => {
      unregister.forEach((remove) => remove());
      map.removeLayer(group);
    };
  }, [map, stalls, floor]);
  return <style>{`
    .leaflet-tooltip.facility-editor-stall-label {
      padding: 2px 4px; border: 1px solid rgba(255,255,255,.9); border-radius: 999px;
      background: rgba(30,41,59,.82); color: white; box-shadow: 0 2px 6px rgba(15,23,42,.18);
      font: 700 8px/1.05 ui-sans-serif,system-ui,sans-serif; letter-spacing: .01em;
    }
    .leaflet-tooltip.facility-editor-stall-label::before { display: none; }
  `}</style>;
}

function DrawFacility({ type, onGeometry }) {
  const map = useMap();
  useEffect(() => {
    const drafts = new L.FeatureGroup().addTo(map);
    const meta = FACILITY_META[type] ?? FACILITY_META.entrance;
    const draftIcon = L.divIcon({ className: "", html: `<div class="facility-editor-draft-icon" style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:${meta.color};color:white;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)">${meta.icon}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
    const drawsArea = ["cr", "office", "technical_room"].includes(type);
    const control = new L.Control.Draw({
      position: "topleft",
      draw: {
        marker: !drawsArea ? { icon: draftIcon } : false,
        polygon: drawsArea ? { allowIntersection: false, showArea: true } : false,
        rectangle: false, polyline: false, circle: false, circlemarker: false,
      },
      edit: { featureGroup: drafts, edit: false, remove: false },
    });
    map.addControl(control);
    const created = (event) => {
      drafts.clearLayers();
      drafts.addLayer(event.layer);
      onGeometry(event.layer.toGeoJSON().geometry);
    };
    map.on(L.Draw.Event.CREATED, created);
    return () => { map.off(L.Draw.Event.CREATED, created); map.removeControl(control); map.removeLayer(drafts); };
  }, [map, type, onGeometry]);
  return null;
}

function EditFacilityGeometry({ facility, onSaved }) {
  const map = useMap();
  useEffect(() => {
    if (!facility) return undefined;
    const group = L.featureGroup().addTo(map);
    const editIcon = L.divIcon({ className: "", html: '<div style="width:26px;height:26px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
    const layer = L.geoJSON({ type: "Feature", properties: {}, geometry: facility.geometry }, { pointToLayer: (_feature, latlng) => L.marker(latlng, { icon: editIcon }) });
    layer.eachLayer((item) => group.addLayer(item));
    const control = new L.Control.Draw({ position: "topleft", draw: false, edit: { featureGroup: group, remove: false } });
    map.addControl(control);
    if (group.getBounds().isValid()) map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 20 });
    const edited = async (event) => {
      const changed = event.layers.getLayers()[0];
      if (!changed) return;
      try { await onSaved(changed.toGeoJSON().geometry); }
      catch (error) { showToast(error.message, "error"); }
    };
    map.on(L.Draw.Event.EDITED, edited);
    return () => { map.off(L.Draw.Event.EDITED, edited); map.removeControl(control); map.removeLayer(group); };
  }, [map, facility, onSaved]);
  return null;
}

export function FacilityMapEditor() {
  const [floor, setFloor] = useState("1");
  const { facilities, loading, refetch } = useMapFacilities(floor);
  const { stalls, loading: stallsLoading } = useStalls();
  const [form, setForm] = useState(EMPTY_FORM);
  const [geometry, setGeometry] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm({ ...EMPTY_FORM, floor }); setGeometry(null); setEditing(null); };
  const handleGeometry = useCallback((value) => setGeometry(value), []);
  const handleEditedGeometry = useCallback(async (value) => {
    if (!editing) return;
    await updateMapFacility(editing.id, { geometry: value });
    setEditing((current) => ({ ...current, geometry: value }));
    await refetch();
    showToast("Facility position updated.", "success");
  }, [editing, refetch]);

  function beginEdit(item) {
    setEditing(item); setGeometry(null);
    setForm({ type: item.type, floor: item.floor, connectedFloors: item.connectedFloors ?? [], isAccessible: item.isAccessible, notes: item.notes ?? "" });
  }

  async function save() {
    const targetGeometry = editing?.geometry ?? geometry;
    const drawsArea = ["cr", "office", "technical_room"].includes(form.type);
    if (!targetGeometry) return showToast(`Draw or place the ${drawsArea ? "facility area" : "marker"} on the map first.`, "error");
    setSaving(true);
    try {
      const payload = { ...form, notes: form.notes.trim(), geometry: targetGeometry };
      if (editing) await updateMapFacility(editing.id, payload); else await createMapFacility(payload);
      await refetch(); reset(); showToast(`Facility ${editing ? "updated" : "created"}.`, "success");
    } catch (error) { showToast(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete this ${FACILITY_META[item.type]?.label ?? "facility"}?`)) return;
    try { await deleteMapFacility(item.id); if (editing?.id === item.id) reset(); await refetch(); showToast("Facility deleted.", "success"); }
    catch (error) { showToast(error.message, "error"); }
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex-1">
        {(loading || stallsLoading) && <div className="absolute inset-0 z-[1100] grid place-items-center bg-white/60 pointer-events-none"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>}
        <MapContainer center={[10.6054, 123.0413]} zoom={18} maxZoom={22} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" maxNativeZoom={19} maxZoom={22} />
          <StallContextLayer stalls={stalls} floor={floor} />
          {!editing && <MapFacilitiesLayer facilities={facilities} />}
          {editing ? <EditFacilityGeometry facility={editing} onSaved={handleEditedGeometry} /> : <DrawFacility type={form.type} onGeometry={handleGeometry} />}
        </MapContainer>
        <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-xl border bg-white px-4 py-2 text-xs font-medium shadow-lg">
          {editing ? "Use the edit tool to move or reshape this facility; gray areas are stalls" : ["cr", "office", "technical_room"].includes(form.type) ? `Draw the ${FACILITY_META[form.type].label} footprint without overlapping the gray stalls` : `Place the ${FACILITY_META[form.type].label} marker outside the gray stalls`}
        </div>
      </div>

      <aside className="flex w-96 flex-col border-l bg-white">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">{editing ? "Edit Facility" : "New Facility"}</h3>{editing && <button onClick={reset}><X className="h-4 w-4" /></button>}</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(FACILITY_META).map(([type, meta]) => <button key={type} disabled={Boolean(editing)} onClick={() => { setField("type", type); setGeometry(null); }} className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold ${form.type === type ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200"}`}><FacilityIcon type={type} className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" />{meta.label}</button>)}
          </div>
          <FloorSwitcher floor={form.floor} onChange={(value) => { setField("floor", value); setFloor(value); }} />
          {form.type === "stairs" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.connectedFloors.includes(form.floor === "1" ? "2" : "1")} onChange={(e) => setField("connectedFloors", e.target.checked ? [form.floor === "1" ? "2" : "1"] : [])} />Connects to floor {form.floor === "1" ? "2" : "1"}</label>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isAccessible} onChange={(e) => setField("isAccessible", e.target.checked)} />Accessible</label>
          <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full resize-none rounded-lg border px-3 py-2 text-sm" />
          <button disabled={saving} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editing ? "Save details" : "Add facility"}</button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between"><strong className="text-sm">Facilities on {floor}F</strong><FloorSwitcher floor={floor} onChange={(value) => { setFloor(value); if (!editing) setField("floor", value); }} /></div>
          {facilities.map((item) => <div key={item.id} className="rounded-xl border p-3"><div className="flex items-start gap-2"><FacilityIcon type={item.type} className="grid h-7 min-w-7 place-items-center rounded-full p-1.5 text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" style={{ backgroundColor: FACILITY_META[item.type].color }} /><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{FACILITY_META[item.type].label}</div><div className="text-xs text-gray-500">{item.floor}F{item.connectedFloors?.length ? ` ↔ ${item.connectedFloors.join(", ")}F` : ""}</div></div><button title="Edit" onClick={() => beginEdit(item)}><Pencil className="h-4 w-4 text-blue-600" /></button><button title="Delete" onClick={() => remove(item)}><Trash2 className="h-4 w-4 text-red-600" /></button></div></div>)}
          {!facilities.length && !loading && <p className="py-8 text-center text-sm text-gray-400">No facilities on this floor.</p>}
        </div>
      </aside>
    </div>
  );
}
