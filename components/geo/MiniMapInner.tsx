"use client";

import { useEffect, useRef } from "react";

interface MiniMapInnerProps {
  lat: number;
  lng: number;
  label?: string;
}

export default function MiniMapInner({ lat, lng, label }: MiniMapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstance: import("leaflet").Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      if (!mapRef.current) return;

      mapInstance = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(mapInstance);

      // Orange dot marker
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#FF7F11;border:3px solid white;box-shadow:0 2px 8px rgba(255,127,17,0.5)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([lat, lng], { icon });
      if (label) marker.bindPopup(label);
      marker.addTo(mapInstance);
    })();

    return () => {
      mapInstance?.remove();
    };
  }, [lat, lng, label]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-sm border border-[#EAE7DC] overflow-hidden"
      style={{ height: 200, zIndex: 0 }}
    />
  );
}
