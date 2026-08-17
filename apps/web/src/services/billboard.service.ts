/**
 * billboard.service.ts
 * Billboard service stub — the underlying Supabase tables
 * (billboard_master, traffic_master, user_profile_master) have been dropped.
 * All methods preserve their original signatures so existing UI imports
 * continue to compile without changes.
 */
import { Billboard } from "../types/location";

function emptyBillboard(): Billboard {
  return {
    id: "",
    billboard_id: "",
    camera_id: "",
    client_id: "",
    name: "",
    billboard_name: "",
    billboard_location: "",
    street_address: "",
    city: "",
    location: "",
    latitude: 0,
    longitude: 0,
    status: "Offline",
    type: "Digital Billboard",
    width: 0,
    height: 0,
    image: null,
    campaign: {
      name: "",
      owner: "",
      startDate: "",
      endDate: "",
      duration: 0,
      status: "Running" as const,
    },
    lastUpdated: new Date().toISOString(),
  } as any;
}

export const billboardService = {
  getBillboards: async (): Promise<Billboard[]> => {
    // Tables dropped — return empty list
    return [];
  },

  getBillboardById: async (id: string): Promise<Billboard> => {
    throw new Error("Billboard data is not available — underlying tables have been removed.");
  },

  invalidateCache: () => {
    // No-op — cache is no longer used
  },

  createBillboard: async (billboardData: {
    name: string;
    id: string;
    location: string;
    latitude: number;
    longitude: number;
    cameraCode?: string;
  }): Promise<Billboard> => {
    throw new Error("Billboard creation is not available — underlying tables have been removed.");
  },

  updateBillboard: async (): Promise<Billboard> => {
    throw new Error("Billboard updates are managed in Supabase directly.");
  },
  deleteBillboard: async (): Promise<void> => {
    throw new Error("Billboard deletion is managed in Supabase directly.");
  },
};
