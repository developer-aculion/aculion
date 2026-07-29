import React, { useState, useEffect, useRef } from 'react';

// ─── Animated Number Counter ───
function AnimNum({ value, suffix = '', precision = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) return;
    const duration = 900;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = p * (2 - p);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
      else setDisplay(end);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = precision > 0 ? display.toFixed(precision) : Math.floor(display).toLocaleString();
  return <span>{fmt}{suffix}</span>;
}

// ─── SVG Sparkline ───
function Sparkline({ data, color = '#0052ff', height = 48, width = 140 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const gradId = `sg-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="brand-sparkline">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts.join(' ')} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── SVG Bar Chart ───
function BarChart({ data, labels, color = '#0052ff', height = 200, barColor2 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data) || 1;
  const barW = Math.min(36, Math.floor(280 / data.length) - 4);
  const chartW = data.length * (barW + 8);
  return (
    <div className="brand-bar-chart-wrap">
      <svg width="100%" height={height + 30} viewBox={`0 0 ${chartW} ${height + 30}`} preserveAspectRatio="xMidYMax meet">
        {data.map((v, i) => {
          const bh = (v / max) * (height - 10);
          const x = i * (barW + 8) + 4;
          const y = height - bh;
          const c = barColor2 && i % 2 === 1 ? barColor2 : color;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx={4} fill={c} opacity={0.85} />
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fill="#8e909a" fontSize="9" fontFamily="Inter, sans-serif">
                {labels?.[i] || ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SVG Area Chart ───
function AreaChart({ data, labels, color = '#0052ff', height = 180 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 500;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - 20 - ((v - min) / range) * (height - 40);
    return { x, y };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPts = `0,${height - 20} ${polyPts} ${w},${height - 20}`;
  const gid = `area-${color.replace('#', '')}`;
  return (
    <div className="brand-area-chart-wrap">
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={0} y1={height - 20 - f * (height - 40)} x2={w} y2={height - 20 - f * (height - 40)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        <polygon points={areaPts} fill={`url(#${gid})`} />
        <polyline points={polyPts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#0c0d14" strokeWidth="2" />
        ))}
        {labels && labels.map((l, i) => (
          <text key={i} x={pts[i]?.x} y={height - 4} textAnchor="middle" fill="#8e909a" fontSize="9" fontFamily="Inter, sans-serif">{l}</text>
        ))}
      </svg>
    </div>
  );
}


// ═══════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════
const CAMPAIGNS = [
  { id: 1, name: 'Summer Mega Sale 2026', status: 'Active', start: '2026-06-01', end: '2026-07-15', budget: 125000, objective: 'Brand Awareness', billboards: [1, 2, 3, 5, 8], impressions: 2450000, qrScans: 18420, attentionScore: 78.5, reach: 1820000, engagement: 4.2 },
  { id: 2, name: 'Product Launch — AuraX', status: 'Active', start: '2026-06-10', end: '2026-08-10', budget: 280000, objective: 'Product Launch', billboards: [4, 6, 7, 10, 12, 14], impressions: 1890000, qrScans: 24100, attentionScore: 82.1, reach: 1540000, engagement: 5.1 },
  { id: 3, name: 'Festive Diwali Campaign', status: 'Scheduled', start: '2026-10-15', end: '2026-11-10', budget: 350000, objective: 'Seasonal Promotion', billboards: [1, 3, 5, 7, 9, 11, 13, 15], impressions: 0, qrScans: 0, attentionScore: 0, reach: 0, engagement: 0 },
  { id: 4, name: 'Q1 Brand Refresh', status: 'Completed', start: '2026-01-05', end: '2026-03-31', budget: 185000, objective: 'Brand Refresh', billboards: [2, 4, 6, 8], impressions: 5120000, qrScans: 42350, attentionScore: 71.8, reach: 3940000, engagement: 3.8 },
  { id: 5, name: 'Metro Transit Blitz', status: 'Active', start: '2026-05-20', end: '2026-07-20', budget: 92000, objective: 'Foot Traffic', billboards: [9, 11, 13, 16, 17], impressions: 980000, qrScans: 8920, attentionScore: 69.4, reach: 720000, engagement: 3.5 },
  { id: 6, name: 'New Year Countdown', status: 'Completed', start: '2025-12-15', end: '2026-01-05', budget: 145000, objective: 'Seasonal Promotion', billboards: [1, 2, 5, 10, 15, 18], impressions: 3200000, qrScans: 29800, attentionScore: 76.2, reach: 2650000, engagement: 4.6 },
];

const BILLBOARDS = [
  { id: 1, name: 'MG Road Skyline', city: 'Bangalore', area: 'MG Road', state: 'Karnataka', type: 'Digital LED', campaign: 'Summer Mega Sale 2026', start: '2026-06-01', end: '2026-07-15', displays: 14200, views: 385000, attention: 81.2, qrScans: 4250, engagement: 4.8, peakHours: '8AM-10AM, 5PM-8PM', lat: 12.97, lng: 77.60 },
  { id: 2, name: 'Marine Drive Premium', city: 'Mumbai', area: 'Marine Drive', state: 'Maharashtra', type: 'Backlit', campaign: 'Summer Mega Sale 2026', start: '2026-06-01', end: '2026-07-15', displays: 18500, views: 520000, attention: 85.4, qrScans: 6100, engagement: 5.2, peakHours: '6PM-10PM', lat: 18.94, lng: 72.82 },
  { id: 3, name: 'Connaught Place Tower', city: 'New Delhi', area: 'CP', state: 'Delhi', type: 'Digital LED', campaign: 'Summer Mega Sale 2026', start: '2026-06-01', end: '2026-07-15', displays: 16800, views: 492000, attention: 79.8, qrScans: 3800, engagement: 4.1, peakHours: '9AM-12PM, 4PM-7PM', lat: 28.63, lng: 77.22 },
  { id: 4, name: 'Anna Salai Junction', city: 'Chennai', area: 'Anna Salai', state: 'Tamil Nadu', type: 'Static', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 8900, views: 210000, attention: 72.5, qrScans: 2400, engagement: 3.4, peakHours: '7AM-9AM, 5PM-7PM', lat: 13.06, lng: 80.25 },
  { id: 5, name: 'Salt Lake Tech Park', city: 'Kolkata', area: 'Salt Lake', state: 'West Bengal', type: 'Digital LED', campaign: 'Summer Mega Sale 2026', start: '2026-06-01', end: '2026-07-15', displays: 11200, views: 298000, attention: 76.9, qrScans: 2850, engagement: 3.9, peakHours: '8AM-11AM', lat: 22.58, lng: 88.42 },
  { id: 6, name: 'FC Road University', city: 'Pune', area: 'FC Road', state: 'Maharashtra', type: 'Backlit', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 9400, views: 245000, attention: 80.1, qrScans: 5200, engagement: 5.6, peakHours: '10AM-1PM, 6PM-9PM', lat: 18.52, lng: 73.84 },
  { id: 7, name: 'Jubilee Hills Main', city: 'Hyderabad', area: 'Jubilee Hills', state: 'Telangana', type: 'Digital LED', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 13100, views: 368000, attention: 83.7, qrScans: 4900, engagement: 5.0, peakHours: '7PM-10PM', lat: 17.43, lng: 78.41 },
  { id: 8, name: 'Brigade Road Central', city: 'Bangalore', area: 'Brigade Road', state: 'Karnataka', type: 'Static', campaign: 'Summer Mega Sale 2026', start: '2026-06-01', end: '2026-07-15', displays: 7200, views: 185000, attention: 68.3, qrScans: 1420, engagement: 2.9, peakHours: '11AM-2PM', lat: 12.97, lng: 77.61 },
  { id: 9, name: 'Andheri Metro East', city: 'Mumbai', area: 'Andheri', state: 'Maharashtra', type: 'Digital LED', campaign: 'Metro Transit Blitz', start: '2026-05-20', end: '2026-07-20', displays: 19800, views: 410000, attention: 74.2, qrScans: 3100, engagement: 3.6, peakHours: '7AM-10AM, 5PM-9PM', lat: 19.12, lng: 72.85 },
  { id: 10, name: 'Sector 17 Plaza', city: 'Chandigarh', area: 'Sector 17', state: 'Punjab', type: 'Backlit', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 6800, views: 152000, attention: 71.0, qrScans: 1800, engagement: 3.2, peakHours: '4PM-8PM', lat: 30.74, lng: 76.78 },
  { id: 11, name: 'Rajiv Chowk Station', city: 'New Delhi', area: 'Rajiv Chowk', state: 'Delhi', type: 'Digital LED', campaign: 'Metro Transit Blitz', start: '2026-05-20', end: '2026-07-20', displays: 22400, views: 580000, attention: 88.1, qrScans: 7200, engagement: 5.8, peakHours: '8AM-10AM, 5PM-8PM', lat: 28.63, lng: 77.21 },
  { id: 12, name: 'Park Street Crossing', city: 'Kolkata', area: 'Park Street', state: 'West Bengal', type: 'Static', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 5600, views: 134000, attention: 65.8, qrScans: 980, engagement: 2.7, peakHours: '12PM-3PM', lat: 22.55, lng: 88.35 },
  { id: 13, name: 'SG Highway Strip', city: 'Ahmedabad', area: 'SG Highway', state: 'Gujarat', type: 'Digital LED', campaign: 'Metro Transit Blitz', start: '2026-05-20', end: '2026-07-20', displays: 15600, views: 342000, attention: 73.6, qrScans: 2800, engagement: 3.4, peakHours: '6PM-9PM', lat: 23.03, lng: 72.53 },
  { id: 14, name: 'Koramangala Inner Ring', city: 'Bangalore', area: 'Koramangala', state: 'Karnataka', type: 'Backlit', campaign: 'Product Launch — AuraX', start: '2026-06-10', end: '2026-08-10', displays: 10200, views: 276000, attention: 79.5, qrScans: 3400, engagement: 4.3, peakHours: '9AM-12PM, 5PM-8PM', lat: 12.93, lng: 77.62 },
  { id: 15, name: 'Banjara Hills Road No.1', city: 'Hyderabad', area: 'Banjara Hills', state: 'Telangana', type: 'Digital LED', campaign: 'New Year Countdown', start: '2025-12-15', end: '2026-01-05', displays: 8100, views: 224000, attention: 77.4, qrScans: 3600, engagement: 4.5, peakHours: '7PM-11PM', lat: 17.41, lng: 78.44 },
  { id: 16, name: 'Viman Nagar IT Park', city: 'Pune', area: 'Viman Nagar', state: 'Maharashtra', type: 'Static', campaign: 'Metro Transit Blitz', start: '2026-05-20', end: '2026-07-20', displays: 4800, views: 98000, attention: 62.1, qrScans: 720, engagement: 2.3, peakHours: '8AM-10AM', lat: 18.57, lng: 73.91 },
  { id: 17, name: 'Whitefield Main Road', city: 'Bangalore', area: 'Whitefield', state: 'Karnataka', type: 'Digital LED', campaign: 'Metro Transit Blitz', start: '2026-05-20', end: '2026-07-20', displays: 12400, views: 310000, attention: 70.8, qrScans: 2100, engagement: 3.1, peakHours: '5PM-8PM', lat: 12.97, lng: 77.75 },
  { id: 18, name: 'Gachibowli Tech Zone', city: 'Hyderabad', area: 'Gachibowli', state: 'Telangana', type: 'Backlit', campaign: 'New Year Countdown', start: '2025-12-15', end: '2026-01-05', displays: 7400, views: 198000, attention: 74.9, qrScans: 2900, engagement: 4.0, peakHours: '6PM-9PM', lat: 17.44, lng: 78.35 },
];

const NOTIFICATIONS = [
  { id: 1, type: 'campaign-start', title: 'Campaign Started', msg: '"Summer Mega Sale 2026" is now live across 5 billboards.', time: '2 hours ago', icon: 'fa-rocket', read: false },
  { id: 2, type: 'milestone', title: 'Performance Milestone', msg: '"Product Launch — AuraX" has crossed 1.5M impressions!', time: '5 hours ago', icon: 'fa-trophy', read: false },
  { id: 3, type: 'offline', title: 'Billboard Offline', msg: '"Park Street Crossing" went offline for maintenance.', time: '8 hours ago', icon: 'fa-triangle-exclamation', read: true },
  { id: 4, type: 'campaign-end', title: 'Campaign Completed', msg: '"Q1 Brand Refresh" has completed. View final report →', time: '1 day ago', icon: 'fa-flag-checkered', read: true },
  { id: 5, type: 'summary', title: 'Weekly Analytics Summary', msg: 'Your campaigns received 1.2M total impressions this week. +12% vs last week.', time: '2 days ago', icon: 'fa-chart-line', read: true },
  { id: 6, type: 'milestone', title: 'QR Scans Milestone', msg: '"Metro Transit Blitz" has crossed 8,000 QR scans!', time: '3 days ago', icon: 'fa-qrcode', read: true },
  { id: 7, type: 'campaign-start', title: 'Campaign Started', msg: '"Metro Transit Blitz" is now live across 5 billboards.', time: '5 days ago', icon: 'fa-rocket', read: true },
];

// Navigation items
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { key: 'campaigns', label: 'Campaigns', icon: 'fa-bullhorn' },
  { key: 'billboards', label: 'Billboards', icon: 'fa-rectangle-ad' },
  { key: 'analytics', label: 'Analytics', icon: 'fa-chart-mixed' },
  { key: 'map', label: 'Map View', icon: 'fa-map-location-dot' },
  { key: 'reports', label: 'Reports', icon: 'fa-file-export' },
  { key: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  { key: 'profile', label: 'Profile', icon: 'fa-user' },
  { key: 'settings', label: 'Settings', icon: 'fa-gear' },
];


// ═══════════════════════════════════════
//  BRAND PORTAL COMPONENT
// ═══════════════════════════════════════
export default function BrandPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  // Live-updating metrics
  const [liveImpressions, setLiveImpressions] = useState(10540000);
  const [liveQrScans, setLiveQrScans] = useState(123590);
  const [liveAttention, setLiveAttention] = useState(76.8);
  const [liveReach, setLiveReach] = useState(8670000);

  // Filter state
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Notification state
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Clock
  const [clock, setClock] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const tick = () => {
      const n = new Date();
      setClock(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Simulate live metric drift
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveImpressions(p => p + Math.floor(Math.random() * 500) + 100);
      setLiveQrScans(p => p + Math.floor(Math.random() * 15) + 2);
      setLiveAttention(p => {
        const d = (Math.random() - 0.48) * 0.3;
        return Math.min(99, Math.max(50, +(p + d).toFixed(1)));
      });
      setLiveReach(p => p + Math.floor(Math.random() * 300) + 50);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeCampaigns = CAMPAIGNS.filter(c => c.status === 'Active');
  const totalBillboards = new Set(CAMPAIGNS.flatMap(c => c.billboards)).size;
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // Filtered billboards
  const filteredBillboards = BILLBOARDS.filter(b => {
    if (filterCampaign !== 'all' && b.campaign !== filterCampaign) return false;
    if (filterState !== 'all' && b.state !== filterState) return false;
    if (filterCity !== 'all' && b.city !== filterCity) return false;
    return true;
  });

  // Unique values for filters
  const states = [...new Set(BILLBOARDS.map(b => b.state))].sort();
  const cities = [...new Set(BILLBOARDS.map(b => b.city))].sort();
  const campaignNames = [...new Set(BILLBOARDS.map(b => b.campaign))].sort();

  // Chart data
  const dailyImpressions = [320000, 345000, 312000, 380000, 398000, 420000, 415000, 440000, 468000, 452000, 478000, 510000, 495000, 520000];
  const dailyLabels = ['Jun 12', 'Jun 13', 'Jun 14', 'Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21', 'Jun 22', 'Jun 23', 'Jun 24', 'Jun 25'];
  const weeklyPerf = [1850000, 2100000, 1980000, 2350000, 2580000, 2780000];
  const weeklyLabels = ['W21', 'W22', 'W23', 'W24', 'W25', 'W26'];
  const monthlyReach = [4200000, 4800000, 5100000, 5600000, 6200000, 6900000];
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const attentionTrend = [72.1, 73.5, 71.8, 74.2, 76.0, 75.4, 76.8, 78.1, 77.5, 78.9, 76.8, 77.2];
  const attentionLabels = ['W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24', 'W25', 'W26'];
  const qrTrend = [8200, 9400, 10100, 11800, 12500, 14200, 15800, 17200, 18900, 20400, 21600, 23100];
  const engagementTrend = [3.1, 3.4, 3.2, 3.8, 4.0, 3.9, 4.2, 4.5, 4.3, 4.6, 4.8, 5.1];

  // Top/bottom billboards
  const topBillboards = [...BILLBOARDS].sort((a, b) => b.attention - a.attention).slice(0, 5);
  const bottomBillboards = [...BILLBOARDS].sort((a, b) => a.attention - b.attention).slice(0, 5);

  // Map data — Indian cities with positioned billboard markers
  const mapCities = [
    { name: 'New Delhi', x: 52, y: 22, billboards: BILLBOARDS.filter(b => b.state === 'Delhi') },
    { name: 'Mumbai', x: 32, y: 52, billboards: BILLBOARDS.filter(b => b.city === 'Mumbai') },
    { name: 'Bangalore', x: 42, y: 78, billboards: BILLBOARDS.filter(b => b.city === 'Bangalore') },
    { name: 'Chennai', x: 52, y: 82, billboards: BILLBOARDS.filter(b => b.city === 'Chennai') },
    { name: 'Kolkata', x: 72, y: 40, billboards: BILLBOARDS.filter(b => b.city === 'Kolkata') },
    { name: 'Hyderabad', x: 46, y: 62, billboards: BILLBOARDS.filter(b => b.city === 'Hyderabad') },
    { name: 'Pune', x: 34, y: 58, billboards: BILLBOARDS.filter(b => b.city === 'Pune') },
    { name: 'Ahmedabad', x: 28, y: 38, billboards: BILLBOARDS.filter(b => b.city === 'Ahmedabad') },
    { name: 'Chandigarh', x: 46, y: 12, billboards: BILLBOARDS.filter(b => b.city === 'Chandigarh') },
  ];

  const [mapHover, setMapHover] = useState(null);

  // Audience insight data
  const audienceData = {
    total: 8670000,
    gender: { male: 54, female: 42, other: 4 },
    age: [
      { group: '18-24', pct: 22 },
      { group: '25-34', pct: 35 },
      { group: '35-44', pct: 24 },
      { group: '45-54', pct: 13 },
      { group: '55+', pct: 6 },
    ],
    peakHours: [
      { hour: '7-9 AM', pct: 28 },
      { hour: '12-2 PM', pct: 18 },
      { hour: '5-8 PM', pct: 38 },
      { hour: '8-10 PM', pct: 16 },
    ],
    returning: 34,
    newViewers: 66,
  };


  // ─────────────────────────────────
  //  RENDER: Sidebar
  // ─────────────────────────────────
  const renderSidebar = () => (
    <aside className={`brand-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      <div className="brand-sidebar-header">
        {sidebarCollapsed ? (
          <button 
            className="brand-sidebar-expand-btn" 
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <i className="fa-solid fa-angles-right"></i>
          </button>
        ) : (
          <>
            <a className="brand-sidebar-logo" onClick={() => setActiveTab('dashboard')}>
              ACULION<span className="logo-dot"></span>
            </a>
            <span className="brand-sidebar-badge">Advertiser</span>
            <button className="brand-sidebar-toggle" onClick={() => { setSidebarCollapsed(true); setMobileSidebarOpen(false); }}>
              <i className="fa-solid fa-angles-left"></i>
            </button>
          </>
        )}
      </div>
      <nav className="brand-sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`brand-nav-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.key); setMobileSidebarOpen(false); }}
            title={sidebarCollapsed ? item.label : ''}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            {!sidebarCollapsed && <span>{item.label}</span>}
            {item.key === 'notifications' && unreadCount > 0 && (
              <span className="brand-nav-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="brand-sidebar-footer">
        <button className="brand-nav-item logout-btn" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );


  // ─────────────────────────────────
  //  RENDER: Top Bar
  // ─────────────────────────────────
  const renderTopbar = () => (
    <header className="brand-topbar">
      <div className="brand-topbar-left">
        <button className="brand-mobile-menu-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <h1 className="brand-page-title">
          {NAV_ITEMS.find(n => n.key === activeTab)?.label || 'Dashboard'}
        </h1>
      </div>
      <div className="brand-topbar-right">
        <span className="brand-topbar-clock">
          <i className="fa-solid fa-clock"></i> {clock}
        </span>
        <span className="brand-live-badge">
          <span className="brand-live-dot"></span> LIVE
        </span>
        <button className="brand-topbar-icon-btn" onClick={() => setActiveTab('notifications')}>
          <i className="fa-solid fa-bell"></i>
          {unreadCount > 0 && <span className="brand-topbar-notif-count">{unreadCount}</span>}
        </button>
        <div className="brand-topbar-user">
          <div className="brand-topbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="brand-topbar-user-info">
            <span className="brand-topbar-username">{user?.name || 'User'}</span>
            <span className="brand-topbar-company">{user?.company || 'Company'}</span>
          </div>
        </div>
      </div>
    </header>
  );


  // ─────────────────────────────────
  //  TAB: Dashboard
  // ─────────────────────────────────
  const renderDashboard = () => (
    <div className="brand-tab-content fade-in-content">
      {/* KPI Grid */}
      <div className="brand-kpi-grid">
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-bullhorn"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Total Campaigns</span>
            <span className="brand-kpi-value"><AnimNum value={CAMPAIGNS.length} /></span>
          </div>
          <Sparkline data={[2, 3, 3, 4, 5, 6]} color="#0052ff" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon active-icon"><i className="fa-solid fa-bolt"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Active Campaigns</span>
            <span className="brand-kpi-value"><AnimNum value={activeCampaigns.length} /></span>
          </div>
          <Sparkline data={[1, 2, 2, 3, 3, 3]} color="#10b981" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-rectangle-ad"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Total Billboards</span>
            <span className="brand-kpi-value"><AnimNum value={totalBillboards} /></span>
          </div>
          <Sparkline data={[10, 12, 14, 15, 16, 18]} color="#8b5cf6" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-eye"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Total Impressions</span>
            <span className="brand-kpi-value"><AnimNum value={liveImpressions} /></span>
          </div>
          <Sparkline data={[5, 6.2, 7.1, 7.8, 8.9, 10.5]} color="#00f0ff" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-qrcode"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Total QR Scans</span>
            <span className="brand-kpi-value"><AnimNum value={liveQrScans} /></span>
          </div>
          <Sparkline data={[42, 58, 72, 85, 98, 123]} color="#f59e0b" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-crosshairs"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Avg Attention Score</span>
            <span className="brand-kpi-value"><AnimNum value={liveAttention} precision={1} suffix="%" /></span>
          </div>
          <Sparkline data={[72, 73, 74, 75, 76, 76.8]} color="#0052ff" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-users"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Campaign Reach</span>
            <span className="brand-kpi-value"><AnimNum value={liveReach} /></span>
          </div>
          <Sparkline data={[4.2, 5.1, 5.8, 6.5, 7.4, 8.7]} color="#10b981" />
        </div>
        <div className="brand-kpi-card">
          <div className="brand-kpi-icon"><i className="fa-solid fa-chart-line"></i></div>
          <div className="brand-kpi-data">
            <span className="brand-kpi-label">Engagement Rate</span>
            <span className="brand-kpi-value"><AnimNum value={4.2} precision={1} suffix="%" /></span>
          </div>
          <Sparkline data={[3.1, 3.4, 3.6, 3.9, 4.0, 4.2]} color="#8b5cf6" />
        </div>
      </div>

      {/* Campaign Performance Summary + Top Billboards */}
      <div className="brand-dashboard-row">
        <div className="brand-card brand-card-wide">
          <div className="brand-card-header">
            <h3><i className="fa-solid fa-chart-area"></i> Campaign Performance Summary</h3>
          </div>
          <AreaChart data={dailyImpressions} labels={dailyLabels} color="#0052ff" height={200} />
        </div>
        <div className="brand-card">
          <div className="brand-card-header">
            <h3><i className="fa-solid fa-trophy"></i> Top Billboards</h3>
          </div>
          <div className="brand-mini-table">
            {topBillboards.map((b, i) => (
              <div key={b.id} className="brand-mini-row">
                <span className="brand-mini-rank">#{i + 1}</span>
                <div className="brand-mini-info">
                  <span className="brand-mini-name">{b.name}</span>
                  <span className="brand-mini-city">{b.city}</span>
                </div>
                <span className="brand-mini-score">{b.attention}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Campaigns
  // ─────────────────────────────────
  const renderCampaigns = () => {
    const filteredCampaigns = filterStatus === 'all' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.status === filterStatus);
    return (
      <div className="brand-tab-content fade-in-content">
        <div className="brand-section-actions">
          <div className="brand-filter-row">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="brand-filter-select">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button className="brand-btn-primary" onClick={() => setShowCreateCampaign(true)}>
            <i className="fa-solid fa-plus"></i> Create Campaign
          </button>
        </div>

        <div className="brand-campaigns-grid">
          {filteredCampaigns.map(c => (
            <div key={c.id} className="brand-campaign-card">
              <div className="brand-campaign-header">
                <h3>{c.name}</h3>
                <span className={`brand-status-badge ${c.status.toLowerCase()}`}>{c.status}</span>
              </div>
              <p className="brand-campaign-objective"><i className="fa-solid fa-crosshairs"></i> {c.objective}</p>
              <div className="brand-campaign-meta">
                <div><i className="fa-regular fa-calendar"></i> {c.start} → {c.end}</div>
                <div><i className="fa-solid fa-dollar-sign"></i> ${c.budget.toLocaleString()}</div>
                <div><i className="fa-solid fa-rectangle-ad"></i> {c.billboards.length} Billboards</div>
              </div>
              <div className="brand-campaign-stats">
                <div className="brand-campaign-stat">
                  <span className="brand-stat-val">{(c.impressions / 1000000).toFixed(1)}M</span>
                  <span className="brand-stat-label">Impressions</span>
                </div>
                <div className="brand-campaign-stat">
                  <span className="brand-stat-val">{c.qrScans.toLocaleString()}</span>
                  <span className="brand-stat-label">QR Scans</span>
                </div>
                <div className="brand-campaign-stat">
                  <span className="brand-stat-val">{c.attentionScore}%</span>
                  <span className="brand-stat-label">Attention</span>
                </div>
                <div className="brand-campaign-stat">
                  <span className="brand-stat-val">{c.engagement}%</span>
                  <span className="brand-stat-label">Engagement</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Campaign Modal */}
        {showCreateCampaign && (
          <div className="brand-modal-overlay" onClick={() => setShowCreateCampaign(false)}>
            <div className="brand-modal" onClick={e => e.stopPropagation()}>
              <div className="brand-modal-header">
                <h2>Create New Campaign</h2>
                <button className="brand-modal-close" onClick={() => setShowCreateCampaign(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="brand-modal-body">
                <div className="brand-form-group">
                  <label>Campaign Name</label>
                  <input type="text" placeholder="Enter campaign name" />
                </div>
                <div className="brand-form-row">
                  <div className="brand-form-group">
                    <label>Start Date</label>
                    <input type="date" />
                  </div>
                  <div className="brand-form-group">
                    <label>End Date</label>
                    <input type="date" />
                  </div>
                </div>
                <div className="brand-form-group">
                  <label>Budget ($)</label>
                  <input type="number" placeholder="100000" />
                </div>
                <div className="brand-form-group">
                  <label>Objective</label>
                  <select>
                    <option>Brand Awareness</option>
                    <option>Product Launch</option>
                    <option>Seasonal Promotion</option>
                    <option>Foot Traffic</option>
                    <option>Brand Refresh</option>
                  </select>
                </div>
                <div className="brand-form-group">
                  <label>Select Billboards</label>
                  <p className="brand-form-hint">Billboard selection will be available after campaign creation.</p>
                </div>
              </div>
              <div className="brand-modal-footer">
                <button className="brand-btn-outline" onClick={() => setShowCreateCampaign(false)}>Cancel</button>
                <button className="brand-btn-primary" onClick={() => { setShowCreateCampaign(false); }}>
                  <i className="fa-solid fa-check"></i> Create Campaign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // ─────────────────────────────────
  //  TAB: Billboards
  // ─────────────────────────────────
  const renderBillboards = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-filter-bar">
        <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)} className="brand-filter-select">
          <option value="all">All Campaigns</option>
          {campaignNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="brand-filter-select">
          <option value="all">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="brand-filter-select">
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="brand-card brand-table-card">
        <div className="brand-table-scroll">
          <table className="brand-table">
            <thead>
              <tr>
                <th>Billboard</th>
                <th>Location</th>
                <th>Type</th>
                <th>Campaign</th>
                <th>Duration</th>
                <th>Displays</th>
                <th>Views</th>
                <th>Attention</th>
                <th>QR Scans</th>
                <th>Engagement</th>
                <th>Peak Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredBillboards.map(b => (
                <tr key={b.id}>
                  <td className="brand-td-name">{b.name}</td>
                  <td>{b.city}, {b.area}<br /><span className="brand-td-sub">{b.state}</span></td>
                  <td><span className={`brand-type-badge ${b.type.toLowerCase().replace(/\s/g, '-')}`}>{b.type}</span></td>
                  <td className="brand-td-campaign">{b.campaign}</td>
                  <td className="brand-td-date">{b.start}<br/>→ {b.end}</td>
                  <td>{b.displays.toLocaleString()}</td>
                  <td>{b.views.toLocaleString()}</td>
                  <td><span className={`brand-attention-score ${b.attention >= 80 ? 'high' : b.attention >= 70 ? 'mid' : 'low'}`}>{b.attention}%</span></td>
                  <td>{b.qrScans.toLocaleString()}</td>
                  <td>{b.engagement}%</td>
                  <td className="brand-td-peak">{b.peakHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="brand-table-footer">
          Showing {filteredBillboards.length} of {BILLBOARDS.length} billboards
        </div>
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Analytics
  // ─────────────────────────────────
  const renderAnalytics = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-charts-grid">
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-chart-line"></i> Daily Impressions</h3></div>
          <AreaChart data={dailyImpressions} labels={dailyLabels} color="#0052ff" />
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-chart-bar"></i> Weekly Performance</h3></div>
          <BarChart data={weeklyPerf} labels={weeklyLabels} color="#0052ff" barColor2="#1a66ff" />
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-users"></i> Monthly Reach</h3></div>
          <AreaChart data={monthlyReach} labels={monthlyLabels} color="#10b981" />
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-crosshairs"></i> Attention Score Trend</h3></div>
          <AreaChart data={attentionTrend} labels={attentionLabels} color="#8b5cf6" />
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-qrcode"></i> QR Scan Trend</h3></div>
          <AreaChart data={qrTrend} labels={attentionLabels} color="#f59e0b" />
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-chart-line"></i> Engagement Trend</h3></div>
          <AreaChart data={engagementTrend} labels={attentionLabels} color="#00f0ff" />
        </div>
      </div>

      {/* Top & Bottom Performers */}
      <div className="brand-dashboard-row" style={{ marginTop: 32 }}>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-arrow-trend-up"></i> Top Performing Billboards</h3></div>
          <div className="brand-mini-table">
            {topBillboards.map((b, i) => (
              <div key={b.id} className="brand-mini-row">
                <span className="brand-mini-rank top">#{i + 1}</span>
                <div className="brand-mini-info">
                  <span className="brand-mini-name">{b.name}</span>
                  <span className="brand-mini-city">{b.city} · {b.views.toLocaleString()} views</span>
                </div>
                <span className="brand-mini-score high">{b.attention}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-arrow-trend-down"></i> Lowest Performing Billboards</h3></div>
          <div className="brand-mini-table">
            {bottomBillboards.map((b, i) => (
              <div key={b.id} className="brand-mini-row">
                <span className="brand-mini-rank low">#{i + 1}</span>
                <div className="brand-mini-info">
                  <span className="brand-mini-name">{b.name}</span>
                  <span className="brand-mini-city">{b.city} · {b.views.toLocaleString()} views</span>
                </div>
                <span className="brand-mini-score low">{b.attention}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Insights */}
      <h2 className="brand-section-title" style={{ marginTop: 40 }}><i className="fa-solid fa-people-group"></i> Audience Insights</h2>
      <div className="brand-audience-grid">
        <div className="brand-card">
          <div className="brand-card-header"><h3>Gender Distribution</h3></div>
          <div className="brand-audience-bars">
            <div className="brand-audience-bar-row">
              <span>Male</span>
              <div className="brand-bar-track"><div className="brand-bar-fill" style={{ width: `${audienceData.gender.male}%`, background: '#0052ff' }}></div></div>
              <span>{audienceData.gender.male}%</span>
            </div>
            <div className="brand-audience-bar-row">
              <span>Female</span>
              <div className="brand-bar-track"><div className="brand-bar-fill" style={{ width: `${audienceData.gender.female}%`, background: '#8b5cf6' }}></div></div>
              <span>{audienceData.gender.female}%</span>
            </div>
            <div className="brand-audience-bar-row">
              <span>Other</span>
              <div className="brand-bar-track"><div className="brand-bar-fill" style={{ width: `${audienceData.gender.other}%`, background: '#00f0ff' }}></div></div>
              <span>{audienceData.gender.other}%</span>
            </div>
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3>Age Groups</h3></div>
          <div className="brand-audience-bars">
            {audienceData.age.map(a => (
              <div key={a.group} className="brand-audience-bar-row">
                <span>{a.group}</span>
                <div className="brand-bar-track"><div className="brand-bar-fill" style={{ width: `${a.pct}%`, background: 'linear-gradient(90deg, #0052ff, #00f0ff)' }}></div></div>
                <span>{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3>Peak Traffic Hours</h3></div>
          <div className="brand-audience-bars">
            {audienceData.peakHours.map(h => (
              <div key={h.hour} className="brand-audience-bar-row">
                <span>{h.hour}</span>
                <div className="brand-bar-track"><div className="brand-bar-fill" style={{ width: `${h.pct}%`, background: '#10b981' }}></div></div>
                <span>{h.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3>Viewer Segments</h3></div>
          <div className="brand-viewer-segments">
            <div className="brand-segment">
              <div className="brand-segment-ring" style={{ '--pct': audienceData.returning }}>
                <span>{audienceData.returning}%</span>
              </div>
              <span className="brand-segment-label">Returning</span>
            </div>
            <div className="brand-segment">
              <div className="brand-segment-ring" style={{ '--pct': audienceData.newViewers }}>
                <span>{audienceData.newViewers}%</span>
              </div>
              <span className="brand-segment-label">New Viewers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Map View
  // ─────────────────────────────────
  const renderMapView = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-card brand-map-card">
        <div className="brand-card-header">
          <h3><i className="fa-solid fa-map-location-dot"></i> Billboard Locations — India</h3>
          <div className="brand-filter-row compact">
            <select value={filterState} onChange={e => setFilterState(e.target.value)} className="brand-filter-select small">
              <option value="all">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)} className="brand-filter-select small">
              <option value="all">All Campaigns</option>
              {campaignNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="brand-map-container">
          <div className="brand-map-india">
            {/* Map grid background */}
            <div className="brand-map-grid"></div>

            {/* City markers */}
            {mapCities.map(city => {
              const bbs = city.billboards.filter(b => {
                if (filterState !== 'all' && b.state !== filterState) return false;
                if (filterCampaign !== 'all' && b.campaign !== filterCampaign) return false;
                return true;
              });
              if (bbs.length === 0) return null;
              const avgAttn = bbs.reduce((s, b) => s + b.attention, 0) / bbs.length;
              const intensity = avgAttn >= 80 ? 'hot' : avgAttn >= 70 ? 'warm' : 'cool';
              return (
                <div
                  key={city.name}
                  className={`brand-map-marker ${intensity}`}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  onMouseEnter={() => setMapHover(city.name)}
                  onMouseLeave={() => setMapHover(null)}
                >
                  <div className="brand-map-pulse"></div>
                  <div className="brand-map-dot"></div>
                  <span className="brand-map-label">{city.name}</span>
                  <span className="brand-map-count">{bbs.length}</span>

                  {mapHover === city.name && (
                    <div className="brand-map-tooltip">
                      <strong>{city.name}</strong>
                      <div>{bbs.length} Billboard{bbs.length > 1 ? 's' : ''}</div>
                      <div>Avg Attention: {avgAttn.toFixed(1)}%</div>
                      <div>Total Views: {bbs.reduce((s, b) => s + b.views, 0).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="brand-map-legend">
            <div className="brand-legend-item"><span className="brand-legend-dot hot"></span> High (80%+)</div>
            <div className="brand-legend-item"><span className="brand-legend-dot warm"></span> Medium (70-80%)</div>
            <div className="brand-legend-item"><span className="brand-legend-dot cool"></span> Low (&lt;70%)</div>
          </div>
        </div>
      </div>

      {/* Regional Performance */}
      <div className="brand-dashboard-row" style={{ marginTop: 24 }}>
        {states.map(state => {
          const bbs = BILLBOARDS.filter(b => b.state === state);
          const avgAttn = bbs.reduce((s, b) => s + b.attention, 0) / bbs.length;
          const totalViews = bbs.reduce((s, b) => s + b.views, 0);
          return (
            <div key={state} className="brand-card brand-region-card">
              <h4>{state}</h4>
              <div className="brand-region-stats">
                <div><span className="brand-stat-val">{bbs.length}</span><span className="brand-stat-label">Billboards</span></div>
                <div><span className="brand-stat-val">{avgAttn.toFixed(1)}%</span><span className="brand-stat-label">Avg Attention</span></div>
                <div><span className="brand-stat-val">{(totalViews / 1000).toFixed(0)}K</span><span className="brand-stat-label">Total Views</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Reports
  // ─────────────────────────────────
  const renderReports = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-reports-grid">
        {[
          { title: 'Campaign Summary Report', desc: 'Full overview of all campaign metrics, KPIs, and performance data.', icon: 'fa-file-lines', type: 'campaign' },
          { title: 'Billboard Performance Report', desc: 'Detailed analytics for each billboard including views, attention, and engagement.', icon: 'fa-rectangle-ad', type: 'billboard' },
          { title: 'Monthly Analytics Report', desc: 'Month-over-month trends for impressions, reach, and audience insights.', icon: 'fa-calendar-days', type: 'monthly' },
          { title: 'QR & Engagement Report', desc: 'QR scan statistics, engagement rates, and conversion funnels.', icon: 'fa-qrcode', type: 'qr' },
          { title: 'Audience Demographics Report', desc: 'Age, gender, and behavioral segmentation of billboard viewers.', icon: 'fa-people-group', type: 'audience' },
          { title: 'Geographic Performance Report', desc: 'Regional breakdown of billboard performance across states and cities.', icon: 'fa-earth-americas', type: 'geo' },
        ].map(report => (
          <div key={report.type} className="brand-report-card">
            <div className="brand-report-icon"><i className={`fa-solid ${report.icon}`}></i></div>
            <h3>{report.title}</h3>
            <p>{report.desc}</p>
            <div className="brand-report-actions">
              <button className="brand-btn-outline small" onClick={() => alert(`Generating ${report.title} PDF...`)}>
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
              <button className="brand-btn-outline small" onClick={() => alert(`Generating ${report.title} Excel...`)}>
                <i className="fa-solid fa-file-excel"></i> Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Notifications
  // ─────────────────────────────────
  const renderNotifications = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-section-actions">
        <h3>{notifications.filter(n => !n.read).length} Unread Notifications</h3>
        <button className="brand-btn-outline small" onClick={markAllRead}>
          <i className="fa-solid fa-check-double"></i> Mark All Read
        </button>
      </div>
      <div className="brand-notifications-list">
        {notifications.map(n => (
          <div key={n.id} className={`brand-notification-item ${n.read ? '' : 'unread'} ${n.type}`}>
            <div className={`brand-notif-icon ${n.type}`}>
              <i className={`fa-solid ${n.icon}`}></i>
            </div>
            <div className="brand-notif-content">
              <h4>{n.title}</h4>
              <p>{n.msg}</p>
              <span className="brand-notif-time">{n.time}</span>
            </div>
            {!n.read && <span className="brand-notif-unread-dot"></span>}
          </div>
        ))}
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Profile
  // ─────────────────────────────────
  const renderProfile = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-profile-card brand-card">
        <div className="brand-profile-header">
          <div className="brand-profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="brand-profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || ''}</p>
            <span className="brand-role-badge">Brand Advertiser</span>
          </div>
        </div>
        <div className="brand-profile-details">
          <div className="brand-profile-row">
            <span className="brand-profile-label">Company</span>
            <span>{user?.company || '—'}</span>
          </div>
          <div className="brand-profile-row">
            <span className="brand-profile-label">Role</span>
            <span>Brand Advertiser</span>
          </div>
          <div className="brand-profile-row">
            <span className="brand-profile-label">Active Campaigns</span>
            <span>{activeCampaigns.length}</span>
          </div>
          <div className="brand-profile-row">
            <span className="brand-profile-label">Total Billboards</span>
            <span>{totalBillboards}</span>
          </div>
          <div className="brand-profile-row">
            <span className="brand-profile-label">Member Since</span>
            <span>June 2026</span>
          </div>
        </div>
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  TAB: Settings
  // ─────────────────────────────────
  const renderSettings = () => (
    <div className="brand-tab-content fade-in-content">
      <div className="brand-settings-grid">
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-bell"></i> Notification Preferences</h3></div>
          <div className="brand-settings-list">
            {[
              { label: 'Campaign Start/End Alerts', checked: true },
              { label: 'Performance Milestones', checked: true },
              { label: 'Billboard Offline Alerts', checked: true },
              { label: 'Weekly Analytics Summary', checked: false },
              { label: 'Monthly Reports', checked: true },
            ].map(s => (
              <label key={s.label} className="brand-setting-toggle">
                <span>{s.label}</span>
                <input type="checkbox" defaultChecked={s.checked} />
                <span className="brand-toggle-slider"></span>
              </label>
            ))}
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-palette"></i> Display Settings</h3></div>
          <div className="brand-settings-list">
            {[
              { label: 'Dark Mode', checked: true },
              { label: 'Compact Sidebar', checked: sidebarCollapsed },
              { label: 'Show Sparklines on KPI Cards', checked: true },
              { label: 'Auto-refresh Metrics', checked: true },
            ].map(s => (
              <label key={s.label} className="brand-setting-toggle">
                <span>{s.label}</span>
                <input type="checkbox" defaultChecked={s.checked} />
                <span className="brand-toggle-slider"></span>
              </label>
            ))}
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-card-header"><h3><i className="fa-solid fa-shield-halved"></i> Account Security</h3></div>
          <div className="brand-settings-list">
            <div className="brand-profile-row">
              <span className="brand-profile-label">Email</span>
              <span>{user?.email || '—'}</span>
            </div>
            <div className="brand-profile-row">
              <span className="brand-profile-label">Password</span>
              <span>••••••••</span>
            </div>
            <button className="brand-btn-outline" style={{ marginTop: 16 }}>Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );


  // ─────────────────────────────────
  //  MAIN RENDER
  // ─────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'campaigns': return renderCampaigns();
      case 'billboards': return renderBillboards();
      case 'analytics': return renderAnalytics();
      case 'map': return renderMapView();
      case 'reports': return renderReports();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="brand-portal">
      {renderSidebar()}
      <div className={`brand-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        {renderTopbar()}
        <div className="brand-content">
          {renderContent()}
        </div>
      </div>
      {mobileSidebarOpen && <div className="brand-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>}
    </div>
  );
}
