const states = new WeakMap();

function overlaps(a, b, padding = 3) {
  return !(
    a.right + padding <= b.left ||
    a.left >= b.right + padding ||
    a.bottom + padding <= b.top ||
    a.top >= b.bottom + padding
  );
}

function setMode(entry, mode) {
  const element = entry.layer.getTooltip?.()?.getElement?.() ?? entry.layer.getElement?.();
  if (!element) return null;
  element.classList.toggle("floater-compact", mode === "compact");
  element.classList.toggle("floater-full", mode === "full");
  return element;
}

function refresh(map, state) {
  state.frame = null;
  const zoom = map.getZoom();
  const entries = [...state.entries].filter((entry) => map.hasLayer(entry.layer));

  if (zoom <= 18) {
    entries.forEach((entry) => setMode(entry, entry.selected ? "full" : "compact"));
    return;
  }

  // At every readable zoom, facilities and selected stalls get first claim on
  // screen space. Ordinary names remain visible only when their boxes fit.
  entries.forEach((entry) => setMode(entry, "full"));
  const occupied = [];
  entries
    .sort((a, b) => Number(b.selected) - Number(a.selected) || b.priority - a.priority)
    .forEach((entry) => {
      const element = entry.layer.getTooltip?.()?.getElement?.() ?? entry.layer.getElement?.();
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (!entry.selected && occupied.some((other) => overlaps(rect, other))) {
        setMode(entry, "compact");
        return;
      }
      occupied.push(rect);
    });
}

function schedule(map, state) {
  if (state.frame != null) cancelAnimationFrame(state.frame);
  state.frame = requestAnimationFrame(() => refresh(map, state));
}

export function registerMapFloater(map, layer, { kind = "stall", selected = false } = {}) {
  let state = states.get(map);
  if (!state) {
    state = { entries: new Set(), frame: null };
    state.listener = () => schedule(map, state);
    map.on("zoomend moveend", state.listener);
    states.set(map, state);
  }
  const entry = { layer, kind, selected, priority: kind === "facility" ? 20 : selected ? 10 : 0 };
  state.entries.add(entry);
  layer.on?.("tooltipopen", state.listener);
  schedule(map, state);

  const remove = () => {
    layer.off?.("tooltipopen", state.listener);
    state.entries.delete(entry);
    schedule(map, state);
    if (!state.entries.size) {
      map.off("zoomend moveend", state.listener);
      if (state.frame != null) cancelAnimationFrame(state.frame);
      states.delete(map);
    }
  };
  remove.setSelected = (nextSelected) => {
    entry.selected = Boolean(nextSelected);
    entry.priority = entry.kind === "facility" ? 20 : entry.selected ? 10 : 0;
    schedule(map, state);
  };
  return remove;
}
