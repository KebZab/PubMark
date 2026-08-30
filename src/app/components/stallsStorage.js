const KEY = "pubmark_stalls";

export function getStoredStalls() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old stalls that lack the floor field
    return parsed.map((s) => ({ floor: "1", ...s }));
  } catch {
    return [];
  }
}

export function saveStoredStall(data) {
  const stalls = getStoredStalls();
  const stall = {
    ...data,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  stalls.push(stall);
  localStorage.setItem(KEY, JSON.stringify(stalls));
  return stall;
}

export function updateStoredStallGeometry(id, geometry) {
  const stalls = getStoredStalls();
  const idx = stalls.findIndex((s) => s.id === id);
  if (idx !== -1) {
    stalls[idx] = { ...stalls[idx], geometry };
    localStorage.setItem(KEY, JSON.stringify(stalls));
  }
}

export function updateStoredStall(id, data) {
  const stalls = getStoredStalls();
  const idx = stalls.findIndex((s) => s.id === id);
  if (idx !== -1) {
    stalls[idx] = { ...stalls[idx], ...data };
    localStorage.setItem(KEY, JSON.stringify(stalls));
    return stalls[idx];
  }
  return null;
}

export function deleteStoredStall(id) {
  const updated = getStoredStalls().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
