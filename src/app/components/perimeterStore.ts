export interface MarketPerimeter {
  id: string;
  name: string;
  geometry: object;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes: string;
}

const KEY = "pubmark_perimeter";

export function getPerimeter(): MarketPerimeter | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MarketPerimeter) : null;
  } catch {
    return null;
  }
}

export function savePerimeter(data: Omit<MarketPerimeter, "id" | "createdAt">): MarketPerimeter {
  const perimeter: MarketPerimeter = {
    ...data,
    id: `perimeter_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(perimeter));
  return perimeter;
}

export function clearPerimeter(): void {
  localStorage.removeItem(KEY);
}
