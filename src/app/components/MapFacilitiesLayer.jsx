import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { registerMapFloater } from "./mapFloaterDeclutter";

export const FACILITY_META = {
  entrance: { label: "Entrance", color: "#16a34a", icon: '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></svg>' },
  cr: { label: "CR", color: "#db2777", icon: '<svg viewBox="0 0 24 24"><circle cx="7" cy="4" r="2"/><path d="M5 22v-7H3l2-7h4l2 7H9v7M17 22v-6m0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-3 2h6v6h-2"/></svg>' },
  stairs: { label: "Stairs", color: "#7c3aed", icon: '<svg viewBox="0 0 24 24"><path d="M3 19h5v-4h4v-4h4V7h5M15 3l3-2 3 2M18 1v5"/></svg>' },
  office: { label: "Office", color: "#ea580c", icon: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg>' },
  technical_room: { label: "Technical Room", color: "#2563eb", icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17l3 3 8.3-8.3a4 4 0 0 0 5-5L18 9l-2.4-2.4 2.3-2.3a4 4 0 0 0-3.2 2z"/></svg>' },
};

const FACILITY_LABEL_CSS = `
  .leaflet-tooltip.facility-area-label {
    border: 0 !important;
    border-radius: 999px !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: 0 5px 14px rgba(15, 23, 42, .24) !important;
  }
  .leaflet-tooltip.facility-area-label::before { display: none !important; }
  .facility-floater {
    display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;
  }
  .facility-floater-icon {
    display: grid; place-items: center; width: 22px; height: 22px; border: 1.5px solid white;
    border-radius: 999px; color: white; box-shadow: 0 2px 7px rgba(0,0,0,.3);
  }
  .facility-floater-icon svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .facility-editor-draft-icon svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .facility-floater-text {
    padding: 2px 5px; border: 1px solid rgba(15,23,42,.12); border-radius: 4px;
    background: rgba(255,255,255,.96); color: #111827; box-shadow: 0 1px 4px rgba(0,0,0,.2);
    font: 700 9px/1.1 ui-sans-serif,system-ui,sans-serif;
  }
  .leaflet-tooltip.vendor-stall-floater {
    padding: 2px 4px; border: 1px solid rgba(255,255,255,.92); border-radius: 999px;
    background: rgba(30,41,59,.88); color: white; box-shadow: 0 2px 7px rgba(15,23,42,.24);
    font: 700 8px/1.05 ui-sans-serif,system-ui,sans-serif;
  }
  .leaflet-tooltip.vendor-stall-floater::before { display: none; }
  .vendor-stall-floater-content { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .vendor-stall-status-dot { width: 5px; height: 5px; border: 1px solid rgba(255,255,255,.8); border-radius: 50%; }
  .leaflet-tooltip.floater-compact.vendor-stall-floater {
    width: 14px; height: 14px; min-width: 14px; box-sizing: border-box; padding: 2px;
    display: grid; place-items: center; overflow: hidden; border-radius: 50%;
  }
  .floater-compact .vendor-stall-floater-content { font-size: 0; gap: 0; }
  .floater-compact .vendor-stall-status-dot { width: 8px; height: 8px; flex: 0 0 8px; }
  .map-facility-marker.floater-compact .facility-floater-text,
  .leaflet-tooltip.floater-compact .facility-floater-text { display: none; }
  .map-facility-marker.floater-compact { width: 22px !important; overflow: visible; }
`;

function facilityFloater(meta) {
  return `<span class="facility-floater"><span class="facility-floater-icon" style="background:${meta.color}">${meta.icon}</span><span class="facility-floater-text">${meta.label}</span></span>`;
}

export function FacilityIcon({ type, className = "", ...props }) {
  const meta = FACILITY_META[type] ?? FACILITY_META.entrance;
  return <span className={className} {...props} dangerouslySetInnerHTML={{ __html: meta.icon }} />;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function stallFloaterHtml(name, color) {
  return `<span class="vendor-stall-floater-content"><span class="vendor-stall-status-dot" style="background:${color}"></span>${escapeHtml(name)}</span>`;
}

function popupHtml(facility) {
  const meta = FACILITY_META[facility.type] ?? FACILITY_META.entrance;
  const connected = facility.type === "stairs" && facility.connectedFloors?.length
    ? `<div>Connects floors: <strong>${facility.connectedFloors.map(escapeHtml).join(", ")}</strong></div>`
    : "";
  return `<div style="min-width:150px;font-size:13px">
    <strong>${meta.label}</strong>
    <div style="color:${meta.color};font-weight:600;margin:4px 0">${meta.label} · ${escapeHtml(facility.floor)}F</div>
    ${connected}
    <div>${facility.isAccessible ? "Accessible" : "Not marked accessible"}</div>
    ${facility.notes ? `<div style="margin-top:5px;color:#4b5563">${escapeHtml(facility.notes)}</div>` : ""}
  </div>`;
}

function markerIcon(facility) {
  const meta = FACILITY_META[facility.type] ?? FACILITY_META.entrance;
  return L.divIcon({
    className: "map-facility-marker",
    html: facilityFloater(meta),
    iconSize: [90, 24],
    iconAnchor: [11, 12],
  });
}

export function MapFacilitiesLayer({ facilities = {}, fitBounds = false, onFacilityClick }) {
  const map = useMap();
  const list = Array.isArray(facilities) ? facilities : [];

  useEffect(() => {
    const group = L.featureGroup().addTo(map);
    const unregister = [];
    list.forEach((facility) => {
      const meta = FACILITY_META[facility.type] ?? FACILITY_META.entrance;
      let layer;
      if (facility.geometry?.type === "Point") {
        const [lng, lat] = facility.geometry.coordinates ?? [];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        layer = L.marker([lat, lng], { icon: markerIcon(facility), keyboard: true });
      } else if (facility.geometry?.type === "Polygon") {
        layer = L.geoJSON({ type: "Feature", properties: {}, geometry: facility.geometry }, {
          style: { color: meta.color, fillColor: meta.color, weight: 3, fillOpacity: 0.22 },
        });
        layer.bindTooltip(
          facilityFloater(meta),
          { permanent: true, direction: "center", className: `facility-area-label facility-${facility.type}-label` },
        );
      } else return;
      layer.bindPopup(popupHtml(facility));
      if (onFacilityClick) layer.on("click", () => onFacilityClick(facility));
      layer.addTo(group);
      unregister.push(registerMapFloater(map, layer, { kind: "facility" }));
    });
    if (fitBounds && group.getLayers().length && group.getBounds().isValid()) {
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 20 });
    }
    return () => {
      unregister.forEach((remove) => remove());
      map.removeLayer(group);
    };
  }, [map, list, fitBounds, onFacilityClick]);
  return <style>{FACILITY_LABEL_CSS}</style>;
}

export function MapFacilitiesLegend({ className = "", showStallStatuses = false, collapsible = showStallStatuses }) {
  const [open, setOpen] = useState(!collapsible);
  const content = (
    <>
      {showStallStatuses && <>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Stall status</p>
        <div className="flex items-center gap-2 text-xs text-gray-700"><span className="h-3 w-5 rounded border-2 border-[#14B8A6] bg-[#14B8A6]/20" />Available stall</div>
        <div className="flex items-center gap-2 text-xs text-gray-700"><span className="h-3 w-5 rounded border-2 border-amber-500 bg-amber-500/20" />Pending</div>
        <div className="flex items-center gap-2 text-xs text-gray-700"><span className="h-3 w-5 rounded border-2 border-gray-400 bg-gray-400/20" />Occupied by vendor</div>
        <div className="mb-2 flex items-center gap-2 border-b pb-2 text-xs text-gray-700"><span className="h-3 w-5 rounded border-2 border-indigo-500 bg-indigo-500/20" />Your stall</div>
      </>}
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Facilities</p>
      {Object.entries(FACILITY_META).map(([type, meta]) => (
        <div key={type} className="flex items-center gap-2 text-xs text-gray-700">
          <FacilityIcon type={type} className="grid h-5 min-w-5 place-items-center rounded-full p-1 text-white [&_svg]:h-3 [&_svg]:w-3 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" style={{ backgroundColor: meta.color }} />
          <span>{meta.label}</span>
        </div>
      ))}
    </>
  );

  if (collapsible) {
    return (
      <div className={`${className} !p-0 overflow-hidden`}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 ${open ? "border-b" : ""}`}
        >
          <span>Legend</span>
          <span className="text-gray-400">{open ? "−" : "+"}</span>
        </button>
        {open && <div className="space-y-1 px-3 py-2.5">{content}</div>}
      </div>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}
