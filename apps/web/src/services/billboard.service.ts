/**
 * billboard.service.ts
 * Supabase-backed Billboard service layer.
 * Replaces mock/stub implementation with actual calls to the `billboards` table.
 */
import { Billboard } from "../types/location";
import { supabase } from "./supabase";

function mapDbRecordToBillboard(record: any): Billboard {
  const code = record.billboard_code || record.id || 'ACU-BB-0001';
  const imgMap: Record<string, string> = {
    'ACU-BB-0001': '/anna_nagar_location.png',
    'ACU-BB-0002': '/blog_attention_metrics.png',
    'ACU-BB-0003': '/blog_billboard_roi.png',
    'ACU-BB-0004': '/blog_smart_city.png',
  };

  return {
    id: record.billboard_code || record.id,
    billboard_id: record.id,
    billboard_code: record.billboard_code || record.id,
    camera_id: record.camera_ff_code || record.camera_bf_code || '',
    camera_ff_code: record.camera_ff_code || '',
    camera_bf_code: record.camera_bf_code || '',
    client_id: record.owner_id,
    name: record.billboard_name || 'Billboard Asset',
    billboard_name: record.billboard_name || 'Billboard Asset',
    billboard_location: record.location_landmark || record.street_address || 'Chennai',
    street_address: record.street_address || '',
    city: record.city || 'Chennai',
    location: record.location_landmark || record.street_address || 'Chennai',
    latitude: Number(record.latitude) || 13.0827,
    longitude: Number(record.longitude) || 80.2707,
    status: record.status || 'Active',
    type: record.billboard_type || 'Digital Billboard',
    size: '40 ft × 20 ft',
    width: '40 ft',
    height: '20 ft',
    image: imgMap[code] || '/anna_nagar_location.png',
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
      billboard_code: billboardData.id || null,
      owner_id: billboardData.ownerId || user.id,
      billboard_name: billboardData.name || "New Billboard",
      camera_ff_code: billboardData.cameraCodeFF || null,
      camera_bf_code: billboardData.cameraCodeBF || null,
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

  getTrafficOverview: async (billboardCode: string, statDate?: string): Promise<any> => {
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const targetDate = statDate || todayIST;
    let { data, error } = await supabase
      .from("traffic_overview")
      .select("*")
      .eq("billboard_code", billboardCode)
      .eq("stat_date", targetDate)
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[billboardService] Error fetching traffic overview:", error);
      throw new Error(error.message || "Failed to fetch traffic overview.");
    }

    if (!data && targetDate === todayIST) {
      try {
        const fallbackRes = await supabase
          .from("traffic_overview")
          .select("*")
          .eq("billboard_code", billboardCode)
          .order("last_updated", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fallbackRes.data) {
          data = fallbackRes.data;
        }
      } catch (fbErr) {
        console.warn("[billboardService] Fallback query notice:", fbErr);
      }
    }

    return data;
  },

  /**
   * Helper to format an hour (0-23) into standard 24-hour hour range format (e.g. 9 -> '09:00 - 09:59')
   */
  formatPeakHourWindow: (hour: number | string | null | undefined): string => {
    if (hour === null || hour === undefined || hour === '' || isNaN(Number(hour))) return '—';
    const startH = Number(hour);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(startH)}:00 - ${pad(startH)}:59`;
  },

  /**
   * Fetch all 24-hour aggregated records from 'traffic_hour' for a specific billboard and day.
   * If traffic_hour is empty or incomplete, aggregates from traffic_overview_history using IST hours.
   */
  getHourlyTraffic: async (billboardCode: string, statDate?: string): Promise<any[]> => {
    if (!billboardCode) return [];
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const targetDate = statDate || todayIST;

    try {
      // 1. Try querying traffic_hour matching billboard_code and stat_date / date
      const { data, error } = await supabase
        .from("traffic_hour")
        .select("*")
        .eq("billboard_code", billboardCode)
        .or(`date.eq.${targetDate},stat_date.eq.${targetDate}`)
        .order("hour", { ascending: true });

      if (!error && data && data.length > 0) {
        let maxCount = 0;
        for (const r of data) {
          if (Number(r.total_vehicles) > maxCount) maxCount = Number(r.total_vehicles);
        }
        if (maxCount > 0) {
          return data;
        }
      }

      // 2. Fallback: Aggregate from traffic_overview_history by IST hour
      const { data: histData, error: histError } = await supabase
        .from("traffic_overview_history")
        .select("recorded_at, total_vehicles, flow_rate, avg_exposure_time, bikes, economy, premium, luxury, ultra_luxury, commercial")
        .eq("billboard_code", billboardCode)
        .eq("stat_date", targetDate)
        .order("recorded_at", { ascending: true })
        .limit(1000);

      if (!histError && histData && histData.length > 0) {
        const hourMap = new Map<number, any>();
        for (const row of histData) {
          if (!row.recorded_at) continue;
          const dt = new Date(row.recorded_at);
          // Convert to IST hour (UTC + 5:30)
          const istHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
          const count = Number(row.total_vehicles) || 0;
          if (!hourMap.has(istHour) || count > (Number(hourMap.get(istHour).total_vehicles) || 0)) {
            hourMap.set(istHour, {
              ...row,
              hour: istHour,
              total_vehicles: count,
              flow_rate: row.flow_rate || 0
            });
          }
        }
        const hourList = Array.from(hourMap.values()).sort((a, b) => a.hour - b.hour);
        if (hourList.length > 0) {
          return hourList;
        }
      }

      // 3. Fallback: If querying today and live traffic exists in traffic_overview
      if (targetDate === todayIST) {
        const { data: liveData } = await supabase
          .from("traffic_overview")
          .select("*")
          .eq("billboard_code", billboardCode)
          .order("last_updated", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (liveData && Number(liveData.total_vehicles) > 0) {
          const dt = liveData.last_updated ? new Date(liveData.last_updated) : new Date();
          const istHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
          return [{
            ...liveData,
            hour: istHour,
            total_vehicles: Number(liveData.total_vehicles),
            flow_rate: Number(liveData.flow_rate) || 0
          }];
        }
      }

      return [];
    } catch (err) {
      console.error("[billboardService] Error in getHourlyTraffic:", err);
      return [];
    }
  },

  /**
   * Calculates the Peak Traffic Hour specifically for a billboard and day by calculating
   * the maximum total number of vehicles from the database (traffic_hour).
   */
  getPeakTrafficHour: async (billboardCode: string, statDate?: string): Promise<{
    peakHourStr: string;
    peakHour: number | null;
    peakCount: number;
    avgDensity: number;
    hourlyData: any[];
  }> => {
    if (!billboardCode) {
      return { peakHourStr: '—', peakHour: null, peakCount: 0, avgDensity: 0, hourlyData: [] };
    }

    const hourlyData = await billboardService.getHourlyTraffic(billboardCode, statDate);
    if (!hourlyData || hourlyData.length === 0) {
      return { peakHourStr: '—', peakHour: null, peakCount: 0, avgDensity: 0, hourlyData: [] };
    }

    let peakRecord: any = null;
    let maxVehicles = 0;

    for (const record of hourlyData) {
      const count = Number(record.total_vehicles) || 0;
      if (count > maxVehicles) {
        maxVehicles = count;
        peakRecord = record;
      }
    }

    if (!peakRecord || maxVehicles <= 0) {
      return { peakHourStr: '—', peakHour: null, peakCount: 0, avgDensity: 0, hourlyData };
    }

    return {
      peakHourStr: billboardService.formatPeakHourWindow(peakRecord.hour),
      peakHour: Number(peakRecord.hour),
      peakCount: maxVehicles,
      avgDensity: Number((maxVehicles / 60).toFixed(1)),
      hourlyData
    };
  },

  /**
   * Calculates the Weekly Peak Traffic Hour and 7-day daily peak breakdown for a billboard
   * directly from database records (traffic_hour and traffic_day).
   */
  getWeeklyPeakTrafficHour: async (billboardCode: string): Promise<{
    weeklyPeakHourStr: string;
    weeklyPeakDay: string;
    weeklyPeakDate: string;
    weeklyPeakCount: number;
    weeklyAvgDensity: number;
    weeklyTotalVehicles: number;
    days: Array<{
      date: string;
      dayName: string;
      peakHourStr: string;
      peakHour: number | null;
      peakCount: number;
      totalVehicles: number;
      avgDensity: number;
      isWeeklyPeak: boolean;
    }>;
  }> => {
    const emptyResult = {
      weeklyPeakHourStr: '—',
      weeklyPeakDay: '—',
      weeklyPeakDate: '—',
      weeklyPeakCount: 0,
      weeklyAvgDensity: 0,
      weeklyTotalVehicles: 0,
      days: []
    };

    if (!billboardCode) return emptyResult;

    try {
      // Calculate 7-day range in IST
      const now = new Date();
      const dates: string[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
        dates.push(dateStr);
      }

      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      const todayDate = dates[dates.length - 1];

      // Query traffic_hour, traffic_day, and traffic_overview in parallel
      const [hourRes, dayRes, overviewRes] = await Promise.all([
        supabase
          .from("traffic_hour")
          .select("*")
          .eq("billboard_code", billboardCode)
          .gte("date", minDate)
          .lte("date", maxDate)
          .order("date", { ascending: true })
          .order("hour", { ascending: true }),
        supabase
          .from("traffic_day")
          .select("*")
          .eq("billboard_code", billboardCode)
          .gte("date", minDate)
          .lte("date", maxDate)
          .order("date", { ascending: true }),
        supabase
          .from("traffic_overview")
          .select("*")
          .eq("billboard_code", billboardCode)
          .order("last_updated", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      const hourRows = hourRes.data || [];
      const dayRows = dayRes.data || [];
      const liveOverview = overviewRes.data || null;

      // Map day rows by date
      const dayMap = new Map<string, any>();
      for (const dRow of dayRows) {
        dayMap.set(dRow.date, dRow);
      }

      // Group hour rows by date
      const hourByDate = new Map<string, any[]>();
      for (const hRow of hourRows) {
        const dKey = hRow.date || hRow.stat_date;
        if (dKey) {
          if (!hourByDate.has(dKey)) hourByDate.set(dKey, []);
          hourByDate.get(dKey)!.push(hRow);
        }
      }

      let overallMaxCount = 0;
      let overallPeakHour: number | null = null;
      let overallPeakDate = '—';
      let overallPeakDayName = '—';
      let weeklyTotal = 0;

      const days = dates.map(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00+05:30');
        const dayName = dayNames[dateObj.getDay()];
        const dayRow = dayMap.get(dateStr);
        const dayHours = hourByDate.get(dateStr) || [];

        let dayMaxCount = 0;
        let dayPeakHour: number | null = null;
        let dayCalculatedTotal = 0;

        for (const h of dayHours) {
          const count = Number(h.total_vehicles) || 0;
          dayCalculatedTotal += count;
          if (count > dayMaxCount) {
            dayMaxCount = count;
            dayPeakHour = Number(h.hour);
          }
        }

        let dayTotal = Number(dayRow?.total_vehicles) || dayCalculatedTotal || 0;

        // If today and no traffic_day record yet, incorporate live overview data
        if (dateStr === todayDate && liveOverview && Number(liveOverview.total_vehicles) > 0) {
          if (dayTotal === 0 || Number(liveOverview.total_vehicles) > dayTotal) {
            dayTotal = Number(liveOverview.total_vehicles);
          }
          if (dayMaxCount === 0) {
            const dt = liveOverview.last_updated ? new Date(liveOverview.last_updated) : new Date();
            dayPeakHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
            dayMaxCount = Number(liveOverview.total_vehicles);
          }
        }

        weeklyTotal += dayTotal;

        if (dayMaxCount > overallMaxCount) {
          overallMaxCount = dayMaxCount;
          overallPeakHour = dayPeakHour;
          overallPeakDate = dateStr;
          overallPeakDayName = dayName;
        }

        return {
          date: dateStr,
          dayName,
          peakHourStr: dayMaxCount > 0 ? billboardService.formatPeakHourWindow(dayPeakHour) : '—',
          peakHour: dayPeakHour,
          peakCount: dayMaxCount,
          totalVehicles: dayTotal,
          avgDensity: dayMaxCount > 0 ? Number((dayMaxCount / 60).toFixed(1)) : 0,
          isWeeklyPeak: false
        };
      });

      // Mark the weekly peak day
      if (overallMaxCount > 0) {
        days.forEach(d => {
          if (d.date === overallPeakDate && d.peakCount === overallMaxCount) {
            d.isWeeklyPeak = true;
          }
        });
      }

      return {
        weeklyPeakHourStr: overallMaxCount > 0 ? billboardService.formatPeakHourWindow(overallPeakHour) : '—',
        weeklyPeakDay: overallPeakDayName,
        weeklyPeakDate: overallPeakDate,
        weeklyPeakCount: overallMaxCount,
        weeklyAvgDensity: overallMaxCount > 0 ? Number((overallMaxCount / 60).toFixed(1)) : 0,
        weeklyTotalVehicles: weeklyTotal,
        days
      };
    } catch (err) {
      console.error("[billboardService] Error in getWeeklyPeakTrafficHour:", err);
      return emptyResult;
    }
  },

  /**
   * Fetch latest completed recording metadata and temporary signed URL for a billboard.
   */
  getLatestRecording: async (billboardCode: string): Promise<BillboardRecordingData | null> => {
    if (!billboardCode) return null;

    try {
      // 1. Try fetching metadata from billboard_latest_recordings
      const { data, error } = await supabase
        .from("billboard_latest_recordings")
        .select(
          "billboard_code, camera_ff_code, storage_path, recorded_at, uploaded_at, duration_seconds, file_name, file_size_bytes, status, updated_at"
        )
        .eq("billboard_code", billboardCode)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[billboardService] Notice fetching latest recording from DB:", error);
      }

      const storagePath = data?.storage_path || `${billboardCode}/latest.mp4`;
      let videoUrl: string | null = null;
      let signedUrlError: string | null = null;

      // 2. Generate signed URL from private bucket 'billboard-recordings'
      const { data: signedData, error: storageError } = await supabase.storage
        .from("billboard-recordings")
        .createSignedUrl(storagePath, 3600);

      if (signedData?.signedUrl) {
        videoUrl = signedData.signedUrl;
      } else if (data?.status === "completed") {
        console.error("[billboardService] Error creating signed URL:", storageError);
        signedUrlError = "Unable to generate the video playback URL. Please try again.";
      }

      // 3. If DB row exists, return it with generated videoUrl
      if (data) {
        return {
          billboard_code: data.billboard_code,
          camera_ff_code: data.camera_ff_code || null,
          storage_path: data.storage_path,
          recorded_at: data.recorded_at,
          uploaded_at: data.uploaded_at,
          duration_seconds: data.duration_seconds || 300,
          file_name: data.file_name || "latest.mp4",
          file_size_bytes: data.file_size_bytes,
          status: data.status || (videoUrl ? "completed" : "failed"),
          updated_at: data.updated_at,
          video_url: videoUrl,
          error: signedUrlError,
        };
      }

      // 4. Fallback: If DB row doesn't exist yet but file is in Storage, construct recording data
      if (videoUrl) {
        return {
          billboard_code: billboardCode,
          camera_ff_code: "CAM-FF-001",
          storage_path: storagePath,
          recorded_at: new Date().toISOString(),
          uploaded_at: new Date().toISOString(),
          duration_seconds: 300,
          file_name: "latest.mp4",
          file_size_bytes: null,
          status: "completed",
          updated_at: new Date().toISOString(),
          video_url: videoUrl,
          error: null,
        };
      }

      return null;
    } catch (err: any) {
      console.error("[billboardService] Error in getLatestRecording:", err);
      throw err;
    }
  },
};

export interface BillboardRecordingData {
  billboard_code: string;
  camera_ff_code: string | null;
  storage_path: string;
  recorded_at: string | null;
  uploaded_at: string | null;
  duration_seconds: number | null;
  file_name: string | null;
  file_size_bytes: number | null;
  status: string;
  updated_at: string | null;
  video_url?: string | null;
  error?: string | null;
}

/**
 * Format timestamp in Asia/Kolkata timezone (IST) as e.g. "16 Sep 2026, 8:05 AM"
 */
export function formatISTDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);

    let day = "";
    let monthNum = 1;
    let year = "";
    let hour = "";
    let minute = "";
    let dayPeriod = "";

    for (const p of parts) {
      if (p.type === "day") day = p.value;
      if (p.type === "month") monthNum = parseInt(p.value, 10);
      if (p.type === "year") year = p.value;
      if (p.type === "hour") hour = p.value;
      if (p.type === "minute") minute = p.value;
      if (p.type === "dayPeriod") dayPeriod = p.value.toUpperCase();
    }

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[monthNum - 1] || "Jan";

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch (e) {
    return "—";
  }
}

/**
 * Format duration in seconds to "5 minutes" or "X min Y sec"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(Number(seconds))) return "—";
  const totalSecs = Math.round(Number(seconds));
  if (totalSecs <= 0) return "0 seconds";
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins > 0 && secs === 0) {
    return `${mins} minute${mins > 1 ? "s" : ""}`;
  }
  if (mins > 0) {
    return `${mins} min ${secs} sec`;
  }
  return `${secs} seconds`;
}

/**
 * Format file size in bytes to human readable string (e.g. 45.2 MB)
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(Number(bytes))) return "—";
  const b = Number(bytes);
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculate the next scheduled recording time in Asia/Kolkata (IST).
 * Schedule: 08:00 AM, 01:00 PM, 06:00 PM IST
 * Example output: "16 Sep 2026, 1:00 PM"
 */
export function getNextScheduledRecordingTime(baseDate: Date = new Date()): {
  formattedText: string;
  timeText: string;
  dateText: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(baseDate);
  const getPart = (name: string) =>
    parseInt(parts.find((p) => p.type === name)?.value || "0", 10);

  const year = getPart("year");
  const month = getPart("month") - 1; // 0-indexed
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const currentMinutes = hour * 60 + minute;

  const schedules = [
    { hour: 8, minute: 0, label: "8:00 AM", minutesOfDay: 8 * 60 },
    { hour: 13, minute: 0, label: "1:00 PM", minutesOfDay: 13 * 60 },
    { hour: 18, minute: 0, label: "6:00 PM", minutesOfDay: 18 * 60 },
  ];

  // Find the first slot strictly after current time
  const nextSlot = schedules.find((s) => s.minutesOfDay > currentMinutes);

  let targetYear = year;
  let targetMonth = month;
  let targetDay = day;
  let targetSlot: { hour: number; minute: number; label: string; minutesOfDay: number };

  if (nextSlot) {
    targetSlot = nextSlot;
  } else {
    // Next day at 8:00 AM
    targetSlot = schedules[0];
    const tomorrow = new Date(Date.UTC(year, month, day + 1));
    targetYear = tomorrow.getUTCFullYear();
    targetMonth = tomorrow.getUTCMonth();
    targetDay = tomorrow.getUTCDate();
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateText = `${targetDay} ${months[targetMonth]} ${targetYear}`;
  const formattedText = `${dateText}, ${targetSlot.label}`;

  return {
    formattedText,
    timeText: targetSlot.label,
    dateText,
  };
}
