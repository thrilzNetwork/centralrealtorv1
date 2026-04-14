"use client";

import dynamic from "next/dynamic";

const MiniMapInner = dynamic(() => import("./MiniMapInner"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-sm border border-[#EAE7DC] bg-[#F7F5EE] flex items-center justify-center"
      style={{ height: 200 }}
    >
      <div className="w-5 h-5 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface MiniMapProps {
  lat: number;
  lng: number;
  label?: string;
}

export function MiniMap({ lat, lng, label }: MiniMapProps) {
  return <MiniMapInner lat={lat} lng={lng} label={label} />;
}
