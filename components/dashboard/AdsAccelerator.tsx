"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdsApplicationForm } from "./AdsApplicationForm";
import { WalletTopupButton } from "./WalletTopupButton";
import { ADS_STATUS_LABELS, ADS_STATUS_COLORS } from "@/lib/ads/constants";

interface AdRequest {
  id: string;
  platforms: string[];
  objective: string;
  total_budget_cents: number;
  spend_reported_cents: number;
  status: string;
  created_at: string;
  results: Record<string, unknown>;
}

interface AdsAcceleratorProps {
  initialStatus: string;
  initialBalance: number;
  topupParam: string | null;
}

export function AdsAccelerator({ initialStatus, initialBalance, topupParam }: AdsAcceleratorProps) {
  const [status, setStatus] = useState(initialStatus);
  const [balance, setBalance] = useState(initialBalance);
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [showAppForm, setShowAppForm] = useState(false);
  const [topupMsg, setTopupMsg] = useState<string | null>(
    topupParam === "success" ? "✅ Recarga completada. Tu wallet fue actualizado." :
    topupParam === "cancelled" ? "Pago cancelado." : null
  );

  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/ads/requests");
    if (res.ok) {
      const json = await res.json();
      setRequests(json.requests ?? []);
    }
  }, []);

  const loadBalance = useCallback(async () => {
    const res = await fetch("/api/ads/wallet");
    if (res.ok) {
      const json = await res.json();
      setBalance(json.balance_cents ?? 0);
    }
  }, []);

  useEffect(() => {
    if (status === "approved") {
      loadRequests();
      loadBalance();
    }
  }, [status, loadRequests, loadBalance]);

  if (status === "none") {
    return (
      <div>
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#262626] to-[#3a3a3a] rounded-sm p-8 mb-8 text-white">
          <span className="label-caps text-[#FF7F11] text-[10px] mb-3 block">Ads Accelerator</span>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3">Anuncia en Meta, TikTok y Google<br />sin dramas con tu banco.</h2>
          <ul className="text-sm text-[#ACBFA4] flex flex-col gap-2 mb-6">
            <li>✓ Paga en USD con cualquier tarjeta. Sin requerir tarjeta boliviana.</li>
            <li>✓ Nuestro equipo en EE.UU. lanza los anuncios desde nuestras propias cuentas.</li>
            <li>✓ Tú das el brief, nosotros optimizamos con IA y lanzamos.</li>
          </ul>
          <button
            onClick={() => setShowAppForm(true)}
            className="label-caps px-6 py-3 bg-[#FF7F11] text-white rounded-sm hover:bg-[#e67310] transition-colors text-xs"
          >
            Solicita acceso al Ads Accelerator →
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { n: "1", title: "Aplica", desc: "Llena una solicitud rápida (5 min). Verificamos tu identidad y cuentas." },
            { n: "2", title: "Recarga", desc: "Aprobado, carga tu wallet en USD desde cualquier tarjeta." },
            { n: "3", title: "Lanza", desc: "Crea tu brief, nuestros especialistas lanzan la campaña." },
          ].map(s => (
            <div key={s.n} className="bg-white border border-[#EAE7DC] rounded-sm p-5">
              <div className="w-7 h-7 rounded-full bg-[#FF7F11] text-white text-xs flex items-center justify-center font-bold mb-3">{s.n}</div>
              <p className="font-medium text-[#262626] text-sm mb-1">{s.title}</p>
              <p className="text-xs text-[#6B7565]">{s.desc}</p>
            </div>
          ))}
        </div>

        {showAppForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-start justify-center py-8 px-4">
            <div className="bg-white rounded-sm shadow-xl p-6 sm:p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl text-[#262626]">Solicitud de acceso</h3>
                <button onClick={() => setShowAppForm(false)} className="text-[#6B7565] hover:text-[#262626]">✕</button>
              </div>
              <AdsApplicationForm onSuccess={() => { setShowAppForm(false); setStatus("pending"); }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-xl">⏳</div>
          <div>
            <h3 className="font-medium text-yellow-800 mb-1">Solicitud en revisión</h3>
            <p className="text-sm text-yellow-700">Nuestro equipo revisará tu solicitud en 24–48h. Te notificaremos por WhatsApp cuando sea aprobada.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected" || status === "suspended") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-xl">❌</div>
          <div>
            <h3 className="font-medium text-red-800 mb-1">
              {status === "rejected" ? "Solicitud rechazada" : "Acceso suspendido"}
            </h3>
            <p className="text-sm text-red-700 mb-3">Escríbenos para obtener más información o resolver cualquier inconveniente.</p>
            <a href="https://wa.me/591" target="_blank" rel="noopener noreferrer" className="label-caps text-xs px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700">
              Contactar soporte
            </a>
          </div>
        </div>
      </div>
    );
  }

  // approved
  return (
    <div>
      {topupMsg && (
        <div className={`mb-4 px-4 py-3 rounded-sm text-sm ${topupMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
          {topupMsg}
          <button onClick={() => setTopupMsg(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Wallet card */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="label-caps text-[#6B7565] text-[10px] mb-1">Saldo en Wallet</p>
          <p className="text-2xl font-light text-[#262626]">
            ${(balance / 100).toFixed(2)} <span className="text-sm text-[#6B7565]">USD</span>
          </p>
        </div>
        <WalletTopupButton />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-[#262626]">Mis campañas</h3>
        <Link
          href="/dashboard/ads/nueva"
          className="label-caps text-xs px-4 py-2 bg-[#262626] text-white rounded-sm hover:bg-[#3a3a3a] transition-colors"
        >
          + Nueva campaña
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="border border-dashed border-[#D8D3C8] rounded-sm p-10 text-center">
          <p className="text-sm text-[#6B7565]">Aún no tienes campañas. Crea tu primera campaña.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAE7DC] bg-[#F7F5EE]">
                <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Plataformas</th>
                <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Presupuesto</th>
                <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Gasto</th>
                <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-[#EAE7DC] hover:bg-[#F7F5EE] cursor-pointer">
                  <td className="px-4 py-3 text-[#262626]">{r.platforms.join(", ")}</td>
                  <td className="px-4 py-3 text-[#262626]">${(r.total_budget_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#6B7565]">${(r.spend_reported_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`label-caps text-[10px] px-2 py-1 rounded-sm ${ADS_STATUS_COLORS[r.status] ?? ""}`}>
                      {ADS_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
