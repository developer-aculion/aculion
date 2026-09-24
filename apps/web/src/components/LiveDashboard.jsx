import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import LocationIntelligence from '../pages/LocationIntelligence';
import FrontCameraView from './FrontCameraView';
import lionLogo from '../assets/aculion_lion_logo.png';
import transparentLogo from '../assets/aculion_logo_transparent.png';
import { supabase } from '../services/supabase';
import { billboardService } from '../services/billboard.service';
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

export default function LiveDashboard({ 
  navigateTo, 
  selectedBillboard, 
  billboards = [], 
  user, 
  onSelectBillboard, 
  onAddNewMedia,
  onBackToProfile,
  baseDashboardPath = '/dashboard',
}) {
  // Derive initial active nav from URL path segment.
  // Works for both old /dashboard/<view> and new /<slug>/<bbCode>/dashboard/<view> patterns.
  const getNavFromPath = () => {
    const parts = window.location.pathname.split('/');
    const dashIdx = parts.indexOf('dashboard');
    const seg = dashIdx >= 0 ? (parts[dashIdx + 1] || '') : '';
    const map = {
      'front-camera':          'front_camera',
      'audience-intelligence': 'traffic',
      'traffic-overview':      'traffic',
      'location-overview':     'overview',
      'corridor-intelligence': 'corridor',
      'zone-comparison':       'zone',
      'historical-trends':     'historical',
      'live-view':             'live',
      'alerts':                'alerts',
      'reports':               'reports',
      'settings':              'settings',
    };
    return map[seg] || 'traffic';
  };
  const [activeNav, setActiveNav] = useState(getNavFromPath);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mainMediaView, setMainMediaView] = useState('map');
  const [timeFilter, setTimeFilter] = useState('24H');
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Prevent background scrolling on mobile when sidebar drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);
  
  const getSeed = () => {
    const str = selectedBillboard?.billboard_code || selectedBillboard?.id || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // Real-time telemetry state connected to active sensors
  const [dbTrafficData, setDbTrafficData] = useState(null);
  const [livePeople, setLivePeople] = useState(0);
  const [liveVehicles, setLiveVehicles] = useState(0);
  const [liveDwell, setLiveDwell] = useState(0);
  const [isTrafficLoading, setIsTrafficLoading] = useState(true);

  // CCTV dynamic AI bounding boxes
  const [boxes, setBoxes] = useState([
    { id: 1, type: 'Vehicle', conf: 94, x: 22, y: 45, w: 18, h: 14, dx: 0.8, dy: 0.2 },
    { id: 2, type: 'Vehicle', conf: 89, x: 42, y: 52, w: 16, h: 12, dx: -0.6, dy: -0.15 },
    { id: 3, type: 'Person', conf: 91, x: 62, y: 28, w: 5, h: 12, dx: 0.1, dy: 0.15 },
    { id: 4, type: 'Vehicle', conf: 95, x: 74, y: 58, w: 20, h: 16, dx: -0.9, dy: -0.3 },
    { id: 5, type: 'Person', conf: 87, x: 12, y: 64, w: 6, h: 14, dx: -0.15, dy: 0.05 }
  ]);

  // System status and alerts
  const [alerts, setAlerts] = useState([]);

  // Reports configurations
  const get7DayDefaultDates = () => {
    const now = new Date();
    const endStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    const startD = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(startD);
    return { startStr, endStr };
  };

  const defaultDates = get7DayDefaultDates();
  const [reportStartDate, setReportStartDate] = useState(defaultDates.startStr);
  const [reportEndDate, setReportEndDate] = useState(defaultDates.endStr);
  const [reportType, setReportType] = useState('weekly');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportsList, setReportsList] = useState([]);

  const buildLiveAlerts = React.useCallback((telemetry) => {
    const code = selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0004';
    const camCode = selectedBillboard?.camera_ff_code || 'CAM-FF-004';
    const bbName = selectedBillboard?.billboard_name || selectedBillboard?.name || 'Corridor Asset';
    const lat = (Number(selectedBillboard?.latitude) || 12.9010).toFixed(4);
    const lng = (Number(selectedBillboard?.longitude) || 80.2279).toFixed(4);
    const flow = telemetry?.flow_rate || 0;
    const peak = telemetry?.peak_traffic_hour || '—';
    const total = (Number(telemetry?.total_vehicles) || 0).toLocaleString();

    return [
      {
        id: 1,
        type: 'INFO',
        title: `Front Camera Stream Active (${camCode})`,
        target: `${code} • 1080p 30fps Real-Time Stream Online`,
        time: 'Active Now',
        active: true
      },
      {
        id: 2,
        type: flow > 90 ? 'CRITICAL' : flow > 70 ? 'WARNING' : 'INFO',
        title: `Mobility Flow Rate: ${flow} veh/min logged`,
        target: `${code} • Real-time junction throughput (Total: ${total} veh)`,
        time: '2 mins ago',
        active: true
      },
      {
        id: 3,
        type: 'INFO',
        title: `Peak Mobility Window Active (${peak})`,
        target: `${bbName} • High audience attention & recall period`,
        time: 'Today',
        active: true
      },
      {
        id: 4,
        type: 'INFO',
        title: `GPS Telemetry Locked (${lat}° N, ${lng}° E)`,
        target: `${bbName} • Verified asset location on OOH Vector Map`,
        time: 'Continuous',
        active: true
      }
    ];
  }, [selectedBillboard]);

  const isFetchingDbRef = React.useRef(false);

  const fetchDbTrafficOverview = React.useCallback(async (isSilent = false) => {
    if (isFetchingDbRef.current) return;
    isFetchingDbRef.current = true;
    if (!isSilent) setIsTrafficLoading(true);

    const targetBbCode = selectedBillboard?.billboard_code || selectedBillboard?.id;
    const camFfCode = selectedBillboard?.camera_ff_code || '';
    const camBfCode = selectedBillboard?.camera_bf_code || '';

    try {
      if (!targetBbCode) {
        setDbTrafficData(null);
        setLiveVehicles(0);
        setLiveDwell(0);
        return;
      }

      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

      // STRICT QUERY: Filter exclusively by the selected billboard_code and stat_date
      const [res, peakResult] = await Promise.all([
        supabase
          .from("traffic_overview")
          .select("*")
          .eq("billboard_code", targetBbCode)
          .eq("stat_date", todayIST)
          .order("last_updated", { ascending: false })
          .limit(1)
          .maybeSingle(),
        billboardService.getPeakTrafficHour(targetBbCode, todayIST)
      ]);

      let data = res.data;

      // Fallback: If no record found for today's stat_date or count is 0, check latest overview or history snapshot
      if (!data || Number(data.total_vehicles) === 0) {
        try {
          const fallbackRes = await supabase
            .from("traffic_overview")
            .select("*")
            .eq("billboard_code", targetBbCode)
            .order("last_updated", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (fallbackRes.data && fallbackRes.data.billboard_code === targetBbCode && Number(fallbackRes.data.total_vehicles) > 0) {
            data = fallbackRes.data;
          } else {
            // Check traffic_overview_history for latest live snapshot
            const histRes = await supabase
              .from("traffic_overview_history")
              .select("*")
              .eq("billboard_code", targetBbCode)
              .order("recorded_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (histRes.data && Number(histRes.data.total_vehicles) > 0) {
              data = {
                ...histRes.data,
                last_updated: histRes.data.recorded_at,
                is_live: true
              };
            }
          }
        } catch (fbErr) {
          console.warn("[fetchLatestTrafficData] Fallback query notice:", fbErr);
        }
      }

      // Strict match check: verify returned record matches target billboard
      if (data && data.billboard_code === targetBbCode) {
        // Integrate calculated peak traffic hour from traffic_hour table
        if (peakResult && peakResult.peakHourStr && peakResult.peakHourStr !== '—') {
          data.peak_traffic_hour = peakResult.peakHourStr;
        } else if (Number(data.total_vehicles) === 0) {
          data.peak_traffic_hour = '—';
        }

        setDbTrafficData(data);
        setAlerts(buildLiveAlerts(data));
        setLiveVehicles(Number(data.total_vehicles) || 0);
        setLiveDwell(Number(data.avg_exposure_time) || 0);

        // Broadcast to iframe with exact billboard info
        document.querySelectorAll('iframe').forEach(frame => {
          frame.contentWindow?.postMessage({
            type: 'ACULION_TRAFFIC_DATA_UPDATE',
            billboard_code: targetBbCode,
            camera_ff_code: camFfCode,
            camera_bf_code: camBfCode,
            data: data
          }, '*');
        });
      } else {
        // STRICT NO-DATA RULE: Billboard has no database record -> Reset to 0
        setDbTrafficData(null);
        setAlerts(buildLiveAlerts(null));
        setLiveVehicles(0);
        setLiveDwell(0);

        // Broadcast zero state to iframe
        document.querySelectorAll('iframe').forEach(frame => {
          frame.contentWindow?.postMessage({
            type: 'ACULION_TRAFFIC_DATA_UPDATE',
            billboard_code: targetBbCode,
            camera_ff_code: camFfCode,
            camera_bf_code: camBfCode,
            data: null
          }, '*');
        });
      }
    } catch (err) {
      console.error("[LiveDashboard] fetchDbTrafficOverview error:", err);
    } finally {
      isFetchingDbRef.current = false;
      if (!isSilent) setIsTrafficLoading(false);
    }
  }, [selectedBillboard, buildLiveAlerts]);

  useEffect(() => {
    const code = selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0001';
    const bbName = selectedBillboard?.billboard_name || selectedBillboard?.name || 'Testing Billboard-1';

    setReportsList([
      { id: `REP-${code}-01`, name: `${bbName} Comprehensive Mobility & Reach Report`, format: 'PDF', date: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }), size: '3.4 MB' },
      { id: `REP-${code}-02`, name: `${bbName} Monthly DOOH Audience & Valuation Summary`, format: 'PDF', date: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }), size: '2.8 MB' }
    ]);

    setAlerts(buildLiveAlerts(null));

    // Reset traffic data immediately on billboard change so previous billboard data is never visible
    setDbTrafficData(null);
    setLiveVehicles(0);
    setLiveDwell(0);

    fetchDbTrafficOverview(false);

    // Reliable 5-second automatic refresh interval
    const intervalId = setInterval(() => {
      fetchDbTrafficOverview(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedBillboard, fetchDbTrafficOverview, buildLiveAlerts]);



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

  // Sync activeNav when user navigates with browser back/forward buttons
  useEffect(() => {
    const onPop = () => setActiveNav(getNavFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Time update ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


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

  // Report generator runner - automatically triggers PDF download
  const handleGenerateReport = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setGeneratingReport(true);
    setReportSuccess(false);
    try {
      const idStr = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRep = {
        id: idStr,
        name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Audience Intelligence & ROI Report`,
        format: 'PDF',
        date: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
        size: '2.4 MB'
      };
      setReportsList(prev => [newRep, ...prev]);
      await downloadReportAsPDF(newRep);
      setReportSuccess(true);
    } catch (err) {
      console.error("Error generating report PDF:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Listen for export report and refresh messages from iframe (e.g. from Audience Intelligence header buttons)
  useEffect(() => {
    const handleIframeMsg = (e) => {
      if (e.data) {
        if (e.data.type === 'ACULION_GENERATE_REPORT_PDF') {
          handleGenerateReport();
        } else if (e.data.type === 'ACULION_REFRESH_TRAFFIC_DATA' || e.data.type === 'REQUEST_TRAFFIC_REFRESH') {
          fetchDbTrafficOverview(true);
        }
      }
    };
    window.addEventListener('message', handleIframeMsg);
    return () => window.removeEventListener('message', handleIframeMsg);
  }, [fetchDbTrafficOverview, dbTrafficData, selectedBillboard, user, reportType]);


  // Download clean 2-page report with pure white background & strictly real 7-day database telemetry
  const downloadReportAsPDF = async (rep) => {
    try {
      const bbCode = selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0001';
      const bbName = selectedBillboard?.billboard_name || selectedBillboard?.name || 'Corridor Asset';
      const landmark = selectedBillboard?.location_landmark || selectedBillboard?.street_address || selectedBillboard?.location || 'Prime Corridor';
      const city = selectedBillboard?.city || 'Chennai';
      const ownerName = user?.name || selectedBillboard?.owner_name || 'Aculion Media Partner';
      const companyName = user?.company || selectedBillboard?.company_name || 'Aculion Traffic Intelligence';
      const bbType = selectedBillboard?.type || selectedBillboard?.billboard_type || 'Digital Billboard';

      // Calculate 7-day range in IST ending today
      const now = new Date();
      const dates = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
        dates.push(dateStr);
      }

      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];

      // Formatted start and end dates
      const startDateObj = new Date(minDate + 'T12:00:00+05:30');
      const endDateObj = new Date(maxDate + 'T12:00:00+05:30');
      const startDateFormatted = startDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const endDateFormatted = endDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const dateStr = `${startDateFormatted} – ${endDateFormatted}`;

      // Query traffic_day, traffic_hour, traffic_overview, and traffic_overview_history for full 7-day coverage
      let dayRows = [];
      let hourRows = [];
      let liveOverviewRow = null;
      let historyRows = [];
      try {
        const [dayRes, hourRes, liveRes, histRes] = await Promise.all([
          supabase
            .from("traffic_day")
            .select("*")
            .eq("billboard_code", bbCode)
            .gte("date", minDate)
            .lte("date", maxDate)
            .order("date", { ascending: true }),
          supabase
            .from("traffic_hour")
            .select("*")
            .eq("billboard_code", bbCode)
            .gte("date", minDate)
            .lte("date", maxDate)
            .order("date", { ascending: true })
            .order("hour", { ascending: true }),
          supabase
            .from("traffic_overview")
            .select("*")
            .eq("billboard_code", bbCode)
            .order("last_updated", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("traffic_overview_history")
            .select("*")
            .eq("billboard_code", bbCode)
            .order("recorded_at", { ascending: true })
            .limit(2500)
        ]);
        if (dayRes.data) dayRows = dayRes.data;
        if (hourRes.data) hourRows = hourRes.data;
        if (liveRes.data) liveOverviewRow = liveRes.data;
        if (histRes.data) historyRows = histRes.data;
      } catch (fetchErr) {
        console.warn("[downloadReportAsPDF] Notice reading 7-day telemetry from Supabase:", fetchErr);
      }

      // Group history by IST date and IST hour
      const histByDate = new Map();
      historyRows.forEach(h => {
        let istDate = h.stat_date;
        let istHour = null;
        if (h.recorded_at) {
          const d = new Date(h.recorded_at);
          const istStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
          istDate = istDate || istStr;
          istHour = (d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60)) % 24;
        }
        if (istDate) {
          if (!histByDate.has(istDate)) histByDate.set(istDate, []);
          histByDate.get(istDate).push({ ...h, istHour });
        }
      });

      // Map day rows by date
      const dayMap = new Map();
      dayRows.forEach(r => dayMap.set(r.date, r));

      // Group hour rows by date
      const hourByDate = new Map();
      hourRows.forEach(r => {
        const dKey = r.date || r.stat_date;
        if (dKey) {
          if (!hourByDate.has(dKey)) hourByDate.set(dKey, []);
          hourByDate.get(dKey).push(r);
        }
      });

      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

      // Compute exact 7-day aggregates from real records
      let total7DayVehicles = 0;
      let totalBikes = 0;
      let totalCommercial = 0;
      let totalEconomy = 0;
      let totalPremium = 0;
      let totalLuxury = 0;
      let totalUltraLuxury = 0;
      let totalReach = 0;
      let dwellWeightedSum = 0;
      let maxDwell7Day = 0;

      let overallMaxCount = 0;
      let overallPeakHour = null;
      let overallPeakDate = '—';
      let overallPeakDayName = '—';

      const weeklyDays = dates.map(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00+05:30');
        const dayIdx = dateObj.getDay();
        const shortDay = dayNames[dayIdx];
        const fullDay = fullDayNames[dayIdx];
        const dayRow = dayMap.get(dateStr);
        const dayHours = hourByDate.get(dateStr) || [];
        const dayHist = histByDate.get(dateStr) || [];

        let dayMaxCount = 0;
        let dayPeakHour = null;
        let hSumV = 0, hSumBikes = 0, hSumComm = 0, hSumEcon = 0, hSumPrem = 0, hSumLux = 0, hSumUltra = 0, hSumReach = 0, hDwellSum = 0, hMaxDwell = 0;

        for (const h of dayHours) {
          const count = Number(h.total_vehicles) || 0;
          hSumV += count;
          hSumBikes += Number(h.bikes) || 0;
          hSumComm += Number(h.commercial) || 0;
          hSumEcon += Number(h.economy) || 0;
          hSumPrem += Number(h.premium) || 0;
          hSumLux += Number(h.luxury) || 0;
          hSumUltra += Number(h.ultra_luxury) || 0;
          hSumReach += Number(h.estimated_reach) || 0;
          const avgDw = Number(h.avg_exposure_time) || 0;
          hDwellSum += avgDw * count;
          if (Number(h.max_exposure_time) > hMaxDwell) hMaxDwell = Number(h.max_exposure_time);
          if (count > dayMaxCount) {
            dayMaxCount = count;
            dayPeakHour = Number(h.hour);
          }
        }

        let dayTotal = 0, dBikes = 0, dComm = 0, dEcon = 0, dPrem = 0, dLux = 0, dUltra = 0, dReach = 0, dAvgDwell = 0, dMaxDwell = 0;

        if (dayRow && Number(dayRow.total_vehicles) > 0) {
          dayTotal = Number(dayRow.total_vehicles) || 0;
          dBikes = Number(dayRow.bikes) || 0;
          dComm = Number(dayRow.commercial) || 0;
          dEcon = Number(dayRow.economy) || 0;
          dPrem = Number(dayRow.premium) || 0;
          dLux = Number(dayRow.luxury) || 0;
          dUltra = Number(dayRow.ultra_luxury) || 0;
          dReach = Number(dayRow.estimated_reach) || 0;
          dAvgDwell = Number(dayRow.avg_exposure_time) || 0;
          dMaxDwell = Number(dayRow.max_exposure_time) || 0;
        } else if (hSumV > 0) {
          dayTotal = hSumV;
          dBikes = hSumBikes;
          dComm = hSumComm;
          dEcon = hSumEcon;
          dPrem = hSumPrem;
          dLux = hSumLux;
          dUltra = hSumUltra;
          dReach = hSumReach || (dayTotal > 0 ? Math.round(dayTotal * 2.4) : 0);
          dAvgDwell = dayTotal > 0 ? (hDwellSum / dayTotal) : 0;
          dMaxDwell = hMaxDwell;
        } else if (dateStr === todayIST && liveOverviewRow && Number(liveOverviewRow.total_vehicles) > 0) {
          // Today's live snapshot
          dayTotal = Number(liveOverviewRow.total_vehicles) || 0;
          dBikes = Number(liveOverviewRow.bikes) || 0;
          dComm = Number(liveOverviewRow.commercial) || 0;
          dEcon = Number(liveOverviewRow.economy) || 0;
          dPrem = Number(liveOverviewRow.premium) || 0;
          dLux = Number(liveOverviewRow.luxury) || 0;
          dUltra = Number(liveOverviewRow.ultra_luxury) || 0;
          dReach = Number(liveOverviewRow.estimated_reach) || Math.round(dayTotal * 2.4);
          dAvgDwell = Number(liveOverviewRow.avg_exposure_time) || 0;
          dMaxDwell = Number(liveOverviewRow.max_exposure_time) || 0;
        } else if (dayHist.length > 0) {
          // Latest snapshot for that historical day
          const latestSnap = dayHist[dayHist.length - 1];
          dayTotal = Number(latestSnap.total_vehicles) || 0;
          dBikes = Number(latestSnap.bikes) || 0;
          dComm = Number(latestSnap.commercial) || 0;
          dEcon = Number(latestSnap.economy) || 0;
          dPrem = Number(latestSnap.premium) || 0;
          dLux = Number(latestSnap.luxury) || 0;
          dUltra = Number(latestSnap.ultra_luxury) || 0;
          dReach = Number(latestSnap.estimated_reach) || Math.round(dayTotal * 2.4);
          dAvgDwell = Number(latestSnap.avg_exposure_time) || 0;
          dMaxDwell = Number(latestSnap.max_exposure_time) || 0;

          // Check peak hour from history
          const hMap = new Map();
          dayHist.forEach(snap => {
            if (snap.istHour !== null && snap.istHour !== undefined) {
              const c = Number(snap.total_vehicles) || 0;
              if (!hMap.has(snap.istHour) || c > hMap.get(snap.istHour)) {
                hMap.set(snap.istHour, c);
              }
            }
          });
          hMap.forEach((c, h) => {
            if (c > dayMaxCount) {
              dayMaxCount = c;
              dayPeakHour = h;
            }
          });
        }

        total7DayVehicles += dayTotal;
        totalBikes += dBikes;
        totalCommercial += dComm;
        totalEconomy += dEcon;
        totalPremium += dPrem;
        totalLuxury += dLux;
        totalUltraLuxury += dUltra;
        totalReach += dReach;
        dwellWeightedSum += dAvgDwell * dayTotal;
        if (dMaxDwell > maxDwell7Day) maxDwell7Day = dMaxDwell;

        if (dayMaxCount > overallMaxCount) {
          overallMaxCount = dayMaxCount;
          overallPeakHour = dayPeakHour;
          overallPeakDate = dateStr;
          overallPeakDayName = fullDay;
        }

        return {
          date: dateStr,
          shortDay,
          fullDay,
          shortDate: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          totalVehicles: dayTotal,
          peakHour: dayPeakHour,
          peakCount: dayMaxCount,
          peakHourStr: dayMaxCount > 0 ? billboardService.formatPeakHourWindow(dayPeakHour) : '—',
          avgDensity: dayMaxCount > 0 ? Number((dayMaxCount / 60).toFixed(1)) : 0
        };
      });

      const avgDwell7Day = total7DayVehicles > 0 ? Number((dwellWeightedSum / total7DayVehicles).toFixed(1)) : 0.0;
      const overallWeeklyPeakWindow = overallMaxCount > 0 ? billboardService.formatPeakHourWindow(overallPeakHour) : '—';

      const sumVehicles = totalBikes + totalCommercial + totalEconomy + totalPremium + totalLuxury + totalUltraLuxury;
      const divisorV = sumVehicles > 0 ? sumVehicles : (total7DayVehicles > 0 ? total7DayVehicles : 1);

      const highEndV = totalPremium + totalLuxury + totalUltraLuxury;
      const highEndPct = divisorV > 0 ? ((highEndV / divisorV) * 100).toFixed(1) : '0.0';

      const categories = [
        { name: 'Bike', desc: 'Two-Wheelers & Couriers', count: totalBikes, pct: total7DayVehicles > 0 ? +((totalBikes / divisorV) * 100).toFixed(1) : 0, color: '#2563EB' },
        { name: 'Commercial', desc: 'Freight, Vans & Logistics', count: totalCommercial, pct: total7DayVehicles > 0 ? +((totalCommercial / divisorV) * 100).toFixed(1) : 0, color: '#0284C7' },
        { name: 'Economy', desc: 'Hatchbacks & Mass Commuters', count: totalEconomy, pct: total7DayVehicles > 0 ? +((totalEconomy / divisorV) * 100).toFixed(1) : 0, color: '#7C3AED' },
        { name: 'Premium', desc: 'Executive Sedans & Compact SUVs', count: totalPremium, pct: total7DayVehicles > 0 ? +((totalPremium / divisorV) * 100).toFixed(1) : 0, color: '#D97706' },
        { name: 'Luxury', desc: 'High-End Sedans & Premium SUVs', count: totalLuxury, pct: total7DayVehicles > 0 ? +((totalLuxury / divisorV) * 100).toFixed(1) : 0, color: '#059669' },
        { name: 'Ultra Luxury', desc: 'Supercars & Exclusive Flagships', count: totalUltraLuxury, pct: total7DayVehicles > 0 ? +((totalUltraLuxury / divisorV) * 100).toFixed(1) : 0, color: '#EA580C' }
      ];

      // Pre-load the Aculion logo safely with timeout
      let logoDataUrl = null;
      try {
        const logoFetchPromise = fetch(transparentLogo)
          .then(r => r.blob())
          .then(blob => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          }))
          .catch(() => null);

        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
        logoDataUrl = await Promise.race([logoFetchPromise, timeoutPromise]);
      } catch (logoErr) {
        logoDataUrl = null;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;

      // ── Helper functions ──────────────────────────────────────
      const hex = (h) => {
        if (!h) return [255, 255, 255];
        if (Array.isArray(h) && h.length >= 3) return [Number(h[0]) || 0, Number(h[1]) || 0, Number(h[2]) || 0];
        if (typeof h !== 'string') return [255, 255, 255];
        const str = h.trim();
        const rgbMatch = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        if (rgbMatch) {
          return [
            Math.min(255, Math.max(0, Math.round(Number(rgbMatch[1])))),
            Math.min(255, Math.max(0, Math.round(Number(rgbMatch[2])))),
            Math.min(255, Math.max(0, Math.round(Number(rgbMatch[3]))))
          ];
        }
        let clean = str.replace(/^#/, '');
        if (clean.length === 3) {
          clean = clean.split('').map(c => c + c).join('');
        }
        if (clean.length >= 6) {
          const r = parseInt(clean.slice(0, 2), 16);
          const g = parseInt(clean.slice(2, 4), 16);
          const b = parseInt(clean.slice(4, 6), 16);
          return [
            isNaN(r) ? 255 : r,
            isNaN(g) ? 255 : g,
            isNaN(b) ? 255 : b
          ];
        }
        return [255, 255, 255];
      };

      const fillRect = (x, y, w, h, color) => {
        doc.setFillColor(...hex(color));
        doc.rect(x, y, w, h, 'F');
      };

      const strokeRect = (x, y, w, h, color, lineWidth = 0.3) => {
        doc.setDrawColor(...hex(color));
        doc.setLineWidth(lineWidth);
        doc.rect(x, y, w, h, 'D');
      };

      const text = (str, x, y, opts = {}) => {
        doc.text(String(str), x, y, opts);
      };

      const setFont = (style = 'normal', size = 10, color = '#0F172A') => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...hex(color));
      };

      // Clean White Header
      const drawHeader = (pageNum, pageTitle) => {
        // Top accent bar
        fillRect(0, 0, pageW, 2.5, '#2563eb');
        // Bottom divider
        fillRect(0, 24, pageW, 0.6, '#e2e8f0');

        // Top Left: Company & Media Owner
        setFont('bold', 10.5, '#0f172a');
        text(companyName.toUpperCase(), margin, 9);
        setFont('normal', 7.5, '#2563eb');
        text(`MEDIA OWNER: ${ownerName}   |   ASSET: ${bbCode} (${bbName})`, margin, 14.5);
        setFont('normal', 6.8, '#64748b');
        text(`LOCATION: ${landmark}, ${city}`, margin, 19.5);

        // Top Right: Page Title & Date
        setFont('bold', 8.5, '#2563eb');
        text(pageTitle, pageW - margin, 9, { align: 'right' });
        setFont('normal', 7, '#64748b');
        text(`Page ${pageNum} of 2`, pageW - margin, 14.5, { align: 'right' });
        text(`Period: ${dateStr}`, pageW - margin, 19.5, { align: 'right' });
      };

      // Clean White Footer with 'POWERED BY' above logo and 'connect@aculion.com' below logo
      const drawFooter = (pageNum) => {
        fillRect(0, pageH - 18, pageW, 0.6, '#e2e8f0');

        // Above logo: POWERED BY
        setFont('bold', 5.5, '#64748b');
        text('POWERED BY', margin, pageH - 13.8);

        // Logo
        if (logoDataUrl) {
          try {
            const logoH = 5.8;
            const logoW = logoH * 4.2;
            doc.addImage(logoDataUrl, 'PNG', margin, pageH - 12.8, logoW, logoH);
          } catch (imgErr) {
            setFont('bold', 8.5, '#2563eb');
            text('ACULION', margin, pageH - 8);
          }
        } else {
          setFont('bold', 8.5, '#2563eb');
          text('ACULION', margin, pageH - 8);
        }

        // Below logo: connect@aculion.com
        setFont('normal', 6, '#475569');
        text('connect@aculion.com', margin, pageH - 3.8);

        // Right side info
        setFont('normal', 6.8, '#64748b');
        text(`Page ${pageNum} of 2   •   Weekly Traffic Intelligence Report (${startDateFormatted} – ${endDateFormatted})`, pageW - margin, pageH - 8, { align: 'right' });
      };

      // ══════════════════════════════════════════════════════════
      // PAGE 1: 7-DAY EXECUTIVE OVERVIEW & VEHICLE CLASSIFICATION
      // ══════════════════════════════════════════════════════════
      fillRect(0, 0, pageW, pageH, '#FFFFFF');
      drawHeader(1, '7-DAY TRAFFIC & EXPOSURE OVERVIEW');

      let y = 29;

      // Title Block
      setFont('bold', 11.5, '#0f172a');
      text(`${bbName} — 7-Day Audience Intelligence & Traffic Analytics`, margin, y);
      y += 4.5;
      setFont('normal', 7.0, '#64748b');
      text(`Reporting Window: ${startDateFormatted} – ${endDateFormatted} (Last 7 Days)   •   Display Type: ${bbType}   •   Data Source: Supabase Live Database`, margin, y);
      y += 6.5;

      // Section 1: 7-Day Executive Mobility KPIs
      fillRect(margin, y, contentW, 5.2, '#eff6ff');
      fillRect(margin, y, 3, 5.2, '#2563eb');
      setFont('bold', 7.0, '#1d4ed8');
      text('  7-DAY EXECUTIVE TRAFFIC & AUDIENCE VOLUME OVERVIEW', margin + 3.5, y + 3.6);
      y += 6.8;

      const kpiBoxes = [
        { label: 'TOTAL 7-DAY VEHICLES', val: total7DayVehicles.toLocaleString(), sub: 'Verified 7-Day Count', col: '#0284c7' },
        { label: '7-DAY AUDIENCE REACH', val: totalReach.toLocaleString(), sub: 'Gross Impressions', col: '#059669' },
        { label: 'AVERAGE DWELL DURATION', val: avgDwell7Day > 0 ? `${avgDwell7Day}s` : '0.0s', sub: `Max Exposure: ${maxDwell7Day > 0 ? `${maxDwell7Day.toFixed(1)}s` : '0.0s'}`, col: '#2563eb' },
        { label: 'WEEKLY PEAK MOBILITY WINDOW', val: overallWeeklyPeakWindow, sub: `Peak Day: ${overallPeakDayName} (${overallMaxCount.toLocaleString()} veh)`, col: '#d97706' }
      ];

      const cardW = (contentW - 3 * 3.5) / 4;
      kpiBoxes.forEach((kpi, idx) => {
        const bx = margin + idx * (cardW + 3.5);
        fillRect(bx, y, cardW, 18, '#f8fafc');
        strokeRect(bx, y, cardW, 18, '#e2e8f0');
        fillRect(bx, y, cardW, 1.5, kpi.col);
        setFont('bold', 5.5, '#64748b');
        text(kpi.label, bx + 3, y + 4.8);
        setFont('bold', 9.2, kpi.col);
        text(kpi.val, bx + 3, y + 11.0);
        setFont('normal', 5.4, '#94a3b8');
        text(kpi.sub, bx + 3, y + 15.2);
      });
      y += 22.0;

      // Section 2: 7-Day Vehicle Classification Distribution
      fillRect(margin, y, contentW, 5.2, '#f5f3ff');
      fillRect(margin, y, 3, 5.2, '#7c3aed');
      setFont('bold', 7.0, '#6d28d9');
      text('  7-DAY VEHICLE CLASSIFICATION DISTRIBUTION & AFFLUENCE RATIOS', margin + 3.5, y + 3.6);
      y += 6.8;

      const pieBoxH = 62;
      fillRect(margin, y, contentW, pieBoxH, '#f8fafc');
      strokeRect(margin, y, contentW, pieBoxH, '#e2e8f0');

      const chartCx = margin + 34;
      const chartCy = y + 31;
      const outerR = 23;
      const innerR = 12;

      let currentAngle = -Math.PI / 2;
      categories.forEach((seg) => {
        if (seg.pct <= 0) return;
        const sliceAngle = (seg.pct / 100) * (2 * Math.PI);
        const steps = Math.max(8, Math.ceil(sliceAngle / (Math.PI / 36)));
        const dAngle = sliceAngle / steps;

        doc.setFillColor(...hex(seg.color));
        for (let i = 0; i < steps; i++) {
          const a1 = currentAngle + i * dAngle;
          const a2 = currentAngle + (i + 1) * dAngle;

          const x1 = chartCx + outerR * Math.cos(a1);
          const y1 = chartCy + outerR * Math.sin(a1);
          const x2 = chartCx + outerR * Math.cos(a2);
          const y2 = chartCy + outerR * Math.sin(a2);

          const ix1 = chartCx + innerR * Math.cos(a1);
          const iy1 = chartCy + innerR * Math.sin(a1);
          const ix2 = chartCx + innerR * Math.cos(a2);
          const iy2 = chartCy + innerR * Math.sin(a2);

          doc.triangle(x1, y1, x2, y2, ix1, iy1, 'F');
          doc.triangle(x2, y2, ix2, iy2, ix1, iy1, 'F');
        }
        currentAngle += sliceAngle;
      });

      // Donut hole center
      doc.setFillColor(255, 255, 255);
      doc.circle(chartCx, chartCy, innerR, 'F');
      setFont('bold', 5.2, '#64748b');
      text('7-DAY TOTAL', chartCx, chartCy - 1.8, { align: 'center' });
      setFont('bold', 8.0, '#0f172a');
      text(total7DayVehicles.toLocaleString(), chartCx, chartCy + 3.0, { align: 'center' });

      // Table on the right side of the donut chart
      const tableX = margin + 70;
      const tableW = contentW - 72;
      let tableY = y + 2.5;

      fillRect(tableX, tableY, tableW, 4.8, '#f1f5f9');
      strokeRect(tableX, tableY, tableW, 4.8, '#e2e8f0');
      setFont('bold', 5.8, '#475569');
      text('CATEGORY', tableX + 3, tableY + 3.3);
      text('7-DAY VEHICLES', tableX + 36, tableY + 3.3);
      text('PERCENT', tableX + 66, tableY + 3.3);
      text('DISTRIBUTION', tableX + 85, tableY + 3.3);
      tableY += 5.4;

      categories.forEach((seg, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        fillRect(tableX, tableY, tableW, 7.8, rowBg);
        strokeRect(tableX, tableY, tableW, 7.8, '#f1f5f9');

        doc.setFillColor(...hex(seg.color));
        doc.circle(tableX + 4, tableY + 3.8, 1.4, 'F');

        setFont('bold', 6.4, '#0f172a');
        text(seg.name, tableX + 8, tableY + 3.4);
        setFont('normal', 4.8, '#64748b');
        text(seg.desc, tableX + 8, tableY + 6.3);

        setFont('bold', 6.4, '#0f172a');
        text(seg.count.toLocaleString(), tableX + 36, tableY + 4.8);

        setFont('bold', 6.6, seg.color);
        text(`${seg.pct}%`, tableX + 66, tableY + 4.8);

        const barMaxW = 20;
        const barW = Math.max(1.5, (seg.pct / 100) * barMaxW);
        fillRect(tableX + 85, tableY + 2.8, barMaxW, 2.8, '#e2e8f0');
        fillRect(tableX + 85, tableY + 2.8, barW, 2.8, seg.color);

        tableY += 8.1;
      });

      y += pieBoxH + 4.5;

      // Section 3: 7-Day Audience Demographic & Affluence Insights
      fillRect(margin, y, contentW, 5.0, '#ecfdf5');
      fillRect(margin, y, 3, 5.0, '#059669');
      setFont('bold', 6.8, '#047857');
      text('  7-DAY AUDIENCE AFFLUENCE & MOBILITY INTELLIGENCE', margin + 3.5, y + 3.5);
      y += 6.5;

      const affluenceBoxH = 22;
      fillRect(margin, y, contentW, affluenceBoxH, '#f8fafc');
      strokeRect(margin, y, contentW, affluenceBoxH, '#e2e8f0');
      setFont('normal', 6.2, '#334155');
      text(`• High Affluence Demographics: Out of ${total7DayVehicles.toLocaleString()} recorded vehicles, ${highEndPct}% (${highEndV.toLocaleString()} vehicles) belong to Premium, Luxury, and Ultra-Luxury tiers.`, margin + 3.5, y + 4.8);
      text(`  This elevated proportion reflects high-disposable-income consumers, senior executives, and affluent residential commuters.`, margin + 3.5, y + 8.8);
      text(`• Exposure & Dwell Velocity: Commuters maintain an average dwell duration of ${avgDwell7Day} seconds (Peak single-vehicle exposure: ${maxDwell7Day.toFixed(1)}s).`, margin + 3.5, y + 13.0);
      text(`• Peak Mobility Intensity: Maximum weekly throughput peaked on ${overallPeakDayName} (${overallPeakDate}) during ${overallWeeklyPeakWindow} with ${overallMaxCount.toLocaleString()} vehicles.`, margin + 3.5, y + 17.2);
      y += affluenceBoxH + 4.5;

      // Section 4: LOCATION ANALYSIS (Dedicated Separate Section)
      fillRect(margin, y, contentW, 5.0, '#e0f2fe');
      fillRect(margin, y, 3, 5.0, '#0284c7');
      setFont('bold', 6.8, '#0369a1');
      text('  LOCATION ANALYSIS & STRATEGIC ECONOMIC CATCHMENT PROFILE', margin + 3.5, y + 3.5);
      y += 6.5;

      const locBoxH = 27;
      fillRect(margin, y, contentW, locBoxH, '#f8fafc');
      strokeRect(margin, y, contentW, locBoxH, '#e2e8f0');
      setFont('normal', 6.2, '#334155');
      text(`• Corridor Character & Arterial Connectivity: Situated along ${landmark} in ${city}, this strategic corridor functions as a vital mobility artery`, margin + 3.5, y + 4.8);
      text(`  linking prime residential enclaves, major corporate business tech parks, and thriving retail high-streets with continuous vehicular flow.`, margin + 3.5, y + 8.8);
      text(`• Catchment Socio-Economic Profile: The catchment area features a dominant presence of premium residential complexes and commercial hubs,`, margin + 3.5, y + 13.0);
      text(`  drawing a continuous stream of upwardly-mobile decision makers, business owners, and high-purchasing-power households.`, margin + 3.5, y + 17.0);
      text(`• Commercial Vitality & Advertising ROI: Steady flow of commercial distribution vehicles alongside executive sedans and SUVs underscores robust local`, margin + 3.5, y + 21.2);
      text(`  commerce and economic strength, ensuring maximum brand exposure, sustained recall, and superior advertising return on investment.`, margin + 3.5, y + 25.2);
      y += locBoxH + 4.5;

      // Section 5: Display Asset & Technical Catchment Profile
      fillRect(margin, y, contentW, 5.0, '#f1f5f9');
      fillRect(margin, y, 3, 5.0, '#475569');
      setFont('bold', 6.8, '#334155');
      text('  DISPLAY ASSET, CATCHMENT ZONE & LOCATION PROFILE', margin + 3.5, y + 3.5);
      y += 6.5;

      const profileBoxH = 30;
      fillRect(margin, y, contentW, profileBoxH, '#f8fafc');
      strokeRect(margin, y, contentW, profileBoxH, '#e2e8f0');

      const profileGrid = [
        ['Billboard Asset Code', bbCode, 'Media Asset Type', bbType],
        ['Location Landmark', landmark, 'City / Region', city],
        ['Locality Character', 'Prime Commercial & Residential Arterial', 'Catchment Affluence', 'High-Income Executive Corridor'],
        ['GPS Geo-Coordinates', `${(Number(selectedBillboard?.latitude) || 0).toFixed(4)}° N, ${(Number(selectedBillboard?.longitude) || 0).toFixed(4)}° E`, 'Operational Status', selectedBillboard?.status || 'Active Live Monitoring'],
        ['Front Camera Node', selectedBillboard?.camera_ff_code || 'CAM-FF-001', 'Secondary Camera Node', selectedBillboard?.camera_bf_code || 'CAM-BF-001']
      ];

      let profY = y + 4.0;
      profileGrid.forEach((row) => {
        setFont('bold', 5.8, '#64748b');
        text(row[0] + ':', margin + 4, profY);
        setFont('normal', 6.0, '#0f172a');
        text(row[1], margin + 36, profY);

        setFont('bold', 5.8, '#64748b');
        text(row[2] + ':', margin + 95, profY);
        setFont('normal', 6.0, '#2563eb');
        text(row[3], margin + 130, profY);

        profY += 5.4;
      });

      drawFooter(1);

      // ══════════════════════════════════════════════════════════
      // PAGE 2: 7-DAY VEHICLE BAR CHART & DAILY MOBILITY BREAKDOWN
      // ══════════════════════════════════════════════════════════
      doc.addPage();
      fillRect(0, 0, pageW, pageH, '#FFFFFF');
      drawHeader(2, '7-DAY MOBILITY PATTERNS & DAILY BREAKDOWN');

      y = 30;

      // Section 5: 7-Day Vehicle Category Comparison (Vertical Bar Chart)
      fillRect(margin, y, contentW, 5.5, '#fffbeb');
      fillRect(margin, y, 3, 5.5, '#d97706');
      setFont('bold', 7.2, '#b45309');
      text('  7-DAY VEHICLE CATEGORY VOLUME COMPARISON (VERTICAL BAR CHART)', margin + 3.5, y + 3.8);
      y += 7.5;

      const barChartH = 65;
      fillRect(margin, y, contentW, barChartH, '#f8fafc');
      strokeRect(margin, y, contentW, barChartH, '#e2e8f0');

      const vBarLeft = margin + 14;
      const vBarRight = margin + contentW - 14;
      const vBarTop = y + 12;
      const vBarBottom = y + barChartH - 16;
      const vPlotW = vBarRight - vBarLeft;
      const vPlotH = vBarBottom - vBarTop;

      const maxBarCount = Math.max(...categories.map(c => c.count)) * 1.15 || 100;

      // Baseline
      doc.setDrawColor(...hex('#e2e8f0'));
      doc.setLineWidth(0.4);
      doc.line(vBarLeft, vBarBottom, vBarRight, vBarBottom);

      const slotW = vPlotW / categories.length;
      const barWidth = Math.min(18, slotW * 0.55);

      categories.forEach((cat, idx) => {
        const bx = vBarLeft + idx * slotW + (slotW - barWidth) / 2;
        const bHeight = Math.max(3, (cat.count / maxBarCount) * vPlotH);
        const by = vBarBottom - bHeight;

        // Track
        fillRect(bx, vBarTop, barWidth, vPlotH, '#e2e8f0');
        // Bar
        fillRect(bx, by, barWidth, bHeight, cat.color);

        // Value & Percent above bar
        setFont('bold', 5.8, '#0f172a');
        text(cat.count.toLocaleString(), bx + barWidth / 2, by - 4, { align: 'center' });
        setFont('bold', 5.2, cat.color);
        text(`${cat.pct}%`, bx + barWidth / 2, by - 1, { align: 'center' });

        // Label below bar
        setFont('bold', 6, '#475569');
        text(cat.name, bx + barWidth / 2, vBarBottom + 5, { align: 'center' });
      });

      y += barChartH + 6.5;

      // Section 6: 7-Day Daily Mobility Throughput Breakdown & Daily History
      fillRect(margin, y, contentW, 5.5, '#eff6ff');
      fillRect(margin, y, 3, 5.5, '#0284c7');
      setFont('bold', 7.2, '#0369a1');
      text('  7-DAY DAILY MOBILITY THROUGHPUT BREAKDOWN', margin + 3.5, y + 3.8);
      y += 7.5;

      // 7-Day Daily Bar Chart
      const dailyChartH = 58;
      fillRect(margin, y, contentW, dailyChartH, '#f8fafc');
      strokeRect(margin, y, contentW, dailyChartH, '#e2e8f0');

      const dBarLeft = margin + 14;
      const dBarRight = margin + contentW - 14;
      const dBarTop = y + 10;
      const dBarBottom = y + dailyChartH - 14;
      const dPlotW = dBarRight - dBarLeft;
      const dPlotH = dBarBottom - dBarTop;

      const maxDailyVal = Math.max(...weeklyDays.map(d => d.totalVehicles)) * 1.15 || 100;

      // Baseline
      doc.setDrawColor(...hex('#e2e8f0'));
      doc.setLineWidth(0.4);
      doc.line(dBarLeft, dBarBottom, dBarRight, dBarBottom);

      const dSlotW = dPlotW / weeklyDays.length;
      const dBarWidth = Math.min(16, dSlotW * 0.55);

      weeklyDays.forEach((day, idx) => {
        const bx = dBarLeft + idx * dSlotW + (dSlotW - dBarWidth) / 2;
        const bHeight = Math.max(3, (day.totalVehicles / maxDailyVal) * dPlotH);
        const by = dBarBottom - bHeight;
        const isPeakDay = day.date === overallPeakDate && day.totalVehicles > 0;

        // Track
        fillRect(bx, dBarTop, dBarWidth, dPlotH, '#e2e8f0');
        // Bar
        fillRect(bx, by, dBarWidth, bHeight, isPeakDay ? '#2563eb' : '#0284c7');

        // Value above bar
        setFont('bold', 5.6, isPeakDay ? '#2563eb' : '#0f172a');
        text(day.totalVehicles.toLocaleString(), bx + dBarWidth / 2, by - 2, { align: 'center' });

        // Label below bar
        setFont('bold', 5.6, isPeakDay ? '#2563eb' : '#475569');
        text(day.shortDate, bx + dBarWidth / 2, dBarBottom + 4.5, { align: 'center' });
        setFont('normal', 4.8, '#64748b');
        text(day.shortDay, bx + dBarWidth / 2, dBarBottom + 8.5, { align: 'center' });
      });

      y += dailyChartH + 6.0;

      // 7-Day Daily Breakdown Table
      const dayTableH = 60;
      fillRect(margin, y, contentW, dayTableH, '#f8fafc');
      strokeRect(margin, y, contentW, dayTableH, '#e2e8f0');

      let rowY = y + 2.5;
      fillRect(margin + 2, rowY, contentW - 4, 5.2, '#f1f5f9');
      strokeRect(margin + 2, rowY, contentW - 4, 5.2, '#e2e8f0');

      setFont('bold', 5.8, '#475569');
      text('DATE', margin + 6, rowY + 3.6);
      text('DAY', margin + 30, rowY + 3.6);
      text('RECORDED VEHICLES', margin + 58, rowY + 3.6);
      text('PEAK MOBILITY WINDOW', margin + 100, rowY + 3.6);
      text('PEAK HOUR VOLUME', margin + 145, rowY + 3.6);
      text('7-DAY SHARE', margin + 175, rowY + 3.6);
      rowY += 5.8;

      weeklyDays.forEach((d, idx) => {
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const isPeak = d.date === overallPeakDate && d.totalVehicles > 0;
        const sharePct = total7DayVehicles > 0 ? ((d.totalVehicles / total7DayVehicles) * 100).toFixed(1) : '0.0';

        fillRect(margin + 2, rowY, contentW - 4, 6.8, isPeak ? '#eff6ff' : rowBg);
        strokeRect(margin + 2, rowY, contentW - 4, 6.8, isPeak ? '#bfdbfe' : '#f1f5f9');

        setFont(isPeak ? 'bold' : 'normal', 6.0, '#0f172a');
        text(d.date, margin + 6, rowY + 4.5);

        setFont(isPeak ? 'bold' : 'normal', 6.0, isPeak ? '#2563eb' : '#475569');
        text(d.fullDay, margin + 30, rowY + 4.5);

        setFont('bold', 6.0, '#0f172a');
        text(d.totalVehicles.toLocaleString(), margin + 58, rowY + 4.5);

        setFont('normal', 5.8, '#475569');
        text(d.peakHourStr, margin + 100, rowY + 4.5);

        setFont('normal', 5.8, isPeak ? '#2563eb' : '#0f172a');
        text(d.peakCount > 0 ? `${d.peakCount.toLocaleString()} veh` : '—', margin + 145, rowY + 4.5);

        setFont('bold', 6.0, isPeak ? '#2563eb' : '#0284c7');
        text(`${sharePct}%`, margin + 175, rowY + 4.5);

        rowY += 7.2;
      });

      drawFooter(2);

      const fileName = `Aculion_${bbCode}_7Day_Traffic_Intelligence_Report.pdf`;
      try {
        doc.save(fileName);
      } catch (saveErr) {
        console.warn("doc.save() failed, attempting anchor click fallback:", saveErr);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 3000);
      }
    } catch (globalPdfErr) {
      console.error("Critical error inside downloadReportAsPDF:", globalPdfErr);
      alert("Failed to generate report PDF. Please check the console for details.");
    }
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

  // ── LIVE DATA COMPUTATIONS ──
  const activeBillboards = (billboards && billboards.length > 0) ? billboards : [
    { id: 'ACU-BB-0001', billboard_code: 'ACU-BB-0001', name: 'Testing Billboard -1', billboard_name: 'Testing Billboard -1', location: 'Injabakkam', city: 'Chennai', impressions: '245K', status: 'Active', type: 'Digital Billboard', camera_ff_code: 'CAM-FF-001', image: '/anna_nagar_location.png', latitude: 13.0827, longitude: 80.2707 },
    { id: 'ACU-BB-0002', billboard_code: 'ACU-BB-0002', name: 'Testing Billboard -2', billboard_name: 'Testing Billboard -2', location: 'Injabakkam', city: 'Chennai', impressions: '189K', status: 'Active', type: 'Static Billboard', camera_ff_code: 'CAM-FF-002', image: '/blog_attention_metrics.png', latitude: 13.0827, longitude: 80.2707 },
    { id: 'ACU-BB-0003', billboard_code: 'ACU-BB-0003', name: 'Testing Billboard -3', billboard_name: 'Testing Billboard -3', location: 'Injabakkam', city: 'Chennai', impressions: '176K', status: 'Active', type: 'Static Billboard', camera_ff_code: 'CAM-FF-003', image: '/blog_billboard_roi.png', latitude: 13.0827, longitude: 80.2707 },
    { id: 'ACU-BB-0004', billboard_code: 'ACU-BB-0004', name: 'Sholinganalur', billboard_name: 'Sholinganalur', location: 'Dollar stop', city: 'Chennai', impressions: '162K', status: 'Active', type: 'Digital Billboard', camera_ff_code: 'CAM-FF-004', image: '/blog_smart_city.png', latitude: 13.0827, longitude: 80.2707 }
  ];

  // 1. Total Medias (count of registered assets)
  const totalMediasCount = activeBillboards.length;

  // 2. Total Impressions (sum across active billboards)
  const rawImpressionsSum = activeBillboards.reduce((acc, b) => {
    if (typeof b.impressions === 'number') return acc + b.impressions;
    if (typeof b.impressions === 'string') {
      if (b.impressions.includes('M')) return acc + parseFloat(b.impressions) * 1000000;
      if (b.impressions.includes('K')) return acc + parseFloat(b.impressions) * 1000;
      return acc + (parseInt(b.impressions, 10) || 150000);
    }
    return acc + (b.status === 'Active' ? 245000 : 80000);
  }, 0);
  const formattedImpressionsVal = rawImpressionsSum >= 1000000 
    ? `${(rawImpressionsSum / 1000000).toFixed(2)}M`
    : `${(rawImpressionsSum / 1000).toFixed(0)}K`;

  // 3. Vehicles Detected (live telemetry state)
  const formattedVehiclesVal = dbTrafficData 
    ? (dbTrafficData.total_vehicles >= 1000 ? `${(dbTrafficData.total_vehicles / 1000).toFixed(1)}K` : `${dbTrafficData.total_vehicles}`)
    : '0';

  // 4. Premium & Above (% of high tier audience / digital screens)
  const digitalScreensCount = activeBillboards.filter(b => (b.type?.toLowerCase() || '').includes('digital') || (b.type?.toLowerCase() || '').includes('dooh') || b.status === 'Active').length;
  const premiumPctVal = Math.min(100, Math.round((digitalScreensCount / (totalMediasCount || 1)) * 43) || 43);

  // 5. Avg. Dwell Time
  const formattedDwellVal = dbTrafficData 
    ? `${dbTrafficData.avg_exposure_time} sec`
    : '0 sec';

  // Dynamic Media Health Breakdown
  const onlineCount = activeBillboards.filter(b => b.status === 'Active' || b.status === 'Online').length;
  const offlineCount = activeBillboards.filter(b => b.status === 'Offline' || b.status === 'Inactive').length;
  const maintenanceCount = activeBillboards.filter(b => b.status === 'Maintenance').length;
  const totalHealthCount = totalMediasCount || 1;
  const onlinePct = Math.round((onlineCount / totalHealthCount) * 100);
  const offlinePct = Math.round((offlineCount / totalHealthCount) * 100);
  const maintenancePct = Math.round((maintenanceCount / totalHealthCount) * 100);

  // Dynamic Top Performing Medias (Sorted by impressions)
  const sortedTopMedias = [...activeBillboards].sort((a, b) => {
    const valA = parseInt(a.impressions, 10) || (a.status === 'Active' ? 245000 : 80000);
    const valB = parseInt(b.impressions, 10) || (b.status === 'Active' ? 245000 : 80000);
    return valB - valA;
  });

  // Dynamic Performance Overview chart datasets based on selected time filter (1H, 6H, 12H, 24H)
  const CHART_DATASETS = {
    '1H': [
      { time: '12:00', Impressions: 15000, Vehicles: 9000, Premium: 4500 },
      { time: '12:15', Impressions: 22000, Vehicles: 14000, Premium: 6800 },
      { time: '12:30', Impressions: 38000, Vehicles: 26000, Premium: 11000 },
      { time: '12:45', Impressions: 45000, Vehicles: 31000, Premium: 14000 },
      { time: '01:00', Impressions: 52000, Vehicles: 38000, Premium: 18000 }
    ],
    '6H': [
      { time: '07 AM', Impressions: 35000, Vehicles: 22000, Premium: 9500 },
      { time: '08 AM', Impressions: 120000, Vehicles: 85000, Premium: 32000 },
      { time: '09 AM', Impressions: 185000, Vehicles: 125000, Premium: 48000 },
      { time: '10 AM', Impressions: 160000, Vehicles: 110000, Premium: 42000 },
      { time: '11 AM', Impressions: 140000, Vehicles: 95000, Premium: 36000 },
      { time: '12 PM', Impressions: 110000, Vehicles: 75000, Premium: 29000 }
    ],
    '12H': [
      { time: '01 AM', Impressions: 18000, Vehicles: 11000, Premium: 4000 },
      { time: '03 AM', Impressions: 25000, Vehicles: 16000, Premium: 6000 },
      { time: '05 AM', Impressions: 42000, Vehicles: 28000, Premium: 11000 },
      { time: '07 AM', Impressions: 95000, Vehicles: 65000, Premium: 24000 },
      { time: '09 AM', Impressions: 185000, Vehicles: 125000, Premium: 48000 },
      { time: '11 AM', Impressions: 140000, Vehicles: 95000, Premium: 36000 },
      { time: '01 PM', Impressions: 125000, Vehicles: 82000, Premium: 31000 }
    ],
    '24H': [
      { time: '12 AM', Impressions: 12000, Vehicles: 8000, Premium: 4000 },
      { time: '4 AM', Impressions: 35000, Vehicles: 22000, Premium: 10000 },
      { time: '8 AM', Impressions: 185000, Vehicles: 120000, Premium: 45000 },
      { time: '12 PM', Impressions: 110000, Vehicles: 75000, Premium: 30000 },
      { time: '4 PM', Impressions: 165000, Vehicles: 115000, Premium: 55000 },
      { time: '8 PM', Impressions: 140000, Vehicles: 95000, Premium: 40000 },
      { time: '12 AM', Impressions: 25000, Vehicles: 15000, Premium: 8000 }
    ]
  };
  const activeChartData = CHART_DATASETS[timeFilter] || CHART_DATASETS['24H'];

  const userName = user?.name || user?.fullName || 'Media Owner';
  const userEmail = user?.email || 'M0123456';
  const userInitials = (userName ? userName.split(' ').map(n => n[0]).join('') : 'MO').toUpperCase();

  const navItems = [
    { id: 'my_medias', icon: 'fa-solid fa-tv', label: 'My Medias' },
    { id: 'front_camera', icon: 'fa-solid fa-video', label: 'Front Camera' },
    { id: 'traffic', icon: 'fa-solid fa-users-viewfinder', label: 'Audience Intelligence' },
    { id: 'overview', icon: 'fa-solid fa-chart-pie', label: 'Location Overview' },
    { id: 'corridor', icon: 'fa-solid fa-route', label: 'Corridor Intelligence', badge: 'BETA' },
    { id: 'zone', icon: 'fa-solid fa-chart-simple', label: 'Zone Comparison', badge: 'BETA' },
    { id: 'historical', icon: 'fa-solid fa-timeline', label: 'Historical Trends', badge: 'BETA' },
    { id: 'live', icon: 'fa-solid fa-circle-dot', label: 'Live View' },
    { id: 'alerts', icon: 'fa-solid fa-triangle-exclamation', label: 'Alerts' },
    { id: 'reports', icon: 'fa-solid fa-file-lines', label: 'Reports' },
    { id: 'settings', icon: 'fa-solid fa-sliders', label: 'Settings' }
  ];

  return (
    <div className="w-full h-screen bg-[#0a0e1a] text-white flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* ═══════════════════════════════════════════════════
         MAIN BODY DECOUPLED COLUMNS
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative">

        {/* Backdrop for Mobile/Tablet Sidebar Drawer */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── SIDEBAR (Left Column - 260px width) ── */}
        <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[260px] max-w-[85vw] border-r border-white/10 bg-[#080b15] flex flex-col justify-between overflow-hidden h-full flex-shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          
          {/* Logo brand section */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div 
              className="flex items-center gap-[12px] cursor-pointer" 
              onClick={(e) => {
                setSidebarOpen(false);
                if (navigateTo) navigateTo(e, '/');
              }}
            >
              <div style={{ width: '44px', height: '50px', overflow: 'hidden', flexShrink: 0 }}>
                <img 
                  src={transparentLogo} 
                  alt="Aculion Symbol" 
                  style={{ height: '50px', width: 'auto', maxWidth: 'none', display: 'block' }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] sm:text-[20px] font-black tracking-[0.05em] text-white uppercase leading-none font-heading">
                  ACULION
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-[4px] leading-none">
                  SEE BEYOND
                </span>
              </div>
            </div>

            {/* Mobile / Tablet Close Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/10 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          {/* Navigation Links Group */}
          <div className="p-3 sm:p-4 flex-grow flex flex-col gap-1.5 overflow-y-auto">
            <span className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-3.5 mb-2 block">
              Core Modules
            </span>

            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (item.id === 'my_medias') {
                      if (onBackToProfile) onBackToProfile();
                    } else {
                      // Map nav id → URL slug
                      const slugMap = {
                        front_camera: 'front-camera',
                        traffic:      'audience-intelligence',
                        overview:     'location-overview',
                        corridor:     'corridor-intelligence',
                        zone:         'zone-comparison',
                        historical:   'historical-trends',
                        live:         'live-view',
                        alerts:       'alerts',
                        reports:      'reports',
                        settings:     'settings',
                      };
                      const viewSlug = slugMap[item.id] || item.id;
                      window.history.pushState(null, '', `${baseDashboardPath}/${viewSlug}`);
                      setActiveNav(item.id);
                    }
                  }}
                  className={`w-full h-10 flex items-center justify-between px-3.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 cursor-pointer border ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-500/40' 
                      : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <i className={`${item.icon} text-sm ${isActive ? 'text-white' : 'text-white/40'}`} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`shrink-0 ml-auto inline-flex items-center justify-center h-5 px-2 rounded text-[9px] font-bold uppercase tracking-wider leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom user profile card */}
          <div className="p-3 sm:p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-white/40 truncate font-mono mt-0.5">
                  {userEmail}
                </span>
              </div>
            </div>
            <i className="fa-solid fa-chevron-down text-[10px] text-white/40 cursor-pointer" />
          </div>
        </aside>

        {/* ── MAIN CONTENT WORKSPACE (Right Column) ── */}
        <div className="flex-grow flex flex-col overflow-hidden h-full min-w-0">

          {/* ═══════════════════════════════════════════════════
             TOP BAR (TARGET REFERENCE DESIGN 1)
          ═══════════════════════════════════════════════════ */}
          <header className="min-h-[60px] sm:h-[76px] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 bg-[#080c16] flex-shrink-0 w-full">
            {/* Left: Hamburger Button & Greeting */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Hamburger Button (Visible on Tablet & Mobile) */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 transition-all cursor-pointer flex-shrink-0"
                aria-label="Open navigation"
              >
                <i className="fa-solid fa-bars text-sm sm:text-base" />
              </button>

              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-sm sm:text-lg lg:text-xl font-heading text-white tracking-tight flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <span className="font-normal text-white/60 text-xs sm:text-base lg:text-lg">Welcome back,</span>
                  <span className="font-bold text-white text-sm sm:text-lg lg:text-xl truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">{userName}</span>
                  <span className="text-sm sm:text-lg select-none shrink-0">👋</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-white/40 font-medium leading-none mt-1 hidden sm:block whitespace-nowrap">
                  Here's what's happening across your media today.
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end flex-nowrap shrink-0">
              <div className="h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 bg-[#121829] border border-white/10 rounded-xl px-2.5 sm:px-3.5 text-xs text-white/80 font-medium shrink-0">
                <i className="fa-regular fa-calendar text-blue-400 text-xs shrink-0" />
                <span className="font-mono whitespace-nowrap text-[11px] sm:text-xs">Today, {formattedDate}</span>
              </div>

              {/* Primary Action Button: Compact + Add on mobile, + Add Media on desktop */}
              <button
                type="button"
                onClick={onAddNewMedia || onBackToProfile}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0"
                title={isMobileScreen ? 'Add' : 'Add Media'}
              >
                <i className="fa-solid fa-plus text-xs shrink-0" />
                <span className="font-semibold text-xs">{isMobileScreen ? 'Add' : 'Add Media'}</span>
              </button>
            </div>
          </header>

          {/* Main Views Container */}
          <main className={`flex-grow flex flex-col h-full min-w-0 bg-[#070913] ${activeNav === 'traffic' ? 'overflow-hidden' : 'overflow-y-auto'} relative`}>
            {isTrafficLoading && activeNav !== 'traffic' && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#070913]/95 backdrop-blur-md transition-all duration-300">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                  <div className="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></div>
                </div>
                <h3 className="mt-6 text-sm font-bold text-white tracking-widest uppercase font-heading">
                  Synchronizing Telemetry
                </h3>
                <p className="mt-2 text-xs text-white/40 font-medium font-mono">
                  Loading real-time database streams...
                </p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               1. LIVE VIEW (EXACT TARGET REFERENCE DESIGN 1)
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'live' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 sm:gap-6 min-w-0">

                {/* ── 1. TOP KPI CARDS ROW (5 CARDS) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Card 1: Total Medias */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/50">Total Medias</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                        <i className="fa-solid fa-desktop" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-white font-mono">{totalMediasCount}</span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold mt-1">
                        <span>--</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Total Impressions */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/50">Total Impressions</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                        <i className="fa-solid fa-eye" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-white font-mono">{formattedImpressionsVal}</span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold mt-1">
                        <span>--</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Vehicles Detected */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/50">Vehicles Detected</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                        <i className="fa-solid fa-car" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-white font-mono">{formattedVehiclesVal}</span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold mt-1">
                        <span>{dbTrafficData ? '+15%' : '--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Premium & Above */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/50">Premium & Above</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs">
                        <i className="fa-solid fa-crown" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-white font-mono">{premiumPctVal}%</span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold mt-1">
                        <span>--</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Avg. Dwell Time */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/50">Avg. Dwell Time</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                <i className="fa-solid fa-stopwatch" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-white font-mono">{formattedDwellVal}</span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold mt-1">
                        <span>{dbTrafficData ? '+6%' : '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 2. MAIN MIDDLE SECTION (2 COLUMNS) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Media Performance Map (2 cols width) */}
                  <div className="lg:col-span-2 bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl min-h-[420px]">
                    
                    {/* Map Header & View Switcher */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-white font-heading">Media Performance Map</h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      </div>

                      {/* View Toggle: Map vs CCTV Feed */}
                      <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/10 gap-1">
                        <button
                          onClick={() => setMainMediaView('map')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            mainMediaView === 'map' ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:!text-white'
                          }`}
                        >
                          <i className="fa-solid fa-map-location-dot mr-1.5" />
                          Map View
                        </button>
                        <button
                          onClick={() => setMainMediaView('cctv')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            mainMediaView === 'cctv' ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:!text-white'
                          }`}
                        >
                          <i className="fa-solid fa-video mr-1.5" />
                          Live CCTV Feed
                        </button>
                      </div>
                    </div>

                    {/* Map Workspace Container */}
                    <div className="flex-1 min-h-[320px] bg-[#050711] rounded-xl border border-white/10 relative overflow-hidden flex flex-col">
                      {mainMediaView === 'map' ? (
                        <div className="w-full h-full relative">
                          <svg className="w-full h-full" viewBox="0 0 600 310" preserveAspectRatio="xMidYMid slice">
                            <defs>
                              <pattern id="gridMapTarget" width="25" height="25" patternUnits="userSpaceOnUse">
                                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1"/>
                              </pattern>
                              <filter id="shadowPin" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6"/>
                              </filter>
                            </defs>

                            <rect width="600" height="310" fill="url(#gridMapTarget)" />

                            {/* Bay of Bengal Ocean Coastline (Right Side) */}
                            <path d="M 530,-10 Q 515,100 540,200 Q 560,260 575,320 L 610,320 L 610,-10 Z" fill="#040b19" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />

                            {/* Road lines grid simulating Chennai arterial roads */}
                            <path d="M -20,110 L 530,115" stroke="#121b2d" strokeWidth="9" fill="none" />
                            <path d="M -20,110 L 530,115" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

                            <path d="M 470,40 L 220,320" stroke="#121b2d" strokeWidth="9" fill="none" />
                            <path d="M 470,40 L 220,320" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

                            <path d="M 260,-20 L 260,330" stroke="#0e1628" strokeWidth="7" fill="none" />
                            <path d="M 440,160 L 500,330" stroke="#0e1628" strokeWidth="7" fill="none" />
                            <path d="M 330,185 L 180,330" stroke="#0e1628" strokeWidth="7" fill="none" />

                            <path d="M 120,-20 L 120,330" stroke="#0a101f" strokeWidth="4" fill="none" />
                            <path d="M 370,-20 L 370,330" stroke="#0a101f" strokeWidth="4" fill="none" />
                            <path d="M -20,180 L 550,180" stroke="#0a101f" strokeWidth="4" fill="none" />
                            <path d="M -20,240 L 550,240" stroke="#0a101f" strokeWidth="4" fill="none" />

                            <text x="340" y="105" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold">ANNA NAGAR</text>
                            <text x="180" y="145" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="600">PORUR</text>
                            <text x="325" y="175" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="600">GUINDY</text>
                            <text x="240" y="225" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="600">VELACHERY</text>
                            <text x="375" y="155" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="600">T. NAGAR</text>
                            <text x="465" y="170" fill="rgba(255,255,255,0.3)" fontSize="7">VELACHERY</text>
                            <text x="465" y="195" fill="rgba(255,255,255,0.3)" fontSize="7">THIRUVANMIYUR</text>
                            <text x="465" y="225" fill="rgba(255,255,255,0.3)" fontSize="7">ADYAR</text>
                            <text x="530" y="130" fill="rgba(255,255,255,0.35)" fontSize="13" fontWeight="bold">Chennai</text>

                            {[
                              { id: 'ACU-AN-001', x: 340, y: 110, status: 'High' },
                              { id: 'ACU-TN-002', x: 375, y: 160, status: 'High' },
                              { id: 'ACU-VL-003', x: 310, y: 220, status: 'Medium' },
                              { id: 'ACU-OMR-004', x: 460, y: 190, status: 'High' },
                              { id: 'ACU-PR-005', x: 190, y: 155, status: 'Low' },
                              { id: 'ACU-GD-006', x: 330, y: 185, status: 'High' },
                              { id: 'ACU-AS-007', x: 420, y: 100, status: 'High' },
                              { id: 'ACU-TM-008', x: 480, y: 225, status: 'Medium' },
                              { id: 'ACU-AD-009', x: 460, y: 245, status: 'High' },
                              { id: 'ACU-SH-010', x: 490, y: 275, status: 'Medium' },
                              { id: 'ACU-KB-011', x: 250, y: 120, status: 'High' },
                              { id: 'ACU-ANP-012', x: 290, y: 160, status: 'Low' },
                              { id: 'ACU-EG-013', x: 400, y: 75, status: 'High' },
                              { id: 'ACU-CR-014', x: 440, y: 65, status: 'High' },
                              { id: 'ACU-PG-015', x: 470, y: 210, status: 'Medium' }
                            ].map((pin) => (
                              <g key={pin.id} transform={`translate(${pin.x}, ${pin.y})`} className="cursor-pointer group">
                                {pin.status === 'High' && (
                                  <circle cx="0" cy="-14" r="8" fill="rgba(34, 197, 94, 0.25)" className="animate-ping" />
                                )}
                                <ellipse cx="0" cy="1" rx="4.5" ry="1.8" fill="rgba(0,0,0,0.6)" />
                                <path
                                  d="M 0 0 C -5 -7 -8 -13 0 -19 C 8 -13 5 -7 0 0 Z"
                                  fill={pin.status === 'High' ? '#22c55e' : pin.status === 'Medium' ? '#f59e0b' : '#ef4444'}
                                  stroke="#ffffff"
                                  strokeWidth="1.3"
                                  filter="url(#shadowPin)"
                                  className="transition-transform duration-200 group-hover:-translate-y-1"
                                />
                                <circle cx="0" cy="-12" r="3" fill="#ffffff" />
                                <circle cx="0" cy="-12" r="1.5" fill={pin.status === 'High' ? '#15803d' : pin.status === 'Medium' ? '#b45309' : '#b91c1c'} />
                              </g>
                            ))}
                          </svg>

                          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                            <button className="w-7 h-7 bg-[#0a0f1d]/90 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-xs text-white shadow-lg cursor-pointer backdrop-blur-sm">+</button>
                            <button className="w-7 h-7 bg-[#0a0f1d]/90 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-xs text-white shadow-lg cursor-pointer backdrop-blur-sm">−</button>
                            <button className="w-7 h-7 bg-[#0a0f1d]/90 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-xs text-white shadow-lg cursor-pointer backdrop-blur-sm mt-1">
                              <i className="fa-solid fa-expand text-[10px]" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Live CCTV Surveillance Feed with AI Object Boxes */
                        <div className="w-full h-full relative bg-black flex flex-col justify-center items-center">
                          <img src={selectedBillboard?.feedImage || "/anna_nagar_feed.png"} alt="CCTV Feed" className="w-full h-full object-cover opacity-80" />
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
                              <span className="bg-blue-600 text-[8px] px-1 text-white leading-none font-bold uppercase self-start rounded-br">
                                {box.type} {box.conf}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legend & Action Bar */}
                      <div className="p-3 border-t border-white/10 bg-[#080c16]/90 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4 text-[11px] text-white/60">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> High Performance
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium Performance
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Low Performance
                          </span>
                        </div>

                        <button
                          onClick={onBackToProfile}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>View All Medias</span>
                          <i className="fa-solid fa-chevron-right text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Top Performing Medias (1 col width) */}
                  <div className="bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl min-h-[420px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white font-heading">Top Performing Medias</h3>
                      <button onClick={onBackToProfile} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        View All
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                      {sortedTopMedias.slice(0, 5).map((media, idx) => (
                        <div 
                          key={media.id || idx} 
                          onClick={() => onSelectBillboard && onSelectBillboard(media)}
                          className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl p-2.5 flex items-center justify-between transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <img src={media.image || '/anna_nagar_location.png'} alt={media.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white font-heading truncate max-w-[140px]">{media.name}</span>
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {media.city || media.location || 'Chennai'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/40 font-medium">Impressions</span>
                            <span className="text-xs font-bold text-white font-mono">{media.impressions || '245K'}</span>
                            <span className="text-[9px] text-emerald-400 font-bold">↑ {22 - idx * 3}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── 3. BOTTOM SECTION (3 COLUMNS) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                  
                  {/* Panel 1: Performance Overview Chart (5 cols) */}
                  <div className="lg:col-span-5 bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white font-heading">Performance Overview</h3>
                      <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/10 text-[10px]">
                        {['1H', '6H', '12H', '24H'].map((tf) => (
                          <button 
                            key={tf} 
                            onClick={() => setTimeFilter(tf)}
                            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${timeFilter === tf ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] mb-2 font-medium">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Impressions
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Vehicles
                      </span>
                      <span className="flex items-center gap-1.5 text-purple-400">
                        <span className="w-2 h-2 rounded-full bg-purple-500" /> Premium & Above
                      </span>
                    </div>

                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={activeChartData} 
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorVeh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPrem" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}K`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="Impressions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorImp)" />
                          <Area type="monotone" dataKey="Vehicles" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVeh)" />
                          <Area type="monotone" dataKey="Premium" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorPrem)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Panel 2: Media Health Donut Chart (3 cols) */}
                  <div className="lg:col-span-3 bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                    <h3 className="text-sm font-bold text-white font-heading mb-2">Media Health</h3>
                    
                    <div className="flex items-center justify-center gap-4 flex-1">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Online', value: onlineCount || 1, color: '#22c55e' },
                                { name: 'Offline', value: offlineCount, color: '#ef4444' },
                                { name: 'Maintenance', value: maintenanceCount, color: '#f59e0b' }
                              ]}
                              innerRadius={32}
                              outerRadius={44}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              <Cell key="0" fill="#22c55e" />
                              <Cell key="1" fill="#ef4444" />
                              <Cell key="2" fill="#f59e0b" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-black text-white font-mono">{totalMediasCount}</span>
                          <span className="text-[8px] text-white/40 uppercase">Total Medias</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white/50">Online</span>
                            <span className="font-bold text-white text-xs font-mono">{onlineCount} ({onlinePct}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white/50">Offline</span>
                            <span className="font-bold text-white text-xs font-mono">{offlineCount} ({offlinePct}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white/50">Maintenance</span>
                            <span className="font-bold text-white text-xs font-mono">{maintenanceCount} ({maintenancePct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Alerts List (4 cols) */}
                  <div className="lg:col-span-4 bg-[#0f1424]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white font-heading">Alerts</h3>
                      <button onClick={() => setActiveNav('alerts')} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        View All
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5 flex-1">
                      {[
                        { type: 'CRITICAL', title: 'Camera Offline', target: 'Guindy Flyover Billboard #2', time: '10 min ago', icon: 'fa-triangle-exclamation', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                        { type: 'WARNING', title: 'Low Storage', target: 'OMR – Sholinganallur', time: '25 min ago', icon: 'fa-triangle-exclamation', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { type: 'INFO', title: 'Maintenance Due', target: 'Anna Salai Junction', time: '1 hr ago', icon: 'fa-wrench', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                      ].map((a, idx) => (
                        <div key={idx} className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl p-2.5 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 border ${a.color}`}>
                              <i className={`fa-solid ${a.icon}`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white truncate">{a.title}</span>
                              <span className="text-[10px] text-white/40 truncate">{a.target}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-white/30 whitespace-nowrap ml-2 font-mono">{a.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               FRONT CAMERA VIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'front_camera' && (
              <FrontCameraView
                selectedBillboard={selectedBillboard}
                billboards={activeBillboards}
                onSelectBillboard={onSelectBillboard}
                user={user}
              />
            )}

            {/* ═══════════════════════════════════════════════════
               TRAFFIC OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'traffic' && (
              <iframe
                key={selectedBillboard?.billboard_code || selectedBillboard?.id || 'traffic-frame'}
                src={`/traffic_ui/index.html?billboard_code=${encodeURIComponent(selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0001')}&camera_ff_code=${encodeURIComponent(selectedBillboard?.camera_ff_code || '')}&camera_bf_code=${encodeURIComponent(selectedBillboard?.camera_bf_code || '')}&bb_name=${encodeURIComponent(selectedBillboard?.billboard_name || selectedBillboard?.name || '')}`}
                title="Audience Intelligence"
                className="w-full h-full border-none"
              />
            )}

            {/* ═══════════════════════════════════════════════════
               2. LOCATION OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'overview' && (
              <LocationIntelligence selectedBillboard={selectedBillboard} />
            )}

            {/* ═══════════════════════════════════════════════════
               3. CORRIDOR INTELLIGENCE
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'corridor' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Junction Corridor Flow Matrix</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">BETA</span>
                  </div>
                </div>

                {/* Empty State when no corridor sensors configured */}
                <div className="flex-grow bg-[#0c1220]/80 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl min-h-[360px]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl mb-4 shadow-lg shadow-blue-500/10">
                    <i className="fa-solid fa-route" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 font-heading">No Active Corridor Streams</h4>
                  <p className="text-xs text-white/50 max-w-md leading-relaxed mb-6">
                    Corridor Intelligence analyzes directional approach flows, junction delay indices, and corridor dwell times when multiple roadside sensors are mapped along an arterial route.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-white/[0.03] text-white/60 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Asset: <strong className="text-white">{selectedBillboard?.billboard_code || selectedBillboard?.id || 'ACU-BB-0001'}</strong>
                    </span>
                    <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-white/[0.03] text-white/60 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Corridor Streams: <strong className="text-amber-400">0 Active</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               4. ZONE COMPARISON
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'zone' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Multi-Zone Dashboard Comparison</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">BETA</span>
                  </div>
                </div>

                {/* Empty State when no zone comparison sensors configured */}
                <div className="flex-grow bg-[#0c1220]/80 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl min-h-[360px]">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl mb-4 shadow-lg shadow-cyan-500/10">
                    <i className="fa-solid fa-chart-simple" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 font-heading">No Multi-Zone Comparison Data</h4>
                  <p className="text-xs text-white/50 max-w-md leading-relaxed mb-6">
                    Multi-Zone Comparison evaluates audience demographics, exposure duration, and ROI yields across adjacent retail, commercial, and transit zones once zone sensors are paired.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-white/[0.03] text-white/60 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Location: <strong className="text-white">{selectedBillboard?.location || selectedBillboard?.billboard_name || 'Main Location'}</strong>
                    </span>
                    <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-white/[0.03] text-white/60 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Comparison Zones: <strong className="text-amber-400">None Configured</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
               5. HISTORICAL TRENDS
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'historical' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Historical Trend Analytics</h3>
                  
                  {/* Select Trend Toggles */}
                  <div className="flex flex-wrap bg-[#121829] border border-white/10 rounded p-0.5 text-[9.5px]">
                    {['day', 'week', 'month', 'year'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setHistoricalFilter(opt)}
                        className={`px-3 py-1 rounded font-semibold transition-all uppercase !border-none !shadow-none cursor-pointer ${
                          historicalFilter === opt ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col shadow-lg min-h-[300px]">
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
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Node Status Alerts & Alarms</h3>

                {/* Telemetries */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { title: 'GPU Core Load', val: '74%', desc: 'AI inference pipeline online', color: 'text-blue-400' },
                    { title: 'Edge Temp', val: '58°C', desc: 'Thermal control normal', color: 'text-emerald-400' },
                    { title: 'Camera Stream', val: '1080p 30fps', desc: `${selectedBillboard?.camera_ff_code || 'CAM-FF-004'} Connected`, color: 'text-cyan-400' },
                    { title: 'Flow Rate', val: `${dbTrafficData?.flow_rate || 84.5} /min`, desc: 'Live vehicular flow', color: 'text-violet-400' },
                    { title: 'Total Logged', val: (dbTrafficData?.total_vehicles || 17820).toLocaleString(), desc: 'Real-time detected count', color: 'text-amber-400' }
                  ].map((meter, idx) => (
                    <div key={idx} className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-[100px]">
                      <span className="text-[9px] text-white/45 uppercase font-medium">{meter.title}</span>
                      <strong className={`text-xl font-bold font-mono ${meter.color}`}>{meter.val}</strong>
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
              <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Campaign Report compiler</h3>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-4 min-h-[300px]">
                  {/* Query config panel */}
                  <form onSubmit={handleGenerateReport} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-lg h-full">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-white/45 uppercase font-medium">Report Configuration</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-white/50">Start Date</label>
                          <input 
                            type="date" 
                            value={reportStartDate} 
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-white/50">End Date</label>
                          <input 
                            type="date" 
                            value={reportEndDate} 
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="bg-[#121829] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none" 
                          />
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
                          {['Footfall & Impression counts', 'Average Dwell Duration', 'Vehicular Speed & Movement Flow', 'Occupancy & Pricing modifier'].map(lbl => (
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
                            Generate Report PDF
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
                              <button
                                onClick={() => downloadReportAsPDF(rep)}
                                className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 rounded text-[9.5px] font-semibold flex items-center gap-1 !shadow-none !outline-none transition-all"
                                title="Download Audience Intelligence & ROI Report"
                              >
                                <i className="fa-solid fa-download" /> PDF
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
               SETTINGS
            ═══════════════════════════════════════════════════ */}
            {activeNav === 'settings' && (
              <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 gap-4 min-w-0 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex-shrink-0">Settings Dashboard</h3>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
                  <span className="text-[10px] text-white/45 uppercase font-medium">Dashboard Preferences</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
             FOOTER STATUS BAR
          ═══════════════════════════════════════════════════ */}
          <footer className="min-h-[40px] border-t border-white/10 px-4 sm:px-6 py-2.5 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#05070f] text-[10px] text-white/35 flex-shrink-0 w-full text-center sm:text-left">
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
