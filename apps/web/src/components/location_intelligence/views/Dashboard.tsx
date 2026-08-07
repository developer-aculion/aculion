import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationService } from "../../../services/location.service";
import { LocationAnalytics, Billboard } from "../../../types/location";
import { billboardService } from "../../../services/billboard.service";
import Header from "../layout/Header";
import KPICardsGrid from "../cards/KPICardsGrid";
import POIDistributionChart from "../charts/POIDistributionChart";
import LandUseChart from "../charts/LandUseChart";
import RoadAnalyticsList from "../charts/RoadAnalyticsList";
import LocationMap from "../maps/LocationMap";
import AIRecommendationSidebar from "../layout/AIRecommendationSidebar";
import { Layers, HelpCircle } from "lucide-react";

export default function Dashboard() {
  const queryClient = useQueryClient();

  // ── UI State ──
  const [isMapPickingActive, setIsMapPickingActive] = useState(false);

  // ── Candidate coordinate ──
  const [candidateLat, setCandidateLat] = useState(13.0827);
  const [candidateLng, setCandidateLng] = useState(80.2707);

  // ── Query parameters ──
  const [latitude, setLatitude] = useState(13.0827);
  const [longitude, setLongitude] = useState(80.2707);
  const [radius, setRadius] = useState(1000);

  // ── Analytics query — refetches whenever latitude/longitude/radius changes ──
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery<LocationAnalytics>({
    queryKey: ["analytics", latitude, longitude, radius],
    queryFn: () => locationService.analyzeLocation(latitude, longitude, radius, undefined),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ── Fetch all registered billboards ──
  const {
    data: billboards = [],
  } = useQuery<Billboard[]>({
    queryKey: ["billboards"],
    queryFn: billboardService.getBillboards,
    staleTime: 5 * 60 * 1000,
  });

  // ── Analyze button handler (commits candidate → query coords) ──
  const handleAnalyze = (lat: number, lng: number, rad: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setRadius(rad);
    setCandidateLat(lat);
    setCandidateLng(lng);
  };

  // ── Map click → candidate only (NO auto-fetch) ──
  const handleLocationPicked = (lat: number, lng: number) => {
    setCandidateLat(lat);
    setCandidateLng(lng);
    setIsMapPickingActive(false);
  };

  // ── Listen for chatbot analyze actions ──
  useEffect(() => {
    const handleChatAnalyzeSite = (e: any) => {
      const { latitude: lat, longitude: lng } = e.detail;
      handleAnalyze(lat, lng, radius);
    };
    window.addEventListener("chat-analyze-site", handleChatAnalyzeSite);
    return () => {
      window.removeEventListener("chat-analyze-site", handleChatAnalyzeSite);
    };
  }, [radius]);


  // ── Skeleton loader ──
  if (isAnalyticsLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
        <div className="flex-1 flex flex-col">
          <Header
            latitude={candidateLat} longitude={candidateLng} radius={radius}
            onAnalyze={handleAnalyze}
            isMapPickingActive={isMapPickingActive}
            setIsMapPickingActive={setIsMapPickingActive}
            area={(analytics as any)?.area}
            onMenuClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
          />
          <div className="flex-1 p-6 space-y-5 animate-pulse">
            <div className="grid grid-cols-7 gap-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-[118px] bg-card/40 border border-border/60 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-10 gap-5">
              <div className="col-span-7 h-[520px] bg-card/40 border border-border/60 rounded-2xl" />
              <div className="col-span-3 h-[520px] bg-card/40 border border-border/60 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-3">
          <HelpCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold">Analytics Unavailable</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Could not load spatial analytics. Check that the FastAPI server is running.
          </p>
          <button onClick={() => refetchAnalytics()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground w-full max-w-full flex-col">
      <Header
        latitude={candidateLat}
        longitude={candidateLng}
        radius={radius}
        onAnalyze={handleAnalyze}
        isMapPickingActive={isMapPickingActive}
        setIsMapPickingActive={setIsMapPickingActive}
        area={analytics?.area}
        onMenuClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
      />

      <div className="flex-1 overflow-y-auto min-h-0 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col lg:flex-row min-h-full w-full max-w-full overflow-x-hidden">
          {/* ── Main Single Dashboard Column (fills remaining horizontal space) ── */}
          <main className="w-full flex-1 min-w-0 p-5 space-y-5 overflow-x-hidden">
            {/* 1. KPI Cards — dynamic cards */}
            <KPICardsGrid analytics={analytics} />

            {/* 2. Map + Asset Summary */}
            <div className="grid grid-cols-10 gap-5">
              {/* Map (10/10) */}
              <div className="col-span-10">
                <LocationMap
                  latitude={latitude}
                  longitude={longitude}
                  radius={radius}
                  poiLocations={analytics.poi_locations || []}
                  heatmapPoints={analytics.heatmap_points || []}
                  isMapPickingActive={isMapPickingActive}
                  onLocationPicked={handleLocationPicked}
                  selectedLat={candidateLat}
                  selectedLng={candidateLng}
                  billboards={billboards}
                  onAnalyzeSite={(lat, lng) => handleAnalyze(lat, lng, radius)}
                />
              </div>


            </div>

            {/* 3. Analytics Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glassmorphism glass-hover p-6 rounded-2xl border border-border space-y-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">POI Category Density</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {analytics.features?.total_pois || 1090} POIs within {radius}m - {analytics.features?.area_km2 || 3.1416} km² area
                  </p>
                </div>
                <POIDistributionChart
                  data={analytics.poi_distribution}
                  radius={radius}
                  areaKm2={analytics.features?.area_km2 || 3.1416}
                />
              </div>

              {/* Land Use */}
              <div className="glassmorphism glass-hover p-6 rounded-2xl border border-border space-y-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Zoning & Land Use</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Land use mix entropy: {analytics.features?.land_use_mix || 62.6}%
                  </p>
                </div>
                <LandUseChart
                  data={analytics.land_use_distribution}
                  areaKm2={analytics.features?.area_km2 || 3.14}
                  entropy={analytics.features?.land_use_mix || 62.6}
                />
              </div>

              {/* Road Radar */}
              <div className="glassmorphism glass-hover p-6 rounded-2xl border border-border space-y-4 lg:col-span-2">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Road & Transit Infrastructure</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Road network: {((analytics.features?.road_length_m || 0) / 1000).toFixed(1)} km · Junctions: {analytics.features?.junction_density || 0}/km²
                  </p>
                </div>
                <RoadAnalyticsList data={analytics.road_analytics} />
              </div>
            </div>

            {/* 4. Feature Insights + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Feature Explorer */}
              <div className="glassmorphism glass-hover p-6 rounded-2xl border border-border space-y-5">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Feature Explorer</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "POI Density", value: `${analytics.features?.poi_density || 0}/km²`, color: "text-blue-400" },
                    { label: "Road Density", value: `${analytics.features?.road_density || 0} km/km²`, color: "text-cyan-400" },
                    { label: "Transit Score", value: `${analytics.features?.transit_accessibility || 0}`, color: "text-violet-400" },
                    { label: "Walkability", value: `${analytics.features?.walkability || 0}%`, color: "text-emerald-400" },
                    { label: "Commercial Mix", value: `${analytics.features?.commercial_density || 0}%`, color: "text-amber-400" },
                    { label: "Land Use Mix", value: `${analytics.features?.land_use_mix || 0}%`, color: "text-orange-400" },
                    { label: "Building Density", value: `${analytics.features?.building_density || 0}%`, color: "text-sky-400" },
                    { label: "Bus Stops", value: `${analytics.features?.bus_count || 0}`, color: "text-indigo-400" },
                    { label: "Rail Stations", value: `${analytics.features?.rail_count || 0}`, color: "text-purple-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background/40 border border-border/50 rounded-xl p-2.5">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase block">{item.label}</span>
                      <span className={`text-sm font-black font-mono ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* ── Right AI Recommendation Sidebar (Fixed 320px width) ── */}
          <div className="w-full lg:w-[380px] lg:min-w-[380px] lg:max-w-[380px] shrink-0">
            <AIRecommendationSidebar
              analytics={analytics}
              candidateLat={candidateLat}
              candidateLng={candidateLng}
              radius={radius}
            />
          </div>
        </div>
      </div>


    </div>
  );
}
