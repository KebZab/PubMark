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
    return { color: input.occupiedColor ?? (selected ? "#dc2626" : "#ef4444"), fillOpacity: selected ? 0.4 : 0.25 };
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
    var bounds = [];

    data.stalls.forEach(function (s) {
      if (!s.latlngs || s.latlngs.length < 3) return;
      var poly = L.polygon(s.latlngs, {
        color: s.style.color,
        fillColor: s.style.color,
        weight: 2,
        fillOpacity: s.style.fillOpacity
      }).addTo(map);

      var tooltip = document.createElement('span');
      tooltip.textContent = s.name + (s.statusLabel ? ' - ' + s.statusLabel : '');
      poly.bindTooltip(tooltip, { direction: 'top' });
      poly.on('click', function () { send({ type: 'select', id: s.id }); });

      layers[s.id] = { layer: poly, base: s.style, sel: s.selectedStyle };
      bounds = bounds.concat(s.latlngs);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([10.6055, 123.041], 17);
    }

    // Called from the app when the selected stall changes. Restyling in place
    // keeps the user's current zoom and pan, instead of reloading the page.
    window.__setSelected = function (ids) {
      var selectedSet = {};
      (ids || []).forEach(function (id) { selectedSet[id] = true; });
      Object.keys(layers).forEach(function (key) {
        var entry = layers[key];
        var isSel = !!selectedSet[key];
        var st = isSel ? entry.sel : entry.base;
        entry.layer.setStyle({
          color: st.color,
          fillColor: st.color,
          weight: isSel ? 3 : 2,
          fillOpacity: st.fillOpacity
        });
        if (isSel) entry.layer.bringToFront();
      });
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
  selectedId,
  selectedIds,
  multiSelectMode = false,
  onSelect,
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
    };
    return buildHtml(JSON.stringify(payload).replace(/</g, "\\u003c"));
  }, [stalls, styleInputs]);

  // Push selection changes into the existing page, preserving zoom/pan.
  useEffect(() => {
    if (!ready) return;
    const ids = multiSelectMode ? Array.from(selectedIds ?? []) : selectedId ? [selectedId] : [];
    webRef.current?.injectJavaScript(
      `window.__setSelected && window.__setSelected(${JSON.stringify(ids)}); true;`,
    );
  }, [selectedId, selectedIds, multiSelectMode, ready]);

  if (stalls.length === 0 && !showEmptyMap) {
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
