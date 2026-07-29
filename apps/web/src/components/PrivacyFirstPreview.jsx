import React, { useEffect, useRef, useState } from 'react';

export default function PrivacyFirstPreview({ isActive }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cardRef = useRef(null);

  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [reflectionStyle, setReflectionStyle] = useState({});

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let rotationAngle = 0;
    let gridOffset = 0;

    // Generate 3D Neural Sphere points (Fibonacci sphere distribution)
    const nodeCount = 50;
    const sphereRadius = 110;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      nodes.push({
        origX: sphereRadius * Math.sin(phi) * Math.cos(theta),
        origY: sphereRadius * Math.sin(phi) * Math.sin(theta),
        origZ: sphereRadius * Math.cos(phi)
      });
    }

    // Floating Data particles
    const particleCount = 40;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 600,
        y: Math.random() * 400 + 100,
        speedY: 0.4 + Math.random() * 0.8,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.5,
        drift: Math.random() * 360,
        driftSpeed: 0.02 + Math.random() * 0.03
      });
    }

    // City light trail cars
    const trailCount = 12;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
      trails.push({
        x: Math.random() * 600,
        laneY: 310 + Math.floor(Math.random() * 4) * 12,
        speed: 1.2 + Math.random() * 1.8,
        length: 15 + Math.random() * 25,
        color: Math.random() > 0.5 ? '#00f0ff' : '#0052ff'
      });
    }

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width || 580;
      height = rect.height || 420;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      particles.forEach(p => {
        p.x = Math.random() * width;
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Primary drawing frame loop
    const draw = () => {
      // Easing current state parallax offsets from state
      const mouseX = parallax.x;
      const mouseY = parallax.y;

      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Moving Grid Floor (Z-Depth Perspective)
      ctx.strokeStyle = 'rgba(0, 82, 255, 0.09)';
      ctx.lineWidth = 1;
      const horizonY = height * 0.65 + mouseY * 15;
      const centerGridX = width * 0.5 + mouseX * 25;

      const gridLines = 24;
      for (let i = -gridLines / 2; i <= gridLines / 2; i++) {
        ctx.beginPath();
        ctx.moveTo(centerGridX, horizonY);
        const bottomX = centerGridX + i * (width / 6) + i * i * i * 0.05;
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      gridOffset += 1.2;
      if (gridOffset >= 40) gridOffset = 0;

      const horizLineCount = 10;
      for (let i = 0; i < horizLineCount; i++) {
        const step = i * 40 + gridOffset;
        const ratio = step / (height - horizonY);
        const y = horizonY + Math.pow(ratio, 1.8) * (height - horizonY);

        if (y < height && y > horizonY) {
          const alpha = Math.min(0.18, Math.max(0, ratio * 0.18));
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = Math.min(2, Math.max(0.5, ratio * 2));
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 2. Holographic Cityscape Outlines & Light Trails
      ctx.strokeStyle = 'rgba(0, 82, 255, 0.14)';
      ctx.lineWidth = 1.5;

      const cityBlocks = [
        { x: 30, w: 45, h: 90 }, { x: 80, w: 35, h: 120 }, { x: 125, w: 55, h: 70 },
        { x: 190, w: 40, h: 140 }, { x: 240, w: 50, h: 100 }, { x: 300, w: 35, h: 160 },
        { x: 345, w: 45, h: 80 }, { x: 400, w: 60, h: 110 }, { x: 470, w: 40, h: 130 },
        { x: 520, w: 50, h: 75 }
      ];

      ctx.beginPath();
      cityBlocks.forEach((block, idx) => {
        const bx = block.x + mouseX * 12;
        const by = horizonY - block.h;
        if (idx === 0) ctx.moveTo(bx, horizonY);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + block.w, by);
        ctx.lineTo(bx + block.w, horizonY);
      });
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 243, 10, 0.06)';
      ctx.lineWidth = 1;
      cityBlocks.forEach(block => {
        const bx = block.x + mouseX * 12;
        const by = horizonY - block.h;
        if (block.h > 90) {
          for (let wY = by + 20; wY < horizonY - 20; wY += 24) {
            ctx.beginPath();
            ctx.moveTo(bx + 8, wY);
            ctx.lineTo(bx + 12, wY);
            ctx.moveTo(bx + 20, wY);
            ctx.lineTo(bx + 24, wY);
            ctx.stroke();
          }
        }
      });

      trails.forEach(trail => {
        trail.x += trail.speed;
        if (trail.x > width + 50) trail.x = -trail.length;

        const grad = ctx.createLinearGradient(trail.x, 0, trail.x + trail.length, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, trail.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trail.x + mouseX * 8, trail.laneY + mouseY * 6);
        ctx.lineTo(trail.x + trail.length + mouseX * 8, trail.laneY + mouseY * 6);
        ctx.stroke();
      });

      // 3. Draw 3D Rotating Neural Sphere (Background)
      rotationAngle += 0.003;
      const cosRot = Math.cos(rotationAngle);
      const sinRot = Math.sin(rotationAngle);

      const sphereCenterX = width * 0.35 + mouseX * -35;
      const sphereCenterY = height * 0.45 + mouseY * -25;

      const projectedNodes = nodes.map(node => {
        let x1 = node.origX * cosRot - node.origZ * sinRot;
        let z1 = node.origX * sinRot + node.origZ * cosRot;

        let y2 = node.origY * Math.cos(rotationAngle * 0.5) - z1 * Math.sin(rotationAngle * 0.5);
        let z2 = node.origY * Math.sin(rotationAngle * 0.5) + z1 * Math.cos(rotationAngle * 0.5);

        const scale = 230 / (230 + z2);

        return {
          x: sphereCenterX + x1 * scale,
          y: sphereCenterY + y2 * scale,
          scale: scale,
          z: z2
        };
      });

      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i++) {
        const n1 = projectedNodes[i];
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n2 = projectedNodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (dist < 65) {
            const alpha = Math.min(0.24, (1 - dist / 65) * 0.24) * n1.scale * n2.scale;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      projectedNodes.forEach(n => {
        const r = 2.5 * n.scale;
        const alpha = Math.min(0.7, n.scale * 0.6);
        ctx.fillStyle = n.z > 0 ? `rgba(0, 82, 255, ${alpha})` : `rgba(0, 240, 255, ${alpha + 0.15})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        if (n.z <= 0) {
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Draw Floating AI Data Particles
      particles.forEach(p => {
        p.y -= p.speedY;
        p.drift += p.driftSpeed;
        const currentX = p.x + Math.sin(p.drift) * 8 + mouseX * -20;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(255, 243, 10, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(currentX, p.y + mouseY * -15, p.size, 0, Math.PI * 2);
        ctx.fill();

        projectedNodes.forEach(node => {
          const d = Math.hypot(currentX - node.x, (p.y + mouseY * -15) - node.y);
          if (d < 40) {
            ctx.strokeStyle = `rgba(255, 243, 10, ${(1 - d / 40) * 0.12})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(currentX, p.y + mouseY * -15);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [parallax]);

  // Handle Mousemove parallax offset states
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 580;
    const h = rect.height || 420;
    
    // Normalized coordinates
    const x = (e.clientX - rect.left) / w - 0.5;
    const y = (e.clientY - rect.top) / h - 0.5;

    // Apply smooth tracking interpolation
    setParallax({ x, y });

    // Reflection overlay gradients based on cursor position
    const rxPercent = (x + 0.5) * 100;
    const ryPercent = (y + 0.5) * 100;
    setReflectionStyle({
      background: `radial-gradient(circle at ${rxPercent}% ${ryPercent}%, rgba(255, 255, 255, 0.12) 0%, transparent 65%)`
    });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
    setReflectionStyle({
      background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 65%)',
      transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
    });
  };

  // 3D transform matrices styled based on cursor offset
  const getCardTransform = () => {
    const rx = parallax.y * -22;
    const ry = parallax.x * 22;
    const tx = parallax.x * 25;
    const ty = parallax.y * 25;

    return {
      transform: `rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 40px)`,
      transition: parallax.x === 0 && parallax.y === 0 ? 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
    };
  };

  return (
    <div 
      className={`preview-panel premium-privacy-preview ${isActive ? 'active' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Canvas for 3D Neural Sphere, Grid Floor, City Light Trails, & Particles */}
      <canvas ref={canvasRef} className="premium-canvas"></canvas>
      
      {/* Floating ambient glow orbs */}
      <div className="premium-ambient-glow"></div>
      <div className="premium-lens-flare"></div>

      {/* Main Glassmorphic Card containing SaaS Telemetry & Privacy Shield */}
      <div 
        className="premium-glass-card" 
        ref={cardRef}
        style={getCardTransform()}
      >
        <div className="premium-card-reflection" style={reflectionStyle}></div>
        <div className="premium-card-header">
          <div className="premium-badge-group">
            <span className="premium-mini-badge">STEP 2</span>
            <span className="premium-status-indicator">
              <span className="indicator-pulse"></span>
              ACTIVE DEEP LEARNING
            </span>
          </div>
          
          {/* Animated Privacy Shield Icon built from SVG & CSS */}
          <div className="premium-shield-container">
            <svg viewBox="0 0 100 100" className="premium-shield-svg">
              <path d="M 50,15 L 80,25 L 80,55 C 80,75 50,88 50,88 C 50,88 20,75 20,55 L 20,25 Z" className="shield-outline" />
              <path d="M 50,22 L 73,30 L 73,53 C 73,70 50,80 50,80 C 50,80 27,70 27,53 L 27,30 Z" className="shield-inner" />
              <circle cx="50" cy="50" r="14" className="shield-core" />
              <path d="M 38,50 L 62,50" className="shield-line" />
              <path d="M 50,38 L 50,62" className="shield-line" />
            </svg>
          </div>
        </div>
        
        <div className="premium-card-body">
          <h4>Privacy-First AI</h4>
          <p>Advanced edge AI automatically anonymizes faces and vehicle identifiers in real time, delivering enterprise-grade analytics with complete data security.</p>
        </div>
        
        <div className="premium-card-footer">
          <div className="realtime-logs-feed">
            <div className="log-stream-item">&gt;&gt; SYNC_NODE_INIT: SUCCESS [99.2% CONF]</div>
            <div className="log-stream-item">&gt;&gt; HASH_STREAM: BLURRING EDGE VECTOR...</div>
          </div>
        </div>
      </div>

      {/* Hovering telemetry tag in mid-air */}
      <div className="premium-hovering-tag tag-left">
        <div className="tag-label">PRIVACY EXCLUSION FIELD</div>
        <div className="tag-value text-cyan">99.8% ANONYMIZATION INDEX</div>
      </div>
      
      <div className="premium-hovering-tag tag-right">
        <div className="tag-label">GDPR PROTOCOL</div>
        <div className="tag-value text-blue">COMPLIANT [AES-256]</div>
      </div>
    </div>
  );
}
