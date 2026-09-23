"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { locationService } from "../../../services/location.service";
import { LocationAnalytics, Billboard } from "../../../types/location";
import { billboardService } from "../../../services/billboard.service";
import KPICardsGrid from "../cards/KPICardsGrid";
import POIDistributionChart from "../charts/POIDistributionChart";
import LandUseChart from "../charts/LandUseChart";
import RoadAnalyticsList from "../charts/RoadAnalyticsList";
import LocationMap from "../maps/LocationMap";
import AIRecommendationSidebar from "../layout/AIRecommendationSidebar";
import {
  MapPin,
  Crosshair,
  Play,
  ChevronDown,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Layers
} from "lucide-react";

// ── Comprehensive Regional Landmark / Hub Dictionary for Instant Coordinate Resolution ──
const CHENNAI_REGIONS = [
  { name: "Anna Nagar Shanthi Colony", lat: 13.0827, lng: 80.2707 },
  { name: "Anna Nagar West Extension", lat: 13.0890, lng: 80.1980 },
  { name: "Periamet Commercial Corridor", lat: 13.0850, lng: 80.2750 },
  { name: "Chennai Central Railway Junction", lat: 13.0825, lng: 80.2755 },
  { name: "Nungambakkam High Road", lat: 13.0617, lng: 80.2422 },
  { name: "T-Nagar Commercial Hub", lat: 13.0418, lng: 80.2341 },
  { name: "Pondy Bazaar Retail District", lat: 13.0405, lng: 80.2370 },
  { name: "OMR IT Expressway (Tidel)", lat: 12.9892, lng: 80.2483 },
  { name: "Thoraipakkam OMR Corridor", lat: 12.9430, lng: 80.2360 },
  { name: "Sholinganallur Junction", lat: 12.9010, lng: 80.2279 },
  { name: "Velachery Junction Depot", lat: 12.9780, lng: 80.2210 },
  { name: "Phoenix Marketcity Area", lat: 12.9925, lng: 80.2170 },
  { name: "Guindy Industrial Estate", lat: 13.0067, lng: 80.2022 },
  { name: "Kathipara Junction Interchange", lat: 13.0070, lng: 80.2045 },
  { name: "Egmore Railway Central", lat: 13.0732, lng: 80.2609 },
  { name: "Kilpauk Medical Corridor", lat: 13.0780, lng: 80.2410 },
  { name: "Adyar Sardar Patel Road", lat: 13.0012, lng: 80.2565 },
  { name: "Besant Nagar Beach Road", lat: 12.9990, lng: 80.2710 },
  { name: "Mylapore Luz Corner", lat: 13.0335, lng: 80.2676 },
  { name: "Alwarpet TTK Road", lat: 13.0340, lng: 80.2500 },
  { name: "Koyambedu CMBT Hub", lat: 13.0694, lng: 80.1948 },
  { name: "Porur Toll Junction", lat: 13.0382, lng: 80.1565 },
  { name: "Tambaram Sanatorium Hub", lat: 12.9249, lng: 80.1280 },
  { name: "Chromepet GST Road", lat: 12.9516, lng: 80.1462 },
  { name: "Pallavaram Arterial Corridor", lat: 12.9675, lng: 80.1491 },
  { name: "Marina Beach Kamarajar Salai", lat: 13.0500, lng: 80.2824 },
  { name: "Royapettah High Road", lat: 13.0530, lng: 80.2610 },
  { name: "Mount Road / Anna Salai", lat: 13.0600, lng: 80.2550 },
  { name: "Vadapalani Forum Mall Hub", lat: 13.0500, lng: 80.2120 },
  { name: "Ashok Nagar 11th Avenue", lat: 13.0370, lng: 80.2120 },
  { name: "KK Nagar Double Tank", lat: 13.0320, lng: 80.2000 },
];

function resolveLocalArea(lat: number, lng: number): string {
  let closest = "";
  let minDist = Infinity;
  for (const hub of CHENNAI_REGIONS) {
    const dist = Math.hypot(lat - hub.lat, lng - hub.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = hub.name;
    }
  }
  if (minDist <= 0.035) {
    return closest;
  }
  return `Point (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
}

export default function Dashboard({ selectedBillboard }: { selectedBillboard?: any }) {
  const queryClient = useQueryClient();

  const initialLat = selectedBillboard?.latitude ? Number(selectedBillboard.latitude) : 13.0827;
  const initialLng = selectedBillboard?.longitude ? Number(selectedBillboard.longitude) : 80.2707;

  // ── UI State ──
  const [isMapPickingActive, setIsMapPickingActive] = useState(true);

  // ── Candidate coordinates (editable & map pick target) ──
  const [candidateLat, setCandidateLat] = useState(initialLat);
  const [candidateLng, setCandidateLng] = useState(initialLng);
  const [candidateLatStr, setCandidateLatStr] = useState(initialLat.toFixed(6));
  const [candidateLngStr, setCandidateLngStr] = useState(initialLng.toFixed(6));

  // ── Dynamic Area Name derived purely from (candidateLat, candidateLng) ──
  const [resolvedAreaName, setResolvedAreaName] = useState(resolveLocalArea(initialLat, initialLng));
  const [isResolvingArea, setIsResolvingArea] = useState(false);

  // ── Query parameters (committed on Analyze click) ──
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [radius, setRadius] = useState(1000);

  // Sync coords when selectedBillboard prop changes
  useEffect(() => {
    if (selectedBillboard?.latitude && selectedBillboard?.longitude) {
      const lat = Number(selectedBillboard.latitude);
      const lng = Number(selectedBillboard.longitude);
      setLatitude(lat);
      setLongitude(lng);
      setCandidateLat(lat);
      setCandidateLng(lng);
      setCandidateLatStr(lat.toFixed(6));
      setCandidateLngStr(lng.toFixed(6));
    }
  }, [selectedBillboard]);

  // Dynamic reverse-geocoding whenever candidate coordinates change
  useEffect(() => {
    if (isNaN(candidateLat) || isNaN(candidateLng)) return;

    setIsResolvingArea(true);
    const localMatch = resolveLocalArea(candidateLat, candidateLng);
    setResolvedAreaName(localMatch);

    const debounceTimer = setTimeout(async () => {
      try {
        const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: {
            format: "json",
            lat: candidateLat,
            lon: candidateLng,
            zoom: 16,
            addressdetails: 1,
          },
          timeout: 4500,
        });

        if (res.data && res.data.address) {
          const addr = res.data.address;
          const name =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.commercial ||
            addr.road ||
            addr.city_district ||
            addr.county ||
            addr.city ||
            res.data.name;

          if (name) {
            const fullTitle = addr.city && addr.city !== name ? `${name}, ${addr.city}` : name;
            setResolvedAreaName(fullTitle);
            setIsResolvingArea(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to regional lookup
      }
      setResolvedAreaName(localMatch);
      setIsResolvingArea(false);
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [candidateLat, candidateLng]);

  // ── Handle manual Latitude change ──
  const handleLatChange = (val: string) => {
    setCandidateLatStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= -90 && num <= 90) {
      setCandidateLat(num);
    }
  };

  // ── Handle manual Longitude change ──
  const handleLngChange = (val: string) => {
    setCandidateLngStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= -180 && num <= 180) {
      setCandidateLng(num);
    }
  };

  // ── Map click handler → updates candidate coordinates dynamically ──
  const handleLocationPicked = (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setCandidateLat(roundedLat);
    setCandidateLng(roundedLng);
    setCandidateLatStr(roundedLat.toFixed(6));
    setCandidateLngStr(roundedLng.toFixed(6));
  };

  // ── Analyze button handler ──
  const handleAnalyzeSubmit = () => {
    const finalLat = candidateLat || latitude;
    const finalLng = candidateLng || longitude;
    setLatitude(finalLat);
    setLongitude(finalLng);
    setRadius(radius);
  };

  // ── Analytics query — refetches whenever latitude/longitude/radius changes ──
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
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

  // ── Listen for chatbot analyze actions ──
  useEffect(() => {
    const handleChatAnalyzeSite = (e: any) => {
      const { latitude: lat, longitude: lng } = e.detail;
      setCandidateLat(lat);
      setCandidateLng(lng);
      setCandidateLatStr(Number(lat).toFixed(6));
      setCandidateLngStr(Number(lng).toFixed(6));
      setLatitude(lat);
      setLongitude(lng);
    };
    window.addEventListener("chat-analyze-site", handleChatAnalyzeSite);
    return () => {
      window.removeEventListener("chat-analyze-site", handleChatAnalyzeSite);
    };
  }, []);

  return (
    <div className="w-full min-h-full bg-[#070913] text-white flex flex-col overflow-x-hidden">
      
      {/* ── Main Single Dashboard Column + Sidebar Row ── */}
      <div className="flex flex-col lg:flex-row w-full flex-1 min-w-0">
        
        {/* ── Main Analytics Area (Left / Center) ── */}
        <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-6 box-border">

          {/* ═══════════════════════════════════════════════════════════════
             1. TOP LOCATION INTELLIGENCE CONTROL BAR (ABOVE KPI CARDS)
          ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-[#0e1628]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
              
              {/* Left: Dynamic Area Badge */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/10">
                  <MapPin size={22} className={isResolvingArea ? "animate-bounce text-cyan-400" : "text-blue-400"} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">
                      Location Area
                    </span>
                    {isResolvingArea ? (
                      <span className="text-[9px] text-cyan-400 animate-pulse font-mono font-bold">
                        • Resolving Coords...
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live GPS
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate mt-1" title={resolvedAreaName}>
                    {resolvedAreaName || "Anna Nagar Shanthi Colony"}
                  </h2>
                </div>
              </div>

              {/* Right: Controls Container (LAT, LNG, RADIUS, PICK, ANALYZE) */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-[#080d1a]/85 p-2 border border-white/10 rounded-xl">
                
                {/* Latitude Input */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121829] border border-white/10 rounded-lg shrink-0 w-full sm:w-[135px] focus-within:border-blue-500 transition-colors">
                  <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LAT</span>
                  <input
                    type="number"
                    step="any"
                    value={candidateLatStr}
                    onChange={(e) => handleLatChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyzeSubmit()}
                    placeholder="Latitude"
                    className="bg-transparent border-none text-xs sm:text-sm w-full focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Longitude Input */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121829] border border-white/10 rounded-lg shrink-0 w-full sm:w-[135px] focus-within:border-blue-500 transition-colors">
                  <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LNG</span>
                  <input
                    type="number"
                    step="any"
                    value={candidateLngStr}
                    onChange={(e) => handleLngChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyzeSubmit()}
                    placeholder="Longitude"
                    className="bg-transparent border-none text-xs sm:text-sm w-full focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Radius Selector */}
                <div className="relative w-full sm:w-[100px] shrink-0">
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="appearance-none bg-[#121829] border border-white/10 rounded-lg pl-3 pr-7 py-2 text-xs font-black focus:outline-none hover:border-blue-500 cursor-pointer w-full text-white"
                  >
                    <option value="500">500 m</option>
                    <option value="1000">1.0 km</option>
                    <option value="1500">1.5 km</option>
                    <option value="2000">2.0 km</option>
                    <option value="3000">3.0 km</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
                </div>

                {/* Pick on Map Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMapPickingActive(!isMapPickingActive)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-black transition-all duration-200 shrink-0 w-full sm:w-auto cursor-pointer ${
                    isMapPickingActive
                      ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                      : "border-white/10 bg-[#121829] hover:bg-white/10 text-white/70 hover:text-white"
                  }`}
                  title="Click anywhere on the map to pick coordinates"
                >
                  <Crosshair size={14} className={isMapPickingActive ? "animate-spin" : ""} />
                  <span>{isMapPickingActive ? "Picking Active" : "Pick on Map"}</span>
                </button>

                {/* Analyze Action Button */}
                <button
                  type="button"
                  onClick={handleAnalyzeSubmit}
                  disabled={isAnalyticsLoading || isAnalyticsFetching}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black shadow-lg shadow-blue-500/30 hover:opacity-95 active:scale-95 transition-all duration-150 shrink-0 w-full sm:w-auto cursor-pointer disabled:opacity-50"
                >
                  {isAnalyticsLoading || isAnalyticsFetching ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} className="fill-current" />
                  )}
                  <span>{isAnalyticsLoading || isAnalyticsFetching ? "Analyzing..." : "Analyze"}</span>
                </button>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             2. LOCATION KPI PERFORMANCE CARDS
          ═══════════════════════════════════════════════════════════════ */}
          {analytics && (
            <KPICardsGrid analytics={analytics} />
          )}

          {/* ═══════════════════════════════════════════════════════════════
             3. INTERACTIVE MAP
          ═══════════════════════════════════════════════════════════════ */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0e18]">
            {isAnalyticsLoading && (
              <div className="absolute inset-0 z-30 bg-[#070913]/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-white tracking-wider uppercase animate-pulse">
                  Computing Spatial Suitability...
                </span>
              </div>
            )}
            
            <LocationMap
              latitude={latitude}
              longitude={longitude}
              radius={radius}
              poiLocations={analytics?.poi_locations || []}
              heatmapPoints={analytics?.heatmap_points || []}
              isMapPickingActive={isMapPickingActive}
              onLocationPicked={handleLocationPicked}
              selectedLat={candidateLat}
              selectedLng={candidateLng}
              billboards={billboards}
              onAnalyzeSite={(lat, lng) => {
                setCandidateLat(lat);
                setCandidateLng(lng);
                setCandidateLatStr(lat.toFixed(6));
                setCandidateLngStr(lng.toFixed(6));
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             4. ANALYTICS CHARTS GRID (POI, LAND USE, ROAD RADAR)
          ═══════════════════════════════════════════════════════════════ */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* POI Category Density */}
              <div className="glassmorphism glass-hover p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">POI Category Density</h3>
                  <p className="text-[10px] text-white/50 mt-0.5 font-mono">
                    {analytics.features?.total_pois || 1090} POIs within {radius}m • {analytics.features?.area_km2 || 3.14} km² radius zone
                  </p>
                </div>
                <POIDistributionChart
                  data={analytics.poi_distribution}
                  radius={radius}
                  areaKm2={analytics.features?.area_km2 || 3.1416}
                />
              </div>

              {/* Zoning & Land Use */}
              <div className="glassmorphism glass-hover p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider">Zoning & Land Use Mix</h3>
                  <p className="text-[10px] text-white/50 mt-0.5 font-mono">
                    Land use mix entropy: {analytics.features?.land_use_mix || 62.6}%
                  </p>
                </div>
                <LandUseChart
                  data={analytics.land_use_distribution}
                  areaKm2={analytics.features?.area_km2 || 3.14}
                  entropy={analytics.features?.land_use_mix || 62.6}
                />
              </div>

              {/* Road & Transit Infrastructure */}
              <div className="glassmorphism glass-hover p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 lg:col-span-2">
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Road & Transit Infrastructure</h3>
                  <p className="text-[10px] text-white/50 mt-0.5 font-mono">
                    Road network: {((analytics.features?.road_length_m || 0) / 1000).toFixed(1)} km • Junctions: {analytics.features?.junction_density || 0}/km²
                  </p>
                </div>
                <RoadAnalyticsList data={analytics.road_analytics} />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             5. FEATURE EXPLORER GRID
          ═══════════════════════════════════════════════════════════════ */}
          {analytics && (
            <div className="glassmorphism glass-hover p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Spatial Feature Explorer</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GIS INDICES
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "POI Density", value: `${analytics.features?.poi_density || 0}/km²`, color: "text-blue-400" },
                  { label: "Road Density", value: `${analytics.features?.road_density || 0} km/km²`, color: "text-cyan-400" },
                  { label: "Transit Score", value: `${analytics.features?.transit_accessibility || 0}`, color: "text-violet-400" },
                  { label: "Walkability", value: `${analytics.features?.walkability || 0}%`, color: "text-emerald-400" },
                  { label: "Commercial Mix", value: `${analytics.features?.commercial_density || 0}%`, color: "text-amber-400" },
                  { label: "Land Use Mix", value: `${analytics.features?.land_use_mix || 0}%`, color: "text-orange-400" },
                  { label: "Bus Stops", value: `${analytics.features?.bus_count || 0}`, color: "text-indigo-400" },
                  { label: "Rail Stations", value: `${analytics.features?.rail_count || 0}`, color: "text-purple-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0f1526]/80 border border-white/5 rounded-xl p-3 hover:border-white/20 transition-colors">
                    <span className="text-[9px] font-bold text-white/50 uppercase block">{item.label}</span>
                    <span className={`text-sm sm:text-base font-black font-mono mt-0.5 block ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ── Right AI Recommendation Sidebar (Fixed 360px on desktop) ── */}
        {analytics && (
          <div className="w-full lg:w-[360px] lg:min-w-[360px] lg:max-w-[360px] shrink-0">
            <AIRecommendationSidebar
              analytics={analytics}
              candidateLat={candidateLat}
              candidateLng={candidateLng}
              radius={radius}
            />
          </div>
        )}

      </div>

    </div>
  );
}
