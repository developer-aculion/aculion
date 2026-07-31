"use client";

import React, { useMemo, useState } from "react";
import { LandUseDistribution } from "../../../types/location";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LandUseChartProps {
  data?: LandUseDistribution[];
  areaKm2?: number;
  entropy?: number;
}

const DEFAULT_LAND_USE_DATA: LandUseDistribution[] = [
  { name: "Specialized Uses", value: 76.7 },
  { name: "Commercial", value: 18.5 },
  { name: "Industrial", value: 4.1 },
  { name: "Residential", value: 0.5 },
  { name: "Recreation", value: 0.2 },
];

const LAND_USE_DESCRIPTIONS: Record<string, string> = {
  "commercial": "Corporate offices, retail markets, and business complexes",
  "residential": "Apartments, housing communities, and neighborhood zones",
  "industrial": "Warehouses, manufacturing units, and logistics parks",
  "recreation": "Parks, playgrounds, sports arenas, and green open space",
  "green space": "Parks, playgrounds, sports arenas, and green open space",
  "others": "Government land, transit hubs, utilities, and mixed specialized uses",
  "specialized uses": "Government land, transit hubs, utilities, and mixed specialized uses",
  "mixed use": "Combined commercial, residential, and civic spaces",
};

const LAND_USE_COLORS: Record<string, string> = {
  "commercial": "#F59E0B",
  "specialized uses": "#94A3B8",
  "others": "#94A3B8",
  "industrial": "#EF4444",
  "recreation": "#10B981",
  "green space": "#10B981",
  "residential": "#2563EB",
  "retail": "#8B5CF6",
  "mixed use": "#06B6D4",
};

const COLOR_PALETTE = [
  "#F59E0B", "#94A3B8", "#EF4444", "#10B981", "#2563EB", "#8B5CF6", "#06B6D4"
];

const OTHERS_EXAMPLES = [
  "Government land",
  "Religious areas",
  "Transportation facilities",
  "Utility infrastructure",
  "Military land",
  "Cemeteries",
  "Forests",
  "Vacant land",
  "Agricultural land",
  "Unknown or unmapped land-use polygons",
];

function getLandUseColor(name: string, index: number): string {
  const lower = name.toLowerCase().trim();
  if (LAND_USE_COLORS[lower]) return LAND_USE_COLORS[lower];
  for (const [k, col] of Object.entries(LAND_USE_COLORS)) {
    if (lower.includes(k) || k.includes(lower)) return col;
  }
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export default function LandUseChart({
  data,
  areaKm2 = 3.14,
}: LandUseChartProps) {
  const [showOthersInfo, setShowOthersInfo] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const processedData = useMemo(() => {
    const activeData = data && Array.isArray(data) && data.length > 0 ? data : DEFAULT_LAND_USE_DATA;
    const active = activeData.filter((d) => (d.value || 0) > 0);
    const source = active.length > 0 ? active : DEFAULT_LAND_USE_DATA;

    return source.map((item, idx) => ({
      name: item.name,
      value: item.value,
      color: getLandUseColor(item.name, idx),
    }));
  }, [data]);

  // Donut SVG parameters
  const size = 180;
  const center = size / 2;
  const outerRadius = 78;
  const innerRadius = 48;

  const totalValue = processedData.reduce((acc, curr) => acc + curr.value, 0) || 100;

  // Compute SVG arc paths
  let cumulativeAngle = 0;
  const slices = processedData.map((item) => {
    const sliceAngle = (item.value / totalValue) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const radStart = (startAngle - 90) * (Math.PI / 180);
    const radEnd = (endAngle - 90) * (Math.PI / 180);

    const x1 = center + outerRadius * Math.cos(radStart);
    const y1 = center + outerRadius * Math.sin(radStart);
    const x2 = center + outerRadius * Math.cos(radEnd);
    const y2 = center + outerRadius * Math.sin(radEnd);

    const xInner1 = center + innerRadius * Math.cos(radStart);
    const yInner1 = center + innerRadius * Math.sin(radStart);
    const xInner2 = center + innerRadius * Math.cos(radEnd);
    const yInner2 = center + innerRadius * Math.sin(radEnd);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = `M ${xInner1} ${yInner1} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${xInner2} ${yInner2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xInner1} ${yInner1} Z`;

    return {
      ...item,
      path,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="w-full flex flex-col items-center relative select-none">
      {/* Main Chart + Right Legend container */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 py-1">
        
        {/* SVG Donut Chart (Center Left) */}
        <div className="w-full md:w-1/2 h-[220px] flex items-center justify-center relative">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-[180px] h-[180px] overflow-visible">
            {slices.map((slice, idx) => {
              const isHovered = activeIndex === idx;
              return (
                <path
                  key={slice.name}
                  d={slice.path}
                  fill={slice.color}
                  fillOpacity={activeIndex === null || isHovered ? 1 : 0.55}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : "none",
                    transform: isHovered ? "scale(1.03)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                />
              );
            })}

            {/* Donut Center Label */}
            <circle cx={center} cy={center} r={innerRadius - 2} fill="#0f172a" />
            <text x={center} y={center - 4} textAnchor="middle" fill="#FFFFFF" className="text-base font-black font-mono">
              {activeIndex !== null ? `${processedData[activeIndex].value}%` : `${processedData[0]?.value}%`}
            </text>
            <text x={center} y={center + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" className="text-[8px] font-bold uppercase tracking-widest">
              {activeIndex !== null ? processedData[activeIndex].name : processedData[0]?.name}
            </text>
          </svg>
        </div>

        {/* Legend List (Right Side) */}
        <div className="w-full md:w-1/2 flex flex-col space-y-2 max-h-[220px] overflow-y-auto pl-2">
          {processedData.map((item, idx) => {
            const isSpecialized = item.name.toLowerCase().includes("specialized") || item.name.toLowerCase().includes("others");
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer p-1 rounded-lg ${
                  activeIndex === idx ? "bg-white/10 scale-105" : "hover:bg-white/5"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span style={{ color: item.color }} className="truncate">
                  {item.name} ({item.value}%)
                </span>
                {isSpecialized && (
                  <button
                    onClick={() => setShowOthersInfo(!showOthersInfo)}
                    className="text-amber-400 hover:text-amber-300 transition-colors ml-0.5"
                    title="View 'Specialized Uses' details"
                  >
                    <Info size={12} className="inline" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Info button & Hover popover for 'Specialized Uses' explanation */}
      <div className="w-full pt-2 px-1 flex justify-between items-center border-t border-border/30 text-[10px]">
        <button
          onClick={() => setShowOthersInfo(!showOthersInfo)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-400 font-bold transition-colors py-1"
        >
          <Info size={12} className="text-amber-400" />
          <span>What is included in &quot;Specialized Uses&quot; land-use?</span>
        </button>

        {showOthersInfo && (
          <div className="absolute bottom-10 left-4 right-4 bg-popover/98 backdrop-blur-xl border border-amber-500/30 p-3.5 rounded-xl text-xs shadow-2xl text-foreground z-50 animate-fadeIn space-y-2">
            <div className="flex justify-between items-center border-b border-border/50 pb-1.5">
              <span className="font-black text-amber-400 text-xs flex items-center gap-1.5">
                <Info size={13} />
                <span>Land Use Category: Specialized Uses</span>
              </span>
              <button
                onClick={() => setShowOthersInfo(false)}
                className="text-muted-foreground hover:text-foreground font-extrabold text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-foreground font-medium leading-relaxed">
              <strong>Specialized Uses</strong> includes land-use polygons that do not belong to the major categories. Examples include:
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              {OTHERS_EXAMPLES.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
