"use client";

import React, { useEffect, useState } from "react";
import { CalendarRange, Hourglass, TrendingUp, RefreshCw, Zap, Award, BarChart3, LayoutGrid } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";
import { billboardService } from "../../../services/billboard.service";

interface WeeklyPeakTrafficHourCardProps {
  billboardCode: string;
  className?: string;
  onWeeklyPeakLoaded?: (data: any) => void;
}

export default function WeeklyPeakTrafficHourCard({
  billboardCode,
  className = "",
  onWeeklyPeakLoaded
}: WeeklyPeakTrafficHourCardProps) {
  const [weeklyData, setWeeklyData] = useState<{
    weeklyPeakHourStr: string;
    weeklyPeakDay: string;
    weeklyPeakDate: string;
    weeklyPeakCount: number;
    weeklyAvgDensity: number;
    weeklyTotalVehicles: number;
    days: Array<{
      date: string;
      dayName: string;
      peakHourStr: string;
      peakHour: number | null;
      peakCount: number;
      totalVehicles: number;
      avgDensity: number;
      isWeeklyPeak: boolean;
    }>;
  }>({
    weeklyPeakHourStr: "—",
    weeklyPeakDay: "—",
    weeklyPeakDate: "—",
    weeklyPeakCount: 0,
    weeklyAvgDensity: 0,
    weeklyTotalVehicles: 0,
    days: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"chart" | "grid">("chart");

  const fetchWeeklyPeak = async () => {
    if (!billboardCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await billboardService.getWeeklyPeakTrafficHour(billboardCode);
      setWeeklyData(res);
      if (onWeeklyPeakLoaded) {
        onWeeklyPeakLoaded(res);
      }
    } catch (err) {
      console.error("[WeeklyPeakTrafficHourCard] Error fetching weekly peak traffic hour:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPeak();
  }, [billboardCode]);

  // Transform days for Recharts Bar Chart
  const chartData = weeklyData.days.map((d) => ({
    name: `${d.dayName} ${d.date.slice(5)}`,
    dayName: d.dayName,
    date: d.date,
    totalVehicles: d.totalVehicles,
    peakCount: d.peakCount,
    peakHourStr: d.peakHourStr,
    avgDensity: d.avgDensity,
    isWeeklyPeak: d.isWeeklyPeak
  }));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1322]/95 via-[#0e172a]/90 to-[#111c38]/95 border border-blue-500/20 backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-blue-400/40 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] group ${className}`}
      id="weekly-peak-traffic-card"
    >
      {/* Background ambient glowing spheres */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <CalendarRange size={18} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-white font-mono">
                Weekly Peak Traffic Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-[10px] font-extrabold uppercase tracking-wider">
                7-Day Window
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Overall weekly peak mobility window &amp; 7-day daily peak throughput aggregation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "chart"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Bar Chart View"
            >
              <BarChart3 size={12} />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="7-Day Cards View"
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={fetchWeeklyPeak}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh weekly peak analysis"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-cyan-400" : "text-slate-400"} />
            <span>{loading ? "Calculating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
        
        {/* Left Column: Overall Weekly Peak Hero Spotlight */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#101b33] via-[#0d1527] to-[#121f3d] border border-cyan-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,240,255,0.08)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-extrabold uppercase tracking-wider">
                <Zap size={13} className="text-cyan-400" />
                <span>Overall Weekly Peak Window</span>
              </div>
              {weeklyData.weeklyPeakCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold">
                  <Award size={11} />
                  <span>Max Throughput</span>
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white tracking-tight">
                {weeklyData.weeklyPeakHourStr}
              </div>
              <div className="text-xs text-slate-300 font-semibold mt-1 flex items-center gap-1.5">
                <span>Peak Day:</span>
                <span className="text-cyan-300 font-bold font-mono">
                  {weeklyData.weeklyPeakDay !== "—" ? `${weeklyData.weeklyPeakDay} (${weeklyData.weeklyPeakDate})` : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Volume</span>
              <span className="text-sm font-black font-mono text-white mt-0.5 block">
                {weeklyData.weeklyPeakCount > 0 ? `${weeklyData.weeklyPeakCount.toLocaleString("en-IN")} veh` : "—"}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg. Density</span>
              <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block">
                {weeklyData.weeklyAvgDensity > 0 ? `${weeklyData.weeklyAvgDensity} veh/min` : "-- veh/min"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Bar Chart or 7-Day Day-by-Day Cards */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {viewMode === "chart" ? "7-Day Traffic Flow & Peak Comparison" : "7-Day Peak Hour Breakdown"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Weekly Total: <strong className="font-mono text-white">{weeklyData.weeklyTotalVehicles.toLocaleString("en-IN")}</strong> veh
            </span>
          </div>

          {viewMode === "chart" ? (
            /* Recharts Bar Chart */
            <div className="h-[210px] w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0b1220]/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans">
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 mb-1.5">
                              <span className="font-bold text-white font-mono">{d.dayName} ({d.date})</span>
                              {d.isWeeklyPeak && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black text-[9px] uppercase">
                                  Weekly Peak
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Total Day Vehicles:</span>
                                <span className="font-mono font-bold text-white">{d.totalVehicles.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Peak Mobility Window:</span>
                                <span className="font-mono font-bold text-cyan-300">{d.peakHourStr}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Peak Hour Volume:</span>
                                <span className="font-mono font-bold text-emerald-400">{d.peakCount.toLocaleString("en-IN")} veh</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Density:</span>
                                <span className="font-mono font-bold text-emerald-300">{d.avgDensity > 0 ? `${d.avgDensity} v/m` : "--"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalVehicles" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isWeeklyPeak ? "#00f0ff" : entry.totalVehicles > 0 ? "#1e88ff" : "#1e293b"}
                        stroke={entry.isWeeklyPeak ? "#38bdf8" : "transparent"}
                        strokeWidth={entry.isWeeklyPeak ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* 7-Day Day-by-Day Peak Hour Cards Breakdown */
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weeklyData.days.map((day) => {
                const hasData = day.peakCount > 0;
                return (
                  <div
                    key={day.date}
                    className={`relative rounded-xl p-3 flex flex-col justify-between transition-all duration-200 border ${
                      day.isWeeklyPeak
                        ? "bg-[#00f0ff]/10 border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400/30"
                        : hasData
                        ? "bg-slate-900/70 border-white/10 hover:border-blue-500/30 hover:bg-slate-900/90"
                        : "bg-slate-950/40 border-white/5 opacity-60"
                    }`}
                  >
                    {day.isWeeklyPeak && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-[8px] font-black text-slate-950 uppercase tracking-tighter whitespace-nowrap shadow">
                        Peak Day
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-white font-mono uppercase">
                          {day.dayName}
                        </span>
                        <span className="text-[9px] font-medium text-slate-400">
                          {day.date.slice(5)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="text-[12px] font-black font-mono text-cyan-300 leading-tight">
                          {day.peakHourStr}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-1">
                          {hasData ? `${day.peakCount.toLocaleString("en-IN")} veh` : "0 veh"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9.5px]">
                      <span className="text-slate-400">Density:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {day.avgDensity > 0 ? `${day.avgDensity} v/m` : "--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
