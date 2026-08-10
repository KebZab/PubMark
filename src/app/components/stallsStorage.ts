export interface StoredStall {
  id: string;
  stall_name: string;
  status: "vacant" | "occupied" | "unavailable";
  owner_name: null;
  business_type: string;
  section: string;
  floor: "1" | "2";
  floor_area: string;
  notes: string;
  geometry: object;
  created_at: string;
}

const KEY = "pubmark_stalls";

export function getStoredStalls(): StoredStall[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredStall[];
    // Migrate old stalls that lack the floor field
    return parsed.map((s) => ({ floor: "1" as const, ...s }));
  } catch {
    return [];
  }
}

export function saveStoredStall(
  data: Omit<StoredStall, "id" | "created_at">
): StoredStall {
  const stalls = getStoredStalls();
  const stall: StoredStall = {
    ...data,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  stalls.push(stall);
  localStorage.setItem(KEY, JSON.stringify(stalls));
  return stall;
}

export function updateStoredStallGeometry(id: string, geometry: object): void {
  const stalls = getStoredStalls();
  const idx = stalls.findIndex((s) => s.id === id);
  if (idx !== -1) {
    stalls[idx] = { ...stalls[idx], geometry };
    localStorage.setItem(KEY, JSON.stringify(stalls));
  }
}

export function updateStoredStall(
  id: string,
  data: Partial<Omit<StoredStall, "id" | "created_at" | "owner_name">>
): StoredStall | null {
  const stalls = getStoredStalls();
  const idx = stalls.findIndex((s) => s.id === id);
  if (idx !== -1) {
    stalls[idx] = { ...stalls[idx], ...data };
    localStorage.setItem(KEY, JSON.stringify(stalls));
    return stalls[idx];
  }
  return null;
}

export function deleteStoredStall(id: string): void {
  const updated = getStoredStalls().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
