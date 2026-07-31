"use client";

import React, { useMemo, useState } from "react";
import { POIDistributionEnriched } from "../../../types/location";
import { motion, AnimatePresence } from "framer-motion";

interface POIDistributionChartProps {
  data?: POIDistributionEnriched[];
  radius?: number;
  areaKm2?: number;
}

const DEFAULT_POI_DATA: POIDistributionEnriched[] = [
  { category: "Food & Dining", count: 64, density: 20.4, percentage: 26.8, weighted_score: 85 },
  { category: "Retail", count: 44, density: 14.0, percentage: 18.5, weighted_score: 78 },
  { category: "Banking & Finance", count: 34, density: 10.8, percentage: 14.2, weighted_score: 72 },
  { category: "Healthcare", count: 27, density: 8.6, percentage: 11.5, weighted_score: 68 },
  { category: "Education", count: 21, density: 6.7, percentage: 8.9, weighted_score: 65 },
  { category: "Entertainment", count: 15, density: 4.8, percentage: 6.4, weighted_score: 60 },
  { category: "Fuel Stations", count: 12, density: 3.8, percentage: 5.2, weighted_score: 55 },
  { category: "Hotels", count: 11, density: 3.5, percentage: 4.8, weighted_score: 52 },
  { category: "Parks & Recreation", count: 9, density: 2.9, percentage: 3.7, weighted_score: 48 },
];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  "food & dining": "#F97316",
  "food_dining": "#F97316",
  "home furnishing": "#84CC16",
  "home_furnishing": "#84CC16",
  "fashion": "#D946EF",
  "retail": "#E11D48",
  "healthcare": "#22C55E",
  "banking & finance": "#EAB308",
  "banking_finance": "#EAB308",
  "education": "#10B981",
  "electronics": "#06B6D4",
  "commercial": "#9333EA",
  "residential": "#2563EB",
  "real_estate": "#FF0011",
  "recreation": "#10B981",
  "office": "#A855F7",
  "shopping": "#EC4899",
  "fuel stations": "#EF4444",
  "hotels": "#3B82F6",
  "parks & recreation": "#10B981",
  "others": "#64748B",
};

const COLOR_PALETTE = [
  "#F97316", "#84CC16", "#D946EF", "#E11D48", "#22C55E",
  "#EAB308", "#10B981", "#06B6D4", "#9333EA", "#2563EB"
];

function getColor(cat: string, idx: number): string {
  const k = cat.toLowerCase().trim();
  if (CATEGORY_COLOR_MAP[k]) return CATEGORY_COLOR_MAP[k];
  for (const [key, val] of Object.entries(CATEGORY_COLOR_MAP)) {
    if (k.includes(key) || key.includes(k)) return val;
  }
  return COLOR_PALETTE[idx % COLOR_PALETTE.length];
}

export default function POIDistributionChart({
  data,
  radius = 1000,
  areaKm2 = 3.1416,
}: POIDistributionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const processedData = useMemo(() => {
    const activeData = data && Array.isArray(data) && data.length > 0 ? data : DEFAULT_POI_DATA;
    const active = activeData.filter((d) => (d.count || 0) > 0 || (d.percentage || 0) > 0);
    const source = active.length > 0 ? active : DEFAULT_POI_DATA;
    const total = source.reduce((acc, curr) => acc + (curr.count || 0), 0) || 237;
    const sliced = source.slice(0, 10);
    const maxPct = Math.max(...sliced.map((s) => s.percentage || 0));

    return sliced.map((item, idx) => {
      const count = item.count || Math.round(((item.percentage || 0) / 100) * total);
      const pct = item.percentage ?? parseFloat(((count / total) * 100).toFixed(1));
      const den = item.density ?? parseFloat((count / (areaKm2 || 3.1416)).toFixed(1));
      const catUpper = item.category.toUpperCase();
      return {
        category: catUpper,
        count: count,
        percentage: pct,
        density: den,
        color: getColor(item.category, idx),
        isDominant: pct === maxPct && maxPct > 0,
      };
    });
  }, [data, areaKm2]);

  // Dimensions for radial polar chart
  const size = 380;
  const height = 250;
  const center = { x: size / 2, y: height / 2 };
  const outerRadius = 72;
  const innerRadius = 14;

  const N = processedData.length;
  const angleSpan = 360 / N;

  const getWedgePath = (startAngle: number, endAngle: number, r: number) => {
    const gap = 2.5; // Degree gap between wedges
    const radStart = (startAngle + gap / 2 - 90) * (Math.PI / 180);
    const radEnd = (endAngle - gap / 2 - 90) * (Math.PI / 180);

    const x1 = center.x + r * Math.cos(radStart);
    const y1 = center.y + r * Math.sin(radStart);
    const x2 = center.x + r * Math.cos(radEnd);
    const y2 = center.y + r * Math.sin(radEnd);

    const xInner1 = center.x + innerRadius * Math.cos(radStart);
    const yInner1 = center.y + innerRadius * Math.sin(radStart);
    const xInner2 = center.x + innerRadius * Math.cos(radEnd);
    const yInner2 = center.y + innerRadius * Math.sin(radEnd);

    const largeArc = endAngle - startAngle - gap > 180 ? 1 : 0;

    return `M ${xInner1} ${yInner1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xInner2} ${yInner2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xInner1} ${yInner1} Z`;
  };

  return (
    <div className="w-full flex items-center justify-center select-none py-1">
      <div className="w-full max-w-[500px] h-[250px] bg-[#0d1527]/90 rounded-2xl border border-white/5 p-2 flex items-center justify-center relative overflow-hidden shadow-inner">
        <svg viewBox={`0 0 ${size} ${height}`} className="w-full h-full overflow-visible">
          {/* Concentric grid lines */}
          {[0.35, 0.65, 1.0].map((scale, i) => (
            <circle
              key={i}
              cx={center.x}
              cy={center.y}
              r={outerRadius * scale}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="2 2"
            />
          ))}

          {/* Wedges & Radial Labels */}
          {processedData.map((d, i) => {
            const startAngle = i * angleSpan;
            const endAngle = startAngle + angleSpan;
            const midAngle = startAngle + angleSpan / 2;

            const isHovered = hoveredIndex === i;
            const path = getWedgePath(startAngle, endAngle, outerRadius);

            // Radial label position calculation
            const labelRadius = outerRadius + 22;
            const radMid = (midAngle - 90) * (Math.PI / 180);
            const labelX = center.x + labelRadius * Math.cos(radMid);
            const labelY = center.y + labelRadius * Math.sin(radMid);

            const cosVal = Math.cos(radMid);
            let textAnchor: "start" | "end" | "middle" = "middle";
            if (cosVal > 0.25) textAnchor = "start";
            else if (cosVal < -0.25) textAnchor = "end";

            return (
              <g key={d.category} className="transition-all duration-300">
                {/* Wedge slice */}
                <path
                  d={path}
                  fill={d.color}
                  fillOpacity={hoveredIndex === null || isHovered ? 1.0 : 0.6}
                  stroke={d.isDominant ? "#FFFFFF" : "rgba(0,0,0,0.4)"}
                  strokeWidth={d.isDominant ? 2.5 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    filter: d.isDominant
                      ? "drop-shadow(0 0 8px rgba(255,255,255,0.35))"
                      : isHovered
                      ? `drop-shadow(0 0 6px ${d.color})`
                      : "none",
                  }}
                />

                {/* Radial Category Text Label */}
                <text
                  x={labelX}
                  y={labelY + 3}
                  textAnchor={textAnchor}
                  fill={isHovered || d.isDominant ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)"}
                  className="text-[8.5px] font-black uppercase tracking-wider font-sans transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {d.category}
                </text>
              </g>
            );
          })}

          {/* Central Black Core */}
          <circle
            cx={center.x}
            cy={center.y}
            r={innerRadius - 2}
            fill="#090a0f"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
          />
        </svg>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredIndex !== null && processedData[hoveredIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-xl border border-border px-3 py-1.5 rounded-xl shadow-2xl text-[10.5px] text-foreground flex items-center gap-3 z-50 pointer-events-none"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: processedData[hoveredIndex].color }}
                />
                <span className="font-extrabold uppercase text-white tracking-wider">
                  {processedData[hoveredIndex].category}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono border-l border-border/40 pl-2.5">
                <span className="font-bold text-white">
                  {processedData[hoveredIndex].count} POIs
                </span>
                <span className="text-emerald-400 font-bold">
                  ({processedData[hoveredIndex].percentage}%)
                </span>
                <span className="text-muted-foreground text-[9.5px]">
                  {processedData[hoveredIndex].density}/km²
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
