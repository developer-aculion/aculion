import React, { useState, useEffect } from 'react';
import { billboardService } from '../../../services/billboard.service';

export default function VisibilityCalibrationModal({
  isOpen,
  onClose,
  billboard,
  currentConfig,
  onSaved,
}) {
  const bbCode = billboard?.billboard_code || billboard?.id || 'ACU-BB-0001';
  const bbName = billboard?.name || billboard?.billboard_name || 'Billboard Asset';

  const [formData, setFormData] = useState({
    board_width: 60,
    board_height: 20,
    board_latitude: billboard?.latitude ? Number(billboard.latitude) : 13.0827,
    board_longitude: billboard?.longitude ? Number(billboard.longitude) : 80.2707,
    board_orientation: 105,
    road_direction: 100,
    visibility_start_distance: 220,
    visibility_end_distance: 20,
    field_of_view_angle: 60,
    obstruction_status: 'Clear',
    visibility_confidence: 'High',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentConfig) {
      setFormData({
        board_width: currentConfig.board_width ?? 60,
        board_height: currentConfig.board_height ?? 20,
        board_latitude: currentConfig.board_latitude ?? (billboard?.latitude ? Number(billboard.latitude) : 13.0827),
        board_longitude: currentConfig.board_longitude ?? (billboard?.longitude ? Number(billboard.longitude) : 80.2707),
        board_orientation: currentConfig.board_orientation ?? 105,
        road_direction: currentConfig.road_direction ?? 100,
        visibility_start_distance: currentConfig.visibility_start_distance ?? 220,
        visibility_end_distance: currentConfig.visibility_end_distance ?? 20,
        field_of_view_angle: currentConfig.field_of_view_angle ?? 60,
        obstruction_status: currentConfig.obstruction_status || 'Clear',
        visibility_confidence: currentConfig.visibility_confidence || 'High',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        board_latitude: billboard?.latitude ? Number(billboard.latitude) : 13.0827,
        board_longitude: billboard?.longitude ? Number(billboard.longitude) : 80.2707,
      }));
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [currentConfig, billboard, isOpen]);

  if (!isOpen) return null;

  // Effective Visibility Distance = D_last - D_first along travel path
  // (upstream start + downstream end)
  const startDist = Number(formData.visibility_start_distance) || 0;
  const endDist = Number(formData.visibility_end_distance) || 0;
  const effectiveDist = Math.max(0, Math.round(startDist + endDist));

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        billboard_code: bbCode,
        billboard_id: billboard?.id,
        board_width: Number(formData.board_width),
        board_height: Number(formData.board_height),
        board_latitude: Number(formData.board_latitude),
        board_longitude: Number(formData.board_longitude),
        board_orientation: Number(formData.board_orientation),
        road_direction: Number(formData.road_direction),
        visibility_start_distance: startDist,
        visibility_end_distance: endDist,
        effective_visibility_distance: effectiveDist,
        field_of_view_angle: Number(formData.field_of_view_angle),
        obstruction_status: formData.obstruction_status,
        visibility_confidence: formData.visibility_confidence,
      };

      const saved = await billboardService.saveVisibilityConfig(payload);
      setSuccessMsg('Visibility calibration saved successfully to Supabase!');
      setTimeout(() => {
        if (onSaved) onSaved(saved);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to save calibration:', err);
      setErrorMsg(err.message || 'Failed to save visibility configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b101f] border border-blue-500/30 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.15)] text-white font-sans max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 text-sm">
                <i className="fa-solid fa-compass-drafting" />
              </span>
              <h2 className="text-xl font-black font-heading tracking-wide uppercase text-white">
                Visibility Calibration
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Calibrate the physical clear-view corridor for{' '}
              <span className="text-cyan-300 font-mono font-bold">{bbCode}</span> — {bbName}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-sm" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-sm" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECTION 1: BILLBOARD GEOMETRY */}
          <div className="bg-[#0f1629]/90 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <i className="fa-solid fa-vector-square" />
              <span>1. Billboard Geometry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Board Width (ft)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.board_width}
                  onChange={(e) => handleChange('board_width', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 60"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Board Height (ft)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.board_height}
                  onChange={(e) => handleChange('board_height', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Billboard Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.board_latitude}
                  onChange={(e) => handleChange('board_latitude', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Billboard Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.board_longitude}
                  onChange={(e) => handleChange('board_longitude', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Billboard Facing Orientation (degrees 0°–360°)
                  </label>
                  <span className="font-mono text-xs text-cyan-300 font-bold">{formData.board_orientation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={formData.board_orientation}
                  onChange={(e) => handleChange('board_orientation', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>0° (North)</span>
                  <span>90° (East)</span>
                  <span>180° (South)</span>
                  <span>270° (West)</span>
                  <span>360°</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ROAD GEOMETRY */}
          <div className="bg-[#0f1629]/90 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <i className="fa-solid fa-road" />
              <span>2. Road Geometry & Approach</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Main Traffic Travel Direction (heading 0°–360°)
                  </label>
                  <span className="font-mono text-xs text-cyan-300 font-bold">{formData.road_direction}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={formData.road_direction}
                  onChange={(e) => handleChange('road_direction', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Visibility Start Distance (D_first)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.visibility_start_distance}
                    onChange={(e) => handleChange('visibility_start_distance', e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                    placeholder="e.g. 220"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">m</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Upstream distance where board first becomes viewable
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Visibility End Distance (D_last)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.visibility_end_distance}
                    onChange={(e) => handleChange('visibility_end_distance', e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                    placeholder="e.g. 20"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">m</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Downstream distance where visibility ceases past board
                </span>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Forward Field-of-View (FOV) Angle
                  </label>
                  <span className="font-mono text-xs text-blue-400 font-bold">{formData.field_of_view_angle}°</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={formData.field_of_view_angle}
                  onChange={(e) => handleChange('field_of_view_angle', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Driver cone of sight (typical urban FOV: 50°–70°)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: CONDITIONS & CONFIDENCE */}
          <div className="bg-[#0f1629]/90 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <i className="fa-solid fa-shield-halved" />
              <span>3. Conditions & Calibration Confidence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Obstruction Status
                </label>
                <select
                  value={formData.obstruction_status}
                  onChange={(e) => handleChange('obstruction_status', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-semibold text-white focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="Clear">Clear (No visual obstructions)</option>
                  <option value="Partially obstructed">Partially obstructed (Trees/signage)</option>
                  <option value="Heavily obstructed">Heavily obstructed (Flyover/buildings)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Visibility Confidence
                </label>
                <select
                  value={formData.visibility_confidence}
                  onChange={(e) => handleChange('visibility_confidence', e.target.value)}
                  className="w-full px-3 py-2 bg-[#121a30] border border-white/15 rounded-lg text-xs font-semibold text-white focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="High">High (Physical audit & telemetry verified)</option>
                  <option value="Medium">Medium (GIS estimation / survey model)</option>
                  <option value="Low">Low (Initial rough estimation)</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIVE COMPUTATION PREVIEW BOX */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-[#0e1f3d] to-cyan-900/30 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Calculated Effective Visibility Distance
              </span>
              <span className="text-3xl font-black text-cyan-300 font-mono">
                {effectiveDist} <span className="text-sm font-normal text-slate-300">meters</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Corridor: {startDist}m (upstream) + {endDist}m (downstream) = {effectiveDist}m
              </span>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
              <div className="text-[10px] text-slate-400 font-medium">Est. Visibility at 43 km/h</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {effectiveDist > 0 ? (effectiveDist / (43 / 3.6)).toFixed(1) : 0} sec
              </div>
              <div className="text-[9px] text-slate-500 font-medium">Formula: Distance ÷ Speed (m/s)</div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#121829] hover:bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" />
                  <span>Save Calibration</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
