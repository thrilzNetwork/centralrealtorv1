"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types/tenant";

// Leaflet requires browser APIs — must be imported dynamically with SSR disabled
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[#E2E8CE] flex items-center justify-center rounded-sm">
      <span className="label-caps text-[#6B7565]">Cargando mapa...</span>
    </div>
  ),
});

interface RealtorV1MapProps {
  listings: Partial<Listing>[];
}

export function RealtorV1Map({ listings }: RealtorV1MapProps) {
  return <MapInner listings={listings} />;
}
