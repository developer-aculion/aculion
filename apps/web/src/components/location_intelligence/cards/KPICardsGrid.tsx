"use client";

import React, { useRef, useState, useEffect } from "react";
import { LocationAnalytics } from "../../../types/location";
import {
  Award, Compass, MapPin, ShieldCheck, Flame, Building2,
  Leaf, Home, HelpCircle, AlertTriangle, ChevronLeft, ChevronRight
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
  footfall_potential:   "Footfall Potential",
  green_coverage:       "Green Coverage",
  building_density:     "Building Density",
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

const TIER_STYLES: Record<string, {
  hex:    string;
  glow:   string;
  bg:     string;
  border: string;
  iconBg: string;
}> = {
  "Exceptional": {
    hex:    "#22C55E",
    glow:   "shadow-[0_0_18px_rgba(34,197,94,0.12)]",
    bg:     "bg-[#0d2218]/90",
    border: "border-[#22C55E]/25",
    iconBg: "bg-[#22C55E]/12",
  },
  "Strong": {
    hex:    "#3B82F6",
    glow:   "shadow-[0_0_18px_rgba(59,130,246,0.12)]",
    bg:     "bg-[#0e172a]/90",
    border: "border-[#3B82F6]/25",
    iconBg: "bg-[#3B82F6]/12",
  },
  "Developing": {
    hex:    "#F59E0B",
    glow:   "shadow-[0_0_18px_rgba(245,158,11,0.12)]",
    bg:     "bg-[#241c0c]/90",
    border: "border-[#F59E0B]/25",
    iconBg: "bg-[#F59E0B]/12",
  },
  "Emerging": {
    hex:    "#EF4444",
    glow:   "shadow-[0_0_18px_rgba(239,68,68,0.12)]",
    bg:     "bg-[#281212]/90",
    border: "border-[#EF4444]/25",
    iconBg: "bg-[#EF4444]/12",
  },
};

export default function KPICardsGrid({ analytics }: KPICardsGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [analytics]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const labelsPayload = analytics.kpi_labels;

  if (!labelsPayload || !labelsPayload.kpi_labels) {
    if (!analytics.kpis) return null;
    const kpis = analytics.kpis;
    const activeEntries = Object.entries(kpis).filter(([k]) => KPI_DISPLAY_NAMES[k]);
    if (activeEntries.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight text-white">Location KPI Performance</h2>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.25) transparent",
          }}
        >
          {activeEntries.map(([key, val]) => {
            const numVal = typeof val === "number" ? val : 0;
            const tier = numVal >= 80 ? "Exceptional" : numVal >= 60 ? "Strong" : numVal >= 40 ? "Developing" : "Emerging";
            const styles = TIER_STYLES[tier];
            const Icon = KPI_ICONS[key] || HelpCircle;
            return (
              <div
                key={key}
                className={`shrink-0 w-[220px] sm:w-[240px] snap-start flex flex-col justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md cursor-default select-none transition-all duration-200 hover:-translate-y-1 hover:brightness-110 hover:shadow-lg ${styles.bg} ${styles.border} ${styles.glow}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/60 leading-tight line-clamp-1" title={KPI_DISPLAY_NAMES[key]}>
                    {KPI_DISPLAY_NAMES[key]}
                  </span>
                  <div className={`p-2 rounded-xl shrink-0 ${styles.iconBg}`} style={{ border: `1px solid ${styles.hex}33` }}>
                    <Icon size={16} style={{ color: styles.hex }} />
                  </div>
                </div>
                <div className="my-0.5">
                  <span className="text-[14px] font-extrabold leading-snug block truncate" style={{ color: styles.hex }}>
                    {tier}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">{numVal.toFixed(0)}</span>
                    <span className="text-[11px] font-bold text-white/40">/100</span>
                  </div>
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
        threshold: item.threshold ?? (tier === "Emerging" ? 20 : tier === "Developing" ? 40 : tier === "Strong" ? 60 : 80),
        Icon:      KPI_ICONS[key] || HelpCircle,
        styles,
      };
    });

  if (activeKpis.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header + AI Confidence pill + Scroll Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Location KPI Performance</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Adaptive intelligence indices · updates with each location.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          {/* Navigation Scroll Buttons */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Data quality caveat banner */}
      {data_confidence_note && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="font-semibold">{data_confidence_note}</span>
        </div>
      )}

      {/* Horizontal scrollable cards row */}
      <div className="relative group">
        <div
          ref={scrollContainerRef}
          className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.25) transparent",
          }}
        >
          {activeKpis.map((kpi) => {
            const Icon = kpi.Icon;
            return (
              <div
                key={kpi.key}
                className={`
                  shrink-0 w-[220px] sm:w-[240px] snap-start
                  flex flex-col justify-between gap-3 p-4 rounded-2xl border
                  backdrop-blur-md cursor-default select-none
                  transition-all duration-200
                  hover:-translate-y-1 hover:brightness-110 hover:shadow-lg
                  ${kpi.styles.bg} ${kpi.styles.border} ${kpi.styles.glow}
                `}
              >
                {/* Row 1: KPI title + icon */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[11px] font-black uppercase tracking-wider text-white/60 leading-tight line-clamp-1"
                    title={kpi.name}
                  >
                    {kpi.name}
                  </span>
                  <div
                    className={`p-2 rounded-xl shrink-0 ${kpi.styles.iconBg}`}
                    style={{ border: `1px solid ${kpi.styles.hex}33` }}
                  >
                    <Icon size={16} style={{ color: kpi.styles.hex }} />
                  </div>
                </div>

                {/* Row 2: adaptive status label */}
                <div className="my-0.5">
                  <span
                    className="text-[14px] font-extrabold leading-snug block truncate"
                    style={{ color: kpi.styles.hex }}
                    title={kpi.label}
                  >
                    {kpi.label}
                  </span>
                </div>

                {/* Row 3: score + threshold badge */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">
                      {kpi.value.toFixed(0)}
                    </span>
                    <span className="text-[11px] font-bold text-white/40">/100</span>
                  </div>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
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
    </div>
  );
}

