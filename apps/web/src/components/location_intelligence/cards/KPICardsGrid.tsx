"use client";

import React from "react";
import { LocationAnalytics } from "../../../types/location";
import {
  Award, Compass, MapPin, ShieldCheck, Flame, Building2,
  Leaf, Home, HelpCircle, AlertTriangle
} from "lucide-react";

interface KPICardsGridProps {
  analytics: LocationAnalytics;
}

const KPI_DISPLAY_NAMES: Record<string, string> = {
  overall_score:        "Overall Suitability",
  accessibility:        "Accessibility",
  commercial_potential: "Commercial Potential",
  residential_density:  "Residential Density",
  transit_connectivity: "Transit Connectivity",
  green_coverage:       "Green Coverage",
  building_density:     "Building Density",
  footfall_potential:   "Footfall Potential",
};

const KPI_ICONS: Record<string, React.ComponentType<any>> = {
  overall_score:        Award,
  accessibility:        Compass,
  commercial_potential: MapPin,
  residential_density:  Home,
  transit_connectivity: ShieldCheck,
  green_coverage:       Leaf,
  building_density:     Building2,
  footfall_potential:   Flame,
};

// Threshold-based color system per spec:
// >90 Exceptional → Green  #22C55E
// >60 Strong      → Blue   #3B82F6
// >40 Developing  → Amber  #F59E0B
// >20 Emerging    → Red    #EF4444
const TIER_STYLES: Record<string, {
  hex:    string;        // exact hex for inline style use
  glow:   string;        // subtle glow/shadow class
  bg:     string;        // card background
  border: string;        // card border
  iconBg: string;        // icon wrapper bg
}> = {
  "Exceptional": {
    hex:    "#22C55E",
    glow:   "shadow-[0_0_18px_rgba(34,197,94,0.12)]",
    bg:     "bg-[#0A1A0E]/80",
    border: "border-[#22C55E]/25",
    iconBg: "bg-[#22C55E]/12",
  },
  "Strong": {
    hex:    "#3B82F6",
    glow:   "shadow-[0_0_18px_rgba(59,130,246,0.12)]",
    bg:     "bg-[#0A0F1E]/80",
    border: "border-[#3B82F6]/25",
    iconBg: "bg-[#3B82F6]/12",
  },
  "Developing": {
    hex:    "#F59E0B",
    glow:   "shadow-[0_0_18px_rgba(245,158,11,0.12)]",
    bg:     "bg-[#1A1400]/80",
    border: "border-[#F59E0B]/25",
    iconBg: "bg-[#F59E0B]/12",
  },
  "Emerging": {
    hex:    "#EF4444",
    glow:   "shadow-[0_0_18px_rgba(239,68,68,0.12)]",
    bg:     "bg-[#1A0A0A]/80",
    border: "border-[#EF4444]/25",
    iconBg: "bg-[#EF4444]/12",
  },
};

export default function KPICardsGrid({ analytics }: KPICardsGridProps) {
  const labelsPayload = analytics.kpi_labels;
  if (!labelsPayload || !labelsPayload.kpi_labels) {
    // Fallback card grid when kpi_labels payload isn't present
    if (!analytics.kpis) return null;
    const kpis = analytics.kpis;
    const activeEntries = Object.entries(kpis).filter(([k]) => KPI_DISPLAY_NAMES[k]);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-white">Location KPI Performance</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {activeEntries.map(([key, val]) => {
            const numVal = typeof val === "number" ? val : 0;
            const tier = numVal >= 90 ? "Exceptional" : numVal >= 60 ? "Strong" : numVal >= 40 ? "Developing" : "Emerging";
            const styles = TIER_STYLES[tier];
            const Icon = KPI_ICONS[key] || HelpCircle;
            return (
              <div
                key={key}
                className={`flex-1 min-w-[110px] max-w-[200px] flex flex-col gap-2 p-3.5 rounded-2xl border backdrop-blur-sm ${styles.bg} ${styles.border} ${styles.glow}`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-white/50 leading-tight">
                    {KPI_DISPLAY_NAMES[key]}
                  </span>
                  <div className={`p-1.5 rounded-lg shrink-0 ${styles.iconBg}`}>
                    <Icon size={11} style={{ color: styles.hex }} />
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-[11px] font-black leading-snug" style={{ color: styles.hex }}>
                    {tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white">{numVal.toFixed(0)}/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const { kpi_labels, data_confidence_note } = labelsPayload;
  const aiConfidence = kpi_labels["ai_confidence"];

  // Show card for every KPI with value > 0
  const activeKpis = Object.entries(kpi_labels)
    .filter(([key, item]) => {
      if (key === "ai_confidence" || key === "competition_level") return false;
      if (!KPI_DISPLAY_NAMES[key]) return false;
      return item && item.value != null && item.value > 0;
    })
    .map(([key, item]) => {
      const tier = item.tier ?? "Emerging";
      const styles = TIER_STYLES[tier] ?? TIER_STYLES["Emerging"];
      return {
        key,
        name:      KPI_DISPLAY_NAMES[key],
        value:     item.value,
        tier,
        label:     item.label ?? tier,
        threshold: item.threshold ?? (tier === "Emerging" ? 20 : tier === "Developing" ? 40 : tier === "Strong" ? 60 : 90),
        Icon:      KPI_ICONS[key] || HelpCircle,
        styles,
      };
    });

  if (activeKpis.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header + AI Confidence pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Location KPI Performance</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Adaptive intelligence indices · updates with each location.
          </p>
        </div>

        {aiConfidence && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-card/60 backdrop-blur-md">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide">
              Data Confidence:
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{
                color: (aiConfidence.value ?? 0) >= 80 ? "#22C55E" :
                       (aiConfidence.value ?? 0) >= 60 ? "#3B82F6" :
                       "#F59E0B"
              }}
            >
              {aiConfidence.tier ?? "—"} ({aiConfidence.value?.toFixed(0)}%)
            </span>
          </div>
        )}
      </div>

      {/* Data quality caveat banner */}
      {data_confidence_note && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="font-semibold">{data_confidence_note}</span>
        </div>
      )}

      {/* Single horizontal row */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {activeKpis.map((kpi) => {
          const Icon = kpi.Icon;
          return (
            <div
              key={kpi.key}
              className={`
                flex-1 min-w-[110px] max-w-[200px]
                flex flex-col gap-2 p-3.5 rounded-2xl border
                backdrop-blur-sm cursor-default select-none
                transition-all duration-200
                hover:-translate-y-0.5 hover:brightness-110
                ${kpi.styles.bg} ${kpi.styles.border} ${kpi.styles.glow}
              `}
            >
              {/* Row 1: KPI title + icon */}
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-white/50 leading-tight">
                  {kpi.name}
                </span>
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${kpi.styles.iconBg}`}
                  style={{ border: `1px solid ${kpi.styles.hex}33` }}
                >
                  <Icon size={11} style={{ color: kpi.styles.hex }} />
                </div>
              </div>

              {/* Row 2: adaptive label */}
              <div className="flex-1 flex items-center">
                <span
                  className="text-[11px] font-black leading-snug"
                  style={{ color: kpi.styles.hex }}
                >
                  {kpi.label}
                </span>
              </div>

              {/* Row 3: score + threshold badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[11px] font-black text-white">
                    {kpi.value.toFixed(0)}
                  </span>
                  <span className="text-[7.5px] font-extrabold text-white/40">/100</span>
                </div>
                <span
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                  style={{
                    color: kpi.styles.hex,
                    background: `${kpi.styles.hex}18`,
                    border: `1px solid ${kpi.styles.hex}33`,
                  }}
                >
                  &gt;{kpi.threshold}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
