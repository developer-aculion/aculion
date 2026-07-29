import React, { useState, useEffect, useRef } from 'react';
import heroCityAnalyticsImg from '../assets/hero_city_analytics.png';

// Tamil Nadu deployment locations mock data
const districtsData = [
  {
    name: 'Coimbatore',
    displays: 12,
    campaigns: 8,
    places: [
      { name: 'RS Puram', screens: 3 },
      { name: 'Gandhipuram', screens: 2 },
      { name: 'Peelamedu', screens: 2 },
      { name: 'Singanallur', screens: 2 },
      { name: 'Saibaba Colony', screens: 2 },
      { name: 'Avinashi Road', screens: 1 }
    ]
  },
  {
    name: 'Chennai',
    displays: 20,
    campaigns: 15,
    places: [
      { name: 'T Nagar', screens: 5 },
      { name: 'Adyar', screens: 3 },
      { name: 'Velachery', screens: 4 },
      { name: 'Anna Nagar', screens: 3 },
      { name: 'OMR', screens: 5 }
    ]
  },
  {
    name: 'Madurai',
    displays: 7,
    campaigns: 4,
    places: [
      { name: 'Anna Nagar', screens: 2 },
      { name: 'KK Nagar', screens: 2 },
      { name: 'Simmakkal', screens: 1 },
      { name: 'Kalavasal', screens: 2 }
    ]
  },
  {
    name: 'Salem',
    displays: 6,
    campaigns: 3,
    places: [
      { name: 'Meyyanur', screens: 2 },
      { name: 'Four Roads', screens: 2 },
      { name: 'Fairlands', screens: 2 }
    ]
  },
  {
    name: 'Trichy',
    displays: 6,
    campaigns: 5,
    places: [
      { name: 'Thillai Nagar', screens: 3 },
      { name: 'Cantonment', screens: 2 },
      { name: 'BHEL Township', screens: 1 }
    ]
  },
  {
    name: 'Erode',
    displays: 4,
    campaigns: 2,
    places: [
      { name: 'Perundurai Road', screens: 2 },
      { name: 'GH Junction', screens: 2 }
    ]
  }
];

export default function HeroCityAnalytics() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Locations Explorer Interactive States
  const [showPanel, setShowPanel] = useState(false);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const closeTimerRef = useRef(null);

  // Live telemetry states
  const [metrics, setMetrics] = useState({
    attention: 74.2,
    traffic: 1420,
    dwell: 5.8
  });

  const [vehicleClassification, setVehicleClassification] = useState({
    cars: 842,
    bikes: 417,
    buses: 28,
    trucks: 63
  });

  const [audienceIntel, setAudienceIntel] = useState({
    reach: 14.2,
    active: 6.8,
    engagement: 92
  });

  const containerRef = useRef(null);

  // Handle mouse movement for 3D parallax tilt
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Normalize coordinates from -0.5 to 0.5
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setTilt({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Locations panel hover management
  const handlePanelEnter = () => {
    console.log('[DEBUG] handlePanelEnter triggered');
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShowPanel(true);
  };

  const handlePanelLeave = () => {
    console.log('[DEBUG] handlePanelLeave triggered');
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      console.log('[DEBUG] Close timer executed, hiding panel');
      setShowPanel(false);
    }, 500);
  };

  const handleToggleDistrict = (name) => {
    setExpandedDistrict(prev => prev === name ? null : name);
  };

  // Simulating live data drift
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => {
        const trafficDrift = Math.floor(Math.random() * 5) - 2;
        const attentionDrift = (Math.random() * 0.4) - 0.2;
        const dwellDrift = (Math.random() * 0.2) - 0.1;

        return {
          traffic: Math.max(1380, Math.min(1470, prev.traffic + trafficDrift)),
          attention: Math.min(76.5, Math.max(72.0, prev.attention + attentionDrift)),
          dwell: Math.min(6.5, Math.max(5.2, prev.dwell + dwellDrift))
        };
      });

      setVehicleClassification((prev) => {
        const carsDrift = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const bikesDrift = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const busesDrift = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const trucksDrift = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return {
          cars: Math.max(830, Math.min(860, prev.cars + carsDrift)),
          bikes: Math.max(400, Math.min(430, prev.bikes + bikesDrift)),
          buses: Math.max(25, Math.min(32, prev.buses + busesDrift)),
          trucks: Math.max(58, Math.min(68, prev.trucks + trucksDrift))
        };
      });

      setAudienceIntel((prev) => {
        const activeDrift = (Math.random() * 0.1) - 0.05;
        const engDrift = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return {
          reach: 14.2,
          active: Math.min(7.5, Math.max(6.0, prev.active + activeDrift)),
          engagement: Math.min(95, Math.max(89, prev.engagement + engDrift))
        };
      });
    }, 2000);

    return () => {
      clearInterval(timer);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Compute 3D transforms based on mouse tilt state
  // Multipliers are adjusted for different cards to create parallax layers
  const getCardStyle = (multiplierZ) => {
    if (!isHovered) {
      return {
        transform: `translate3d(0px, 0px, ${multiplierZ * 30}px)`,
        transition: 'transform 0.5s ease-out',
      };
    }
    const tx = tilt.x * 35 * (multiplierZ / 1.0);
    const ty = tilt.y * 35 * (multiplierZ / 1.0);
    const tz = multiplierZ * 30;

    return {
      transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`,
      transition: 'none',
    };
  };

  const getConsoleStyle = () => {
    if (!isHovered) {
      return {
        transform: 'rotateX(10deg) rotateY(-15deg)',
        transition: 'transform 0.5s ease-out',
      };
    }
    const rx = 10 + tilt.y * 12;
    const ry = -15 + tilt.x * 15;
    return {
      transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
      transition: 'none',
    };
  };

  return (
    <div 
      className="hero-visual"
      style={{ perspective: '1200px' }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="hero-console-inner"
        style={{ 
          transformStyle: 'preserve-3d',
          ...getConsoleStyle()
        }}
      >
        {/* Base City Image */}
        <div className="hero-image-wrapper">
          <img src={heroCityAnalyticsImg} alt="Smart City AI Analytics Dashboard" className="hero-analytics-img" />
          <div className="hero-scanner-line"></div>
          <div className="hero-grid-overlay"></div>
          <div className="hero-lens-flare"></div>
          
          {/* Subtle blue/cyan glow around the billboard screen inside the image */}
          <div className={`billboard-glow-overlay ${showPanel ? 'active' : ''}`}></div>
          


          {/* Billboard Screen Hover Target Area */}
          <div 
            className="billboard-hover-zone"
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handlePanelLeave}
          ></div>
        </div>

        {/* Floating Location Panel */}
        <div 
          className={`location-explorer-panel ${showPanel ? 'visible' : ''}`}
          style={getCardStyle(1.6)}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          <div className="panel-glow"></div>
          <div className="panel-header">
            <h3><span>📍</span> Active Locations</h3>
          </div>
          
          <div className="panel-districts custom-scrollbar">
            {districtsData.map((district, idx) => (
              <div 
                key={district.name} 
                className="district-card-wrapper"
                style={{ 
                  transitionDelay: `${idx * 40}ms`,
                  opacity: showPanel ? 1 : 0,
                  transform: showPanel ? 'translateY(0)' : 'translateY(8px)'
                }}
              >
                <div 
                  className={`district-card ${expandedDistrict === district.name ? 'expanded' : ''}`}
                  onClick={() => handleToggleDistrict(district.name)}
                >
                  <div className="district-info">
                    <span className="district-name">{district.name}</span>
                    <span className="district-live">
                      <span className="status-dot"></span> Live
                    </span>
                  </div>
                  <div className="district-stats">
                    <span className="stat-pill">{district.displays} Displays</span>
                    <span className="stat-pill">{district.campaigns} Campaigns</span>
                    <span className="expand-arrow">{expandedDistrict === district.name ? '▼' : '▶'}</span>
                  </div>
                </div>

                {expandedDistrict === district.name && (
                  <div className="place-list">
                    {district.places.map((place, pIdx) => (
                      <div 
                        key={place.name} 
                        className="place-item"
                        style={{
                          transitionDelay: `${pIdx * 25}ms`
                        }}
                      >
                        <span className="place-name">
                          <span className="pin">📍</span> {place.name}
                        </span>
                        <div className="place-details">
                          <span className="place-screens">{place.screens} {place.screens === 1 ? 'Screen' : 'Screens'}</span>
                          <span className="status-dot"></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Analytics Card 1: Vehicle Classification */}
        <div 
          className="hero-floating-card card-attention" 
          style={getCardStyle(1.83)} // tz = 55px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-object-group text-cyan"></i>
            <span>VEHICLE CLASSIFICATION</span>
          </div>
          <div className="card-metrics-grid">
            <div className="card-metric-row">
              <span>Cars:</span>
              <span className="cyan-glow" style={{ color: 'var(--cyan-accent)', fontWeight: '700' }}>{vehicleClassification.cars}</span>
            </div>
            <div className="card-metric-row">
              <span>Bikes:</span>
              <span className="cyan-glow" style={{ color: 'var(--cyan-accent)', fontWeight: '700' }}>{vehicleClassification.bikes}</span>
            </div>
            <div className="card-metric-row">
              <span>Buses:</span>
              <span className="cyan-glow" style={{ color: 'var(--cyan-accent)', fontWeight: '700' }}>{vehicleClassification.buses}</span>
            </div>
            <div className="card-metric-row">
              <span>Trucks:</span>
              <span className="cyan-glow" style={{ color: 'var(--cyan-accent)', fontWeight: '700' }}>{vehicleClassification.trucks}</span>
            </div>
          </div>
        </div>

        {/* Floating Analytics Card 2: Audience Intelligence */}
        <div 
          className="hero-floating-card card-audience-intel" 
          style={getCardStyle(1.4)} // tz = 42px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-users text-purple"></i>
            <span>AUDIENCE INTELLIGENCE</span>
          </div>
          <div className="card-metrics-list">
            <div className="card-metric-row">
              <span>Reach:</span>
              <span>{audienceIntel.reach}K</span>
            </div>
            <div className="card-metric-row">
              <span>Active:</span>
              <span>{audienceIntel.active.toFixed(1)}K</span>
            </div>
            <div className="card-metric-row">
              <span>Engagement:</span>
              <span className="purple-glow" style={{ color: 'var(--purple-accent)', fontWeight: '700' }}>{audienceIntel.engagement}%</span>
            </div>
          </div>
        </div>

        {/* Floating Analytics Card 3: Vehicle Flow */}
        <div 
          className="hero-floating-card card-traffic" 
          style={getCardStyle(1.17)} // tz = 35px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-car text-blue"></i>
            <span>VEHICLE FLOW</span>
          </div>
          <div className="card-body-single">
            <div className="card-value-wrapper">
              <span className="card-value blue-glow">{metrics.traffic.toLocaleString()}</span>
              <span className="card-unit">/ HR</span>
            </div>
            <div className="card-subtext">
              Density: <span style={{ color: '#8bb2ff', fontWeight: '600' }}>High</span>
            </div>
          </div>
        </div>

        {/* Floating Analytics Card 4: Location Intelligence */}
        <div 
          className="hero-floating-card card-campaign" 
          style={getCardStyle(2.17)} // tz = 65px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-location-dot text-purple"></i>
            <span>LOCATION INTELLIGENCE</span>
          </div>
          <div className="card-metrics-list">
            <div className="card-metric-row" style={{ marginBottom: '2px' }}>
              <span style={{ color: '#ffffff', fontWeight: '700' }}>Chennai • T Nagar</span>
            </div>
            <div className="card-metric-row">
              <span>Zone:</span>
              <span style={{ color: 'var(--purple-accent)' }}>High Footfall</span>
            </div>
            <div className="card-metric-row">
              <span>Peak:</span>
              <span style={{ color: 'var(--purple-accent)' }}>6 PM – 9 PM</span>
            </div>
          </div>
        </div>

        {/* Floating Analytics Card 5: Audience Demography */}
        <div 
          className="hero-floating-card card-audience-demography" 
          style={getCardStyle(1.7)} // tz = 51px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-venus-mars text-blue"></i>
            <span>AUDIENCE DEMOGRAPHY</span>
          </div>
          <div className="card-metrics-list" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 0, gap: '6px' }}>
            <div className="card-metric-row">
              <span>Reach:</span>
              <span className="blue-glow" style={{ color: '#8bb2ff', fontWeight: '700' }}>14.2K</span>
            </div>
            <div className="card-metric-row">
              <span>Engagement Rate:</span>
              <span className="purple-glow" style={{ color: 'var(--purple-accent)', fontWeight: '700' }}>89%</span>
            </div>
          </div>
        </div>

        {/* Floating Analytics Card 6: Average Dwell Time */}
        <div 
          className="hero-floating-card card-dwell" 
          style={getCardStyle(1.5)} // tz = 45px
        >
          <div className="card-glow"></div>
          <div className="card-header">
            <i className="fa-solid fa-hourglass-half text-yellow"></i>
            <span>AVG DWELL TIME</span>
          </div>
          <div className="card-body-single">
            <div className="card-value-wrapper">
              <span className="card-value yellow-glow">{metrics.dwell.toFixed(1)}s</span>
              <span className="card-unit">dwell</span>
            </div>
            <div className="card-subtext">Avg Viewing Time</div>
          </div>
        </div>

        {/* Floating Camera Node Badge */}
        <div 
          className="hero-node-badge" 
          style={getCardStyle(0.83)} // tz = 25px
        >
          <span className="badge-pulse"></span>
          <span>NODE_ANS_02_CAM1 // LIVE INFERENCE</span>
        </div>
      </div>
    </div>
  );
}
