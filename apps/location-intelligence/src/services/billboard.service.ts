import { Billboard } from "@/types";

const LOCAL_STORAGE_KEY = "aculion_billboards_chennai_v2";

const DEFAULT_BILLBOARDS: Billboard[] = [
  {
    id: "MAA001",
    name: "Anna Salai Digital Screen",
    category: "Digital",
    latitude: 13.0604,
    longitude: 80.2505,
    campaign: {
      name: "Samsung Galaxy Launch",
      owner: "Samsung India",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      duration: 30,
      status: "Running",
      notes: "Premium high-impact digital billboard on Mount Road/Anna Salai near Spencer Plaza."
    },
    lastUpdated: "2026-07-13T12:00:00Z"
  },
  {
    id: "MAA002",
    name: "Nungambakkam High Rd Billboard",
    category: "Classic",
    latitude: 13.0617,
    longitude: 80.2422,
    campaign: {
      name: "Nike Run Club Campaign",
      owner: "Nike Retail",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      duration: 14,
      status: "Upcoming",
      notes: "Targeting elite fitness community and young working professionals in high-traffic commercial area."
    },
    lastUpdated: "2026-07-13T11:45:00Z"
  },
  {
    id: "MAA003",
    name: "OMR IT Expressway Display",
    category: "Digital",
    latitude: 12.9701,
    longitude: 80.2443,
    campaign: {
      name: "Hyundai EV Premium Showcase",
      owner: "Hyundai Motors",
      startDate: "2026-05-01",
      endDate: "2026-06-30",
      duration: 60,
      status: "Completed",
      notes: "Showcasing Hyundai Ioniq 5 to tech professionals along OMR IT Corridor near Tidel Park."
    },
    lastUpdated: "2026-07-13T10:15:00Z"
  },
  {
    id: "MAA004",
    name: "T-Nagar Usman Road Unipole",
    category: "Unipole",
    latitude: 13.0360,
    longitude: 80.2335,
    campaign: {
      name: "Zomato Gold Rollout",
      owner: "Zomato Media",
      startDate: "2026-07-10",
      endDate: "2026-08-10",
      duration: 31,
      status: "Running",
      notes: "High footfall shopping hub targeting festival shoppers and local store visitors."
    },
    lastUpdated: "2026-07-13T13:20:00Z"
  }
];

function initDb(): Billboard[] {
  if (typeof window === "undefined") return DEFAULT_BILLBOARDS;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_BILLBOARDS));
    return DEFAULT_BILLBOARDS;
  }
  return JSON.parse(stored);
}

function writeDb(data: Billboard[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

// Helper to simulate API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const billboardService = {
  getBillboards: async (): Promise<Billboard[]> => {
    await delay(300);
    return initDb();
  },

  getBillboardById: async (id: string): Promise<Billboard> => {
    await delay(200);
    const db = initDb();
    const item = db.find((b) => b.id.toLowerCase() === id.toLowerCase());
    if (!item) {
      throw new Error("Billboard not found");
    }
    return item;
  },

  createBillboard: async (billboard: Omit<Billboard, "lastUpdated">): Promise<Billboard> => {
    await delay(400);
    const db = initDb();
    if (db.some((b) => b.id.toLowerCase() === billboard.id.toLowerCase())) {
      throw new Error("Billboard with this ID already exists");
    }
    const newBillboard: Billboard = {
      ...billboard,
      lastUpdated: new Date().toISOString(),
    };
    db.unshift(newBillboard);
    writeDb(db);
    return newBillboard;
  },

  updateBillboard: async (id: string, billboard: Partial<Billboard>): Promise<Billboard> => {
    await delay(400);
    const db = initDb();
    const index = db.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      throw new Error("Billboard not found");
    }
    const updated: Billboard = {
      ...db[index],
      ...billboard,
      campaign: {
        ...db[index].campaign,
        ...(billboard.campaign || {}),
      },
      lastUpdated: new Date().toISOString(),
    };
    db[index] = updated;
    writeDb(db);
    return updated;
  },

  deleteBillboard: async (id: string): Promise<void> => {
    await delay(300);
    const db = initDb();
    const filtered = db.filter((b) => b.id.toLowerCase() !== id.toLowerCase());
    writeDb(filtered);
  },
};
