"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LandUseDistribution } from "@/types";
import { Info } from "lucide-react";

interface LandUseChartProps {
  data: LandUseDistribution[];
}

// Distinct professional land use color palette
const LAND_USE_COLORS: Record<string, string> = {
  "Residential": "#2563EB",
  "Commercial": "#F59E0B",
  "Industrial": "#EF4444",
  "Retail": "#8B5CF6",
  "Education": "#06B6D4",
  "Institutional": "#06B6D4",
  "Recreation": "#10B981",
  "Green Space": "#10B981",
  "Mixed Use": "#6366F1",
  "Specialized Uses": "#94A3B8",
};

const FALLBACK_PALETTE = [
  "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#10B981", "#6366F1", "#94A3B8",
];

function getLandUseColor(name: string, index: number): string {
  if (LAND_USE_COLORS[name]) {
    return LAND_USE_COLORS[name];
  }
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(LAND_USE_COLORS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return color;
    }
  }
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

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

export default function LandUseChart({ data }: LandUseChartProps) {
  const [showOthersInfo, setShowOthersInfo] = useState(false);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const isSpecialized = item.name.toLowerCase() === "specialized uses" || item.name.toLowerCase() === "specialized";

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl text-xs shadow-2xl text-foreground space-y-2 max-w-[290px] z-50">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 gap-4">
          <span className="font-extrabold uppercase text-[9px] tracking-wider text-muted-foreground">ZONING CATEGORY</span>
          <span className="font-mono font-black text-primary text-xs">{item.value}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.payload?.fill || getLandUseColor(item.name, 0) }} />
          <p className="font-extrabold text-sm text-foreground">{item.name}</p>
        </div>

        {isSpecialized && (
          <div className="space-y-1.5 pt-2 border-t border-border/40 text-[10px] leading-relaxed">
            <p className="text-foreground font-semibold">
              <strong className="text-primary">Specialized Uses</strong> includes land-use polygons that do not belong to the major categories. Examples include:
            </p>
            <ul className="space-y-0.5 text-muted-foreground pl-1">
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
    );
  };

  const renderLegendText = (value: string) => {
    const item = data.find((d) => d.name === value);
    const valText = item ? ` (${item.value}%)` : "";
    const isSpecialized = value.toLowerCase() === "specialized uses" || value.toLowerCase() === "specialized";

    return (
      <span className="text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors inline-flex items-center gap-1 group">
        <span>{value}{valText}</span>
        {isSpecialized && (
          <span
            onMouseEnter={() => setShowOthersInfo(true)}
            onMouseLeave={() => setShowOthersInfo(false)}
            className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Click or hover to view 'Specialized Uses' explanation"
          >
            <Info size={11} className="inline" />
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="w-full h-[280px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getLandUseColor(entry.name, index)}
                  stroke="rgba(0,0,0,0.2)"
                />
              ))}
            </Pie>
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              formatter={renderLegendText}
              wrapperStyle={{ right: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Info button & Hover popover for 'Specialized Uses' explanation */}
      <div className="w-full pt-1 px-1 flex justify-between items-center border-t border-border/30 text-[10px]">
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
