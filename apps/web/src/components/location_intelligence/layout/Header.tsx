"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Bell,
  MapPin,
  Play,
  ChevronDown,
} from "lucide-react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080";

interface HeaderProps {
  latitude: number;
  longitude: number;
  radius: number;
  onAnalyze: (lat: number, lng: number, rad: number) => void;
  isMapPickingActive: boolean;
  setIsMapPickingActive: (active: boolean) => void;
  area?: string;
  onMenuClick?: () => void;
}

export default function Header({
  latitude,
  longitude,
  radius,
  onAnalyze,
  isMapPickingActive,
  setIsMapPickingActive,
  area,
  onMenuClick,
}: HeaderProps) {
  // Inputs
  const [latVal, setLatVal] = useState<string>(latitude.toString());
  const [lngVal, setLngVal] = useState<string>(longitude.toString());
  const [radVal, setRadVal] = useState<number>(radius);
  const [detectedArea, setDetectedArea] = useState("");
  const [areaSearch, setAreaSearch] = useState("");

  // Sync typed query when coordinates analysis updates detected area name
  useEffect(() => {
    if (detectedArea && detectedArea !== "Unknown") {
      setAreaSearch(detectedArea);
    } else if (area) {
      setAreaSearch(area);
    }
  }, [detectedArea, area]);

  // Auto-detect area name based on coordinates
  useEffect(() => {
    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);
    if (!isNaN(lat) && !isNaN(lng)) {
      const delayDebounce = setTimeout(() => {
        axios.get(`${API_BASE}/api/location/v1/area/detect`, {
          params: { latitude: lat, longitude: lng }
        }).then(res => {
          setDetectedArea(res.data.area);
        }).catch(() => {
          setDetectedArea("Unknown");
        });
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [latVal, lngVal]);

  // Sync inputs with parent state
  useEffect(() => {
    setLatVal(latitude.toString());
  }, [latitude]);

  useEffect(() => {
    setLngVal(longitude.toString());
  }, [longitude]);

  useEffect(() => {
    setRadVal(radius);
  }, [radius]);

  const handleAnalyzeClick = async () => {
    // If a different area search name was typed by the user, geocode it first!
    if (areaSearch && areaSearch !== detectedArea && areaSearch !== area) {
      try {
        const res = await axios.get(`${API_BASE}/api/location/v1/geocode`, {
          params: { q: areaSearch }
        });
        const { latitude: newLat, longitude: newLng } = res.data;
        setLatVal(newLat.toString());
        setLngVal(newLng.toString());
        onAnalyze(newLat, newLng, radVal);
        return;
      } catch (err: any) {
        console.error("Geocoding failed", err);
        const detail = err.response?.data?.detail || "Location not found. Try T Nagar, Anna Nagar, Velachery, Adyar, OMR, Guindy, Porur, or Tambaram.";
        alert(detail);
        return;
      }
    }

    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);
    if (!isNaN(lat) && !isNaN(lng)) {
      onAnalyze(lat, lng, radVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAnalyzeClick();
    }
  };

  return (
    <header className="relative lg:sticky top-0 z-40 w-full border-b border-border/80 bg-[#0d1222]/95 backdrop-blur-md px-3 sm:px-5 py-2.5 shrink-0 shadow-md">
      {/* DESKTOP LAYOUT (>= lg) */}
      <div className="hidden lg:flex items-center justify-between gap-3 w-full">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Aculion</span>
            <h1 className="text-sm font-black text-white tracking-tight leading-none mt-1">
              Intelligence
            </h1>
          </div>
        </div>

        {/* Middle/Main: Map inputs in a single horizontal bar */}
        <div className="flex items-center gap-2.5 bg-background/50 p-1.5 border border-border/80 rounded-xl flex-1 min-w-0">
          {/* Lat Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/90 border border-border rounded-lg shrink-0 w-[105px]">
            <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LAT</span>
            <input
              type="number"
              step="any"
              value={latVal}
              onChange={(e) => setLatVal(e.target.value)}
              className="bg-transparent border-none text-sm w-full focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Lng Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/90 border border-border rounded-lg shrink-0 w-[105px]">
            <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LNG</span>
            <input
              type="number"
              step="any"
              value={lngVal}
              onChange={(e) => setLngVal(e.target.value)}
              className="bg-transparent border-none text-sm w-full focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Area Search Display */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-background/90 border border-border rounded-lg flex-1 min-w-0">
            <span className="text-xs font-black text-emerald-400 tracking-wider uppercase shrink-0">AREA</span>
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search area..."
              className="bg-transparent border-none text-sm font-bold text-white p-0 w-full min-w-0 focus:outline-none truncate"
            />
          </div>

          {/* Radius Selector */}
          <div className="relative w-[95px] shrink-0">
            <select
              value={radVal}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRadVal(val);
                const currentLat = parseFloat(latVal);
                const currentLng = parseFloat(lngVal);
                if (!isNaN(currentLat) && !isNaN(currentLng)) {
                  onAnalyze(currentLat, currentLng, val);
                } else {
                  onAnalyze(latitude, longitude, val);
                }
              }}
              className="appearance-none bg-background/90 border border-border rounded-lg pl-3 pr-7 py-1.5 text-xs font-extrabold focus:outline-none hover:border-primary cursor-pointer w-full text-white"
            >
              <option value="500">500 m</option>
              <option value="1000">1.0 km</option>
              <option value="1500">1.5 km</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Map Pin Picker Trigger */}
          <button
            onClick={() => setIsMapPickingActive(!isMapPickingActive)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 border rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 w-[85px] ${
              isMapPickingActive
                ? "bg-primary border-primary text-primary-foreground animate-pulse shadow-md"
                : "border-border bg-background/90 hover:bg-secondary text-muted-foreground hover:text-white"
            }`}
            title="Click and select a point directly on the interactive map"
          >
            <MapPin size={13} className={isMapPickingActive ? "animate-bounce" : ""} />
            <span>Pick</span>
          </button>

          {/* Analyze CTA */}
          <button
            onClick={handleAnalyzeClick}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-xs font-black shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-95 transition-all duration-150 shrink-0 w-[110px]"
          >
            <Play size={12} className="fill-current" />
            <span>Analyze</span>
          </button>
        </div>
      </div>

      {/* MOBILE LAYOUT (< lg) */}
      <div className="flex lg:hidden flex-col gap-3 w-full">
        {/* Mobile Brand Row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Aculion</span>
            <h1 className="text-sm font-black text-white tracking-tight leading-none mt-1">
              Intelligence
            </h1>
          </div>
        </div>

        {/* Mobile Card Container */}
        <div className="bg-[#0d1222]/90 border border-white/10 rounded-[20px] p-4 sm:p-5 flex flex-col gap-3 shadow-lg">
          {/* Row 1: LAT & LNG in 2-column grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Lat Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-background/90 border border-white/10 rounded-xl min-w-0">
              <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LAT</span>
              <input
                type="number"
                step="any"
                value={latVal}
                onChange={(e) => setLatVal(e.target.value)}
                className="bg-transparent border-none text-sm w-full min-w-0 focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Lng Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-background/90 border border-white/10 rounded-xl min-w-0">
              <span className="text-xs font-black text-blue-400 tracking-wider uppercase shrink-0">LNG</span>
              <input
                type="number"
                step="any"
                value={lngVal}
                onChange={(e) => setLngVal(e.target.value)}
                className="bg-transparent border-none text-sm w-full min-w-0 focus:outline-none font-mono font-bold text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Row 2: AREA input full width */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-background/90 border border-white/10 rounded-xl w-full min-w-0">
            <span className="text-xs font-black text-emerald-400 tracking-wider uppercase shrink-0">AREA</span>
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search area..."
              className="bg-transparent border-none text-sm font-bold text-white p-0 w-full min-w-0 focus:outline-none truncate"
            />
          </div>

          {/* Row 3: RADIUS selector full width */}
          <div className="relative w-full">
            <select
              value={radVal}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRadVal(val);
                const currentLat = parseFloat(latVal);
                const currentLng = parseFloat(lngVal);
                if (!isNaN(currentLat) && !isNaN(currentLng)) {
                  onAnalyze(currentLat, currentLng, val);
                } else {
                  onAnalyze(latitude, longitude, val);
                }
              }}
              className="appearance-none bg-background/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-extrabold focus:outline-none hover:border-primary cursor-pointer w-full text-white pr-9"
            >
              <option value="500">Radius: 500 m</option>
              <option value="1000">Radius: 1.0 km</option>
              <option value="1500">Radius: 1.5 km</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Row 4: Action buttons side by side */}
          <div className="grid grid-cols-[1fr_1.5fr] gap-3 pt-1">
            {/* Pick Button */}
            <button
              onClick={() => setIsMapPickingActive(!isMapPickingActive)}
              className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-xs font-extrabold transition-all duration-200 ${
                isMapPickingActive
                  ? "bg-primary border-primary text-primary-foreground animate-pulse shadow-md"
                  : "border-white/10 bg-background/90 hover:bg-secondary text-muted-foreground hover:text-white"
              }`}
              title="Click and select a point directly on the interactive map"
            >
              <MapPin size={15} className={isMapPickingActive ? "animate-bounce" : ""} />
              <span>Pick</span>
            </button>

            {/* Analyze CTA */}
            <button
              onClick={handleAnalyzeClick}
              className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-95 transition-all duration-150"
            >
              <Play size={14} className="fill-current" />
              <span>Analyze</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
