import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

// Renders the SAME map as the web app: Leaflet 1.9.4 with OpenStreetMap tiles,
// inside a WebView. No Google Maps SDK and no API key, and stalls draw with the
// same colors as src/app/pages/UserMapDashboard.tsx.

// Mirrors stallStyle() in UserMapDashboard.tsx exactly.
function styleFor(input, selected) {
  if (input.userAppStatus === "approved") {
    return { color: selected ? "#4338ca" : "#6366f1", fillOpacity: selected ? 0.4 : 0.25 };
  }
  if (input.userAppStatus === "pending") {
    return { color: selected ? "#d97706" : "#f59e0b", fillOpacity: selected ? 0.4 : 0.25 };
  }
  if (input.occupied) {
    // Matches the admin map's occupied color exactly (AdminMapView.jsx's
    // stallColor()), so a stall reads the same whichever screen shows it.
    return { color: input.occupiedColor ?? (selected ? "#6b7280" : "#9ca3af"), fillOpacity: selected ? 0.4 : 0.25 };
  }
  // Someone (not necessarily this vendor) has an undecided application on
  // this stall — reads the same as "your pending", since the map has no
  // other way to distinguish "pending" from "your pending" at a glance.
  if (input.pending) {
    return { color: selected ? "#d97706" : "#f59e0b", fillOpacity: selected ? 0.4 : 0.25 };
  }
  return { color: selected ? "#0d9488" : "#14B8A6", fillOpacity: selected ? 0.35 : 0.2 };
}

// GeoJSON is [longitude, latitude]; Leaflet wants [latitude, longitude].
function toLatLngs(geometry) {
  const ring = geometry?.coordinates?.[0];
  if (!Array.isArray(ring)) return [];
  return ring
    .filter((c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map(([lng, lat]) => [lat, lng]);
}

function buildHtml(payload) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<!-- user-scalable=no stops the *page* from zooming, so pinch gestures reach
     Leaflet and zoom the map instead of the whole document. -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e5e7eb; }
  .leaflet-container { background: #e5e7eb; font-family: -apple-system, Roboto, sans-serif; }
  /* Bigger zoom buttons - the defaults are hard to hit with a thumb. */
  .leaflet-touch .leaflet-bar a { width: 36px; height: 36px; line-height: 36px; font-size: 20px; }
  .leaflet-tooltip.vendor-stall-floater {
    padding:2px 4px; border:1px solid rgba(255,255,255,.92); border-radius:999px;
    background:rgba(30,41,59,.88); color:white; box-shadow:0 2px 7px rgba(15,23,42,.24);
    font:700 8px/1.05 -apple-system,Roboto,sans-serif;
  }
  .leaflet-tooltip.vendor-stall-floater:before { display:none; }
  .vendor-stall-floater-content { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
  .vendor-stall-status-dot { width:5px; height:5px; border:1px solid rgba(255,255,255,.8); border-radius:50%; }
  .map-legend-shell { background:rgba(255,255,255,.96); border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.24); overflow:hidden; }
  .map-legend-toggle { border:0; background:white; padding:8px 11px; color:#374151; font:700 11px -apple-system,Roboto,sans-serif; }
  .map-legend-content { display:none; width:152px; padding:8px 10px 10px; color:#374151; font:500 10px/17px -apple-system,Roboto,sans-serif; }
  .map-legend-shell.open .map-legend-content { display:block; }
  .map-legend-shell.open .map-legend-toggle { width:100%; border-bottom:1px solid #e5e7eb; text-align:left; }
  .map-legend-title { margin:3px 0 2px; color:#9ca3af; font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
  .leaflet-tooltip.facility-area-label {
    padding: 0; border: 0; border-radius: 999px; background: transparent;
    box-shadow: 0 5px 14px rgba(15,23,42,.28);
  }
  .leaflet-tooltip.facility-area-label:before { display: none; }
  .facility-floater { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
  .facility-floater-icon {
    display:grid; place-items:center; width:24px; height:24px; box-sizing:border-box;
    border:1.5px solid white; border-radius:50%; color:white; box-shadow:0 2px 7px rgba(0,0,0,.32);
  }
  .facility-floater-icon svg { width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  .facility-floater-text {
    padding:2px 5px; border:1px solid rgba(15,23,42,.12); border-radius:4px;
    background:rgba(255,255,255,.97); color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.22);
    font:700 9px/1.1 -apple-system,Roboto,sans-serif;
  }
  .leaflet-tooltip.floater-compact.vendor-stall-floater {
    width:14px; height:14px; min-width:14px; box-sizing:border-box; padding:2px;
    display:grid; place-items:center; overflow:hidden; border-radius:50%;
  }
  .floater-compact .vendor-stall-floater-content { font-size:0; gap:0; }
  .floater-compact .vendor-stall-status-dot { width:8px; height:8px; flex:0 0 8px; }
  .floater-compact .facility-floater-text { display:none; }
  .map-facility-marker.floater-compact { width:24px !important; overflow:visible; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var send = function (msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  };

  try {
    var data = ${payload};

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: false,
      dragging: true,
      tap: true,
      minZoom: 3,
      maxZoom: 22
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var layers = {};
    var floaterEntries = [];
    var bounds = [];

    data.stalls.forEach(function (s) {
      if (!s.latlngs || s.latlngs.length < 3) return;
      var poly = L.polygon(s.latlngs, {
        color: s.style.color,
        fillColor: s.style.color,
        weight: 2,
        fillOpacity: s.style.fillOpacity
      }).addTo(map);

      poly.bindTooltip('<span class="vendor-stall-floater-content"><span class="vendor-stall-status-dot" style="background:' + s.style.color + '"></span>' + s.safeName + '</span>', { permanent: true, direction: 'center', className: 'vendor-stall-floater' });
      poly.on('click', function () { send({ type: 'select', id: s.id }); });

      var floaterEntry = { layer: poly, kind: 'stall', id: s.id, selected: false };
      layers[s.id] = { layer: poly, base: s.style, sel: s.selectedStyle, floater: floaterEntry };
      floaterEntries.push(floaterEntry);
      bounds = bounds.concat(s.latlngs);
    });

    var facilityMeta = {
      entrance: { label: 'Entrance', color: '#16a34a', icon: '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></svg>' },
      cr: { label: 'CR', color: '#db2777', icon: '<svg viewBox="0 0 24 24"><circle cx="7" cy="4" r="2"/><path d="M5 22v-7H3l2-7h4l2 7H9v7M17 22v-6m0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-3 2h6v6h-2"/></svg>' },
      stairs: { label: 'Stairs', color: '#7c3aed', icon: '<svg viewBox="0 0 24 24"><path d="M3 19h5v-4h4v-4h4V7h5M15 3l3-2 3 2M18 1v5"/></svg>' },
      office: { label: 'Office', color: '#ea580c', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/></svg>' }
    };
    var escapeHtml = function (value) { return String(value || '').replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[ch]; }); };
    data.facilities.forEach(function (facility) {
      var meta = facilityMeta[facility.type] || facilityMeta.entrance;
      var layer = null;
      if (facility.geometry && facility.geometry.type === 'Point') {
        var point = facility.geometry.coordinates;
        if (!point || point.length < 2) return;
        var icon = L.divIcon({
          className: 'map-facility-marker', iconSize: [96, 26], iconAnchor: [12, 13],
          html: '<span class="facility-floater"><span class="facility-floater-icon" style="background:' + meta.color + '">' + meta.icon + '</span><span class="facility-floater-text">' + meta.label + '</span></span>'
        });
        layer = L.marker([point[1], point[0]], { icon: icon }).addTo(map);
        bounds.push([point[1], point[0]]);
      } else if (facility.geometry && facility.geometry.type === 'Polygon') {
        var facilityLatLngs = (facility.geometry.coordinates[0] || []).map(function (p) { return [p[1], p[0]]; });
        if (facilityLatLngs.length < 3) return;
        layer = L.polygon(facilityLatLngs, { color: meta.color, fillColor: meta.color, weight: 3, fillOpacity: .22 }).addTo(map);
        layer.bindTooltip('<span class="facility-floater"><span class="facility-floater-icon" style="background:' + meta.color + '">' + meta.icon + '</span><span class="facility-floater-text">' + meta.label + '</span></span>', { permanent: true, direction: 'center', className: 'facility-area-label facility-' + facility.type + '-label' });
        bounds = bounds.concat(facilityLatLngs);
      }
      if (!layer) return;
      floaterEntries.push({ layer: layer, kind: 'facility', selected: false });
      var detail = '<strong>' + meta.label + '</strong><br>' + escapeHtml(facility.floor) + 'F';
      if (facility.connectedFloors.length) detail += '<br>Connects floors: ' + facility.connectedFloors.map(escapeHtml).join(', ');
      detail += '<br>' + (facility.isAccessible ? 'Accessible' : 'Not marked accessible');
      if (facility.notes) detail += '<br>' + escapeHtml(facility.notes);
      layer.bindPopup(detail);
      layer.on('click', function () { send({ type: 'facility', facility: facility }); });
    });

    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      var div = L.DomUtil.create('div', 'map-legend-shell');
      div.innerHTML = '<button class="map-legend-toggle" type="button">Legend +</button><div class="map-legend-content"><div class="map-legend-title">Stall status</div><span style="color:#14B8A6">●</span> Available<br><span style="color:#f59e0b">●</span> Pending<br><span style="color:#9ca3af">●</span> Occupied by vendor<br><span style="color:#6366f1">●</span> Your stall<div class="map-legend-title" style="margin-top:6px">Facilities</div><span style="color:#16a34a">●</span> Entrance<br><span style="color:#db2777">●</span> CR<br><span style="color:#7c3aed">●</span> Stairs<br><span style="color:#ea580c">●</span> Office</div>';
      L.DomEvent.disableClickPropagation(div);
      var button = div.querySelector('.map-legend-toggle');
      button.addEventListener('click', function () { var open = div.classList.toggle('open'); button.textContent = open ? 'Legend −' : 'Legend +'; });
      return div;
    };
    legend.addTo(map);

    var floaterElement = function (entry) {
      var tooltip = entry.layer.getTooltip && entry.layer.getTooltip();
      return (tooltip && tooltip.getElement && tooltip.getElement()) || (entry.layer.getElement && entry.layer.getElement());
    };
    var setFloaterMode = function (entry, compact) {
      var element = floaterElement(entry);
      if (!element) return null;
      element.classList.toggle('floater-compact', compact);
      element.classList.toggle('floater-full', !compact);
      return element;
    };
    var boxesOverlap = function (a, b) {
      var pad = 3;
      return !(a.right + pad <= b.left || a.left >= b.right + pad || a.bottom + pad <= b.top || a.top >= b.bottom + pad);
    };
    var updateFloaters = function () {
      var zoom = map.getZoom();
      if (zoom <= 18) {
        floaterEntries.forEach(function (entry) { setFloaterMode(entry, !entry.selected); });
        return;
      }
      floaterEntries.forEach(function (entry) { setFloaterMode(entry, false); });
      var occupied = [];
      floaterEntries.slice().sort(function (a, b) {
        return Number(b.selected) - Number(a.selected) || Number(b.kind === 'facility') - Number(a.kind === 'facility');
      }).forEach(function (entry) {
        var element = floaterElement(entry);
        if (!element) return;
        var rect = element.getBoundingClientRect();
        if (!entry.selected && occupied.some(function (box) { return boxesOverlap(rect, box); })) {
          setFloaterMode(entry, true);
        } else {
          occupied.push(rect);
        }
      });
    };
    map.on('zoomend moveend', function () { requestAnimationFrame(updateFloaters); });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([10.6055, 123.041], 17);
    }
    map.whenReady(function () { requestAnimationFrame(updateFloaters); });

    // Called from the app when the selected stall changes. Restyling in place
    // keeps the user's current zoom and pan, instead of reloading the page.
    window.__setSelected = function (ids) {
      var selectedSet = {};
      (ids || []).forEach(function (id) { selectedSet[id] = true; });
      Object.keys(layers).forEach(function (key) {
        var entry = layers[key];
        var isSel = !!selectedSet[key];
        entry.floater.selected = isSel;
        var st = isSel ? entry.sel : entry.base;
        entry.layer.setStyle({
          color: st.color,
          fillColor: st.color,
          weight: isSel ? 3 : 2,
          fillOpacity: st.fillOpacity
        });
        if (isSel) entry.layer.bringToFront();
      });
      requestAnimationFrame(updateFloaters);
    };

    map.whenReady(function () { send({ type: 'ready' }); });
  } catch (e) {
    send({ type: 'error', message: String(e && e.message ? e.message : e) });
  }
</script>
</body>
</html>`;
}

export default function StallMap({
  stalls,
  facilities = [],
  selectedId,
  selectedIds,
  multiSelectMode = false,
  onSelect,
  onFacilitySelect,
  styleInputs = {},
  showEmptyMap = false,
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(null);
  const webRef = useRef(null);

  // Deliberately does NOT depend on selectedId - rebuilding the HTML would
  // reload the WebView and throw away the user's zoom and pan. Selection is
  // applied afterwards by injecting a style update instead.
  const html = useMemo(() => {
    const payload = {
      stalls: stalls.map((s) => {
        const input = styleInputs[s.id] ?? {};
        return {
          id: s.id,
          name: s.stall_name,
          safeName: String(s.stall_name || '').replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch]),
          statusLabel: input.userAppStatus
            ? input.userAppStatus === "approved"
              ? "Yours"
              : "Pending"
            : input.occupied
              ? "Occupied"
              : input.pending
                ? "Pending"
                : "Available",
          latlngs: toLatLngs(s.geometry),
          style: styleFor(input, false),
          selectedStyle: styleFor(input, true),
        };
      }),
      facilities: facilities.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        floor: item.floor,
        geometry: item.geometry,
        connectedFloors: item.connectedFloors ?? [],
        isAccessible: Boolean(item.isAccessible),
        notes: item.notes ?? "",
      })),
    };
    return buildHtml(JSON.stringify(payload).replace(/</g, "\\u003c"));
  }, [stalls, facilities, styleInputs]);

  // Push selection changes into the existing page, preserving zoom/pan.
  useEffect(() => {
    if (!ready) return;
    const ids = multiSelectMode ? Array.from(selectedIds ?? []) : selectedId ? [selectedId] : [];
    webRef.current?.injectJavaScript(
      `window.__setSelected && window.__setSelected(${JSON.stringify(ids)}); true;`,
    );
  }, [selectedId, selectedIds, multiSelectMode, ready]);

  if (stalls.length === 0 && facilities.length === 0 && !showEmptyMap) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>No stalls to show</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={["*"]}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        // Let Leaflet handle pinch itself rather than the WebView scaling the page.
        scalesPageToFit={false}
        setBuiltInZoomControls={false}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === "select" && msg.id) onSelect(msg.id);
            else if (msg.type === "facility" && msg.facility && onFacilitySelect) onFacilitySelect(msg.facility);
            else if (msg.type === "ready") setReady(true);
            else if (msg.type === "error") setFailed(msg.message);
          } catch {
            // Ignore anything that isn't our own JSON.
          }
        }}
      />

      {!ready && !failed ? (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>Loading map…</Text>
        </View>
      ) : null}

      {failed ? (
        <View style={styles.overlay}>
          <Text style={styles.fallbackTitle}>Map failed to load</Text>
          <Text style={styles.fallbackNote}>{failed}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  web: { flex: 1, backgroundColor: "#e5e7eb" },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f9fafb",
  },
  fallbackTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  fallbackNote: { marginTop: 6, fontSize: 12, lineHeight: 18, color: "#9ca3af", textAlign: "center" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    padding: 24,
  },
  overlayText: { fontSize: 12, color: "#9ca3af" },
});
