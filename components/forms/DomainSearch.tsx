"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";

interface DomainSearchProps {
  isPremium: boolean;
}

export function DomainSearch({ isPremium }: DomainSearchProps) {
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const domain = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    window.open(
      `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${domain}.com`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-caps text-[#6B7565] mb-1">Buscar Dominio</p>
          <p className="text-sm text-[#6B7565]">
            Encuentra y compra tu dominio personalizado desde $9.99/año.
          </p>
        </div>
        {!isPremium && (
          <span className="flex items-center gap-1.5 label-caps text-[#6B7565] border border-[#EAE7DC] px-2.5 py-1 rounded-sm text-xs">
            <Lock className="w-3 h-3" /> Solo Premium
          </span>
        )}
      </div>

      {isPremium ? (
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="tunombre o tumarca"
              className="w-full border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 transition-colors pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#ACBFA4]">.com</span>
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-[#262626] text-white text-sm font-medium rounded-sm hover:bg-[#323232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </form>
      ) : (
        <div className="bg-[#F7F5EE] rounded-sm px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-[#6B7565]">
            Activa el plan Premium para buscar y conectar tu propio dominio.
          </p>
          <a
            href="/dashboard/facturacion"
            className="text-sm font-medium text-[#FF7F11] hover:underline whitespace-nowrap ml-4"
          >
            Ver planes →
          </a>
        </div>
      )}

      <p className="text-xs text-[#ACBFA4] mt-3">
        Se abrirá GoDaddy para completar la compra. Después de adquirirlo, conéctalo abajo.
      </p>
    </div>
  );
}
