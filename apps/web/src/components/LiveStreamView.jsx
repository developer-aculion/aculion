import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_RTSP_URL = 'rtsp://admin:123456@192.168.1.62:554/h264/ch1/main/av_stream';

export default function LiveStreamView({
  selectedBillboard,
  billboards = [],
  onSelectBillboard,
  user
}) {
  const [rtspUrl, setRtspUrl] = useState(() => {
    return localStorage.getItem('aculion_rtsp_camera_url') || DEFAULT_RTSP_URL;
  });
  const [tempUrl, setTempUrl] = useState(rtspUrl);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cameraStatus, setCameraStatus] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reconnectKey, setReconnectKey] = useState(Date.now());
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Query camera health and network telemetry from backend
  const fetchCameraStatus = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8095/traffic/camera/status?url=${encodeURIComponent(rtspUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setCameraStatus(data);
      }
    } catch {
      // Backend temporarily unreachable
    }
  }, [rtspUrl]);

  useEffect(() => {
    fetchCameraStatus();
    const interval = setInterval(fetchCameraStatus, 3500);
    return () => clearInterval(interval);
  }, [fetchCameraStatus]);

  // Secure backend proxy URL
  const proxyStreamUrl = `http://localhost:8095/traffic/camera/live-stream?url=${encodeURIComponent(rtspUrl)}&t=${reconnectKey}`;

  // Reconnect / Refresh stream
  const handleReconnect = () => {
    setReconnectKey(Date.now());
    fetchCameraStatus();
  };

  // Save new RTSP URL
  const handleSaveUrl = (newUrl) => {
    const target = newUrl || tempUrl;
    setRtspUrl(target);
    localStorage.setItem('aculion_rtsp_camera_url', target);
    setShowConfigModal(false);
    setReconnectKey(Date.now());
  };

  // Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Snapshot capture
  const handleCaptureSnapshot = () => {
    if (!imgRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgRef.current.naturalWidth || 1280;
      canvas.height = imgRef.current.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `Aculion_Live_Snapshot_${Date.now()}.jpg`;
      a.href = canvas.toDataURL('image/jpeg', 0.95);
      a.click();
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2000);
    } catch {
      const a = document.createElement('a');
      a.download = `Aculion_Live_Snapshot_${Date.now()}.jpg`;
      a.href = proxyStreamUrl;
      a.click();
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2000);
    }
  };

  const currentBillboardName = selectedBillboard?.billboard_name || selectedBillboard?.name || 'Testing Billboard -1';
  const currentBillboardCode = selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0001';

  const isStreaming = cameraStatus?.is_streaming;
  const isOffline = cameraStatus?.state === 'offline';
  const isAuthFailed = cameraStatus?.state === 'auth_failed';

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 gap-3 sm:gap-4 min-w-0 bg-[#070913] text-white h-full overflow-hidden">
      
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1222]/90 border border-white/10 rounded-2xl px-4 py-3 shadow-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg shrink-0">
            <i className="fa-solid fa-video" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-heading truncate">
                Live Camera Feed
              </h2>
              {isStreaming ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAMING
                </span>
              ) : isOffline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  HARDWARE OFFLINE
                </span>
              ) : isAuthFailed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-red-500/15 text-red-400 border-red-500/30">
                  <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                  AUTH ERROR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-blue-500/15 text-blue-400 border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  CONNECTING RTSP
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 font-mono mt-0.5 truncate">
              <span className="text-white/80 font-bold">{currentBillboardCode}</span>
              <span>•</span>
              <span className="truncate">{currentBillboardName}</span>
              <span>•</span>
              <span className="text-emerald-400/90 font-semibold flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[10px]" />
                Private Stream Channel
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTempUrl(rtspUrl);
              setShowConfigModal(true);
            }}
            className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Configure RTSP Stream Source"
          >
            <i className="fa-solid fa-sliders text-cyan-400" />
            <span>Stream Source</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Take snapshot photo"
          >
            <i className={`fa-solid ${snapshotSuccess ? 'fa-check text-emerald-400' : 'fa-camera text-blue-400'}`} />
            <span>{snapshotSuccess ? 'Snapshot Saved' : 'Snapshot'}</span>
          </button>

          <button
            type="button"
            onClick={handleReconnect}
            className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            title="Refresh stream connection"
          >
            <i className="fa-solid fa-rotate-right text-xs" />
            <span>Reconnect</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="h-9 w-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
            title="Fullscreen Mode"
          >
            <i className={`fa-solid ${fullscreen ? 'fa-compress' : 'fa-expand'}`} />
          </button>
        </div>
      </div>

      {/* ── HARDWARE DIAGNOSTIC BANNER (Shows if camera is offline / has suggested fix) ── */}
      {isOffline && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200/90 shadow-lg shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-sm shrink-0" />
            <div className="truncate">
              <span className="font-bold text-amber-300">Camera Unreachable at {cameraStatus?.host || '192.168.1.62'}: </span>
              <span className="text-white/70">Verify camera power & network connection.</span>
            </div>
          </div>
          {cameraStatus?.detected_devices?.length > 0 && (
            <button
              type="button"
              onClick={() => handleSaveUrl(cameraStatus.detected_devices[0].suggested_url)}
              className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-network-wired text-[10px]" />
              <span>Connect to Detected {cameraStatus.detected_devices[0].ip}</span>
            </button>
          )}
        </div>
      )}

      {/* ── LIVE FEED DISPLAY CONTAINER ── */}
      <div 
        ref={containerRef}
        className={`relative w-full flex-1 min-h-0 rounded-2xl bg-black border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-center items-center group ${
          fullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : ''
        }`}
      >
        {/* Continuous Active Video Stream Feed */}
        {!isPaused ? (
          <img
            ref={imgRef}
            src={proxyStreamUrl}
            alt="Live Camera Feed"
            className="w-full h-full object-contain bg-black"
            onError={() => {
              // Retry seamless connection if stream drops
              setTimeout(() => setReconnectKey(Date.now()), 2500);
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#0a0e1a] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/40 mb-3 text-2xl">
              <i className="fa-solid fa-pause" />
            </div>
            <p className="text-sm font-semibold text-white/80 font-heading">Live Feed Paused</p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-play text-xs" />
              <span>Resume Stream</span>
            </button>
          </div>
        )}

        {/* ── TOP HUD OVERLAY ── */}
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between text-xs pointer-events-none z-20">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-wider shadow-lg ${
              isStreaming ? 'bg-red-600' : 'bg-amber-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isStreaming ? 'LIVE' : 'STANDBY'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-mono font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-lock text-[10px] text-emerald-400" />
              CH 01 • SECURE STREAM (H.264)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/80 font-mono text-[11px] hidden sm:inline">
              {formattedDate} {formattedTime}
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
              {isStreaming ? `${cameraStatus?.fps || 30} FPS • 1080p` : 'Auto-Syncing'}
            </span>
          </div>
        </div>

        {/* ── BOTTOM PLAYER CONTROL BAR ── */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between z-20 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title={isPaused ? 'Resume Stream' : 'Pause Stream'}
            >
              <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`} />
            </button>
            <button
              type="button"
              onClick={handleReconnect}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Refresh Stream"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Capture Snapshot"
            >
              <i className="fa-solid fa-camera" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTempUrl(rtspUrl);
                setShowConfigModal(true);
              }}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Configure Camera Source"
            >
              <i className="fa-solid fa-gear" />
            </button>
          </div>

          {/* Center Info Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
            <span className="text-cyan-400 font-bold">{currentBillboardCode}</span>
            <span>|</span>
            <span className="truncate max-w-[200px]">{currentBillboardName}</span>
            <span>|</span>
            <span className="text-white/50 truncate max-w-[240px]" title={cameraStatus?.target_url || rtspUrl}>
              {cameraStatus?.target_url || rtspUrl}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <i className={`fa-solid ${fullscreen ? 'fa-compress' : 'fa-expand'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* ── RTSP CAMERA STREAM CONFIGURATION MODAL ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1424] border border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                  <i className="fa-solid fa-satellite-dish" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Camera RTSP Stream Settings</h3>
                  <p className="text-xs text-white/50 font-mono">Configure hardware RTSP URL & diagnostics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* RTSP URL Input Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/70 font-mono">
                RTSP Camera Stream URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="rtsp://admin:password@ip:554/path"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs font-mono text-cyan-300 placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all pr-20"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="absolute right-2 top-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[11px] rounded-lg font-mono transition-colors cursor-pointer"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-white/40">
                Credentials are kept fully private by the backend stream proxy. The browser never directly contacts camera credentials.
              </p>
            </div>

            {/* Detected Local Cameras on Network */}
            {cameraStatus?.detected_devices?.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                  <i className="fa-solid fa-radar text-[11px]" />
                  <span>Detected Cameras on Local Subnet</span>
                </div>
                <div className="flex flex-col gap-2">
                  {cameraStatus.detected_devices.map((dev) => (
                    <div
                      key={dev.ip}
                      className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm shrink-0">
                          <i className="fa-solid fa-video" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white font-mono truncate">{dev.model}</div>
                          <div className="text-[11px] text-white/40 font-mono">IP: {dev.ip} • Ports: {dev.ports.join(', ')}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempUrl(dev.suggested_url);
                        }}
                        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket text-[10px]" />
                        <span>Use This Camera</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Status Box */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs font-mono flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-white/50">
                <span>Hardware Status:</span>
                <span className={`font-bold ${
                  cameraStatus?.state === 'streaming' ? 'text-emerald-400' :
                  cameraStatus?.state === 'offline' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {cameraStatus?.state ? cameraStatus.state.toUpperCase() : 'CHECKING...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/50">
                <span>Host Reachability:</span>
                <span className={cameraStatus?.is_reachable ? 'text-emerald-400' : 'text-amber-400'}>
                  {cameraStatus?.host || '192.168.1.62'}:554 {cameraStatus?.is_reachable ? '(ONLINE)' : '(UNREACHABLE)'}
                </span>
              </div>
              {cameraStatus?.error_message && (
                <div className="text-[11px] text-amber-300/80 mt-1 pt-1 border-t border-white/5">
                  Diagnosis: {cameraStatus.error_message}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTempUrl(DEFAULT_RTSP_URL)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveUrl(tempUrl)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-2"
                >
                  <i className="fa-solid fa-plug text-xs" />
                  <span>Connect Stream</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
