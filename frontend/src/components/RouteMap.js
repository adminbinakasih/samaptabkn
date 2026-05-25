'use client';

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function RouteMap({
  routePoints = [],
  currentPosition = null,
  isTracking = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMarkerRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const hasAutoFitRef = useRef(false);
  const isUserInteractingRef = useRef(false);

  const routeCoordinates = useMemo(() => {
    return routePoints.map((point) => [
      parseFloat(point.latitude),
      parseFloat(point.longitude),
    ]);
  }, [routePoints]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialCenter = currentPosition
      ? [currentPosition.latitude, currentPosition.longitude]
      : [-6.2088, 106.8456];

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Detect user interaction so we don't force-pan while they're exploring
    mapInstanceRef.current.on('dragstart', () => {
      isUserInteractingRef.current = true;
    });
    mapInstanceRef.current.on('zoomstart', () => {
      isUserInteractingRef.current = true;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update polyline and start marker when routePoints change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Draw / update polyline
    if (routeCoordinates.length > 1) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(routeCoordinates);
      } else {
        polylineRef.current = L.polyline(routeCoordinates, {
          color: isTracking ? '#f97316' : '#3b82f6',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(mapInstanceRef.current);
      }
      // Update color based on tracking state
      polylineRef.current.setStyle({
        color: isTracking ? '#f97316' : '#3b82f6',
      });
    }

    // Add start marker once
    if (routeCoordinates.length > 0 && !startMarkerRef.current) {
      startMarkerRef.current = L.circleMarker(routeCoordinates[0], {
        radius: 9,
        fillColor: '#10b981',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindTooltip('Start', { permanent: false, direction: 'top' })
        .addTo(mapInstanceRef.current);
    }

    // Auto-fit bounds to full route when tracking stops (finish)
    if (!isTracking && routeCoordinates.length > 1) {
      mapInstanceRef.current.fitBounds(
        L.latLngBounds(routeCoordinates).pad(0.15)
      );
      hasAutoFitRef.current = true;
    }
  }, [routeCoordinates, isTracking]);

  // Update current position marker — smooth follow
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    const latlng = [currentPosition.latitude, currentPosition.longitude];

    if (currentMarkerRef.current) {
      // Move existing marker
      currentMarkerRef.current.setLatLng(latlng);
    } else {
      // Create pulsing current-position marker
      const pulseIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
          ">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: rgba(249,115,22,0.3);
              animation: pulse 1.5s ease-out infinite;
            "></div>
            <div style="
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 12px; height: 12px;
              border-radius: 50%;
              background: #f97316;
              border: 2px solid #fff;
              box-shadow: 0 0 6px rgba(0,0,0,0.4);
            "></div>
          </div>
          <style>
            @keyframes pulse {
              0%   { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      currentMarkerRef.current = L.marker(latlng, { icon: pulseIcon, zIndexOffset: 1000 })
        .bindTooltip('Posisi Kamu', { permanent: false, direction: 'top' })
        .addTo(mapInstanceRef.current);
    }

    // Auto-follow: pan to current position only if user hasn't manually moved the map
    if (isTracking && !isUserInteractingRef.current) {
      mapInstanceRef.current.panTo(latlng, { animate: true, duration: 0.5 });
    }
  }, [currentPosition, isTracking]);

  // Re-center button: tap map to re-enable auto-follow
  // (reset user interaction flag when tracking is active and user double-taps)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleDblClick = () => {
      if (isTracking) {
        isUserInteractingRef.current = false;
      }
    };
    map.on('dblclick', handleDblClick);
    return () => map.off('dblclick', handleDblClick);
  }, [isTracking]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />

      {/* Re-center button */}
      {isTracking && currentPosition && (
        <button
          onClick={() => {
            isUserInteractingRef.current = false;
            if (mapInstanceRef.current && currentPosition) {
              mapInstanceRef.current.setView(
                [currentPosition.latitude, currentPosition.longitude],
                17,
                { animate: true }
              );
            }
          }}
          className="absolute bottom-4 right-4 z-[1000] bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg border border-orange-500/40 backdrop-blur-sm transition-all"
          title="Kembali ke posisi saya"
        >
          📍 Ikuti Saya
        </button>
      )}

      {/* GPS accuracy indicator */}
      {currentPosition && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-800/80 text-xs text-white/70 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
          GPS ±{currentPosition.accuracy ? Math.round(currentPosition.accuracy) : '?'}m
        </div>
      )}
    </div>
  );
}
