/**
 * billboard.service.ts
 * Supabase-backed Billboard service layer.
 * Replaces mock/stub implementation with actual calls to the `billboards` table.
 */
import { Billboard } from "../types/location";
import { supabase } from "./supabase";

function mapDbRecordToBillboard(record: any): Billboard {
  return {
    id: record.id,
    billboard_id: record.id,
    billboard_code: record.billboard_code,
    camera_id: record.camera_ff_code || record.camera_bf_code || '',
    client_id: record.owner_id,
    name: record.billboard_name,
    billboard_name: record.billboard_name,
    billboard_location: record.location_landmark,
    street_address: record.street_address,
    city: record.city,
    location: record.location_landmark,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    status: record.status || 'Active',
    type: record.billboard_type || 'Digital Billboard',
    width: 40,
    height: 20,
    image: '/blog_smart_city.png',
    campaign: {
      name: "Nike OOH Campaign",
      owner: "Nike India",
      startDate: "2026-08-01",
      endDate: "2026-09-01",
      duration: 30,
      status: "Running" as const,
    },
    lastUpdated: record.updated_at || new Date().toISOString(),
  } as any;
}

export const billboardService = {
  getBillboards: async (): Promise<Billboard[]> => {
    const { data, error } = await supabase
      .from("billboards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[billboardService] Error fetching billboards:", error);
      throw new Error(error.message || "Failed to fetch billboards.");
    }

    return (data || []).map(mapDbRecordToBillboard);
  },

  getBillboardById: async (id: string): Promise<Billboard> => {
    const { data, error } = await supabase
      .from("billboards")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[billboardService] Error fetching billboard by ID:", error);
      throw new Error(error.message || "Failed to fetch billboard.");
    }

    if (!data) {
      throw new Error(`Billboard with ID ${id} not found.`);
    }

    return mapDbRecordToBillboard(data);
  },

  invalidateCache: () => {
    // No-op
  },

  createBillboard: async (billboardData: {
    name: string;
    id?: string;
    location: string;
    address?: string;
    city?: string;
    type?: string;
    category?: string;
    status?: string;
    latitude: number;
    longitude: number;
    cameraCodeFF?: string;
    cameraCodeBF?: string;
    ownerId?: string;
  }): Promise<Billboard> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required to register a billboard.");

    const insertData = {
      owner_id: billboardData.ownerId || user.id,
      billboard_name: billboardData.name || "New Billboard",
      camera_ff_code: billboardData.cameraCodeFF || `CAM-FF-${Math.floor(1000 + Math.random() * 9000)}`,
      camera_bf_code: billboardData.cameraCodeBF || `CAM-BF-${Math.floor(1000 + Math.random() * 9000)}`,
      billboard_type: billboardData.type || billboardData.category || 'Digital Billboard',
      location_landmark: billboardData.location || "Junction",
      street_address: billboardData.address || billboardData.location || "Street Address",
      latitude: Number(billboardData.latitude),
      longitude: Number(billboardData.longitude),
      city: billboardData.city || "Chennai",
      status: billboardData.status || "Active"
    };

    const { data, error } = await supabase
      .from("billboards")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error("[billboardService] Error creating billboard:", error);
      throw new Error(error.message || "Failed to create billboard.");
    }

    return mapDbRecordToBillboard(data);
  },

  updateBillboard: async (id: string, billboardData: any): Promise<Billboard> => {
    const updateData: any = {};
    if (billboardData.name !== undefined) updateData.billboard_name = billboardData.name;
    if (billboardData.type !== undefined) updateData.billboard_type = billboardData.type;
    if (billboardData.category !== undefined) updateData.billboard_type = billboardData.category;
    if (billboardData.location !== undefined) updateData.location_landmark = billboardData.location;
    if (billboardData.address !== undefined) updateData.street_address = billboardData.address;
    if (billboardData.latitude !== undefined) updateData.latitude = Number(billboardData.latitude);
    if (billboardData.longitude !== undefined) updateData.longitude = Number(billboardData.longitude);
    if (billboardData.city !== undefined) updateData.city = billboardData.city;
    if (billboardData.status !== undefined) updateData.status = billboardData.status;
    if (billboardData.cameraCodeFF !== undefined) updateData.camera_ff_code = billboardData.cameraCodeFF;
    if (billboardData.cameraCodeBF !== undefined) updateData.camera_bf_code = billboardData.cameraCodeBF;

    const { data, error } = await supabase
      .from("billboards")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[billboardService] Error updating billboard:", error);
      throw new Error(error.message || "Failed to update billboard.");
    }

    return mapDbRecordToBillboard(data);
  },

  deleteBillboard: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("billboards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[billboardService] Error deleting billboard:", error);
      throw new Error(error.message || "Failed to delete billboard.");
    }
  },
};
