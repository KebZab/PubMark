export interface StallData {
  id: string;
  name: string;
  section: string;
  status: "vacant" | "occupied";
  owner: string | null;
  businessName: string | null;
  businessType: string;
  floorArea: string;
  contact: string | null;
  contractEnd: string | null;
  notes: string;
  lat: number;
  lng: number;
}

export const stallsData: StallData[] = [
  // ── Section A (Row 1 — North) ──────────────────────────────────────
  {
    id: "A101", name: "A-101", section: "A",
    status: "occupied", owner: "Maria Santos", businessName: "Santos Karenderia",
    businessType: "Food & Beverage", floorArea: "25 sqm",
    contact: "0917-123-4567", contractEnd: "2027-01-15",
    notes: "Corner lot, high foot traffic. Fully operational.",
    lat: 10.60558, lng: 123.04090,
  },
  {
    id: "A102", name: "A-102", section: "A",
    status: "vacant", owner: null, businessName: null,
    businessType: "Food & Beverage", floorArea: "25 sqm",
    contact: null, contractEnd: null,
    notes: "Recently vacated. Ready for new tenant.",
    lat: 10.60558, lng: 123.04110,
  },
  {
    id: "A103", name: "A-103", section: "A",
    status: "occupied", owner: "Jose Reyes", businessName: "Reyes General Store",
    businessType: "Retail", floorArea: "30 sqm",
    contact: "0928-234-5678", contractEnd: "2026-12-31",
    notes: "Prime center location, steady customer base.",
    lat: 10.60558, lng: 123.04130,
  },
  {
    id: "A104", name: "A-104", section: "A",
    status: "vacant", owner: null, businessName: null,
    businessType: "Retail", floorArea: "30 sqm",
    contact: null, contractEnd: null,
    notes: "Good visibility from main entrance.",
    lat: 10.60558, lng: 123.04150,
  },
  {
    id: "A105", name: "A-105", section: "A",
    status: "occupied", owner: "Ana Flores", businessName: "Flores Beauty Salon",
    businessType: "Services", floorArea: "20 sqm",
    contact: "0919-345-6789", contractEnd: "2026-09-30",
    notes: "End unit with extra window space.",
    lat: 10.60558, lng: 123.04170,
  },

  // ── Section B (Row 2) ──────────────────────────────────────────────
  {
    id: "B201", name: "B-201", section: "B",
    status: "occupied", owner: "Tomas Bautista", businessName: "Bautista Fruits",
    businessType: "Fruits", floorArea: "22 sqm",
    contact: "0906-111-2222", contractEnd: "2027-02-10",
    notes: "Fresh fruits daily. Near restroom facilities.",
    lat: 10.60543, lng: 123.04090,
  },
  {
    id: "B202", name: "B-202", section: "B",
    status: "occupied", owner: "Pedro Cruz", businessName: "Cruz Hardware",
    businessType: "Hardware", floorArea: "35 sqm",
    contact: "0917-456-7890", contractEnd: "2027-03-20",
    notes: "Largest unit in Section B.",
    lat: 10.60543, lng: 123.04110,
  },
  {
    id: "B203", name: "B-203", section: "B",
    status: "vacant", owner: null, businessName: null,
    businessType: "General", floorArea: "22 sqm",
    contact: null, contractEnd: null,
    notes: "Center aisle, high visibility.",
    lat: 10.60543, lng: 123.04130,
  },
  {
    id: "B204", name: "B-204", section: "B",
    status: "occupied", owner: "Rosa Mendoza", businessName: "Mendoza Pharmacy",
    businessType: "Pharmacy", floorArea: "28 sqm",
    contact: "0928-567-8901", contractEnd: "2027-06-15",
    notes: "Licensed pharmaceutical outlet.",
    lat: 10.60543, lng: 123.04150,
  },
  {
    id: "B205", name: "B-205", section: "B",
    status: "vacant", owner: null, businessName: null,
    businessType: "General", floorArea: "22 sqm",
    contact: null, contractEnd: null,
    notes: "Adjacent to pharmacy, high foot traffic.",
    lat: 10.60543, lng: 123.04170,
  },

  // ── Section C (Row 3) ──────────────────────────────────────────────
  {
    id: "C301", name: "C-301", section: "C",
    status: "occupied", owner: "Carlos Torres", businessName: "Torres Clothing",
    businessType: "Retail", floorArea: "32 sqm",
    contact: "0919-678-9012", contractEnd: "2026-11-30",
    notes: "Clothing and accessories boutique.",
    lat: 10.60528, lng: 123.04090,
  },
  {
    id: "C302", name: "C-302", section: "C",
    status: "vacant", owner: null, businessName: null,
    businessType: "Food & Beverage", floorArea: "25 sqm",
    contact: null, contractEnd: null,
    notes: "Near back entrance. Ideal for food stalls.",
    lat: 10.60528, lng: 123.04110,
  },
  {
    id: "C303", name: "C-303", section: "C",
    status: "occupied", owner: "Luz Ramos", businessName: "Ramos Bakeshop",
    businessType: "Food & Beverage", floorArea: "25 sqm",
    contact: "0917-789-0123", contractEnd: "2027-02-28",
    notes: "Popular bakeshop with loyal customers.",
    lat: 10.60528, lng: 123.04130,
  },
  {
    id: "C304", name: "C-304", section: "C",
    status: "vacant", owner: null, businessName: null,
    businessType: "Services", floorArea: "20 sqm",
    contact: null, contractEnd: null,
    notes: "Suitable for service-type businesses.",
    lat: 10.60528, lng: 123.04150,
  },
  {
    id: "C305", name: "C-305", section: "C",
    status: "occupied", owner: "Dante Villanueva", businessName: "Villanueva Electronics",
    businessType: "Electronics", floorArea: "30 sqm",
    contact: "0928-890-1234", contractEnd: "2027-04-10",
    notes: "Electronics repair and sales.",
    lat: 10.60528, lng: 123.04170,
  },

  // ── Section D (Row 4) ──────────────────────────────────────────────
  {
    id: "D401", name: "D-401", section: "D",
    status: "occupied", owner: "Nelia Aquino", businessName: "Aquino Vegetables",
    businessType: "Vegetables", floorArea: "20 sqm",
    contact: "0912-334-5566", contractEnd: "2026-10-31",
    notes: "Fresh vegetables sourced daily from local farms.",
    lat: 10.60513, lng: 123.04090,
  },
  {
    id: "D402", name: "D-402", section: "D",
    status: "occupied", owner: "Fernando Lim", businessName: "Lim Meat Shop",
    businessType: "Meat & Seafood", floorArea: "24 sqm",
    contact: "0935-445-6677", contractEnd: "2027-05-31",
    notes: "Fresh pork, beef, and chicken. Certified halal.",
    lat: 10.60513, lng: 123.04110,
  },
  {
    id: "D403", name: "D-403", section: "D",
    status: "vacant", owner: null, businessName: null,
    businessType: "Food & Beverage", floorArea: "22 sqm",
    contact: null, contractEnd: null,
    notes: "Good foot traffic near the D-row entrance.",
    lat: 10.60513, lng: 123.04130,
  },
  {
    id: "D404", name: "D-404", section: "D",
    status: "occupied", owner: "Gloria Castillo", businessName: "Castillo Tailoring",
    businessType: "Services", floorArea: "18 sqm",
    contact: "0921-556-7788", contractEnd: "2026-08-15",
    notes: "Clothing alterations and dressmaking.",
    lat: 10.60513, lng: 123.04150,
  },
  {
    id: "D405", name: "D-405", section: "D",
    status: "vacant", owner: null, businessName: null,
    businessType: "Retail", floorArea: "25 sqm",
    contact: null, contractEnd: null,
    notes: "Corner position — high visibility from walkway.",
    lat: 10.60513, lng: 123.04170,
  },

  // ── Section E (Row 5 — South) ──────────────────────────────────────
  {
    id: "E501", name: "E-501", section: "E",
    status: "occupied", owner: "Renaldo Gomez", businessName: "Gomez Fish Stall",
    businessType: "Meat & Seafood", floorArea: "20 sqm",
    contact: "0908-667-8899", contractEnd: "2027-07-01",
    notes: "Fresh catch daily. Near wet market area.",
    lat: 10.60498, lng: 123.04090,
  },
  {
    id: "E502", name: "E-502", section: "E",
    status: "vacant", owner: null, businessName: null,
    businessType: "Vegetables", floorArea: "20 sqm",
    contact: null, contractEnd: null,
    notes: "Ideal for produce vendors.",
    lat: 10.60498, lng: 123.04110,
  },
  {
    id: "E503", name: "E-503", section: "E",
    status: "occupied", owner: "Maricel Soriano", businessName: "Soriano Snack House",
    businessType: "Food & Beverage", floorArea: "22 sqm",
    contact: "0917-778-9900", contractEnd: "2026-12-15",
    notes: "Popular snack and refreshment stand.",
    lat: 10.60498, lng: 123.04130,
  },
  {
    id: "E504", name: "E-504", section: "E",
    status: "occupied", owner: "Rodrigo Navarro", businessName: "Navarro Accessories",
    businessType: "Retail", floorArea: "18 sqm",
    contact: "0929-889-0011", contractEnd: "2027-03-01",
    notes: "Bags, belts, and accessories.",
    lat: 10.60498, lng: 123.04150,
  },
  {
    id: "E505", name: "E-505", section: "E",
    status: "vacant", owner: null, businessName: null,
    businessType: "General", floorArea: "22 sqm",
    contact: null, contractEnd: null,
    notes: "Southernmost unit — end-of-row position.",
    lat: 10.60498, lng: 123.04170,
  },
];
