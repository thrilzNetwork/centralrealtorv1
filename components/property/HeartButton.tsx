"use client";

import { useState } from "react";

interface HeartButtonProps {
  listingId: string;
  profileId: string;
  hearts?: number;
}

export function HeartButton({ listingId, profileId, hearts = 0 }: HeartButtonProps) {
  const [hearted, setHearted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(hearts);
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });
  const [done, setDone] = useState(false);

  function handleHeartClick() {
    if (hearted) return;
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        profileId,
        visitorName: leadData.name,
        visitorEmail: leadData.email,
        visitorPhone: leadData.phone,
        type: "heart",
      }),
    });

    setCount((c) => c + 1);
    setHearted(true);
    setDone(true);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleHeartClick}
        className="flex items-center justify-center gap-2 w-full py-3 border text-sm font-medium transition-all rounded-sm"
        style={
          hearted
            ? { backgroundColor: "#FFF0E8", borderColor: "#FF7F11", color: "#FF7F11" }
            : { backgroundColor: "transparent", borderColor: "#D8D3C8", color: "#262626" }
        }
      >
        <svg
          className={`w-4 h-4 transition-all ${hearted ? "scale-110" : ""}`}
          viewBox="0 0 20 20"
          fill={hearted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={hearted ? 0 : 1.5}
        >
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
        {hearted ? `Guardado (${count})` : `Guardar Propiedad (${count})`}
      </button>

      {/* Lead capture modal */}
      {showModal && !done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-sm border border-[#EAE7DC] shadow-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-[#262626]"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.3rem", fontWeight: 500 }}
                >
                  Guardar propiedad
                </h3>
                <button onClick={() => setShowModal(false)} className="text-[#ACBFA4] hover:text-[#262626] transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-[#6B7565] mb-5">
                Déjanos tus datos y el agente podrá contactarte con más información.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  placeholder="Tu nombre *"
                  required
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  className="border border-[#D8D3C8] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF7F11] transition-colors"
                />
                <input
                  type="email"
                  placeholder="Tu correo *"
                  required
                  value={leadData.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  className="border border-[#D8D3C8] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF7F11] transition-colors"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp (opcional)"
                  value={leadData.phone}
                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  className="border border-[#D8D3C8] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF7F11] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 py-3 bg-[#FF7F11] text-white text-sm font-medium rounded-sm hover:bg-[#CC6500] transition-colors disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar y Notificar al Agente"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success state in modal */}
      {showModal && done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-sm border border-[#EAE7DC] shadow-2xl animate-scale-in p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFF0E8] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#FF7F11]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.3rem" }} className="text-[#262626] mb-2">
              ¡Guardado!
            </h3>
            <p className="text-sm text-[#6B7565]">El agente fue notificado y te contactará pronto.</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-5 text-sm text-[#FF7F11] hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
