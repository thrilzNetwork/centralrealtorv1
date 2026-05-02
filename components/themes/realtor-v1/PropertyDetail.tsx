"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTenant } from "@/components/themes/TenantContext";
import { RealtorV1Header } from "./RealtorV1Header";
import { RealtorV1Footer } from "./RealtorV1Footer";
import { HeartButton } from "@/components/property/HeartButton";
import { formatPrice } from "@/lib/utils/formatCurrency";
import { decodeHtmlEntities } from "@/lib/utils/decode-entities";
import type { Listing } from "@/types/tenant";

const PropertyMapInner = dynamic(() => import("./PropertyMapInner"), { ssr: false, loading: () => <div style={{ height: 260, background: "#E2E8CE", borderRadius: 4 }} /> });

interface PropertyDetailProps {
  listing: Listing;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  oficina: "Oficina",
  local_comercial: "Local Comercial",
  otro: "Otro",
};

export function PropertyDetail({ listing }: PropertyDetailProps) {
  const { profile } = useTenant();
  const [activeImage, setActiveImage] = useState(0);
  const decodedDescription = decodeHtmlEntities(listing.description ?? "");
  const primaryColor = profile.primary_color ?? "#FF7F11";

  return (
    <div className="min-h-screen bg-[#F7F5EE]">
      <RealtorV1Header />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] sm:text-xs text-[#6B7565] mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
          <a href="/" className="hover:text-[#262626] transition-colors shrink-0">Inicio</a>
          <span className="shrink-0">/</span>
          <a href="/propiedades" className="hover:text-[#262626] transition-colors shrink-0">Inmuebles</a>
          <span className="shrink-0">/</span>
          <span className="text-[#262626] truncate">{listing.title}</span>
        </nav>

        {/* ── MOBILE: Stack everything vertically, specs/price/images on top ── */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-3 lg:gap-8">

          {/* ── MOBILE: Price + Type badge first (above images) ── */}
          <div className="lg:col-span-2 order-1">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span
                className="inline-block px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-white rounded-sm uppercase tracking-wide"
                style={{ backgroundColor: primaryColor }}
              >
                {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
              </span>
              {listing.price && (
                <span
                  className="text-xl sm:text-2xl lg:text-3xl font-light"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", color: primaryColor }}
                >
                  {formatPrice(listing.price, listing.currency ?? "USD")}
                </span>
              )}
            </div>
          </div>

          {/* ── Images gallery — always above description ── */}
          <div className="lg:col-span-2 order-2">
            {/* Main image */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden bg-[#E2E8CE] rounded-sm">
              {listing.images?.[activeImage] ? (
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              )}

              {listing.ai_generated && (
                <div className="absolute bottom-2 right-2 bg-[#262626]/80 backdrop-blur-sm px-2 py-1 rounded-sm">
                  <span className="text-[10px] sm:text-xs text-[#FF7F11] font-medium">✦ IA</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip — horizontal scroll */}
            {listing.images.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-14 h-10 sm:w-16 sm:h-12 flex-shrink-0 overflow-hidden rounded-sm border-2 transition-all ${
                      i === activeImage ? "border-[#FF7F11]" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Desktop right sidebar: price, specs, CTA (hidden on mobile, moved inline) ── */}
          <div className="hidden lg:block lg:col-span-1 order-3">
            <div className="sticky top-20 flex flex-col gap-5">
              {/* Title + Neighborhood */}
              <div>
                <h1
                  className="text-[#262626] leading-tight"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.5rem", fontWeight: 500 }}
                >
                  {listing.title}
                </h1>
                {listing.neighborhood && (
                  <p className="text-xs text-[#6B7565] mt-1.5 uppercase tracking-wide">
                    {listing.neighborhood}{listing.city ? `, ${listing.city}` : ""}
                  </p>
                )}
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {listing.area_m2 && <SpecItem label="Área" value={`${listing.area_m2} m²`} />}
                {listing.bedrooms != null && <SpecItem label="Habitaciones" value={`${listing.bedrooms}`} />}
                {listing.bathrooms != null && <SpecItem label="Baños" value={`${listing.bathrooms}`} />}
                {listing.parking != null && <SpecItem label="Estacionamiento" value={`${listing.parking}`} />}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2.5">
                <HeartButton listingId={listing.id} profileId={listing.profile_id} hearts={listing.hearts} />
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=Hola, me interesa la propiedad: ${listing.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-medium rounded-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "#25d366" }}
                  >
                    <WhatsAppIcon />
                    Consultar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Description + Map (below images, full width until desktop sidebar kicks in) ── */}
          <div className="lg:col-span-2 order-4 space-y-4 sm:space-y-6">
            {/* Title + neighborhood (mobile only — desktop sidebar has it) */}
            <div className="lg:hidden">
              <h1
                className="text-[#262626] leading-tight"
                style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.3rem", fontWeight: 500 }}
              >
                {listing.title}
              </h1>
              {listing.neighborhood && (
                <p className="text-[11px] text-[#6B7565] mt-1 uppercase tracking-wide">
                  {listing.neighborhood}{listing.city ? `, ${listing.city}` : ""}
                </p>
              )}
            </div>

            {/* Specs grid (mobile only) */}
            <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listing.area_m2 && <SpecItem label="Área" value={`${listing.area_m2} m²`} />}
              {listing.bedrooms != null && <SpecItem label="Habitaciones" value={`${listing.bedrooms}`} />}
              {listing.bathrooms != null && <SpecItem label="Baños" value={`${listing.bathrooms}`} />}
              {listing.parking != null && <SpecItem label="Estacionamiento" value={`${listing.parking}`} />}
            </div>

            {/* Description — decoded, no HTML entities */}
            {decodedDescription && (
              <div>
                <h2
                  className="text-[#262626] mb-3"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.2rem", fontWeight: 500 }}
                >
                  Descripción
                </h2>
                <div className="text-[#6B7565] leading-relaxed text-sm whitespace-pre-line">
                  {decodedDescription}
                </div>
              </div>
            )}

            {/* Neighborhood context */}
            {listing.neighborhood_summary && (
              <div className="p-4 sm:p-5 bg-[#E2E8CE] rounded-sm">
                <h3 className="text-[11px] uppercase tracking-wide text-[#6B7565] mb-2 font-semibold">Contexto del Barrio</h3>
                <p className="text-sm text-[#262626] leading-relaxed">{listing.neighborhood_summary}</p>
              </div>
            )}

            {/* Map */}
            {listing.lat && listing.lng && (
              <div>
                <h2 className="text-[11px] uppercase tracking-wide text-[#6B7565] mb-2 font-semibold">Ubicación</h2>
                <PropertyMapInner listing={listing} primaryColor={primaryColor} />
              </div>
            )}

            {/* Mobile CTA */}
            <div className="lg:hidden flex flex-col gap-2.5 pt-2 pb-6">
              <HeartButton listingId={listing.id} profileId={listing.profile_id} hearts={listing.hearts} />
              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=Hola, me interesa la propiedad: ${listing.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-medium rounded-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: "#25d366" }}
                >
                  <WhatsAppIcon />
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <RealtorV1Footer />
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm px-2.5 py-2 sm:px-3 sm:py-2.5">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[#6B7565] mb-0.5 font-semibold">{label}</p>
      <p className="text-sm sm:text-base font-medium text-[#262626]">{value}</p>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.529 5.859L0 24l6.335-1.607A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.914 0-3.71-.5-5.27-1.377L2.5 21.5l.907-3.992A9.95 9.95 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}
