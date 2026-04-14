"use client";

import { useEffect, useRef } from "react";
import { useTenant } from "@/components/themes/TenantContext";
import type { Listing } from "@/types/tenant";

interface MapInnerProps {
  listings: Partial<Listing>[];
}

export default function MapInner({ listings }: MapInnerProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const { profile } = useTenant();
  const primary    = profile.primary_color ?? "#FF7F11";

  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstance: import("leaflet").Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;

      // Fix Next.js icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Default center: Santa Cruz, Bolivia
      mapInstance = L.map(mapRef.current!, {
        center: [-17.7833, -63.1833],
        zoom:   12,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      // Dark base tile
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains:  "abcd",
        maxZoom:     19,
      }).addTo(mapInstance);

      const listingsWithCoords = listings.filter(l => l.lat && l.lng);

      if (listingsWithCoords.length > 0) {
        const bounds: [number, number][] = [];

        listingsWithCoords.forEach((listing) => {
          // Pulsing dot marker
          const icon = L.divIcon({
            className: "",
            html: `
              <div style="position:relative;width:18px;height:18px">
                <div style="position:absolute;inset:0;border-radius:50%;background:${primary};opacity:0.25;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
                <div style="position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:${primary};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>
              </div>
              <style>@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}</style>
            `,
            iconSize:   [18, 18],
            iconAnchor: [9, 9],
          });

          const marker = L.marker([listing.lat!, listing.lng!], { icon });

          const priceStr = listing.price
            ? listing.currency === "BOB"
              ? `Bs. ${listing.price.toLocaleString()}`
              : `$${listing.price.toLocaleString()}`
            : "";

          const badgeColor = listing.status === "activo" ? "#22c55e" : "#6b7280";

          marker.bindPopup(`
            <div style="font-family:'Manrope',sans-serif;min-width:200px;max-width:240px;padding:4px">
              ${listing.images?.[0] ? `<img src="${listing.images[0]}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:4px;margin-bottom:8px;display:block"/>` : ""}
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="background:${badgeColor};color:#fff;font-size:9px;padding:2px 6px;border-radius:2px;letter-spacing:0.1em;text-transform:uppercase">${listing.status ?? ""}</span>
                ${listing.property_type ? `<span style="color:#888;font-size:10px;text-transform:capitalize">${listing.property_type}</span>` : ""}
              </div>
              <strong style="font-size:12.5px;color:#1a1a1a;display:block;line-height:1.35;margin-bottom:3px">${listing.title ?? "Propiedad"}</strong>
              ${priceStr ? `<p style="margin:0 0 3px;color:${primary};font-weight:700;font-size:13px">${priceStr}</p>` : ""}
              ${listing.neighborhood ? `<p style="margin:0 0 8px;font-size:10px;color:#888">${listing.neighborhood}</p>` : ""}
              <a href="/propiedades/${listing.slug}" style="display:inline-block;background:${primary};color:#fff;font-size:10px;padding:5px 12px;border-radius:2px;text-decoration:none;font-weight:600;letter-spacing:0.05em">Ver propiedad →</a>
            </div>
          `, { maxWidth: 260 });

          marker.addTo(mapInstance!);
          bounds.push([listing.lat!, listing.lng!]);
        });

        // Fit all markers in view
        if (bounds.length === 1) {
          mapInstance.setView(bounds[0], 14);
        } else if (bounds.length > 1) {
          mapInstance.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
        }
      }
    })();

    return () => { mapInstance?.remove(); };
  }, [listings, primary]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", minHeight: 400, borderRadius: 2 }}
    />
  );
}
