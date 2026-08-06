import React, { useState, useEffect } from 'react';
import LocationIntelligence from '../pages/LocationIntelligence';
import lionLogo from '../assets/aculion_lion_logo.png';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

// ── Static Mock Data ──
const LINE_DATA = [
  { time: '12 AM', value: 150 },
  { time: '02 AM', value: 90 },
  { time: '04 AM', value: 60 },
  { time: '06 AM', value: 240 },
  { time: '08 AM', value: 680 },
  { time: '10 AM', value: 1246 },
  { time: '12 PM', value: 950 },
  { time: '02 PM', value: 1100 },
  { time: '04 PM', value: 1480 },
  { time: '06 PM', value: 1600 },
  { time: '08 PM', value: 1200 },
  { time: '10 PM', value: 750 },
  { time: '12 AM', value: 350 }
];

const HISTORICAL_DAILY = [
  { name: '08:00 AM', Impressions: 4200, Occupancy: 85 },
  { name: '10:00 AM', Impressions: 8400, Occupancy: 88 },
  { name: '12:00 PM', Impressions: 6100, Occupancy: 84 },
  { name: '02:00 PM', Impressions: 7200, Occupancy: 86 },
  { name: '04:00 PM', Impressions: 9800, Occupancy: 90 },
  { name: '06:00 PM', Impressions: 12400, Occupancy: 95 },
  { name: '08:00 PM', Impressions: 10500, Occupancy: 92 },
  { name: '10:00 PM', Impressions: 5400, Occupancy: 86 }
];

const HISTORICAL_WEEKLY = [
  { name: 'Mon', Impressions: 38200, Occupancy: 82 },
  { name: 'Tue', Impressions: 42100, Occupancy: 85 },
  { name: 'Wed', Impressions: 45782, Occupancy: 89 },
  { name: 'Thu', Impressions: 41200, Occupancy: 84 },
  { name: 'Fri', Impressions: 49800, Occupancy: 95 },
  { name: 'Sat', Impressions: 35400, Occupancy: 78 },
  { name: 'Sun', Impressions: 31200, Occupancy: 72 }
];

const HISTORICAL_MONTHLY = [
  { name: 'Week 1', Impressions: 245000, Occupancy: 80 },
  { name: 'Week 2', Impressions: 278000, Occupancy: 85 },
  { name: 'Week 3', Impressions: 295000, Occupancy: 88 },
  { name: 'Week 4', Impressions: 312000, Occupancy: 92 }
];

const HISTORICAL_YEARLY = [
  { name: 'Jan', Impressions: 1120000, Occupancy: 78 },
  { name: 'Feb', Impressions: 1240000, Occupancy: 81 },
  { name: 'Mar', Impressions: 1350000, Occupancy: 83 },
  { name: 'Apr', Impressions: 1190000, Occupancy: 80 },
  { name: 'May', Impressions: 1450000, Occupancy: 87 },
  { name: 'Jun', Impressions: 1520000, Occupancy: 90 },
  { name: 'Jul', Impressions: 1610000, Occupancy: 92 },
  { name: 'Aug', Impressions: 1580000, Occupancy: 91 },
  { name: 'Sep', Impressions: 1390000, Occupancy: 85 },
  { name: 'Oct', Impressions: 1490000, Occupancy: 87 },
  { name: 'Nov', Impressions: 1680000, Occupancy: 93 },
  { name: 'Dec', Impressions: 1820000, Occupancy: 96 }
];

const DONUT_DATA = [
  { name: '0–15 sec', value: 22.1, color: '#3b82f6' },
  { name: '15–30 sec', value: 31.4, color: '#6366f1' },
  { name: '30–60 sec', value: 28.7, color: '#f59e0b' },
  { name: '60+ sec', value: 17.8, color: '#22c55e' }
];

// Heatmap grid (7 days x 12 time-slots)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_LABELS = ['12 AM', '04 AM', '08 AM', '12 PM', '04 PM', '08 PM', '12 AM'];

const HEATMAP_DATA = [
  [0.05, 0.08, 0.12, 0.22, 0.35, 0.48, 0.65, 0.72, 0.58, 0.32, 0.15, 0.08],
  [0.08, 0.05, 0.10, 0.25, 0.38, 0.52, 0.78, 0.85, 0.62, 0.35, 0.18, 0.10],
  [0.06, 0.07, 0.11, 0.24, 0.40, 0.55, 0.82, 0.95, 0.68, 0.38, 0.20, 0.12],
  [0.07, 0.06, 0.13, 0.26, 0.42, 0.50, 0.75, 0.88, 0.60, 0.34, 0.19, 0.09],
  [0.09, 0.08, 0.15, 0.30, 0.48, 0.65, 0.88, 0.92, 0.75, 0.42, 0.25, 0.15],
  [0.12, 0.10, 0.18, 0.35, 0.44, 0.48, 0.52, 0.58, 0.45, 0.30, 0.22, 0.18],
  [0.10, 0.08, 0.12, 0.20, 0.30, 0.35, 0.40, 0.45, 0.38, 0.25, 0.15, 0.10]
];

const getHeatmapColor = (val) => {
  if (val < 0.15) return '#101626';
  if (val < 0.30) return '#1e3a8a';
  if (val < 0.45) return '#2563eb';
  if (val < 0.60) return '#22c55e';
  if (val < 0.75) return '#d97706';
  if (val < 0.90) return '#ea580c';
  return '#dc2626';
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-white/10 px-2 py-1 rounded text-[10px] shadow-xl">
        <span className="text-white/60 font-medium">{payload[0].payload.time || payload[0].payload.name}</span>
        <span className="mx-1">•</span>
        <span className="text-white font-semibold">{(payload[0].value || payload[0].Impressions || 0).toLocaleString()} Units</span>
      </div>
    );
  }
  return null;
};

export default function LiveDashboard({ navigateTo }) {
  const [activeNav, setActiveNav] = useState('live');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time ticking KPIs
  const [livePeople, setLivePeople] = useState(1246);
  const [liveVehicles, setLiveVehicles] = useState(862);
  const [liveDwell, setLiveDwell] = useState(38);

  // CCTV dynamic AI bounding boxes
  const [boxes, setBoxes] = useState([
    { id: 1, type: 'Vehicle', conf: 94, x: 22, y: 45, w: 18, h: 14, dx: 0.8, dy: 0.2 },
    { id: 2, type: 'Vehicle', conf: 89, x: 42, y: 52, w: 16, h: 12, dx: -0.6, dy: -0.15 },
    { id: 3, type: 'Person', conf: 91, x: 62, y: 28, w: 5, h: 12, dx: 0.1, dy: 0.15 },
    { id: 4, type: 'Vehicle', conf: 95, x: 74, y: 58, w: 20, h: 16, dx: -0.9, dy: -0.3 },
    { id: 5, type: 'Person', conf: 87, x: 12, y: 64, w: 6, h: 14, dx: -0.15, dy: 0.05 }
  ]);

  // System status and alerts
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'CRITICAL', title: 'Pedestrian density threshold exceeded', target: 'Anna Nagar Entrance A', time: '11:42 AM', active: true },
    { id: 2, type: 'WARNING', title: 'CCTV Node 3 package latency spike (48ms)', target: 'Shanthi Colony Lane 2', time: '11:38 AM', active: true },
    { id: 3, type: 'INFO', title: 'Weekly DOOH Occupancy report completed', target: 'Server Node 1', time: '11:05 AM', active: true },
    { id: 4, type: 'CRITICAL', title: 'Hardware sensor temperature alert (64°C)', target: 'Edge Box AN-01', time: '10:50 AM', active: true }
  ]);

  // Reports configurations
  const [reportType, setReportType] = useState('weekly');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportsList, setReportsList] = useState([
    { id: 'REP-0822', name: 'June 2025 Comprehensive Mobility & Reach Report', format: 'PDF', date: '01 Jul 2025', size: '4.2 MB' },
    { id: 'REP-0821', name: 'Q2 Billboard Inventory Occupancy Summary', format: 'XLSX', date: '30 Jun 2025', size: '1.8 MB' }
  ]);

  // Data Export configurations
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportingData, setExportingData] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Historical trends granularity
  const [historicalFilter, setHistoricalFilter] = useState('week');

  // Settings preferences
  const [settings, setSettings] = useState({
    refreshInterval: '5s',
    mapStyle: 'dark-gps',
    overlayBoxes: true,
    overlayLabels: true,
    notifications: true,
    timezone: 'Asia/Kolkata (IST)'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Zone Comparison active zones
  const [activeZoneCompare, setActiveZoneCompare] = useState({
    zoneA: true,
    zoneB: true,
    zoneC: false
  });

  // Time update ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry drift ticker
  useEffect(() => {
    let tickMs = 5000;
    if (settings.refreshInterval === '1s') tickMs = 1000;
    if (settings.refreshInterval === '10s') tickMs = 10000;

    const interval = setInterval(() => {
      setLivePeople(prev => Math.max(1100, Math.min(1450, prev + Math.floor(Math.random() * 9) - 4)));
      setLiveVehicles(prev => Math.max(780, Math.min(940, prev + Math.floor(Math.random() * 7) - 3)));
      setLiveDwell(prev => Math.max(32, Math.min(46, prev + Math.floor(Math.random() * 3) - 1)));
    }, tickMs);
    return () => clearInterval(interval);
  }, [settings.refreshInterval]);

  // CCTV bounding boxes tracker simulation
  useEffect(() => {
    const trackingTimer = setInterval(() => {
      setBoxes(prev => prev.map(box => {
        let newX = box.x + box.dx * 1.5;
        let newY = box.y + box.dy * 1.5;
        // Reset box position when leaving screen bounds
        if (newX < 5 || newX > 90 || newY < 15 || newY > 85) {
          if (box.dx > 0) {
            newX = 5;
            newY = 20 + Math.random() * 50;
          } else {
            newX = 85;
            newY = 20 + Math.random() * 50;
          }
        }
        return {
          ...box,
          x: newX,
          y: newY,
          conf: Math.min(99, Math.max(80, box.conf + Math.floor(Math.random() * 5) - 2))
        };
      }));
    }, 180);
    return () => clearInterval(trackingTimer);
  }, []);

  // Alert dismissing handler
  const dismissAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
  };

  // Report generator runner
  const handleGenerateReport = (e) => {
    e.preventDefault();
    setGeneratingReport(true);
    setReportSuccess(false);
    setTimeout(() => {
      setGeneratingReport(false);
      setReportSuccess(true);
      const idStr = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      setReportsList(prev => [
        {
          id: idStr,
          name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Traffic & Campaign ROI Report`,
          format: 'PDF',
          date: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
          size: '2.5 MB'
        },
        ...prev
      ]);
    }, 2000);
  };

  // Data Export runner
  const handleExportData = (e) => {
    e.preventDefault();
    setExportingData(true);
    setExportSuccess(false);
    setTimeout(() => {
      setExportingData(false);
      setExportSuccess(true);
    }, 2000);
  };

  // Settings Saver
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper date/time formatting
  const formattedDate = currentTime.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="w-full max-w-[1536px] h-screen bg-[#0a0e1a] text-white flex flex-col font-sans select-none overflow-hidden relative mx-auto border-x border-white/10 shadow-2xl">
      
      {/* ═══════════════════════════════════════════════════
         MAIN BODY DECOUPLED COLUMNS
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative">

        {/* ── SIDEBAR (Left Column - 240px width) ── */}
        <aside className="w-[240px] border-r border-white/10 bg-[#080b15] flex flex-col justify-between overflow-hidden h-full flex-shrink-0">
          
          {/* Logo brand section (Moved to sidebar matching reference) */}
          <div className="p-5 border-b border-white/10 flex flex-col gap-1.5 flex-shrink-0 cursor-pointer" onClick={(e) => navigateTo && navigateTo(e, '/')}>
            <div className="flex items-center gap-[12px]">
              {/* Logo container vertically centered with the wordmark */}
              <img 
                src={lionLogo} 
                alt="Aculion Logo" 
                className="h-[42px] w-auto object-contain"
              />
              
              {/* Text group containing wordmark and tagline */}
              <div className="flex flex-col">
                <span className="text-[20px] font-black tracking-[0.05em] text-white uppercase leading-none font-heading">
                  ACULION
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-[4px] leading-none">
                  SEE BEYOND
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col p-3 gap-1.5 overflow-y-auto min-h-0">
            {/* Sidebar header */}
            <span className="text-[9px] font-bold tracking-[0.18em] text-white/30 uppercase px-2.5 mb-1.5">LOCATION INTELLIGENCE</span>
            {[
              { id: 'live', icon: 'fa-circle-dot', label: 'Live View' },
              { id: 'traffic', icon: 'fa-car', label: 'Traffic Overview' },
              { id: 'overview', icon: 'fa-chart-pie', label: 'Location Overview' },
              { id: 'corridor', icon: 'fa-route', label: 'Corridor Intelligence' },
              { id: 'zone', icon: 'fa-chart-simple', label: 'Zone Comparison' },
              { id: 'historical', icon: 'fa-timeline', label: 'Historical Trends' },
              { id: 'alerts', icon: 'fa-triangle-exclamation', label: 'Alerts' },
              { id: 'reports', icon: 'fa-file-lines', label: 'Reports' },
              { id: 'export', icon: 'fa-file-export', label: 'Data Export' },
              { id: 'settings', icon: 'fa-sliders', label: 'Settings' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-semibold transition-all !w-full !border-none !shadow-none ${
                  activeNav === item.id 
                    ? '!bg-blue-600 !text-white border border-blue-400/20 shadow-[0_0_8px_rgba(37,99,235,0.25)]' 
                    : '!bg-[#121829]/75 hover:!bg-[#1a233a] !text-white/50 hover:!text-white border border-white/5'
                }`}
              >
                <i className={`fa-solid ${item.icon} text-[11px] w-3.5 text-center`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Location Summary card */}
          <div className="p-3 border-t border-white/5 bg-[#06080e]/60 flex-shrink-0">
            <div className="border border-white/10 rounded-lg bg-white/[0.01] overflow-hidden">
              <span className="text-[8px] font-bold tracking-wider text-white/30 uppercase block px-2.5 block pt-2 pb-0.5">Selected Location</span>
              <div className="h-[56px] overflow-hidden relative">
                <img src="/anna_nagar_location.png" alt="Anna Nagar" className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] to-transparent"></div>
              </div>
              <div className="p-2.5">
                <h4 className="text-[11px] font-bold text-white/90 leading-none font-heading">Anna Nagar</h4>
                <p className="text-[9.5px] text-white/40 leading-normal mt-0.5">Shanthi Colony Junction,<br />Chennai - 600040</p>
                <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold mt-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                  Live Since 09:12:45 AM
                </div>
              </div>
              <button className="w-full bg-white/[0.03] border-t border-b-0 border-l-0 border-r-0 border-white/5 py-1.5 text-[9.5px] text-blue-400 font-medium hover:bg-white/5 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 !shadow-none !outline-none border-t border-white/5">
                Change Location
                <i className="fa-solid fa-chevron-right text-[8px] text-blue-400/50" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT WORKSPACE (Right Column) ── */}
        <div className="flex-grow flex flex-col overflow-hidden h-full min-w-0">

          {/* ═══════════════════════════════════════════════════
             TOP BAR (h-[70px])
          ═══════════════════════════════════════════════════ */}
          <header className="h-[70px] border-b border-white/10 px-6 flex items-center justify-between bg-[#080c16] flex-shrink-0 w-full">
            {/* Location Title & status */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xs lg:text-sm font-semibold font-heading tracking-wide">Anna Nagar – Shanthi Colony Junction</h1>
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-white/40 leading-none mt-0.5">Chennai, Tamil Nadu, India</p>
            </div>

            {/* Topbar Actions (Keeping ONLY Live Date and Live Time) */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#121829] border border-white/5 rounded px-2.5 py-1 text-[11px] text-white/70 font-sans">
                <span>📅</span>
                <span className="font-medium font-mono">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#121829] border border-white/5 rounded px-2.5 py-1 text-[11px] text-white/70 font-mono">
                <span>🕐</span>
                <span>{formattedTime}</span>
              </div>
              <div className="relative">
                <select className="appearance-none bg-[#121829] border border-white/5 rounded pl-2.5 pr-7 py-1 text-[11px] text-white/70 font-medium cursor-pointer focus:outline-none focus:border-blue-500/50 max-w-[125px] sm:max-w-none truncate">
                  <option>All Cameras</option>
                  <option>CAM-01 (South)</option>
                  <option>CAM-02 (East)</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px]">
                  <i className="fa-solid fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </header>

          {/* Main Views Container */}
          <main className={`flex-grow flex flex-col h-full min-w-0 ${
            activeNav === 'overview' 
              ? 'overflow-hidden p-0 bg-[#070913]' 
              : activeNav === 'traffic' 
                ? 'overflow-hidden p-0 bg-[#070913]' 
                : 'overflow-hidden bg-[#070913] p-4 gap-4'
          }`}>

            {/* ═══════════════════════════════════════════════════
               1. LIVE VIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'live' && (
              <>
                {/* Row 1: Real-time Counters Ticking */}
                <div className="grid grid-cols-5 gap-4 h-[100px] flex-shrink-0 w-full">
                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-0 shadow-lg">
                    <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs flex-shrink-0">
                      <i className="fa-solid fa-person-walking" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-white/40 font-medium uppercase tracking-wide truncate">People Count (Now)</span>
                      <span className="text-sm lg:text-base font-bold text-white mt-0.5 leading-none font-mono transition-all duration-300">{livePeople}</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1 leading-none truncate">
                        <i className="fa-solid fa-arrow-up text-[7px]" />
                        18.6% <span className="text-white/20 font-medium ml-0.5">vs yesterday</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-0 shadow-lg">
                    <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs flex-shrink-0">
                      <i className="fa-solid fa-car" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-white/40 font-medium uppercase tracking-wide truncate">Vehicles Count (Now)</span>
                      <span className="text-sm lg:text-base font-bold text-white mt-0.5 leading-none font-mono transition-all duration-300">{liveVehicles}</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1 leading-none truncate">
                        <i className="fa-solid fa-arrow-up text-[7px]" />
                        12.4% <span className="text-white/20 font-medium ml-0.5">vs yesterday</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-0 shadow-lg">
                    <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs flex-shrink-0">
                      <i className="fa-regular fa-clock" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-white/40 font-medium uppercase tracking-wide truncate">Avg. Dwell Time</span>
                      <span className="text-sm lg:text-base font-bold text-white mt-0.5 leading-none font-mono transition-all duration-300">{liveDwell} sec</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1 leading-none truncate">
                        <i className="fa-solid fa-arrow-up text-[7px]" />
                        6.3% <span className="text-white/20 font-medium ml-0.5">vs yesterday</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-0 shadow-lg">
                    <div className="w-8 h-8 rounded bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs flex-shrink-0">
                      <i className="fa-solid fa-chart-simple" />
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <span className="text-[9px] text-white/40 font-medium uppercase tracking-wide block truncate">Peak Time Today</span>
                      <span className="text-xs font-bold text-white/90 mt-1 leading-none truncate">06:00 PM – 08:00 PM</span>
                      <span className="text-[8px] text-white/25 mt-0.5 block truncate">Highest volume window</span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-0 shadow-lg">
                    <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs flex-shrink-0">
                      <i className="fa-regular fa-star" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-white/40 font-medium uppercase tracking-wide truncate">Location Score</span>
                      <div className="flex items-baseline gap-0.5 mt-0.5 leading-none">
                        <span className="text-sm lg:text-base font-bold text-white font-mono">87</span>
                        <span className="text-[9px] text-white/30">/100</span>
                      </div>
                      <div className="mt-1 leading-none">
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] font-bold uppercase tracking-wider scale-95 origin-left">
                          High Potential
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Live City Map View & CCTV overlay grid */}
                <div className="flex-1 min-h-0 grid grid-cols-[1.85fr_1fr] gap-4 w-full">
                  {/* Main GPS Live Map layout */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden relative h-full">
                    <div className="h-8 border-b border-white/10 px-4 flex items-center justify-between bg-[#080b15]/30 flex-shrink-0">
                      <span className="text-xs font-bold text-white/80">Live Location Intelligence Map</span>
                    </div>
                    
                    <div className="flex-grow relative bg-[#070a13] overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
                        <defs>
                          <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1"/>
                          </pattern>
                        </defs>

                        <rect width="600" height="300" fill="url(#grid)" />

                        <style>
                          {`
                            @keyframes flowEast { to { stroke-dashoffset: -20; } }
                            @keyframes flowWest { to { stroke-dashoffset: 20; } }
                            @keyframes flowSouth { to { stroke-dashoffset: -20; } }
                            @keyframes flowNorth { to { stroke-dashoffset: 20; } }
                            
                            .flow-east { animation: flowEast 1.5s linear infinite; }
                            .flow-west { animation: flowWest 1.5s linear infinite; }
                            .flow-south { animation: flowSouth 1.8s linear infinite; }
                            .flow-north { animation: flowNorth 1.8s linear infinite; }
                          `}
                        </style>

                        {/* Road Outline Paths */}
                        <path d="M -50,126 L 650,126" stroke="#131b2e" strokeWidth="12" fill="none" />
                        <path d="M 282,-50 L 282,350" stroke="#131b2e" strokeWidth="12" fill="none" />
                        <path d="M -50,30 L 650,230" stroke="#131b2e" strokeWidth="10" fill="none" />
                        <path d="M 650,30 L -50,230" stroke="#131b2e" strokeWidth="10" fill="none" />
                        <path d="M 110,-50 L 110,350" stroke="#131b2e" strokeWidth="8" fill="none" />
                        <path d="M 460,-50 L 460,350" stroke="#131b2e" strokeWidth="8" fill="none" />

                        {/* Road Center Dotted Lines */}
                        <path d="M -50,126 L 650,126" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                        <path d="M 282,-50 L 282,350" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                        <path d="M -50,30 L 650,230" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                        <path d="M 650,30 L -50,230" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

                        {/* Live traffic direction markers */}
                        <path d="M -50,126 L 650,126" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1.5" strokeDasharray="8 8" fill="none" className="flow-east" />
                        <path d="M 282,-50 L 282,350" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1.5" strokeDasharray="8 8" fill="none" className="flow-south" />

                        {/* Concentric Search Rings */}
                        <circle cx="282" cy="126" r="30" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="0.8" strokeDasharray="3 3" />
                        <circle cx="282" cy="126" r="60" fill="none" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="0.8" />

                        {/* Quad Spoked Geofence Star */}
                        <path 
                          d="M 282,126 L 150,120 Q 220,126 282,185 Q 282,140 420,140 Q 330,132 282,65 Q 262,108 150,120" 
                          fill="rgba(37, 99, 235, 0.12)" 
                          stroke="#2563eb" 
                          strokeWidth="1.2" 
                          filter="url(#blueGlow)" 
                        />

                        {/* Animated Pedestrian/Vehicle Density Points */}
                        <circle r="2.5" fill="#ef4444"><animateMotion dur="9s" repeatCount="indefinite" path="M 282,-20 L 282,320" begin="0s" /></circle>
                        <circle r="2.5" fill="#22c55e"><animateMotion dur="13s" repeatCount="indefinite" path="M 282,320 L 282,-20" begin="-2s" /></circle>
                        <circle r="2.8" fill="#eab308"><animateMotion dur="7s" repeatCount="indefinite" path="M -20,126 L 620,126" begin="-1s" /></circle>
                        <circle r="2.2" fill="#3b82f6"><animateMotion dur="11s" repeatCount="indefinite" path="M 620,126 L -20,126" begin="-5s" /></circle>
                        <circle r="2.5" fill="#ef4444"><animateMotion dur="14s" repeatCount="indefinite" path="M -20,20 L 620,220" begin="-4s" /></circle>

                        {/* Street labels */}
                        <g fontSize="8.5" fontFamily="Inter, sans-serif" fill="rgba(255,255,255,0.35)" fontWeight="500">
                          <text x="135" y="70" textAnchor="middle">Anna Nagar West</text>
                          <text x="140" y="200" textAnchor="middle">Shanthi Colony</text>
                          <text x="315" y="250" textAnchor="middle">Anna Nagar East</text>
                          <text x="360" y="110" textAnchor="middle">PVR VR Mall</text>
                          <text x="445" y="145" textAnchor="middle">Anna Nagar Tower</text>
                          <text x="465" y="90" textAnchor="middle">Blue Star</text>
                          <text x="300" y="52" textAnchor="middle">Roundtana</text>
                          <text x="420" y="222" fill="rgba(255,255,255,0.18)" fontSize="7" transform="rotate(15, 420, 222)" textAnchor="middle">Arya Gowda Road</text>
                        </g>

                        {/* Location Pin */}
                        <g transform="translate(282, 126)">
                          <circle cx="0" cy="0" r="14" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
                          <circle cx="0" cy="0" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                          <circle cx="0" cy="0" r="1.5" fill="white" />
                        </g>
                      </svg>

                      <div className="absolute bottom-2.5 left-2.5 bg-[#0a0f1d]/95 border border-white/10 px-2 py-0.5 rounded text-[9.5px] font-semibold text-white/75 flex items-center gap-1 backdrop-blur-sm shadow-md">
                        <span>Camera 1</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">LIVE</span>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1">
                        <button className="!w-6 !h-6 !bg-[#0a0f1d]/90 hover:!bg-white/5 !border-white/10 rounded flex items-center justify-center text-[10px] text-white/70 shadow-lg cursor-pointer backdrop-blur-sm">+</button>
                        <button className="!w-6 !h-6 !bg-[#0a0f1d]/90 hover:!bg-white/5 !border-white/10 rounded flex items-center justify-center text-[10px] text-white/70 shadow-lg cursor-pointer backdrop-blur-sm">−</button>
                        <button className="!w-6 !h-6 !bg-[#0a0f1d]/90 hover:!bg-white/5 !border-white/10 rounded flex items-center justify-center text-[10px] text-white/70 shadow-lg cursor-pointer backdrop-blur-sm mt-1">
                          <i className="fa-solid fa-crosshairs" />
                        </button>
                      </div>

                      <div className="absolute top-2.5 right-2.5 bg-[#0a0f1d]/90 border border-white/10 rounded p-2 shadow-lg backdrop-blur-sm flex flex-col gap-0.5">
                        <span className="text-[8px] font-semibold text-white/55 tracking-wide">Live Density (People/min)</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] text-white/40">Low</span>
                          <div className="w-[80px] h-[5px] rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-500 to-red-500" />
                          <span className="text-[8px] text-white/40">High</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right stack column: Live CCTV feed & location analytics */}
                  <div className="flex flex-col gap-4 h-full min-h-0">
                    {/* Live CCTV Video with moving bounding boxes */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden h-[160px] flex-shrink-0 relative shadow-lg">
                      <div className="h-8 border-b border-white/10 px-3 flex items-center justify-between bg-[#080b15]/30">
                        <span className="text-[11px] font-bold text-white/80">Live Camera Feed</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          LIVE
                        </span>
                      </div>
                      <div className="flex-1 relative bg-black overflow-hidden">
                        <img src="/anna_nagar_feed.png" alt="Live Surveillance feed" className="w-full h-full object-cover opacity-80" />
                        
                        {/* Interactive Bounding box overlays */}
                        {settings.overlayBoxes && boxes.map(box => (
                          <div
                            key={box.id}
                            className="absolute border border-blue-400 bg-blue-500/15 pointer-events-none flex flex-col justify-between"
                            style={{
                              left: `${box.x}%`,
                              top: `${box.y}%`,
                              width: `${box.w}%`,
                              height: `${box.h}%`,
                              transition: 'left 180ms linear, top 180ms linear'
                            }}
                          >
                            <span className="bg-blue-500 text-[6.5px] px-0.5 text-white leading-none font-bold uppercase self-start rounded-br">
                              {box.type} {box.conf}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Location Summary card */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden flex-grow min-h-0 shadow-lg">
                      <div className="h-8 border-b border-white/10 px-3 flex items-center justify-between bg-[#080b15]/30 flex-shrink-0">
                        <span className="text-[11px] font-bold text-white/80">Location Summary <span className="text-white/30 font-medium">(Today)</span></span>
                      </div>
                      <div className="flex-grow p-3 flex flex-col justify-around gap-1.5 text-[11px] min-h-0 overflow-y-auto">
                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-2 text-white/60">
                            <i className="fa-solid fa-person-walking text-blue-400 w-3.5 text-center text-[11px]" />
                            <span>Total People</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">45,782</span>
                            <span className="text-[9.5px] text-emerald-400 font-bold">↑ 16.8%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-2 text-white/60">
                            <i className="fa-solid fa-car text-cyan-400 w-3.5 text-center text-[11px]" />
                            <span>Total Vehicles</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">32,605</span>
                            <span className="text-[9.5px] text-emerald-400 font-bold">↑ 11.3%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-2 text-white/60">
                            <i className="fa-regular fa-clock text-indigo-400 w-3.5 text-center text-[11px]" />
                            <span>Avg. Dwell Time</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">38 sec</span>
                            <span className="text-[9.5px] text-emerald-400 font-bold">↑ 6.3%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-2 text-white/60">
                            <i className="fa-solid fa-chart-line text-violet-400 w-3.5 text-center text-[11px]" />
                            <span>Peak Hour</span>
                          </div>
                          <span className="font-bold text-white/80 text-right truncate pl-2">06:00 PM – 08:00 PM</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-2 text-white/60">
                            <i className="fa-regular fa-calendar-days text-amber-400 w-3.5 text-center text-[11px]" />
                            <span>Busiest Day</span>
                          </div>
                          <span className="font-bold text-white/80 text-right pl-2">Friday</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Charts & Heatmap row */}
                <div className="grid grid-cols-3 gap-4 h-[280px] flex-shrink-0 w-full font-sans">
                  {/* People Count Trend AreaChart */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden p-4 relative h-full shadow-lg">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <span className="text-[11px] font-bold text-white/80">People Count Trend</span>
                      <span className="text-[9px] text-white/30 font-mono">Today</span>
                    </div>
                    <div className="flex-grow w-full relative min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={LINE_DATA} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="time" 
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 7.5 }} 
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            ticks={['12 AM', '04 AM', '08 AM', '12 PM', '04 PM', '08 PM', '12 AM']}
                          />
                          <YAxis 
                            domain={[0, 2000]}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 7.5 }} 
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            ticks={[0, 500, 1000, 1500, 2000]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#areaGlow)" />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="absolute left-[38%] top-[12%] flex flex-col items-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_8px_#3b82f6]"></div>
                        <div className="bg-[#0f172a] border border-white/10 px-1.5 py-0.5 rounded text-[8.5px] shadow-2xl mt-0.5 flex flex-col items-center whitespace-nowrap">
                          <span className="text-white/40">10:00 AM</span>
                          <span className="text-white font-bold font-mono">1,246 People</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Heatmap matrix */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden p-4 h-full shadow-lg">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <span className="text-[11px] font-bold text-white/80">Hourly Heatmap (People)</span>
                      <span className="text-[9px] text-white/30 font-mono">Today</span>
                    </div>
                    <div className="flex-grow flex flex-col justify-between min-h-0 mt-0.5">
                      <div className="flex flex-col gap-[2px] flex-grow justify-around min-h-0">
                        {DAYS.map((day, dIdx) => (
                          <div key={day} className="flex items-center gap-[3px] flex-grow min-h-0">
                            <span className="w-6 text-[8px] text-white/40 font-medium text-left leading-none">{day}</span>
                            <div className="flex-1 grid grid-cols-12 gap-[2.5px] h-full items-center">
                              {HEATMAP_DATA[dIdx].map((val, hIdx) => (
                                <div 
                                  key={hIdx} 
                                  style={{ backgroundColor: getHeatmapColor(val) }}
                                  className="h-full max-h-[11px] rounded-[1px] hover:scale-110 hover:border hover:border-white/20 transition-all cursor-pointer"
                                  title={`${day} Hourly Segment — Value: ${val}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center pl-6 gap-[3px] text-[7.5px] text-white/30 font-mono mt-0.5 flex-shrink-0">
                        <div className="flex-1 grid grid-cols-6 text-center">
                          {HOURS_LABELS.slice(0, -1).map(h => <span key={h}>{h}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[7.5px] text-white/40 px-1 border-t border-white/5 pt-1.5 flex-shrink-0 mt-0.5 font-mono">
                        <span>Low</span>
                        <div className="w-[140px] h-[4px] rounded-full bg-gradient-to-r from-[#101626] via-[#1e3a8a] via-[#2563eb] via-[#22c55e] via-[#d97706] via-[#ea580c] to-[#dc2626]" />
                        <span>High</span>
                      </div>
                    </div>
                  </div>

                  {/* Dwell Time PieChart */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl flex flex-col overflow-hidden p-4 h-full shadow-lg">
                    <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                      <span className="text-[11px] font-bold text-white/80">Dwell Time Distribution</span>
                      <span className="text-[9px] text-white/30 font-mono">Today</span>
                    </div>
                    <div className="flex-grow grid grid-cols-[84px_1fr] items-center gap-3 min-h-0">
                      <div className="w-[84px] h-[84px] relative mx-auto flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={DONUT_DATA}
                              cx="50%"
                              cy="50%"
                              innerRadius={24}
                              outerRadius={32}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {DONUT_DATA.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                          <span className="text-sm font-extrabold text-white">38</span>
                          <span className="text-[7.5px] text-white/40 uppercase tracking-widest mt-0.5 font-mono">sec</span>
                          <span className="text-[6.5px] text-white/30 uppercase tracking-wider mt-0.5">Average</span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-1.5 min-w-0 font-sans">
                        {DONUT_DATA.map(item => (
                          <div key={item.name} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 text-white/50 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-white/85 font-mono flex-shrink-0 ml-1">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════
               TRAFFIC OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'traffic' && (
              <iframe
                src="/traffic_ui/index.html"
                title="Traffic Overview"
                className="w-full h-full border-none"
              />
            )}

            {/* ═══════════════════════════════════════════════════
               2. LOCATION OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'overview' && (
              <LocationIntelligence />
            )}

            {/* ═══════════════════════════════════════════════════
               3. CORRIDOR INTELLIGENCE
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'corridor' && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Junction Corridor Flow Matrix</h3>
                </div>

                {/* Corridor Comparison Table */}
                <div className="flex-grow bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#080b15] text-white/45 border-b border-white/10 uppercase font-semibold text-[9.5px]">
                        <tr>
                          <th className="p-3">Corridor Description</th>
                          <th className="p-3">Average Speed</th>
                          <th className="p-3">Traffic Density</th>
                          <th className="p-3">Avg Dwell time</th>
                          <th className="p-3 font-mono">Busiest Hour</th>
                          <th className="p-3">Congestion Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { name: 'Anna Nagar Main Ave (Northbound)', speed: '42 km/h', flow: '680 veh/hr', dwell: '25s', peak: '08:00 AM - 10:00 AM', status: 'Low', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
                          { name: 'Shanthi Colony Bypass (Eastbound)', speed: '28 km/h', flow: '942 veh/hr', dwell: '48s', peak: '06:00 PM - 08:00 PM', status: 'Moderate', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
                          { name: 'Arya Gowda Connector (Southbound)', speed: '14 km/h', flow: '1,204 veh/hr', dwell: '84s', peak: '05:30 PM - 07:30 PM', status: 'High', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
                          { name: 'Roundtana Loop Circle (Rotary)', speed: '36 km/h', flow: '710 veh/hr', dwell: '15s', peak: '09:00 AM - 11:00 AM', status: 'Low', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 font-bold text-white/95">{row.name}</td>
                            <td className="p-3 font-mono text-white/80">{row.speed}</td>
                            <td className="p-3 font-mono text-white/80">{row.flow}</td>
                            <td className="p-3 font-mono text-white/80">{row.dwell}</td>
                            <td className="p-3 font-mono text-white/60">{row.peak}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${row.badge}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Speed vs Congestion metrics */}
                <div className="grid grid-cols-2 gap-4 h-[120px] flex-shrink-0">
                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex flex-col justify-around shadow-lg">
                    <span className="text-[9.5px] text-cyan-400 font-bold uppercase tracking-wider">Corridor Congestion Average</span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Mean Vehicular Speed: <strong className="text-white font-mono">30 km/h</strong></span>
                      <span>Average Delay Index: <strong className="text-yellow-400 font-mono">+12.4% vs last week</strong></span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3 flex flex-col justify-around shadow-lg">
                    <span className="text-[9.5px] text-purple-400 font-bold uppercase tracking-wider">AI Traffic recommendations</span>
                    <p className="text-[11.5px] text-white/50 leading-relaxed">Arya Gowda Connector displays severe delays on weekday evening hours. Auto-apply dynamic programmatic DOOH price modifiers to capture longer dwell margins.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               4. ZONE COMPARISON
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'zone' && (
              <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Multi-Zone Dashboard Comparison</h3>
                  
                  {/* Select zone toggles */}
                  <div className="flex bg-[#121829] border border-white/10 rounded p-0.5 text-[9.5px]">
                    {[
                      { key: 'zoneA', label: 'Commercial Zone A' },
                      { key: 'zoneB', label: 'Retail Zone B' },
                      { key: 'zoneC', label: 'Transit Zone C' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setActiveZoneCompare(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                        className={`px-3 py-1 rounded font-semibold transition-all !border-none !shadow-none ${
                          activeZoneCompare[opt.key] ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Commercial Zone */}
                  {activeZoneCompare.zoneA && (
                    <div className="bg-[#0f172a]/60 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg h-[260px]">
                      <div>
                        <span className="text-[8px] font-bold text-white/40 block">ZONE A</span>
                        <h4 className="text-sm font-bold text-white mt-1">Anna Nagar Commercial Centre</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-white/5 pt-3 my-2 flex-grow font-sans">
                        <div><span className="text-white/45 block">Daily Footfall:</span> <strong className="font-mono text-white/90">45,782</strong></div>
                        <div><span className="text-white/45 block">Vehicles count:</span> <strong className="font-mono text-white/90">32,605</strong></div>
                        <div><span className="text-white/45 block">Avg Dwell time:</span> <strong className="font-mono text-white/90">38 sec</strong></div>
                        <div><span className="text-white/45 block">Occupancy:</span> <strong className="font-mono text-white/90 text-emerald-400">92%</strong></div>
                        <div><span className="text-white/45 block">Campaign Reach:</span> <strong className="font-mono text-white/90">86.2K</strong></div>
                        <div><span className="text-white/45 block">Engagement:</span> <strong className="font-mono text-white/90 text-purple-400">89%</strong></div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-[10px] text-white/50">Performance ROI Yield:</span>
                        <strong className="text-sm text-blue-400 font-mono">2.4x</strong>
                      </div>
                    </div>
                  )}

                  {/* Retail Zone */}
                  {activeZoneCompare.zoneB && (
                    <div className="bg-[#0f172a]/60 border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between shadow-lg h-[260px]">
                      <div>
                        <span className="text-[8px] font-bold text-white/40 block">ZONE B</span>
                        <h4 className="text-sm font-bold text-white mt-1">Shanthi Colony Retail Row</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-white/5 pt-3 my-2 flex-grow font-sans">
                        <div><span className="text-white/45 block">Daily Footfall:</span> <strong className="font-mono text-white/90">38,120</strong></div>
                        <div><span className="text-white/45 block">Vehicles count:</span> <strong className="font-mono text-white/90">41,500</strong></div>
                        <div><span className="text-white/45 block">Avg Dwell time:</span> <strong className="font-mono text-white/90">52 sec</strong></div>
                        <div><span className="text-white/45 block">Occupancy:</span> <strong className="font-mono text-white/90 text-emerald-400">85%</strong></div>
                        <div><span className="text-white/45 block">Campaign Reach:</span> <strong className="font-mono text-white/90">72.4K</strong></div>
                        <div><span className="text-white/45 block">Engagement:</span> <strong className="font-mono text-white/90 text-purple-400">76%</strong></div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-[10px] text-white/50">Performance ROI Yield:</span>
                        <strong className="text-sm text-cyan-400 font-mono">1.9x</strong>
                      </div>
                    </div>
                  )}

                  {/* Transit Zone */}
                  {activeZoneCompare.zoneC && (
                    <div className="bg-[#0f172a]/60 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between shadow-lg h-[260px]">
                      <div>
                        <span className="text-[8px] font-bold text-white/40 block">ZONE C</span>
                        <h4 className="text-sm font-bold text-white mt-1">Metro Transit Junction Hub</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-white/5 pt-3 my-2 flex-grow font-sans">
                        <div><span className="text-white/45 block">Daily Footfall:</span> <strong className="font-mono text-white/90">62,800</strong></div>
                        <div><span className="text-white/45 block">Vehicles count:</span> <strong className="font-mono text-white/90">14,200</strong></div>
                        <div><span className="text-white/45 block">Avg Dwell time:</span> <strong className="font-mono text-white/90">15 sec</strong></div>
                        <div><span className="text-white/45 block">Occupancy:</span> <strong className="font-mono text-white/90 text-emerald-400">74%</strong></div>
                        <div><span className="text-white/45 block">Campaign Reach:</span> <strong className="font-mono text-white/90">98.1K</strong></div>
                        <div><span className="text-white/45 block">Engagement:</span> <strong className="font-mono text-white/90 text-purple-400">62%</strong></div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-[10px] text-white/50">Performance ROI Yield:</span>
                        <strong className="text-sm text-purple-400 font-mono">1.4x</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               5. HISTORICAL TRENDS
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'historical' && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between flex-shrink-0 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Historical Trend Analytics</h3>
                  
                  {/* Select Trend Toggles */}
                  <div className="flex bg-[#121829] border border-white/10 rounded p-0.5 text-[9.5px]">
                    {['day', 'week', 'month', 'year'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setHistoricalFilter(opt)}
                        className={`px-3 py-1 rounded font-semibold transition-all uppercase !border-none !shadow-none ${
                          historicalFilter === opt ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col shadow-lg min-h-0">
                  <span className="text-[10px] text-white/45 mb-3 block">Impressions vs Billboard Occupancy Trend Matrix</span>
                  <div className="flex-grow w-full relative min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={
                          historicalFilter === 'day' 
                            ? HISTORICAL_DAILY 
                            : historicalFilter === 'week' 
                              ? HISTORICAL_WEEKLY 
                              : historicalFilter === 'month' 
                                ? HISTORICAL_MONTHLY 
                                : HISTORICAL_YEARLY
                        }
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
                        <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(34,197,94,0.6)', fontSize: 9 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="Impressions" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        <Bar yAxisId="right" dataKey="Occupancy" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               6. ALERTS
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'alerts' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Node Status Alerts & Alarms</h3>

                {/* Telemetries */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { title: 'GPU Core Load', val: '74%', desc: 'AI processing OK', color: 'text-blue-400' },
                    { title: 'Edge Temp', val: '58°C', desc: 'Thermal control clean', color: 'text-emerald-400' },
                    { title: 'CCTV Stream Health', val: '100%', desc: 'Camera offline alert: 0', color: 'text-cyan-400' },
                    { title: 'Network Latency', val: '12ms', desc: 'Signal ping active', color: 'text-violet-400' },
                    { title: 'Traffic Alerts', val: '2 Spike', desc: 'Corridor threshold alerts', color: 'text-amber-400' }
                  ].map((meter, idx) => (
                    <div key={idx} className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-[100px]">
                      <span className="text-[9px] text-white/45 uppercase font-medium">{meter.title}</span>
                      <strong className={`text-2xl font-bold font-mono ${meter.color}`}>{meter.val}</strong>
                      <span className="text-[8.5px] text-white/30 truncate leading-none">{meter.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col shadow-lg flex-grow">
                  <span className="text-[10px] text-white/40 mb-3 block">Live Device Logs & Event Status Indicators</span>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                    {alerts.map(alert => alert.active && (
                      <div key={alert.id} className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-lg hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            alert.type === 'CRITICAL' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : alert.type === 'WARNING' 
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {alert.type}
                          </span>
                          <div className="flex flex-col text-[11px]">
                            <strong className="text-white/95">{alert.title}</strong>
                            <span className="text-white/45 mt-0.5">{alert.target} • {alert.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-[9.5px] font-semibold text-blue-400 hover:text-blue-300 transition-colors px-2.5 py-1 bg-white/[0.02] hover:bg-white/5 rounded border border-white/5 !shadow-none !outline-none"
                        >
                          Dismiss Event
                        </button>
                      </div>
                    ))}
                    {alerts.filter(a => a.active).length === 0 && (
                      <div className="text-center py-6 text-xs text-white/30">
                        All clear. No active alerts on edge network.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               7. Reports
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'reports' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Campaign Report compiler</h3>

                <div className="grid grid-cols-[1.2fr_1.8fr] gap-4 min-h-[300px]">
                  {/* Query config panel */}
                  <form onSubmit={handleGenerateReport} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-lg h-full">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-white/45 uppercase font-medium">Report Configuration</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-white/50">Start Date</label>
                          <input type="date" defaultValue="2026-07-01" className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-white/50">End Date</label>
                          <input type="date" defaultValue="2026-07-11" className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-white/50">Frequency Scope</label>
                        <select 
                          value={reportType} 
                          onChange={(e) => setReportType(e.target.value)} 
                          className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none"
                        >
                          <option value="weekly">Weekly Summary</option>
                          <option value="monthly">Monthly Comprehensive</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-white/50">Streams check list</label>
                        <div className="flex flex-col gap-1.5 text-[10px] mt-1 font-sans">
                          {['Footfall & Impression counts', 'Average Dwell Duration', 'Vehicular Speed & Traffic count', 'Occupancy & Pricing modifier'].map(lbl => (
                            <label key={lbl} className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                              <input type="checkbox" defaultChecked className="rounded border-white/10 bg-slate-800 w-3 h-3 cursor-pointer" />
                              <span>{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button 
                        type="submit" 
                        disabled={generatingReport}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-[11px] border-none shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        {generatingReport ? (
                          <>
                            <i className="fa-solid fa-spinner animate-spin" />
                            Compiling Data streams...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-file-pdf" />
                            Generate Report PDF / Excel
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Preview generated report logs */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-lg h-full">
                    <div>
                      <span className="text-[10px] text-white/45 uppercase font-medium mb-3 block">Reports log history</span>
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                        {reportsList.map(rep => (
                          <div key={rep.id} className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-2.5 rounded-lg text-[10.5px] hover:bg-white/[0.02]">
                            <div className="flex flex-col">
                              <strong className="text-white/95 truncate max-w-[200px]">{rep.name}</strong>
                              <span className="text-white/45 mt-0.5 font-mono">{rep.id} • {rep.date} • {rep.size}</span>
                            </div>
                            <div className="flex gap-1">
                              <button className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 rounded text-[9.5px] font-semibold flex items-center gap-1 !shadow-none !outline-none">
                                <i className="fa-solid fa-download" /> PDF
                              </button>
                              <button className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10 rounded text-[9.5px] font-semibold flex items-center gap-1 !shadow-none !outline-none">
                                <i className="fa-solid fa-download" /> EXCEL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               8. DATA EXPORT
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'export' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Raw Data Streams Exporter</h3>

                <div className="grid grid-cols-[1fr_2fr] gap-4">
                  {/* Format config panel */}
                  <form onSubmit={handleExportData} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-lg h-[240px]">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-white/45 uppercase font-medium">Export Query Settings</span>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-white/55">Target Format</label>
                        <div className="flex items-center gap-4 mt-0.5 text-[10.5px]">
                          {['csv', 'xlsx', 'pdf'].map(fmt => (
                            <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="format" 
                                checked={exportFormat === fmt} 
                                onChange={() => setExportFormat(fmt)}
                                className="w-3 h-3 bg-slate-800 border-white/10 cursor-pointer" 
                              />
                              <span className="uppercase font-bold">{fmt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <button 
                        type="submit" 
                        disabled={exportingData}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-[11px] border-none shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        {exportingData ? (
                          <>
                            <i className="fa-solid fa-spinner animate-spin" />
                            Packaging dataset...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-file-export" />
                            Start Export Download
                          </>
                        )}
                      </button>
                      {exportSuccess && (
                        <p className="text-[10.5px] text-emerald-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                          <i className="fa-solid fa-circle-check" />
                          Download completed successfully!
                        </p>
                      )}
                    </div>
                  </form>

                  {/* Raw data preview mock grid */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col shadow-lg h-[240px]">
                    <span className="text-[10px] text-white/45 uppercase font-medium mb-2.5">Raw Data Stream Preview (Live)</span>
                    <div className="flex-grow overflow-auto border border-white/5 rounded">
                      <table className="w-full text-left text-[9.5px] font-mono">
                        <thead className="bg-[#080b15] text-white/40 border-b border-white/10 sticky top-0 uppercase">
                          <tr>
                            <th className="p-2">Timestamp</th>
                            <th className="p-2">Vehicles/min</th>
                            <th className="p-2">Pedestrians/min</th>
                            <th className="p-2">AvgDwell(s)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/70">
                          {[
                            { time: '11:44:15 AM', v: 14, p: 28, d: 38 },
                            { time: '11:44:00 AM', v: 16, p: 32, d: 42 },
                            { time: '11:43:45 AM', v: 12, p: 25, d: 35 },
                            { time: '11:43:30 AM', v: 15, p: 30, d: 39 },
                            { time: '11:43:15 AM', v: 18, p: 34, d: 41 }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="p-2">{row.time}</td>
                              <td className="p-2">{row.v}</td>
                              <td className="p-2">{row.p}</td>
                              <td className="p-2">{row.d}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               9. SETTINGS
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'settings' && (
              <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex-shrink-0">Settings Dashboard</h3>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
                  <span className="text-[10px] text-white/45 uppercase font-medium">Dashboard Preferences</span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50">Telemetry refresh rate</label>
                      <select 
                        value={settings.refreshInterval} 
                        onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
                        className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11.5px] text-white/80 focus:outline-none"
                      >
                        <option value="1s">High Frequency (1 second)</option>
                        <option value="5s">Standard (5 seconds)</option>
                        <option value="10s">Extended (10 seconds)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/50">Vector Map Visual Style</label>
                      <select 
                        value={settings.mapStyle} 
                        onChange={(e) => setSettings({ ...settings, mapStyle: e.target.value })}
                        className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11.5px] text-white/80 focus:outline-none"
                      >
                        <option value="dark-gps">Futuristic Dark GPS</option>
                        <option value="vector-lines">Monochrome Vector</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex flex-col gap-2.5">
                    <label className="flex items-center gap-2.5 text-[11px] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.overlayBoxes} 
                        onChange={(e) => setSettings({ ...settings, overlayBoxes: e.target.checked })}
                        className="rounded border-white/10 bg-slate-800 w-3.5 h-3.5 cursor-pointer" 
                      />
                      <span>Show live AI tracking bounding box labels on CCTV feeds</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-[11px] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications} 
                        onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                        className="rounded border-white/10 bg-slate-800 w-3.5 h-3.5 cursor-pointer" 
                      />
                      <span>Enable audio signals and visual indicators for critical threshold alerts</span>
                    </label>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                    <span className="text-[10.5px] text-emerald-400 font-semibold">
                      {saveSuccess && (
                        <>
                          <i className="fa-solid fa-circle-check" /> Console configurations updated successfully!
                        </>
                      )}
                    </span>
                    <button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded text-[11px] border-none shadow-md transition-all !shadow-none !outline-none"
                    >
                      Apply Settings
                    </button>
                  </div>
                </div>
              </form>
            )}

          </main>

          {/* ═══════════════════════════════════════════════════
             FOOTER STATUS BAR (h-[40px])
          ═══════════════════════════════════════════════════ */}
          <footer className="h-[40px] border-t border-white/10 px-6 flex items-center justify-between bg-[#05070f] text-[10px] text-white/35 flex-shrink-0 w-full">
            <div className="flex items-center gap-1.5 font-semibold text-[#22c55e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.6)]"></span>
              All hardware nodes operational
            </div>
            
            <div className="font-medium text-white/30 text-center truncate px-2">
              Aculion Location Intelligence Platform <span className="mx-2 text-white/10">|</span> Real-time human & mobility insights
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-blue-400/80 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)] animate-pulse"></span>
              Data updates every {settings.refreshInterval}
            </div>
          </footer>

        </div>

      </div>

    </div>
  );
}
