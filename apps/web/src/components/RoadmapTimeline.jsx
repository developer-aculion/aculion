import React, { useEffect, useRef, useState } from 'react';

const roadmapData = [
  {
    phase: 'PHASE 1 — Traffic Intelligence',
    title: 'Measure the Movement',
    desc: 'Real-time vehicle, pedestrian, speed, dwell time, and traffic analytics for every billboard.',
    status: 'Completed',
    statusClass: 'complete',
    icon: 'fa-circle-check'
  },
  {
    phase: 'PHASE 2 — Location Intelligence',
    title: 'Understand Every Location',
    desc: 'Contextual intelligence including audience flow, location quality, premium vehicle mix, and environmental insights.',
    status: 'Active Rollout',
    statusClass: 'active',
    icon: 'fa-circle-play'
  },
  {
    phase: 'PHASE 3 — Audience Intelligence',
    title: 'Know Who Sees Your Media',
    desc: 'AI-powered audience profiling, attention measurement, demographic insights, and campaign attribution.',
    status: 'In Development',
    statusClass: 'development',
    icon: 'fa-compass'
  },
  {
    phase: 'PHASE 4 — AI Media Intelligence',
    title: 'Plan Smarter. Perform Better.',
    desc: 'AI-powered campaign planning, predictive performance, media recommendations, ROI optimization, and intelligent APIs.',
    status: 'Roadmap',
    statusClass: 'upcoming',
    icon: 'fa-network-wired'
  }
];

export default function RoadmapTimeline() {
  const containerRef = useRef(null);
  const glowPathRef = useRef(null);
  const [activeNodes, setActiveNodes] = useState([]);
  const [passedNodes, setPassedNodes] = useState([]);
  const [glowHeight, setGlowHeight] = useState(0);
  const [cardTilts, setCardTilts] = useState({});
  const [transparentLogoUrl, setTransparentLogoUrl] = useState('/logo_icon.png');

  useEffect(() => {
    const img = new Image();
    img.src = '/logo_icon.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // Loop through pixels and clear black/near-black pixels, enhancing logo details and colors
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r < 25 && g < 25 && b < 25) {
          data[i + 3] = 0; // set alpha to 0 (transparent)
        } else {
          const maxVal = Math.max(r, g, b);
          let factor = 1.45; // default neon brightness boost
          if (maxVal < 100) {
            factor = 1.7; // higher boost for inner lion face details
          }
          let newR = r * factor;
          let newG = g * factor;
          let newB = b * factor;

          // Saturation boost for the blue/cyan elements
          if (b > r || g > r) {
            newB = Math.min(255, newB * 1.15);
            newG = Math.min(255, newG * 1.10);
          }

          data[i] = Math.min(255, newR);
          data[i + 1] = Math.min(255, newG);
          data[i + 2] = Math.min(255, newB);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setTransparentLogoUrl(canvas.toDataURL('image/png'));
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Scroll progress relative to the container element
      const scrollStart = rect.top - viewportHeight / 2;
      let percent = 0;
      if (scrollStart < 0) {
        percent = Math.abs(scrollStart) / (containerHeight - viewportHeight / 2);
        percent = Math.min(Math.max(percent, 0), 1);
      }
      setGlowHeight(percent * 100);

      // Node highlights
      const items = containerRef.current.querySelectorAll('.timeline-item');
      const passed = [];
      const active = [];

      items.forEach((item, idx) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;

        if (itemCenter < viewportHeight / 2) {
          passed.push(idx);
        } else if (itemCenter < viewportHeight * 0.75) {
          active.push(idx);
        }
      });

      setPassedNodes(passed);
      setActiveNodes(active);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    // Initial call
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleCardMouseMove = (e, idx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setCardTilts(prev => ({
      ...prev,
      [idx]: { x, y }
    }));
  };

  const handleCardMouseLeave = (idx) => {
    setCardTilts(prev => ({
      ...prev,
      [idx]: { x: 0, y: 0 }
    }));
  };

  const getCardStyle = (idx, isPassed, isActive) => {
    const tilt = cardTilts[idx] || { x: 0, y: 0 };
    const isHovered = tilt.x !== 0 || tilt.y !== 0;
    const isNodeActive = isPassed || isActive;
    const isLeft = idx % 2 === 0;

    let transform = '';
    if (isNodeActive) {
      if (isHovered) {
        transform = `rotateY(${tilt.x * 12}deg) rotateX(${tilt.y * -12}deg) translateZ(70px) scale(1.06)`;
      } else {
        transform = `rotateY(0deg) translateZ(30px) scale(1.02)`;
      }
    } else {
      if (isHovered) {
        const baseRotY = isLeft ? 20 : -20;
        transform = `rotateY(${baseRotY + tilt.x * 10}deg) rotateX(${4 + tilt.y * -10}deg) translateZ(-40px) scale(1.0)`;
      } else {
        const baseRotY = isLeft ? 25 : -25;
        transform = `rotateY(${baseRotY}deg) translateZ(-100px) rotateX(4deg) scale(0.96)`;
      }
    }

    return {
      transform,
      transition: isHovered ? 'transform 0.1s ease-out, border-color 0.4s ease, box-shadow 0.4s ease' : undefined
    };
  };

  return (
    <>
      <div className="timeline-container" ref={containerRef}>
      {/* Central Line */}
      <div className="timeline-center-line">
        <div 
          className="timeline-glow-path" 
          ref={glowPathRef}
          style={{ height: `${glowHeight}%` }}
        />
      </div>

      {/* Large glowing floating logo anchored at the bottom center of the timeline */}
      <div className="timeline-brand-logo-wrap">
        <img
          src="/logo_icon.png"
          alt="Aculion Brand Logo"
          className="timeline-brand-logo-img"
        />
      </div>

      {roadmapData.map((item, idx) => {
        const isPassed = passedNodes.includes(idx);
        const isActive = activeNodes.includes(idx);
        const itemClass = `timeline-item ${isPassed ? 'passed' : ''} ${isActive ? 'active' : ''}`;

        return (
          <div className={itemClass} key={idx} id={`timeline-node-${idx + 1}`}>
            <div className="timeline-marker">
              <i className={`fa-solid ${item.icon}`} />
            </div>
            <div 
              className="timeline-content-card"
              onMouseMove={(e) => handleCardMouseMove(e, idx)}
              onMouseLeave={() => handleCardMouseLeave(idx)}
              style={getCardStyle(idx, isPassed, isActive)}
            >
              <span className="timeline-phase">{item.phase}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <span className={`timeline-status-badge ${item.statusClass}`}>
                {item.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
