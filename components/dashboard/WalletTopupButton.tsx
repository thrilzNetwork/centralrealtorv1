"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BUDGET_PRESETS } from "@/lib/ads/constants";

export function WalletTopupButton() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopup() {
    const cents = selected ?? (custom ? Math.round(parseFloat(custom) * 100) : 0);
    if (!cents || cents < 2000) { setError("Mínimo $20 USD"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ads/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_cents: cents }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Error"); setLoading(false); return; }
    window.location.href = json.url;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="label-caps px-5 py-2.5 bg-[#FF7F11] text-white rounded-sm hover:bg-[#e67310] transition-colors text-xs"
      >
        Recargar wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-serif text-xl text-[#262626] mb-1">Recargar wallet</h3>
            <p className="text-xs text-[#6B7565] mb-5">Paga en USD con cualquier tarjeta. El saldo queda disponible de inmediato.</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {BUDGET_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { setSelected(p * 100); setCustom(""); }}
                  className={`py-2 text-sm rounded-sm border transition-colors ${selected === p * 100 ? "border-[#FF7F11] bg-[#FF7F11]/10 text-[#FF7F11]" : "border-[#D8D3C8] text-[#262626] hover:border-[#FF7F11]"}`}
                >
                  ${p}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Otro monto (USD)"
              value={custom}
              onChange={e => { setCustom(e.target.value); setSelected(null); }}
              min={20}
              max={2000}
              className="w-full border border-[#D8D3C8] px-4 py-2.5 text-sm rounded-sm mb-4 focus:outline-none focus:border-[#FF7F11]"
            />

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={handleTopup} loading={loading} className="flex-1">
                Ir a pagar
              </Button>
              <button onClick={() => setOpen(false)} className="flex-1 py-2 border border-[#D8D3C8] rounded-sm text-sm text-[#6B7565] hover:bg-[#F7F5EE]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
