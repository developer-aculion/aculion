import { Billboard } from "../types/location";

const LOCAL_STORAGE_KEY = "aculion_billboards_chennai_v3_empty";

const DEFAULT_BILLBOARDS: Billboard[] = [];

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
