/**
 * billboard.service.ts
 * Fetches and saves billboard data directly using the Supabase billboard_master table.
 * Filtered to only return records belonging to the current authenticated client.
 */
import { supabase } from "./supabase";
import { Billboard } from "../types/location";

// ── In-memory cache to avoid redundant fetches ──
let cachedBillboards: Billboard[] | null = null;
let cacheTime = 0;
let cachedEmail: string | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function mapRow(row: any): Billboard {
  return {
    id: row.billboard_id || row.camera_id || String(row.id),
    billboard_id: row.billboard_id,
    camera_id: row.camera_id,
    client_id: row.client_id,
    name: row.billboard_name || row.billboard_location || "Unknown Billboard",
    billboard_name: row.billboard_name,
    billboard_location: row.billboard_location,
    street_address: row.street_address,
    city: row.city,
    location: row.street_address || row.billboard_location || "Unknown Location",
    latitude: typeof row.latitude === "number" ? row.latitude : parseFloat(row.latitude) || 0,
    longitude: typeof row.longitude === "number" ? row.longitude : parseFloat(row.longitude) || 0,
    status: row.status || "Active",
    type: row.billboard_type || "Digital Billboard",
    width: row.width_ft || 40,
    height: row.height_ft || 20,
    image: null,
    campaign: {
      name: "",
      owner: "",
      startDate: "",
      endDate: "",
      duration: 0,
      status: "Running" as const,
    },
    lastUpdated: row.created_at || new Date().toISOString(),
  } as any;
}

export const billboardService = {
  getBillboards: async (): Promise<Billboard[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return [];

    const now = Date.now();
    if (cachedBillboards && now - cacheTime < CACHE_TTL_MS && cachedEmail === user.email) {
      return cachedBillboards;
    }

    const { data: profile } = await supabase
      .from('user_profile_master')
      .select('client_id')
      .eq('mail_id', user.email)
      .single();

    if (!profile?.client_id) {
      return [];
    }

    const { data, error } = await supabase
      .from("billboard_master")
      .select("billboard_id, camera_id, client_id, billboard_location, latitude, longitude, billboard_name, billboard_type, street_address, city, status, width_ft, height_ft, created_at")
      .eq("client_id", profile.client_id)
      .order("billboard_id", { ascending: true });

    if (error) {
      console.error("[billboard.service] Supabase fetch error:", error.message);
      return [];
    }

    // Fetch traffic records to resolve status/snapshot_image
    const { data: trafficData } = await supabase
      .from("traffic_master")
      .select("camera_code, is_live, snapshot_image")
      .order("last_updated", { ascending: false });

    // Build a map of camera_code -> latest traffic record
    const trafficMap: Record<string, { is_live: boolean; snapshot_image: string | null }> = {};
    for (const t of trafficData || []) {
      if (t.camera_code && !trafficMap[t.camera_code]) {
        trafficMap[t.camera_code] = {
          is_live: t.is_live,
          snapshot_image: t.snapshot_image,
        };
      }
    }

    const rows = (data || []).map((r) => {
      const mapped = mapRow(r);
      const trafficInfo = r.camera_id ? trafficMap[r.camera_id] : null;
      if (trafficInfo) {
        mapped.status = trafficInfo.is_live ? "Active" : "Offline";
        mapped.image = trafficInfo.snapshot_image || mapped.image;
      }
      return mapped;
    });

    cachedBillboards = rows;
    cacheTime = now;
    cachedEmail = user.email;
    return rows;
  },

  getBillboardById: async (id: string): Promise<Billboard> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      throw new Error("No authenticated session found");
    }

    const { data: profile } = await supabase
      .from('user_profile_master')
      .select('client_id')
      .eq('mail_id', user.email)
      .single();

    if (!profile?.client_id) {
      throw new Error(`Billboard '${id}' not found`);
    }

    const { data, error } = await supabase
      .from("billboard_master")
      .select("billboard_id, camera_id, client_id, billboard_location, latitude, longitude, billboard_name, billboard_type, street_address, city, status, width_ft, height_ft, created_at")
      .eq("client_id", profile.client_id)
      .or(`billboard_id.eq.${id},camera_id.eq.${id}`)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Billboard '${id}' not found`);
    }

    const mapped = mapRow(data);

    // Fetch traffic details for image/live status
    if (data.camera_id) {
      const { data: trafficInfo } = await supabase
        .from("traffic_master")
        .select("is_live, snapshot_image")
        .eq("camera_code", data.camera_id)
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (trafficInfo) {
        mapped.status = trafficInfo.is_live ? "Active" : "Offline";
        mapped.image = trafficInfo.snapshot_image || mapped.image;
      }
    }

    return mapped;
  },

  invalidateCache: () => {
    cachedBillboards = null;
    cacheTime = 0;
    cachedEmail = null;
  },

  createBillboard: async (billboardData: {
    name: string;
    id: string;
    location: string;
    latitude: number;
    longitude: number;
    cameraCode?: string;
  }): Promise<Billboard> => {
    // 1. Validate required fields
    if (!billboardData.name || !billboardData.name.trim()) {
      throw new Error("Billboard Name is required.");
    }
    if (billboardData.latitude === undefined || billboardData.latitude === null || isNaN(billboardData.latitude)) {
      throw new Error("Latitude is required.");
    }
    if (billboardData.longitude === undefined || billboardData.longitude === null || isNaN(billboardData.longitude)) {
      throw new Error("Longitude is required.");
    }

    // 2. Fetch logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      throw new Error("No authenticated session found.");
    }
    console.log("[createBillboard] logged-in user email:", user.email);

    // Profile lookup
    const { data: profile, error: profileError } = await supabase
      .from('user_profile_master')
      .select('client_id')
      .eq('mail_id', user.email)
      .single();

    console.log("[createBillboard] fetched profile:", profile, "error:", profileError);

    if (profileError || !profile || !profile.client_id) {
      throw new Error("Could not find a valid client profile for your account.");
    }

    const clientId = profile.client_id;

    // 3. Prepare payload (only client_id, billboard_location, latitude, longitude)
    const insertPayload = {
      client_id: clientId,
      billboard_location: billboardData.name,
      latitude: billboardData.latitude,
      longitude: billboardData.longitude,
    };
    console.log("[createBillboard] insert payload:", insertPayload);

    // 4. Insert into billboard_master
    const { data, error } = await supabase
      .from("billboard_master")
      .insert(insertPayload)
      .select()
      .single();

    console.log("[createBillboard] insert result:", data, "error:", error);

    if (error) {
      console.error("[billboard.service] Insert error:", error.message);
      throw new Error(error.message || "Failed to save billboard to the database.");
    }

    // Invalidate cache so the list displays the new entry immediately
    cachedBillboards = null;
    cacheTime = 0;
    cachedEmail = null;

    return mapRow(data);
  },

  updateBillboard: async (): Promise<Billboard> => {
    throw new Error("Billboard updates are managed in Supabase directly.");
  },
  deleteBillboard: async (): Promise<void> => {
    throw new Error("Billboard deletion is managed in Supabase directly.");
  },
};
