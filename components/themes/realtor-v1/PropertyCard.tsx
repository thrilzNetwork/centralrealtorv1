"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/formatCurrency";
import { useTenant } from "@/components/themes/TenantContext";
import type { Listing } from "@/types/tenant";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Dpto.",
  terreno: "Terreno",
  oficina: "Oficina",
  local_comercial: "Local",
  otro: "Otro",
};

interface PropertyCardProps {
  listing: Partial<Listing>;
}

export function PropertyCard({ listing }: PropertyCardProps) {
  const { profile } = useTenant();
  const primaryImage = listing.images?.[0];

  return (
    <Link
      href={`/propiedades/${listing.slug}`}
      className="block group bg-white border border-[#EAE7DC] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#E2E8CE]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={listing.title ?? "Propiedad"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}

        {/* Type badge */}
        {listing.property_type && (
          <div
            className="absolute top-3 left-3 px-2 py-1 text-white label-caps rounded-sm"
            style={{ backgroundColor: profile.primary_color }}
          >
            {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
          </div>
        )}

        {/* Hearts count */}
        {(listing.hearts ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm flex items-center gap-1">
            <svg className="w-3 h-3 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span className="text-xs text-[#262626] font-medium">{listing.hearts}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-[#262626] mb-1 line-clamp-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}
        >
          {listing.title}
        </h3>

        {listing.neighborhood && (
          <p className="label-caps text-[#6B7565] mb-3">{listing.neighborhood}</p>
        )}

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-[#6B7565] mb-4">
          {listing.area_m2 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {listing.area_m2} m²
            </span>
          )}
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {listing.bedrooms} hab.
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {listing.bathrooms} baños
            </span>
          )}
        </div>

        {/* Price */}
        {listing.price && (
          <div className="flex items-center justify-between">
            <span
              className="font-semibold text-lg"
              style={{ color: profile.primary_color, fontFamily: "Cormorant Garamond, Georgia, serif" }}
            >
              {formatPrice(listing.price, listing.currency ?? "USD")}
            </span>
            <span
              className="label-caps text-xs transition-opacity opacity-0 group-hover:opacity-100"
              style={{ color: profile.primary_color }}
            >
              Ver detalle →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
