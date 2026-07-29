import React, { useEffect, useRef } from 'react';

export default function SmartCityBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Objects Setup
    const buildings = [
      { x: -350, z: 400, w: 70, d: 70, h: 220 },
      { x: -200, z: 650, w: 90, d: 90, h: 320 },
      { x: -380, z: 900, w: 75, d: 75, h: 260 },
      { x: 300, z: 450, w: 70, d: 70, h: 200 },
      { x: 220, z: 700, w: 100, d: 100, h: 340 },
      { x: 360, z: 1000, w: 80, d: 80, h: 280 },
      { x: -120, z: 500, w: 60, d: 60, h: 180 },
      { x: 120, z: 520, w: 60, d: 60, h: 190 },
      { x: -140, z: 1150, w: 85, d: 85, h: 300 },
      { x: 150, z: 1250, w: 90, d: 90, h: 310 },
      { x: -550, z: 600, w: 70, d: 70, h: 160 },
      { x: 550, z: 650, w: 70, d: 70, h: 170 }
    ];

    // Rooftop Connections
    const connections = [];
    for (let i = 0; i < buildings.length; i++) {
      for (let j = i + 1; j < buildings.length; j++) {
        const dx = buildings[i].x - buildings[j].x;
        const dz = buildings[i].z - buildings[j].z;
        const dist = Math.hypot(dx, dz);
        if (dist < 420) {
          connections.push({ from: i, to: j, packets: [] });
        }
      }
    }

    // Vehicles
    const vehicles = [];
    const numVehicles = 25;
    for (let i = 0; i < numVehicles; i++) {
      const isLong = Math.random() > 0.5;
      const style = Math.random() > 0.3 ? 'car' : (Math.random() > 0.5 ? 'bus' : 'bike');
      if (isLong) {
        const x = [ -350, 0, 350 ][Math.floor(Math.random() * 3)];
        const dir = Math.random() > 0.5 ? 1 : -1;
        vehicles.push({
          type: 'long',
          x,
          z: Math.random() * 1200 + 200,
          dir,
          speed: (1.2 + Math.random() * 1.5) * dir,
          style,
          bbox: Math.random() > 0.75
        });
      } else {
        const z = [ 400, 800, 1200 ][Math.floor(Math.random() * 3)];
        const dir = Math.random() > 0.5 ? 1 : -1;
        vehicles.push({
          type: 'lat',
          x: Math.random() * 1200 - 600,
          z,
          dir,
          speed: (1.5 + Math.random() * 1.8) * dir,
          style,
          bbox: Math.random() > 0.75
        });
      }
    }

    // Sky Neural Sphere particles
    const sphereNodes = [];
    const numSphereNodes = 90;
    const sphereRadius = 120;
    const sphereCenter = { x: 0, y: -380, z: 1200 };
    for (let i = 0; i < numSphereNodes; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numSphereNodes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      sphereNodes.push({
        ox: Math.sin(phi) * Math.cos(theta) * sphereRadius,
        oy: Math.cos(phi) * sphereRadius,
        oz: Math.sin(phi) * Math.sin(theta) * sphereRadius,
        x: 0, y: 0, z: 0
      });
    }
    let sphereRotation = 0;

    // Floating particles
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * 1400 - 700,
        y: Math.random() * -100 - 50,
        z: Math.random() * 1200 + 200,
        size: 1 + Math.random() * 2,
        speedY: 0.2 + Math.random() * 0.4,
        alpha: 0.15 + Math.random() * 0.3
      });
    }

    // Camera settings
    const cam = {
      x: 0,
      y: -260,
      z: -250,
      pitch: 0.32,
      yaw: 0.0,
      fov: 650
    };

    // Parallax state
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    const handleMouseMove = (e) => {
      targetTiltX = (e.clientX / window.innerWidth) - 0.5;
      targetTiltY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Scanner sweep depth
    let sweepZ = 200;
    let sweepSpeed = 3.5;

    // Projection math helper
    function project(X, Y, Z) {
      let x = X - cam.x - tiltX * 180;
      let y = Y - cam.y - tiltY * 120;
      let z = Z - cam.z;
      
      const yawAngle = cam.yaw - tiltX * 0.12;
      const cosY = Math.cos(yawAngle);
      const sinY = Math.sin(yawAngle);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      
      const pitchAngle = cam.pitch + tiltY * 0.08;
      const cosP = Math.cos(pitchAngle);
      const sinP = Math.sin(pitchAngle);
      let y1 = y * cosP - z1 * sinP;
      let z2 = y * sinP + z1 * cosP;
      
      if (z2 <= 20) return null;
      
      const scale = cam.fov / z2;
      return {
        x: width / 2 + x1 * scale,
        y: height / 2 + y1 * scale,
        scale,
        depth: z2
      };
    }

    let animFrameId;

    // Drawing frame
    function draw() {
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, width, height);

      // Parallax easing
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;

      // Scanning line
      sweepZ += sweepSpeed;
      if (sweepZ > 1400) sweepZ = 200;

      // Rotating globe
      sphereRotation += 0.003;

      // 1. Street Grid lines
      ctx.strokeStyle = 'rgba(0, 82, 255, 0.06)';
      ctx.lineWidth = 1;
      
      const longX = [-350, 0, 350];
      longX.forEach(x => {
        ctx.beginPath();
        let first = true;
        for (let z = 200; z <= 1400; z += 50) {
          const p = project(x, 0, z);
          if (p) {
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else { ctx.lineTo(p.x, p.y); }
          }
        }
        ctx.stroke();
      });

      const latZ = [400, 800, 1200];
      latZ.forEach(z => {
        ctx.beginPath();
        let first = true;
        for (let x = -600; x <= 600; x += 50) {
          const p = project(x, 0, z);
          if (p) {
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else { ctx.lineTo(p.x, p.y); }
          }
        }
        ctx.stroke();
      });

      // Intersections fuzzy circles (heatmaps)
      longX.forEach(lx => {
        latZ.forEach(lz => {
          const p = project(lx, 0, lz);
          if (p) {
            const pulseRadius = 18 * p.scale * (1 + Math.sin(Date.now() * 0.002) * 0.2);
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseRadius);
            grad.addColorStop(0, 'rgba(0, 216, 255, 0.12)');
            grad.addColorStop(0.5, 'rgba(0, 153, 255, 0.03)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      // 2. Rooftop connections (network wires)
      connections.forEach(conn => {
        const b1 = buildings[conn.from];
        const b2 = buildings[conn.to];
        const p1 = project(b1.x, -b1.h, b1.z);
        const p2 = project(b2.x, -b2.h, b2.z);
        
        if (p1 && p2) {
          const centerZ = (b1.z + b2.z) / 2;
          const dSweep = Math.abs(centerZ - sweepZ);
          const isScanning = dSweep < 150;
          
          ctx.strokeStyle = isScanning 
            ? `rgba(0, 216, 255, ${0.15 + (1 - dSweep/150)*0.2})` 
            : 'rgba(0, 153, 255, 0.08)';
          ctx.lineWidth = isScanning ? 1.5 : 0.8;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          if (Math.random() < 0.015 && conn.packets.length < 3) {
            conn.packets.push({ progress: 0, speed: 0.01 + Math.random() * 0.015 });
          }

          conn.packets.forEach((pack, pIdx) => {
            pack.progress += pack.speed;
            if (pack.progress >= 1) {
              conn.packets.splice(pIdx, 1);
              return;
            }
            const px = p1.x + (p2.x - p1.x) * pack.progress;
            const py = p1.y + (p2.y - p1.y) * pack.progress;
            const pScale = p1.scale + (p2.scale - p1.scale) * pack.progress;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, 1.8 * pScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(0, 216, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(px, py, 4 * pScale, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // 3. Vehicles and Object Bounding boxes
      vehicles.forEach(v => {
        if (v.type === 'long') {
          v.z += v.speed;
          if (v.speed > 0 && v.z > 1400) v.z = 200;
          if (v.speed < 0 && v.z < 200) v.z = 1400;
        } else {
          v.x += v.speed;
          if (v.speed > 0 && v.x > 600) v.x = -600;
          if (v.speed < 0 && v.x < -600) v.x = 600;
        }

        const p = project(v.x, 0, v.z);
        if (p) {
          const trailLength = v.speed * 2.5;
          const pTrail = v.type === 'long' 
            ? project(v.x, 0, v.z - trailLength)
            : project(v.x - trailLength, 0, v.z);

          ctx.lineWidth = 1.5 * p.scale;
          ctx.strokeStyle = v.dir > 0 ? 'rgba(0, 216, 255, 0.6)' : 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          if (pTrail) ctx.lineTo(pTrail.x, pTrail.y);
          ctx.stroke();

          if (v.bbox) {
            const boxW = v.style === 'bus' ? 14 : 8;
            const boxH = v.style === 'bus' ? 14 : 7;
            
            const corners = [
              project(v.x - boxW, 0, v.z - boxW),
              project(v.x + boxW, 0, v.z - boxW),
              project(v.x + boxW, -boxH*2, v.z - boxW),
              project(v.x - boxW, -boxH*2, v.z - boxW)
            ];

            if (corners.every(c => c !== null)) {
              ctx.strokeStyle = 'rgba(0, 216, 255, 0.35)';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(corners[0].x, corners[0].y);
              corners.forEach(c => ctx.lineTo(c.x, c.y));
              ctx.closePath();
              ctx.stroke();

              ctx.strokeStyle = '#00D8FF';
              ctx.lineWidth = 1.5;
              corners.forEach((c, idx) => {
                const next = corners[(idx + 1) % 4];
                const prev = corners[(idx + 3) % 4];
                const dxN = (next.x - c.x) * 0.25;
                const dyN = (next.y - c.y) * 0.25;
                const dxP = (prev.x - c.x) * 0.25;
                const dyP = (prev.y - c.y) * 0.25;

                ctx.beginPath();
                ctx.moveTo(c.x + dxN, c.y + dyN);
                ctx.lineTo(c.x, c.y);
                ctx.lineTo(c.x + dxP, c.y + dyP);
                ctx.stroke();
              });

              ctx.fillStyle = '#00D8FF';
              ctx.font = `${Math.max(7, 8 * corners[2].scale)}px monospace`;
              ctx.fillText(v.style === 'bus' ? 'BUS 98%' : 'CAR 94%', corners[3].x, corners[3].y - 3);
            }
          }
        }
      });

      // 4. Skyscraper Buildings
      buildings.forEach(b => {
        const distToSweep = Math.abs(b.z - sweepZ);
        const isScanning = distToSweep < 150;
        
        let glowVal = 0.15;
        if (isScanning) {
          glowVal = 0.15 + (1 - distToSweep / 150) * 0.35;
        }

        const bWidth = b.w / 2;
        const bDepth = b.d / 2;

        const pB = [
          project(b.x - bWidth, 0, b.z - bDepth),
          project(b.x + bWidth, 0, b.z - bDepth),
          project(b.x + bWidth, 0, b.z + bDepth),
          project(b.x - bWidth, 0, b.z + bDepth)
        ];

        const pT = [
          project(b.x - bWidth, -b.h, b.z - bDepth),
          project(b.x + bWidth, -b.h, b.z - bDepth),
          project(b.x + bWidth, -b.h, b.z + bDepth),
          project(b.x - bWidth, -b.h, b.z + bDepth)
        ];

        if (pB.every(p => p !== null) && pT.every(p => p !== null)) {
          ctx.fillStyle = `rgba(0, 153, 255, ${glowVal * 0.08})`;
          ctx.beginPath();
          ctx.moveTo(pB[0].x, pB[0].y);
          ctx.lineTo(pB[1].x, pB[1].y);
          ctx.lineTo(pT[1].x, pT[1].y);
          ctx.lineTo(pT[0].x, pT[0].y);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(pB[1].x, pB[1].y);
          ctx.lineTo(pB[2].x, pB[2].y);
          ctx.lineTo(pT[2].x, pT[2].y);
          ctx.lineTo(pT[1].x, pT[1].y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = `rgba(0, 216, 255, ${glowVal})`;
          ctx.lineWidth = isScanning ? 1.2 : 0.7;

          ctx.beginPath();
          ctx.moveTo(pB[0].x, pB[0].y);
          pB.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.stroke();

          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(pB[i].x, pB[i].y);
            ctx.lineTo(pT[i].x, pT[i].y);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.moveTo(pT[0].x, pT[0].y);
          pT.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.stroke();

          ctx.strokeStyle = `rgba(0, 216, 255, ${glowVal * 0.35})`;
          ctx.lineWidth = 0.5;
          const numFloors = b.h / 35;
          for (let i = 1; i < numFloors; i++) {
            const fh = (b.h / numFloors) * i;
            const pF = [
              project(b.x - bWidth, -fh, b.z - bDepth),
              project(b.x + bWidth, -fh, b.z - bDepth),
              project(b.x + bWidth, -fh, b.z + bDepth),
              project(b.x - bWidth, -fh, b.z + bDepth)
            ];
            if (pF.every(p => p !== null)) {
              ctx.beginPath();
              ctx.moveTo(pF[0].x, pF[0].y);
              pF.forEach(p => ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      });

      // 5. Sky Sphere (Rotating Neural Hub)
      const projCenter = project(sphereCenter.x, sphereCenter.y, sphereCenter.z);
      if (projCenter) {
        const projectedSphereNodes = sphereNodes.map(node => {
          const cosR = Math.cos(sphereRotation);
          const sinR = Math.sin(sphereRotation);
          let rx = node.ox * cosR - node.oz * sinR;
          let rz = node.ox * sinR + node.oz * cosR;
          let ry = node.oy;

          return project(sphereCenter.x + rx, sphereCenter.y + ry, sphereCenter.z + rz);
        });

        ctx.lineWidth = 0.5;
        for (let i = 0; i < projectedSphereNodes.length; i++) {
          const n1 = projectedSphereNodes[i];
          if (!n1) continue;
          for (let j = i + 1; j < projectedSphereNodes.length; j++) {
            const n2 = projectedSphereNodes[j];
            if (!n2) continue;
            const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
            if (dist < 45) {
              const alpha = (1 - dist / 45) * 0.16 * n1.scale * n2.scale;
              ctx.strokeStyle = `rgba(0, 216, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        }

        projectedSphereNodes.forEach(n => {
          if (!n) return;
          const r = 1.8 * n.scale;
          ctx.fillStyle = `rgba(255, 255, 255, ${n.scale * 0.6})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 6. Floating data dust particles
      particles.forEach(p => {
        p.y += p.speedY;
        if (p.y > 0) {
          p.y = Math.random() * -100 - 50;
          p.x = Math.random() * 1400 - 700;
          p.z = Math.random() * 1200 + 200;
        }

        const projPart = project(p.x, p.y, p.z);
        if (projPart) {
          ctx.fillStyle = `rgba(0, 216, 255, ${p.alpha * projPart.scale})`;
          ctx.beginPath();
          ctx.arc(projPart.x, projPart.y, p.size * projPart.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 7. Depth Scanner sweep line
      const gridWidth = 700;
      const pLeft = project(-gridWidth, 0, sweepZ);
      const pRight = project(gridWidth, 0, sweepZ);

      if (pLeft && pRight) {
        const grad = ctx.createLinearGradient(pLeft.x, pLeft.y, pRight.x, pRight.y);
        grad.addColorStop(0, 'rgba(0, 216, 255, 0)');
        grad.addColorStop(0.5, 'rgba(0, 216, 255, 0.28)');
        grad.addColorStop(1, 'rgba(0, 216, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4 * pLeft.scale;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(0, 216, 255, ${0.4 * pLeft.scale})`;
        ctx.lineWidth = 1 * pLeft.scale;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      animFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="global-city-bg" />;
}
