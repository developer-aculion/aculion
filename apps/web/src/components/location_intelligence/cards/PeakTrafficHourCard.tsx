"use client";

import React, { useEffect, useState } from "react";
import { Hourglass, TrendingUp, RefreshCw } from "lucide-react";
import { billboardService } from "../../../services/billboard.service";

interface PeakTrafficHourCardProps {
  billboardCode: string;
  statDate?: string;
  className?: string;
  onPeakDataLoaded?: (data: { peakHourStr: string; peakHour: number | null; peakCount: number; avgDensity: number }) => void;
}

export default function PeakTrafficHourCard({
  billboardCode,
  statDate,
  className = "",
  onPeakDataLoaded
}: PeakTrafficHourCardProps) {
  const [peakHourStr, setPeakHourStr] = useState<string>("—");
  const [peakCount, setPeakCount] = useState<number>(0);
  const [avgDensity, setAvgDensity] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPeakTraffic = async () => {
    if (!billboardCode) {
      setPeakHourStr("—");
      setPeakCount(0);
      setAvgDensity(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await billboardService.getPeakTrafficHour(billboardCode, statDate);
      setPeakHourStr(res.peakHourStr);
      setPeakCount(res.peakCount);
      setAvgDensity(res.avgDensity);
      if (onPeakDataLoaded) {
        onPeakDataLoaded(res);
      }
    } catch (err) {
      console.error("[PeakTrafficHourCard] Error calculating peak traffic hour:", err);
      setPeakHourStr("—");
      setPeakCount(0);
      setAvgDensity(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeakTraffic();
  }, [billboardCode, statDate]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1322]/90 via-[#0e172a]/80 to-[#111c38]/90 border border-blue-500/20 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-blue-400/40 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] group ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Peak Traffic Hour
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
          <Hourglass size={15} className="text-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 relative z-10">
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <RefreshCw size={18} className="text-blue-400 animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Calculating...</span>
          </div>
        ) : (
          <div className="text-2xl sm:text-[26px] font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white tracking-tight">
            {peakHourStr}
          </div>
        )}

        {/* Sub-label & Metrics */}
        <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <div className="text-slate-400 font-medium">
            Avg. Density:{" "}
            <span className="font-bold font-mono text-cyan-300">
              {avgDensity > 0 ? `${avgDensity} veh/min` : "-- veh/min"}
            </span>
          </div>
          {peakCount > 0 && (
            <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[10.5px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <TrendingUp size={12} />
              <span>{peakCount.toLocaleString("en-IN")} units</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
