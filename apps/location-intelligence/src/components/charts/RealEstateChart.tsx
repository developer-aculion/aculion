"use client";

import React, { useMemo, useState } from "react";
import { RealEstateRecord } from "@/types";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Filter } from "lucide-react";

interface RealEstateChartProps {
  data?: RealEstateRecord[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl text-[10px] shadow-2xl text-foreground space-y-1 z-50">
      <p className="font-extrabold text-xs text-white border-b border-border/40 pb-1 uppercase tracking-wider">
        {d.area}
      </p>
      <div className="grid grid-cols-2 gap-x-3 pt-1 font-mono">
        <span className="text-muted-foreground">Category:</span>
        <span className="text-right text-white font-bold">{d.category}</span>
        <span className="text-muted-foreground">Tier:</span>
        <span className="text-right text-white font-bold">{d.tier}</span>
        <span className="text-muted-foreground">Min Price:</span>
        <span className="text-right font-bold" style={{ color: "#03D4C4" }}>₹{d.price_low.toLocaleString()}/sqft</span>
        <span className="text-muted-foreground">Max Price:</span>
        <span className="text-right font-bold" style={{ color: "#2458C9" }}>₹{d.price_high.toLocaleString()}/sqft</span>
      </div>
    </div>
  );
};

// Premium blue-green palette: #2458C9, #1978E0, #03D4C4 interpolated
const AREA_COLORS = [
  "#2458C9",
  "#1978E0",
  "#03D4C4",
  "#1565C0",
  "#1E88E5",
  "#00BCD4",
  "#2979FF",
  "#26C6DA",
  "#1976D2",
  "#0097A7",
];

export default function RealEstateChart({ data }: RealEstateChartProps) {
  // ⚠️ All hooks MUST be at the top level — BEFORE any early return
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    if (!data || data.length === 0) return ["All"];
    const cats = new Set(data.map((d) => d.category));
    return ["All", ...Array.from(cats)];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let filtered = [...data];
    if (selectedCategory !== "All") {
      filtered = filtered.filter((d) => d.category === selectedCategory);
    }
    return filtered.map((d, i) => ({
      ...d,
      label: d.area,
      base: d.price_low,
      rangeHeight: Math.max(0, d.price_high - d.price_low),
      colorIndex: i % AREA_COLORS.length,
    }));
  }, [data, selectedCategory]);

  const domainMin = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(0, Math.min(...chartData.map(d => d.price_low)) - 1000);
  }, [chartData]);

  const domainMax = useMemo(() => {
    if (chartData.length === 0) return 20000;
    return Math.max(...chartData.map(d => d.price_high)) + 1500;
  }, [chartData]);

  // Early return AFTER all hooks
  if (!data || data.length === 0) return null;

  if (chartData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
        No properties match the selected filter.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Category filter tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter size={11} />
          <span className="text-[9px] font-black uppercase tracking-wider">Property Category</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? "text-white shadow-sm"
                  : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
              style={selectedCategory === cat ? { background: "#1978E0" } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/*
        Floating range bar chart using stacked bars:
        - "base" bar: transparent spacer that starts from 0 up to price_low
        - "rangeHeight" bar: visible colored bar spanning price_low → price_high
      */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 55, left: 2, bottom: 4 }}
            barCategoryGap="30%"
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              domain={[domainMin, domainMax]}
              stroke="rgba(255,255,255,0.25)"
              fontSize={8}
              fontFamily="monospace"
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              stroke="rgba(255,255,255,0.25)"
              fontSize={8}
              width={68}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />

            {/* Invisible base spacer — lifts visible bar to start at price_low */}
            <Bar
              dataKey="base"
              stackId="range"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />

            {/* Visible price range bar */}
            <Bar
              dataKey="rangeHeight"
              stackId="range"
              radius={[3, 3, 3, 3]}
              isAnimationActive
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={AREA_COLORS[entry.colorIndex]}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Mini legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {chartData.map((d, i) => (
          <span key={`leg-${i}`} className="flex items-center gap-1 text-[8px] text-muted-foreground font-mono">
            <span
              className="inline-block w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: AREA_COLORS[d.colorIndex], opacity: 0.9 }}
            />
            {d.area}{d.tier && d.tier !== "General" ? ` (${d.tier})` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
