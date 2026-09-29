import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Destination coordinate along bearing in degrees for distance d in meters
function computeDestinationPoint(lat, lng, distanceMeters, bearingDegrees) {
  const R = 6378137; // Earth radius in meters
  const δ = distanceMeters / R;
  const θ = (bearingDegrees * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2);
  const λ2 = λ1 + Math.atan2(y, x);

  return [ (φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI ];
}

export default function VisibilityCorridorMap({ billboard, config }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const baseTileRef = useRef(null);
  const [mapType, setMapType] = useState('dark');

  const lat = billboard?.latitude ? Number(billboard.latitude) : (config?.board_latitude ? Number(config.board_latitude) : 13.0827);
  const lng = billboard?.longitude ? Number(billboard.longitude) : (config?.board_longitude ? Number(config.board_longitude) : 80.2707);

  const isCalibrated = !!config && Number(config.effective_visibility_distance) > 0;
  const roadDirection = Number(config?.road_direction) || 100;
  const boardOrientation = Number(config?.board_orientation) || 105;
  const startDist = Number(config?.visibility_start_distance) || 220;
  const endDist = Number(config?.visibility_end_distance) || 20;
  const fovAngle = Number(config?.field_of_view_angle) || 60;
  const effectiveDistance = Number(config?.effective_visibility_distance) || (startDist + endDist);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileUrl =
      mapType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const baseTile = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    baseTileRef.current = baseTile;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on type change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const tileUrl =
      mapType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current);
    }
    const newBase = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    baseTileRef.current = newBase;
  }, [mapType]);

  // Render Geometry & Corridor Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Billboard Point & Marker
    const bbIcon = L.divIcon({
      className: 'custom-bb-icon',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(0,240,255,0.25); border:2px solid #00f0ff; box-shadow:0 0 15px #00f0ff; animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:24px; height:24px; border-radius:6px; background:#0f172a; border:1.5px solid #00f0ff; display:flex; align-items:center; justify-content:center; color:#00f0ff; font-size:12px; z-index:2;">
            <i class="fa-solid fa-tv"></i>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const bbMarker = L.marker([lat, lng], { icon: bbIcon }).addTo(layerGroup);
    bbMarker.bindPopup(`
      <div style="color:#0f172a; font-family:sans-serif; font-size:12px; font-weight:bold;">
        <div>${billboard?.billboard_code || 'Billboard Asset'}</div>
        <div style="font-size:10px; color:#475569; font-weight:normal;">Facing: ${boardOrientation}°</div>
      </div>
    `);

    // 2. Billboard Facing Vector (Indicator Arrow)
    const facingEndpoint = computeDestinationPoint(lat, lng, 35, boardOrientation);
    const facingLine = L.polyline([[lat, lng], facingEndpoint], {
      color: '#00f0ff',
      weight: 3,
      dashArray: '4, 4',
      opacity: 0.9,
    }).addTo(layerGroup);

    if (isCalibrated) {
      // 3. Compute D_first (upstream along reverse road heading)
      // Reverse direction: (roadDirection + 180) % 360
      const reverseHeading = (roadDirection + 180) % 360;
      const startPoint = computeDestinationPoint(lat, lng, startDist, reverseHeading);

      // 4. Compute D_last (downstream along forward road heading)
      const endPoint = computeDestinationPoint(lat, lng, endDist, roadDirection);

      // 5. Visibility Corridor Polyline along road travel path
      const corridorLine = L.polyline([startPoint, [lat, lng], endPoint], {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.85,
      }).addTo(layerGroup);

      // 6. Corridor Buffer Polygon (Width ~ 18 meters for road catchment)
      const leftStart = computeDestinationPoint(startPoint[0], startPoint[1], 10, (roadDirection - 90 + 360) % 360);
      const rightStart = computeDestinationPoint(startPoint[0], startPoint[1], 10, (roadDirection + 90) % 360);
      const leftEnd = computeDestinationPoint(endPoint[0], endPoint[1], 10, (roadDirection - 90 + 360) % 360);
      const rightEnd = computeDestinationPoint(endPoint[0], endPoint[1], 10, (roadDirection + 90) % 360);

      const corridorPolygon = L.polygon([leftStart, rightStart, rightEnd, leftEnd], {
        color: '#00f0ff',
        weight: 1.5,
        fillColor: '#00f0ff',
        fillOpacity: 0.18,
      }).addTo(layerGroup);

      corridorPolygon.bindTooltip(
        `<strong>Visibility Corridor</strong><br/>Length: ${effectiveDistance} m<br/>Approach: ${startDist}m | Departure: ${endDist}m`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      // 7. Start Point Marker (D_first)
      const startIcon = L.divIcon({
        className: 'corridor-start-icon',
        html: `
          <div style="background:#0284c7; color:#fff; border:1px solid #38bdf8; border-radius:4px; padding:2px 5px; font-size:10px; font-family:monospace; font-weight:bold; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
            D_first (−${startDist}m)
          </div>
        `,
        iconAnchor: [30, 24],
      });
      L.marker(startPoint, { icon: startIcon }).addTo(layerGroup);

      // 8. End Point Marker (D_last)
      const endIcon = L.divIcon({
        className: 'corridor-end-icon',
        html: `
          <div style="background:#0f172a; color:#38bdf8; border:1px solid #38bdf8; border-radius:4px; padding:2px 5px; font-size:10px; font-family:monospace; font-weight:bold; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
            D_last (+${endDist}m)
          </div>
        `,
        iconAnchor: [30, 24],
      });
      L.marker(endPoint, { icon: endIcon }).addTo(layerGroup);

      // 9. Direction of Travel Arrow
      const midPoint = computeDestinationPoint(startPoint[0], startPoint[1], startDist * 0.5, roadDirection);
      const travelArrowIcon = L.divIcon({
        className: 'travel-arrow-icon',
        html: `
          <div style="transform: rotate(${roadDirection}deg); color:#00f0ff; font-size:16px; text-shadow:0 0 6px #00f0ff;">
            ▲
          </div>
        `,
        iconAnchor: [8, 8],
      });
      L.marker(midPoint, { icon: travelArrowIcon }).addTo(layerGroup);

      // 10. Forward FOV Vision Wedge from Billboard
      const leftFovBearing = (boardOrientation - fovAngle / 2 + 360) % 360;
      const rightFovBearing = (boardOrientation + fovAngle / 2) % 360;
      const leftFovPoint = computeDestinationPoint(lat, lng, 120, leftFovBearing);
      const rightFovPoint = computeDestinationPoint(lat, lng, 120, rightFovBearing);

      L.polygon([[lat, lng], leftFovPoint, rightFovPoint], {
        color: '#60a5fa',
        weight: 1,
        dashArray: '3, 3',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
      }).addTo(layerGroup);

      // Fit map to corridor bounds
      const bounds = L.latLngBounds([startPoint, endPoint, [lat, lng]]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    } else {
      map.setView([lat, lng], 17);
    }
  }, [lat, lng, isCalibrated, roadDirection, boardOrientation, startDist, endDist, fovAngle, effectiveDistance]);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/10 bg-[#070a14] shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Control Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#090d1a]/90 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
          Corridor Spatial Map
        </span>
      </div>

      {/* Basemap Switcher */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-1 bg-[#090d1a]/90 backdrop-blur-md border border-white/15 p-1 rounded-xl shadow-lg">
        <button
          onClick={() => setMapType('dark')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
            mapType === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Dark GIS
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
            mapType === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Map Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 bg-[#090d1a]/90 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl text-[10px] font-mono text-slate-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400 border border-cyan-300 shadow-[0_0_6px_#00f0ff]" />
            <span>Billboard Face ({boardOrientation}°)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded bg-blue-500" />
            <span>Corridor Path ({effectiveDistance} m)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">▲</span>
            <span>Travel Flow ({roadDirection}°)</span>
          </span>
        </div>

        <div className="text-slate-400">
          GIS Coordinates: <strong className="text-white">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong>
        </div>
      </div>
    </div>
  );
}
