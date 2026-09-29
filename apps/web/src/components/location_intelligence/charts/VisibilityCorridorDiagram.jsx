import React from 'react';

export default function VisibilityCorridorDiagram({
  config,
  speedKmh,
  visibilityTimeSec,
  onOpenCalibration,
}) {
  const isCalibrated = !!config && Number(config.effective_visibility_distance) > 0;
  const effectiveDistance = isCalibrated ? Number(config.effective_visibility_distance) : null;
  const startDistance = isCalibrated ? Number(config.visibility_start_distance) : null;
  const endDistance = isCalibrated ? Number(config.visibility_end_distance) : null;
  const obstructionStatus = config?.obstruction_status || 'Clear';

  const obstructionColor =
    obstructionStatus === 'Clear'
      ? 'from-cyan-500/20 via-blue-500/30 to-cyan-500/20 border-cyan-400/50 text-cyan-300'
      : obstructionStatus === 'Partially obstructed'
      ? 'from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-amber-400/50 text-amber-300'
      : 'from-rose-500/20 via-red-500/30 to-rose-500/20 border-rose-400/50 text-rose-300';

  return (
    <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xs">
            <i className="fa-solid fa-eye" />
          </span>
          <h3 className="text-sm font-bold text-white font-heading tracking-wide uppercase">
            Visibility Corridor Analysis
          </h3>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (D_last − D_first)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCalibrated ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Calibrated: {effectiveDistance} m</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold">
              Not Calibrated
            </span>
          )}
          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-400/40 text-blue-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <i className="fa-solid fa-sliders text-[10px]" />
              <span>Calibrate</span>
            </button>
          )}
        </div>
      </div>

      {!isCalibrated ? (
        <div className="my-8 py-8 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 text-xl mb-3">
            <i className="fa-solid fa-ruler-combined" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Visibility Not Calibrated</h4>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            Aculion does not assume a fixed universal visibility distance. Calibrate this billboard's road
            coordinates, geometry, and approach corridor to compute real moving visibility metrics.
          </p>
          <button
            onClick={onOpenCalibration}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-compass-drafting" />
            <span>Calibrate Visibility Corridor</span>
          </button>
        </div>
      ) : (
        /* ── INTERACTIVE CORRIDOR VISUALIZATION ── */
        <div className="flex flex-col gap-5 py-2">
          
          {/* Schematic Diagram */}
          <div className="relative w-full rounded-2xl bg-[#090d19] border border-white/10 p-5 overflow-hidden">
            
            {/* Top Billboard Indicator */}
            <div className="flex flex-col items-center mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <i className="fa-solid fa-tv text-cyan-300 text-xs" />
                <span className="text-xs font-black font-mono tracking-wider text-white uppercase">
                  BILLBOARD {config.board_width ? `(${config.board_width}ft × ${config.board_height}ft)` : ''}
                </span>
                <span className="text-[10px] text-blue-300 font-mono">
                  {config.board_orientation}° Facing
                </span>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-transparent" />
              <i className="fa-solid fa-caret-down text-blue-400 text-xs -mt-1" />
            </div>

            {/* ROAD / VEHICLE PATH */}
            <div className="relative w-full my-4">
              
              {/* Road Asphalt Container */}
              <div className="relative w-full h-16 bg-[#121727] rounded-xl border border-white/15 overflow-hidden flex items-center shadow-inner">
                {/* Road edge lines */}
                <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/20" />
                <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-white/20" />
                {/* Road dashed center line */}
                <div className="w-full border-t border-dashed border-yellow-400/50 my-auto" />

                {/* Road Label */}
                <div className="absolute top-2 left-3 text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase pointer-events-none">
                  ROAD / VEHICLE PATH ({config.road_direction}° Travel Direction)
                </div>

                {/* Highlighted Visibility Corridor along Road */}
                <div
                  className={`absolute inset-y-1 left-[15%] right-[10%] rounded-lg bg-gradient-to-r ${obstructionColor} border-x-2 border-y flex items-center justify-between px-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]`}
                >
                  <div className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-tighter">
                    Corridor Entry
                  </div>
                  <div className="text-[11px] font-mono font-black text-white bg-black/40 px-2.5 py-0.5 rounded border border-white/20">
                    {effectiveDistance} m Clear-View Zone
                  </div>
                  <div className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-tighter">
                    Corridor Exit
                  </div>
                </div>

                {/* Animated Moving Vehicle in Corridor */}
                <div className="absolute inset-y-0 left-[15%] right-[10%] flex items-center pointer-events-none">
                  <div
                    className="relative flex items-center text-cyan-300 animate-[bounce_2s_infinite]"
                    style={{
                      animation: 'moveVehicle 8s linear infinite',
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]">
                      <i className="fa-solid fa-car text-xs" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Bracket / Caliper Dimension Indicators */}
              <div className="relative w-full mt-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-[15%]">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-3 bg-cyan-400" />
                    <span className="text-cyan-300 font-bold mt-1">D_first</span>
                    <span className="text-[10px] text-slate-400">−{startDistance}m</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="w-full flex items-center">
                      <div className="w-2 h-2 border-t-2 border-l-2 border-cyan-400 transform -rotate-45" />
                      <div className="flex-1 h-0.5 bg-cyan-400/60" />
                      <div className="px-2 py-0.5 bg-blue-950 border border-cyan-400/60 rounded text-xs font-mono font-black text-cyan-300 shadow-md">
                        {effectiveDistance} m
                      </div>
                      <div className="flex-1 h-0.5 bg-cyan-400/60" />
                      <div className="w-2 h-2 border-t-2 border-r-2 border-cyan-400 transform rotate-45" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Effective Visibility Distance
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-3 bg-cyan-400" />
                    <span className="text-cyan-300 font-bold mt-1">D_last</span>
                    <span className="text-[10px] text-slate-400">+{endDistance}m</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Vehicle Vector & Estimated Visibility */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <span className="text-cyan-400 font-mono font-bold">Vehicle Vector:</span>
                <span className="flex items-center gap-1 font-mono text-white">
                  <span>Travel Direction</span>
                  <i className="fa-solid fa-arrow-right-long text-cyan-400" />
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">
                  Avg Speed: <strong className="text-white font-mono">{speedKmh > 0 ? `${speedKmh} km/h` : '—'}</strong>
                  {speedKmh > 0 && <span className="text-[11px] text-slate-500"> ({(speedKmh / 3.6).toFixed(1)} m/s)</span>}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-500/30 px-3.5 py-1.5 rounded-xl shadow-lg">
                <i className="fa-regular fa-clock text-cyan-400" />
                <span className="text-slate-400 font-semibold text-[11px]">Estimated Visibility:</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {visibilityTimeSec !== null ? `${visibilityTimeSec} sec` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">moving view</span>
              </div>
            </div>

          </div>

          {/* Quick Metrics Bar below Diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Start Point (D_first)</span>
              <span className="text-base font-black font-mono text-white mt-0.5">{startDistance} m</span>
              <span className="text-[10px] text-slate-500">Before billboard</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">End Point (D_last)</span>
              <span className="text-base font-black font-mono text-white mt-0.5">{endDistance} m</span>
              <span className="text-[10px] text-slate-500">After passing</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Corridor Conditions</span>
              <span className={`text-base font-black font-mono mt-0.5 ${
                obstructionStatus === 'Clear' ? 'text-emerald-400' : obstructionStatus === 'Partially obstructed' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {obstructionStatus}
              </span>
              <span className="text-[10px] text-slate-500">{config.field_of_view_angle}° Viewing FOV</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Calibration Confidence</span>
              <span className="text-base font-black font-mono text-cyan-300 mt-0.5">{config.visibility_confidence || 'High'}</span>
              <span className="text-[10px] text-slate-500">Physical site verified</span>
            </div>
          </div>

        </div>
      )}

      {/* Animation keyframes style */}
      <style>{`
        @keyframes moveVehicle {
          0% { transform: translateX(0%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(700%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
