"use client";

import React, { useMemo, useState } from "react";
import { POIDistributionEnriched } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface POIDistributionChartProps {
  data: POIDistributionEnriched[];
}

const SCORE_LABELS = [
  { min: 90.0, label: "Exceptional", color: "#2458C9", textClass: "text-[#2458C9]" },
  { min: 60.0, label: "Strong",      color: "#1978E0", textClass: "text-[#1978E0]" },
  { min: 40.0, label: "Developing",  color: "#0D9ED4", textClass: "text-[#0D9ED4]" }, // midpoint blend
  { min: 20.0, label: "Emerging",    color: "#03D4C4", textClass: "text-[#03D4C4]" },
  { min: 0.01, label: "Minimal",     color: "#05E8D8", textClass: "text-[#05E8D8]" }, // lighter teal
  { min: 0.0,  label: "No Data",     color: "#1F3A6E", textClass: "text-[#1F3A6E]" }  // muted dark blue
];


const POI_COLORS: Record<string, string> = {
  real_estate: "#ff0011",      // --red
  fitness: "#ff2b2f",          // --cinnabar
  food_dining: "#ff4026",      // --scarlet-fire
  shopping: "#ff5900",         // --blaze-orange
  home_furnishing: "#ff702e",  // --atomic-tangerine
  fashion: "#ff7c30",          // --pumpkin-spice
  office: "#ff8800",           // --dark-orange
  electronics: "#ff9500",      // --deep-saffron
  retail: "#ffa200",           // --amber-glow
  commercial: "#ffb300",       // --amber-flame
  automotive: "#ff0011",       // Cycle back
  healthcare: "#ff2b2f",
  banking_finance: "#ff4026",
  residential: "#ff5900",
  education: "#ff702e",
  entertainment: "#ff7c30",
  travel_tourism: "#ff8800"
};

function getScoreLabelInfo(score: number) {
  for (const band of SCORE_LABELS) {
    if (score >= band.min) return band;
  }
  return SCORE_LABELS[SCORE_LABELS.length - 1];
}

export default function POIDistributionChart({ data }: POIDistributionChartProps) {
  const [hoveredWedge, setHoveredWedge] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Filter categories with count > 0, cap at 10, prioritizing highest absolute_score
  const processedData = useMemo(() => {
    const active = data.filter(d => d.count > 0);
    const sorted = [...active].sort((a, b) => (b.absolute_score ?? 0) - (a.absolute_score ?? 0));
    const sliced = sorted.slice(0, 10);
    
    // Find the category with the highest relative_share to apply the locally dominant highlight
    const maxRelativeShare = sliced.length > 0 ? Math.max(...sliced.map(d => d.relative_share ?? 0)) : 0;
    
    return sliced.map(d => ({
      ...d,
      isDominant: maxRelativeShare > 0 && (d.relative_share ?? 0) === maxRelativeShare
    }));
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 15
    });
  };

  if (processedData.length === 0) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center text-muted-foreground text-xs">
        No POI categories mapping this location
      </div>
    );
  }

  // Viewport/radius calculations for Radial Polar Area Chart
  const outerRadius = 80;
  const size = 260;
  const center = size / 2;

  // Polar wedge path helper with gap/spacing
  const getWedgePath = (startAngle: number, endAngle: number, radius: number) => {
    // Leave a small gap of 3 degrees between wedges
    const gap = 3.5;
    const radStart = (startAngle + gap/2 - 90) * (Math.PI / 180);
    const radEnd = (endAngle - gap/2 - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(radStart);
    const y1 = center + radius * Math.sin(radStart);
    const x2 = center + radius * Math.cos(radEnd);
    const y2 = center + radius * Math.sin(radEnd);

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none relative" onMouseMove={handleMouseMove}>
      
      {/* Component 2: Radial POI Density Chart (Desktop/Tablet View) */}
      <div className="hidden md:flex w-full items-center justify-center relative overflow-hidden bg-gradient-to-br from-card/30 to-card/10 rounded-2xl border border-white/5 p-4 h-[260px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] max-h-[260px] overflow-visible">
          {/* Concentric reference grids (20%, 40%, 60%, 80%, 100%) */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={outerRadius * scale}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="2 2"
            />
          ))}

          {/* Spokes drawing */}
          {processedData.map((d, index) => {
            const numSpokes = processedData.length;
            const angleSpan = 360 / numSpokes;
            const startAngle = index * angleSpan;
            const endAngle = startAngle + angleSpan;
            const midAngle = startAngle + angleSpan / 2;
            
            // Length is determined ONLY by absolute_score (0-100)
            const score = d.absolute_score ?? 0;
            const wedgeRadius = Math.max(12, (score / 100) * outerRadius);
            
            const band = getScoreLabelInfo(score);
            const isHovered = hoveredWedge?.category === d.category;
            const path = getWedgePath(startAngle, endAngle, wedgeRadius);

            // Label position coordinates (slightly beyond outer radius)
            const labelDist = outerRadius + 14;
            const radMid = (midAngle - 90) * (Math.PI / 180);
            const labelX = center + labelDist * Math.cos(radMid);
            const labelY = center + labelDist * Math.sin(radMid);

            // Determine text anchor based on circle side
            const cosVal = Math.cos(radMid);
            let textAnchor: "start" | "end" | "middle" = "middle";
            if (cosVal > 0.15) textAnchor = "start";
            else if (cosVal < -0.15) textAnchor = "end";


            return (
              <g key={d.category} className="transition-all duration-300">
                {/* Wedge body */}
                <motion.path
                  d={path}
                  fill={POI_COLORS[d.category] || band.color}
                  fillOpacity={isHovered ? 1.0 : 0.95}
                  stroke={d.isDominant ? "#FFF" : "rgba(255,255,255,0.1)"}
                  strokeWidth={d.isDominant ? (isHovered ? 2.5 : 1.5) : (isHovered ? 1.0 : 0.5)}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredWedge(d)}
                  onMouseLeave={() => setHoveredWedge(null)}
                  style={{
                    filter: d.isDominant ? "drop-shadow(0 0 6px rgba(255,255,255,0.25))" : "none"
                  }}
                />

                {/* Clear, readable outer labels */}
                <text
                  x={labelX}
                  y={labelY + 3}
                  textAnchor={textAnchor}
                  fill="rgba(255, 255, 255, 0.75)"
                  className="text-[8px] font-black uppercase tracking-wider"
                  style={{ pointerEvents: "none" }}
                >
                  {d.label || d.category}
                </text>
              </g>
            );
          })}

          {/* Central background center core */}
          <circle cx={center} cy={center} r={10} fill="#0d0e12" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        </svg>

        {/* Hover Tooltip in plain language */}
        <AnimatePresence>
          {hoveredWedge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                position: "absolute",
                left: tooltipPos.x,
                top: tooltipPos.y,
                pointerEvents: "none"
              }}
              className="bg-popover/95 backdrop-blur-xl border border-border p-3 rounded-xl shadow-2xl text-[11px] text-foreground space-y-1 min-w-[200px] z-50 pointer-events-none"
            >
              <div className="flex items-center gap-1.5 border-b border-border/40 pb-1 justify-between">
                <span className="font-extrabold uppercase text-[9px] tracking-wider text-muted-foreground">{hoveredWedge.label || hoveredWedge.category}</span>
                {hoveredWedge.isDominant && (
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-amber-400">Dominant</span>
                )}
              </div>
              <p className="font-semibold text-foreground leading-relaxed">
                {hoveredWedge.label || hoveredWedge.category}: {hoveredWedge.count} locations ({hoveredWedge.density}/km²) — {" "}
                <span className={getScoreLabelInfo(hoveredWedge.absolute_score).textClass}>
                  {getScoreLabelInfo(hoveredWedge.absolute_score).label} presence
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Component 2: Mobile Fallback (Vertical list of horizontal bars) */}
      <div className="md:hidden w-full flex flex-col gap-3 p-4 bg-card/25 rounded-2xl border border-white/5">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">POI Category Strengths</h3>
        <div className="space-y-3">
          {processedData.map((d) => {
            const score = d.absolute_score ?? 0;
            const band = getScoreLabelInfo(score);
            return (
              <div key={d.category} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {d.label || d.category}
                    {d.isDominant && <span className="text-[8px] font-black text-amber-400 uppercase">Dominant</span>}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {d.count} POIs ({score}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score}%`,
                      backgroundColor: POI_COLORS[d.category] || band.color,
                      boxShadow: d.isDominant ? `0 0 8px ${POI_COLORS[d.category] || band.color}` : "none"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
