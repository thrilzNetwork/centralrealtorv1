"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PLATFORMS, OBJECTIVES, BUDGET_PRESETS, DURATION_OPTIONS, calcFee } from "@/lib/ads/constants";

interface Listing {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  listings: Listing[];
  balanceCents: number;
}

export function AdsNewCampaignForm({ listings, balanceCents }: Props) {
  const router = useRouter();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [objective, setObjective] = useState("leads");
  const [listingId, setListingId] = useState("");
  const [budgetCents, setBudgetCents] = useState(10000);
  const [customBudget, setCustomBudget] = useState("");
  const [duration, setDuration] = useState(7);
  const [audienceNotes, setAudienceNotes] = useState("");
  const [creativeBrief, setCreativeBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = customBudget ? Math.round(parseFloat(customBudget) * 100) : budgetCents;
  const { feeCents, spendCents } = calcFee(totalCents);
  const canAfford = balanceCents >= totalCents;

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleGenerateCreative() {
    if (!creativeBrief.trim()) { setError("Escribe un brief antes de generar."); return; }
    setAiLoading(true);
    setError(null);
    try {
      const listing = listings.find(l => l.id === listingId);
      const prompt = `Crea un copy publicitario para ${listing?.title ?? "una propiedad inmobiliaria"} en ${selectedPlatforms.join(", ")}. Objetivo: ${objective}. Brief del cliente: ${creativeBrief}`;
      const res = await fetch("/api/media/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.description) setCreativeBrief(prev => prev + "\n\n---\n✨ Copy sugerido por IA:\n" + json.description);
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedPlatforms.length) { setError("Selecciona al menos una plataforma."); return; }
    if (!canAfford) { setError("Saldo insuficiente. Recarga tu wallet."); return; }

    setLoading(true);

    const createRes = await fetch("/api/ads/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id:         listingId || undefined,
        platforms:          selectedPlatforms,
        objective,
        total_budget_cents: totalCents,
        duration_days:      duration,
        audience_notes:     audienceNotes || undefined,
        creative_brief:     creativeBrief || undefined,
      }),
    });

    const createJson = await createRes.json();
    if (!createRes.ok) { setError(createJson.error ?? "Error al crear campaña"); setLoading(false); return; }

    // Auto-submit (move to queued)
    const submitRes = await fetch(`/api/ads/requests/${createJson.request.id}/submit`, { method: "POST" });
    const submitJson = await submitRes.json();
    if (!submitRes.ok) { setError(submitJson.error ?? "Error al enviar campaña"); setLoading(false); return; }

    router.push("/dashboard/ads?submitted=1");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Listing picker */}
      <div className="flex flex-col gap-1.5">
        <label className="label-caps text-[#6B7565] text-[11px]">Propiedad (opcional)</label>
        <select
          value={listingId}
          onChange={e => setListingId(e.target.value)}
          className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11]"
        >
          <option value="">Sin propiedad específica</option>
          {listings.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {/* Platforms */}
      <div className="flex flex-col gap-2">
        <label className="label-caps text-[#6B7565] text-[11px]">Plataformas *</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              className={`px-4 py-2 text-sm rounded-sm border transition-colors ${selectedPlatforms.includes(p.id) ? "border-[#FF7F11] bg-[#FF7F11]/10 text-[#FF7F11]" : "border-[#D8D3C8] text-[#6B7565] hover:border-[#262626]"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="flex flex-col gap-2">
        <label className="label-caps text-[#6B7565] text-[11px]">Objetivo *</label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setObjective(o.id)}
              className={`px-4 py-2 text-sm rounded-sm border transition-colors ${objective === o.id ? "border-[#FF7F11] bg-[#FF7F11]/10 text-[#FF7F11]" : "border-[#D8D3C8] text-[#6B7565] hover:border-[#262626]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-2">
        <label className="label-caps text-[#6B7565] text-[11px]">Presupuesto total (USD) *</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {BUDGET_PRESETS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => { setBudgetCents(p * 100); setCustomBudget(""); }}
              className={`px-4 py-2 text-sm rounded-sm border transition-colors ${!customBudget && budgetCents === p * 100 ? "border-[#FF7F11] bg-[#FF7F11]/10 text-[#FF7F11]" : "border-[#D8D3C8] text-[#6B7565] hover:border-[#262626]"}`}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Otro monto"
          value={customBudget}
          onChange={e => setCustomBudget(e.target.value)}
          min={20}
          className="w-full border border-[#D8D3C8] px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11]"
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-2">
        <label className="label-caps text-[#6B7565] text-[11px]">Duración *</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-4 py-2 text-sm rounded-sm border transition-colors ${duration === d ? "border-[#FF7F11] bg-[#FF7F11]/10 text-[#FF7F11]" : "border-[#D8D3C8] text-[#6B7565] hover:border-[#262626]"}`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div className="flex flex-col gap-1.5">
        <label className="label-caps text-[#6B7565] text-[11px]">Notas de audiencia</label>
        <textarea
          value={audienceNotes}
          onChange={e => setAudienceNotes(e.target.value)}
          placeholder="Ej: Mujeres 25-45 en Santa Cruz interesadas en casas de lujo"
          rows={2}
          className="w-full border border-[#D8D3C8] px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] resize-none"
        />
      </div>

      {/* Creative brief */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="label-caps text-[#6B7565] text-[11px]">Brief creativo</label>
          <button
            type="button"
            onClick={handleGenerateCreative}
            disabled={aiLoading}
            className="label-caps text-[10px] px-3 py-1.5 border border-[#FF7F11] text-[#FF7F11] rounded-sm hover:bg-[#FF7F11]/10 disabled:opacity-50"
          >
            {aiLoading ? "Generando..." : "✨ Generar con IA"}
          </button>
        </div>
        <textarea
          value={creativeBrief}
          onChange={e => setCreativeBrief(e.target.value)}
          placeholder="Describe tu anuncio: qué destacar, tono, mensaje clave..."
          rows={4}
          className="w-full border border-[#D8D3C8] px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] resize-none"
        />
      </div>

      {/* Cost preview */}
      {totalCents >= 2000 && (
        <div className="bg-[#F7F5EE] rounded-sm p-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-[#6B7565]">Presupuesto publicitario</span>
            <span className="text-[#262626]">${(spendCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-[#6B7565]">Comisión de gestión (3%)</span>
            <span className="text-[#262626]">${(feeCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium border-t border-[#D8D3C8] pt-2">
            <span className="text-[#262626]">Total a deducir</span>
            <span className="text-[#262626]">${(totalCents / 100).toFixed(2)}</span>
          </div>
          {!canAfford && (
            <p className="mt-3 text-xs text-red-600">
              Saldo insuficiente (${(balanceCents / 100).toFixed(2)} disponible).{" "}
              <a href="/dashboard/ads" className="underline">Recarga tu wallet</a>.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">{error}</p>
      )}

      <Button type="submit" loading={loading} size="lg" disabled={!canAfford} className="w-full">
        Enviar campaña
      </Button>
    </form>
  );
}
