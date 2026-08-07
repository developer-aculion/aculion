import React, { useState, useEffect, useRef } from 'react';
import heroCityAnalyticsImg from '../assets/hero_city_analytics.png';
import floatingDashboardImg from '../assets/floating_dashboard.png';

export default function MediaOwnerPage({ navigateTo, isLoggedIn, setShowRegister, setShowSignin, handleLogout, user }) {
  // Active sub-section tab inside features explorer
  const [activeFeatureTab, setActiveFeatureTab] = useState('traffic');

  // KPI counters state
  const [counters, setCounters] = useState({
    vehiclesPerHour: 1428,
    audienceReach: 84720,
    activeCampaigns: 18,
    dwellTime: 5.7,
    roiMultiplier: 4.8,
    activeAudience: 247,
  });

  // Live Inference Log payload state
  const [logs, setLogs] = useState([
    { id: 1, timestamp: '10:55:01', node: 'NODE_ANS_02_CAM1', status: 'INFERENCE_SUCCESS', latency: '12ms', details: 'Detected: 4 Cars, 2 Bikes' },
    { id: 2, timestamp: '10:55:03', node: 'NODE_ANS_02_CAM1', status: 'HEATMAP_UPDATED', latency: '8ms', details: 'Zone 4 attention increase' },
    { id: 3, timestamp: '10:55:05', node: 'NODE_ANS_02_CAM1', status: 'DWELL_DETECTED', latency: '15ms', details: 'Dwell: 6.2s, Target: Male 25-34' },
  ]);

  // Live bounding boxes simulator state for the Live AI Camera Feed
  const [detectedObjects, setDetectedObjects] = useState([
    { id: 1, type: 'Car', confidence: 97, x: 20, y: 35, w: 25, h: 22 },
    { id: 2, type: 'Bike', confidence: 91, x: 50, y: 40, w: 12, h: 18 },
    { id: 3, type: 'Truck', confidence: 94, x: 70, y: 25, w: 22, h: 30 },
  ]);

  // Interactive Heatmap billboard spots
  const [selectedHeatmapSpot, setSelectedHeatmapSpot] = useState(2);
  const heatmapSpots = [
    { id: 1, label: 'Top Left (Branding)', score: '82%', dwell: '3.4s', description: 'Initial gaze entry point. Good for brand logo placement.' },
    { id: 2, label: 'Center (Hero Message)', score: '96%', dwell: '6.8s', description: 'Peak attention zone. Highly visual content or text goes here.' },
    { id: 3, label: 'Bottom Right (CTA)', score: '88%', dwell: '4.5s', description: 'Closing gaze zone. Ideal for QR codes, URLs, or phone numbers.' },
  ];

  // Simulated live updates for statistics, charts, logs, and bounding boxes
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Randomly adjust KPI counters slightly for realism
      setCounters(prev => ({
        vehiclesPerHour: Math.max(1350, Math.min(1550, prev.vehiclesPerHour + Math.floor(Math.random() * 9) - 4)),
        audienceReach: prev.audienceReach + Math.floor(Math.random() * 3),
        activeCampaigns: prev.activeCampaigns,
        dwellTime: parseFloat(Math.max(5.1, Math.min(6.5, prev.dwellTime + (Math.random() * 0.2 - 0.1))).toFixed(1)),
        roiMultiplier: parseFloat(Math.max(4.5, Math.min(5.2, prev.roiMultiplier + (Math.random() * 0.04 - 0.02))).toFixed(1)),
        activeAudience: Math.max(180, Math.min(320, prev.activeAudience + Math.floor(Math.random() * 11) - 5)),
      }));

      // 2. Roll new inference logs
      setLogs(prev => {
        const now = new Date();
        const timestamp = now.toTimeString().split(' ')[0];
        const actions = [
          { status: 'INFERENCE_SUCCESS', latency: `${Math.floor(Math.random() * 6) + 9}ms`, details: `Detected: ${Math.floor(Math.random() * 6) + 2} Cars, ${Math.floor(Math.random() * 3)} Bikes` },
          { status: 'SPEED_COUNT_TRIGGER', latency: `${Math.floor(Math.random() * 5) + 8}ms`, details: `Avg Speed: ${Math.floor(Math.random() * 20) + 30} km/h` },
          { status: 'DWELL_DETECTED', latency: `${Math.floor(Math.random() * 8) + 10}ms`, details: `Dwell: ${(Math.random() * 4 + 3).toFixed(1)}s, Focus: High` },
          { status: 'AUDIENCE_CLASSIFIED', latency: `${Math.floor(Math.random() * 6) + 11}ms`, details: `Group: ${Math.random() > 0.5 ? 'Female 18-24' : 'Male 35-44'}, Confidence: ${Math.floor(Math.random() * 10) + 85}%` }
        ];
        const newAction = actions[Math.floor(Math.random() * actions.length)];
        const nextLogs = [...prev.slice(1), { id: Date.now(), timestamp, node: 'NODE_ANS_02_CAM1', ...newAction }];
        return nextLogs;
      });

      // 3. Update simulated bounding boxes for camera overlay
      setDetectedObjects(() => {
        const types = ['Car', 'Bike', 'Bus', 'Truck'];
        const carCount = Math.floor(Math.random() * 2) + 2;
        const boxes = [];
        for (let i = 0; i < carCount; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          boxes.push({
            id: i,
            type,
            confidence: Math.floor(Math.random() * 10) + 89,
            x: Math.floor(Math.random() * 60) + 5,
            y: Math.floor(Math.random() * 45) + 15,
            w: type === 'Truck' || type === 'Bus' ? Math.floor(Math.random() * 10) + 18 : Math.floor(Math.random() * 10) + 12,
            h: type === 'Truck' || type === 'Bus' ? Math.floor(Math.random() * 10) + 18 : Math.floor(Math.random() * 10) + 12
          });
        }
        return boxes;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="media-owner-page fade-in-content">
      {/* â”€â”€ HERO SECTION â”€â”€ */}
      <section className="media-hero">
        <div className="section-container media-hero-container">
          <div className="media-hero-content">
            <div className="hero-accent">
              <span className="accent-line"></span>
              <span className="accent-pulse"></span>
            </div>
            <div className="hero-title-container">
              <div className="hero-title-glow"></div>
              <h1 className="media-hero-title">
                AE Intelligence Platform<br />
                <span className="text-gradient">for Media Owners</span>
              </h1>
            </div>
            <p className="media-hero-subtitle">
              Monitor every billboard with real-time AE-powered traffic, audience, and performance analytics.<br />
              Optimize occupancy, pricing, and ROI through a unified live intelligence dashboard.
            </p>
          </div>

          {/* Quick HUD Hero Overlay */}
          <div className="media-hero-visual-wrapper">
            <div className="media-hero-panel glass-panel">
              <div className="panel-glow"></div>
              <div className="hud-header">
                <span className="hud-badge active-pulse">
                  <span className="hud-dot"></span> Live
                </span>
                <span className="hud-title">NODE_ANS_02 // SYSTEM STATUS</span>
              </div>
              <div className="hud-grid">
                <div className="hud-item">
                  <div className="hud-label">VEHICLES / HR</div>
                  <div className="hud-value cyan-glow">{counters.vehiclesPerHour}</div>
                  <div className="hud-trend positive">
                    <i className="fa-solid fa-arrow-trend-up"></i> +4.2% peak
                  </div>
                </div>
                <div className="hud-item">
                  <div className="hud-label">ACTIVE AUDIENCE</div>
                  <div className="hud-value purple-glow">{counters.activeAudience}</div>
                  <div className="hud-trend positive">
                    <i className="fa-solid fa-users"></i> Live Gaze
                  </div>
                </div>
                <div className="hud-item">
                  <div className="hud-label">DWELL TIME</div>
                  <div className="hud-value yellow-glow">{counters.dwellTime}s</div>
                  <div className="hud-trend">
                    <i className="fa-solid fa-hourglass"></i> High Focus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEDIA OWNER SHOWCASE SECTION ── */}
      <section className="mos-section">
        <div className="mos-bg-grid"></div>

        <div className="section-container">

          {/* Section header */}
          <div className="mos-header">
            <span className="section-tag">Media Owner Platform</span>
            <h2 className="mos-title">Built for Modern Media Owners</h2>
            <p className="mos-subtitle">
              Everything you need to manage, monitor, and monetize your billboard network from one intelligent platform.
            </p>
          </div>

          {/* 3Ã—2 Feature grid */}
          <div className="mos-feature-grid">
            {[
              {
                icon: 'fa-satellite-dish',
                color: '#00f0ff',
                glow: 'rgba(0,240,255,0.15)',
                title: 'Real-Time Billboard Monitoring',
                desc: 'Monitor every billboard with live traffic, audience, and campaign insights updated every second.',
                tag: 'Live',
              },
              {
                icon: 'fa-layer-group',
                color: '#3b82f6',
                glow: 'rgba(59,130,246,0.15)',
                title: 'Occupancy & Inventory Management',
                desc: 'Track available, booked, and upcoming inventory across all locations in one unified view.',
                tag: 'Inventory',
              },
              {
                icon: 'fa-tags',
                color: '#f59e0b',
                glow: 'rgba(245,158,11,0.15)',
                title: 'Dynamic Pricing Intelligence',
                desc: 'Optimize billboard pricing based on real-time traffic, demand, audience reach, and peak hours.',
                tag: 'Pricing',
              },
              {
                icon: 'fa-chart-line',
                color: '#10b981',
                glow: 'rgba(16,185,129,0.15)',
                title: 'Revenue & Performance Analytics',
                desc: 'View revenue trends, occupancy rates, advertiser ROI, impressions, and campaign performance.',
                tag: 'Analytics',
              },
              {
                icon: 'fa-brain',
                color: '#a855f7',
                glow: 'rgba(168,85,247,0.15)',
                title: 'AI Audience & Traffic Insights',
                desc: 'Analyze people count, vehicle flow, dwell time, reach, and engagement in real time with AI.',
                tag: 'AI',
              },
              {
                icon: 'fa-network-wired',
                color: '#ec4899',
                glow: 'rgba(236,72,153,0.15)',
                title: 'Multi-Location Control Center',
                desc: 'Manage hundreds of billboard locations from a unified dashboard with instant status updates.',
                tag: 'Scale',
              },
            ].map((feat, idx) => (
              <div className="mos-feat-card" key={idx} style={{ '--feat-color': feat.color, '--feat-glow': feat.glow }}>
                <div className="mos-feat-card-bg"></div>
                <div className="mos-feat-icon-wrap">
                  <div className="mos-feat-icon-ring"></div>
                  <i className={`fa-solid ${feat.icon} mos-feat-icon`}></i>
                </div>
                <div className="mos-feat-tag">{feat.tag}</div>
                <h3 className="mos-feat-title">{feat.title}</h3>
                <p className="mos-feat-desc">{feat.desc}</p>
                <div className="mos-feat-arrow">
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            ))}
          </div>

          {/* ── Platform Capability Banner ── */}
          <div className="mos-cta-banner">
            <div className="mos-cta-glow-left"></div>
            <div className="mos-cta-glow-right"></div>
            <div className="mos-cta-grid-lines"></div>
            <div className="mos-cta-content">
              <div className="mos-cta-badge">
                <span className="mos-cta-live-dot"></span>
                AE-Powered Platform
              </div>
              <h2 className="mos-cta-heading">
                Transform Your Billboard Network<br />
                <span className="text-gradient">with AI Intelligence</span>
              </h2>
              <p className="mos-cta-subtext">
                Unlock real-time analytics, smarter pricing, and complete operational visibility from a single platform.
              </p>
              {/* Feature highlights row replacing CTA buttons */}
              <div className="mos-feat-highlights">
                {[
                  { icon: 'fa-car', emoji: '🚗', label: 'Real-Time Traffic Intelligence' },
                  { icon: 'fa-users', emoji: '👥', label: 'Audience Analytics' },
                  { icon: 'fa-location-dot', emoji: '📍', label: 'Location Intelligence' },
                  { icon: 'fa-chart-bar', emoji: '📊', label: 'Performance Insights' },
                ].map((item, idx) => (
                  <div className="mos-feat-highlight-item" key={idx}>
                    <div className="mos-feat-highlight-icon">
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <span className="mos-feat-highlight-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
