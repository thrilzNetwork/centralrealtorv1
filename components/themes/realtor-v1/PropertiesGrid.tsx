"use client";

import { useState } from "react";
import { PropertyCard } from "./PropertyCard";
import { RealtorV1Header } from "./RealtorV1Header";
import { RealtorV1Footer } from "./RealtorV1Footer";
import { useTenant } from "@/components/themes/TenantContext";
import type { Listing } from "@/types/tenant";

const FILTER_TYPES = [
  { value: "", label: "Todos" },
  { value: "casa", label: "Casas" },
  { value: "departamento", label: "Deptos." },
  { value: "terreno", label: "Terrenos" },
  { value: "oficina", label: "Oficinas" },
  { value: "local_comercial", label: "Locales" },
];

interface PropertiesGridProps {
  listings: Partial<Listing>[];
  selectedType?: string;
  searchQuery?: string;
}

export function PropertiesGrid({ listings, selectedType, searchQuery }: PropertiesGridProps) {
  const { profile } = useTenant();
  const [activeFilter, setActiveFilter] = useState(selectedType ?? "");
  const [sortOrder, setSortOrder] = useState<"price-asc" | "price-desc" | "recent">("recent");
  const [search, setSearch] = useState(searchQuery ?? "");

  const filtered = listings
    .filter((l) => !activeFilter || l.property_type === activeFilter)
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.title?.toLowerCase().includes(q) ||
        l.neighborhood?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sortOrder === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#F7F5EE]">
      <RealtorV1Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <span className="accent-line" />
          <h1
            className="text-[#262626]"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2.5rem", fontWeight: 500 }}
          >
            Inmuebles
          </h1>
          <p className="text-[#6B7565] mt-2 text-sm">{filtered.length} propiedades disponibles</p>
        </div>

        {/* Search + Filter + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por zona, tipo, descripción..."
            className="flex-1 border border-[#D8D3C8] bg-white px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] transition-colors placeholder:text-[#ACBFA4]"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="border border-[#D8D3C8] bg-white px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer text-[#262626]"
          >
            <option value="recent">Más recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="px-4 py-1.5 text-sm transition-all duration-150 rounded-sm border"
              style={
                activeFilter === f.value
                  ? { backgroundColor: profile.primary_color, color: "white", borderColor: profile.primary_color }
                  : { backgroundColor: "transparent", color: "#262626", borderColor: "#D8D3C8" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#6B7565]">No se encontraron propiedades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      <RealtorV1Footer />
    </div>
  );
}
