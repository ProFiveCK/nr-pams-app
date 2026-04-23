export type CatalogItem = {
  id: string;
  name: string;
  unitPrice: number;
  uom: string;
  description: string;
  published: boolean;
};

export const SERVICE_CATALOG: CatalogItem[] = [
  {
    id: "SVC-001",
    name: "Landing Permit – Scheduled",
    unitPrice: 850,
    uom: "per permit",
    description: "Standard landing permit for scheduled airline operations.",
    published: true,
  },
  {
    id: "SVC-002",
    name: "Landing Permit – Charter",
    unitPrice: 650,
    uom: "per permit",
    description: "Landing permit for charter flight operations.",
    published: true,
  },
  {
    id: "SVC-003",
    name: "Overflight Permit",
    unitPrice: 400,
    uom: "per permit",
    description: "Non-stop overflight through Nauruan airspace.",
    published: true,
  },
  {
    id: "SVC-004",
    name: "Landing Permit – Cargo",
    unitPrice: 950,
    uom: "per permit",
    description: "Dedicated cargo aircraft landing permit.",
    published: true,
  },
  {
    id: "SVC-005",
    name: "Emergency Landing",
    unitPrice: 0,
    uom: "per permit",
    description: "Waived fee for declared emergency landings.",
    published: false,
  },
];

/** Only published items are available for selection in invoice generation */
export const PUBLISHED_CATALOG = SERVICE_CATALOG.filter((s) => s.published);
