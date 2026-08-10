export type ItemCategory = "Produce" | "Meat & Seafood" | "Dry Goods" | "Equipment" | "Supplies" | "Other";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
  notes: string;
}

const KEY = "pubmark_inventory";

function getDefaultItems(): InventoryItem[] {
  return [
    { id: "inv_001", name: "Meat Display Tray (Large)", category: "Equipment", unit: "pcs", quantity: 45, minQuantity: 10, unitCost: 850, supplier: "MarketPro Supplies", lastRestocked: "2026-05-01", notes: "" },
    { id: "inv_002", name: "Vegetable Crate (Plastic)", category: "Equipment", unit: "pcs", quantity: 120, minQuantity: 30, unitCost: 320, supplier: "LM Trading", lastRestocked: "2026-04-28", notes: "" },
    { id: "inv_003", name: "Weighing Scale (Digital)", category: "Equipment", unit: "units", quantity: 8, minQuantity: 5, unitCost: 2400, supplier: "ScaleMart PH", lastRestocked: "2026-03-15", notes: "Check calibration quarterly" },
    { id: "inv_004", name: "Plastic Bags (Small)", category: "Supplies", unit: "rolls", quantity: 6, minQuantity: 20, unitCost: 95, supplier: "Packaging Co.", lastRestocked: "2026-05-05", notes: "LOW STOCK" },
    { id: "inv_005", name: "Cleaning Solution (5L)", category: "Supplies", unit: "containers", quantity: 18, minQuantity: 5, unitCost: 280, supplier: "CleanRight PH", lastRestocked: "2026-04-20", notes: "" },
    { id: "inv_006", name: "Ice Block (10kg)", category: "Produce", unit: "blocks", quantity: 0, minQuantity: 15, unitCost: 45, supplier: "IceHouse Bacolod", lastRestocked: "2026-05-13", notes: "OUT OF STOCK" },
    { id: "inv_007", name: "Stall Signage Board", category: "Supplies", unit: "pcs", quantity: 32, minQuantity: 10, unitCost: 180, supplier: "SignCraft", lastRestocked: "2026-02-10", notes: "" },
    { id: "inv_008", name: "Rubber Gloves (Box)", category: "Supplies", unit: "boxes", quantity: 24, minQuantity: 10, unitCost: 160, supplier: "MedSupply PH", lastRestocked: "2026-05-08", notes: "" },
    { id: "inv_009", name: "Extension Cord (5m)", category: "Equipment", unit: "pcs", quantity: 15, minQuantity: 5, unitCost: 420, supplier: "ElectroParts", lastRestocked: "2026-03-20", notes: "" },
    { id: "inv_010", name: "Garbage Bins (Large)", category: "Equipment", unit: "units", quantity: 7, minQuantity: 8, unitCost: 950, supplier: "CitySupply", lastRestocked: "2026-01-15", notes: "LOW STOCK" },
  ];
}

export function getInventoryItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const defaults = getDefaultItems();
      localStorage.setItem(KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return getDefaultItems();
  }
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity === 0) return "out_of_stock";
  if (item.quantity <= item.minQuantity) return "low_stock";
  return "in_stock";
}

export function saveInventoryItem(data: Omit<InventoryItem, "id">): InventoryItem {
  const items = getInventoryItems();
  const item: InventoryItem = {
    ...data,
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  items.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(items));
  return item;
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const items = getInventoryItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  localStorage.setItem(KEY, JSON.stringify(items));
  return items[idx];
}

export function deleteInventoryItem(id: string): void {
  const items = getInventoryItems().filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(items));
}
