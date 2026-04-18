"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Affiliate {
  id: string;
  code: string;
  tier: number;
  commission_percent: number;
  total_referrals: number;
  total_paid_referrals: number;
  credit_balance_cents: number;
  credit_used_cents: number;
  available_credit_cents: number;
  created_at: string;
}

interface Referral {
  id: string;
  referred_email: string | null;
  plan: string | null;
  status: "signed_up" | "paid" | "churned";
  commission_cents: number;
  created_at: string;
  first_payment_at: string | null;
}

interface Credit {
  id: string;
  amount_cents: number;
  reason: string;
  description: string | null;
  created_at: string;
}

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function tierBadge(tier: number): { label: string; color: string } {
  if (tier === 3) return { label: "Elite · 30%",   color: "#262626" };
  if (tier === 2) return { label: "Pro · 20%",     color: "#FF7F11" };
  return                   { label: "Inicial · 10%", color: "#ACBFA4" };
}

export function AffiliateDashboard() {
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/affiliate/me")
      .then(r => r.json())
      .then(d => {
        setAffiliate(d.affiliate ?? null);
        setReferrals(d.referrals ?? []);
        setCredits(d.credits ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!affiliate) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-[#6B7565]">Cargando…</div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white border border-[#EAE7DC] rounded-sm p-8 text-center">
          <p className="text-4xl mb-3">🤝</p>
          <h1 className="font-serif text-2xl text-[#262626] mb-2">Aún no eres afiliado</h1>
          <p className="text-[#6B7565] text-sm mb-6">
            Aplica al Programa de Afiliados para comenzar a ganar créditos por cada asesor que refieras.
          </p>
          <Link
            href="/afiliados#apply"
            className="inline-block bg-[#FF7F11] text-white px-6 py-2.5 rounded-sm font-medium text-sm hover:-translate-y-0.5 transition-transform"
          >
            Aplicar al programa →
          </Link>
        </div>
      </div>
    );
  }

  const tier = tierBadge(affiliate.tier);
  const nextTierAt = affiliate.tier === 1 ? 6 : affiliate.tier === 2 ? 16 : null;
  const referralLink =
    typeof window !== "undefined" ? `${window.location.origin}/?ref=${affiliate.code}` : `/?ref=${affiliate.code}`;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="label-caps text-[#6B7565]">Programa de Afiliados</p>
          <h1 className="font-serif text-3xl text-[#262626]">Tu panel de afiliado</h1>
        </div>
        <span
          className="px-3 py-1 rounded-sm text-xs font-medium text-white"
          style={{ backgroundColor: tier.color }}
        >
          {tier.label}
        </span>
      </div>

      {/* Code + link card */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="label-caps text-[#6B7565]">Tu código</p>
            <p className="font-mono text-2xl text-[#262626] mt-1">{affiliate.code}</p>
          </div>
          <button
            onClick={copyLink}
            className="bg-[#262626] text-white px-4 py-2 rounded-sm text-xs font-medium hover:-translate-y-0.5 transition-transform"
          >
            {copied ? "✓ Copiado" : "Copiar enlace"}
          </button>
        </div>
        <div className="bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm px-3 py-2 text-xs text-[#6B7565] font-mono break-all">
          {referralLink}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Referidos"          value={affiliate.total_referrals.toString()} />
        <StatCard label="Pagaron"             value={affiliate.total_paid_referrals.toString()} />
        <StatCard label="Crédito disponible" value={formatUSD(affiliate.available_credit_cents)} accent />
        <StatCard label="Total ganado"       value={formatUSD(affiliate.credit_balance_cents)} />
      </div>

      {/* Tier progress */}
      {nextTierAt && (
        <div className="bg-white border border-[#EAE7DC] rounded-sm p-5">
          <div className="flex justify-between items-baseline mb-2">
            <p className="label-caps text-[#6B7565]">Progreso al siguiente nivel</p>
            <p className="text-xs text-[#262626]">
              {affiliate.total_paid_referrals} / {nextTierAt}
            </p>
          </div>
          <div className="h-2 bg-[#EAE7DC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF7F11] transition-all"
              style={{ width: `${Math.min(100, (affiliate.total_paid_referrals / nextTierAt) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-[#6B7565] mt-2">
            {nextTierAt - affiliate.total_paid_referrals} referidos pagados más para subir a{" "}
            {affiliate.tier === 1 ? "Pro (20%)" : "Elite (30%)"}.
          </p>
        </div>
      )}

      {/* Referrals table */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE7DC]">
          <h2 className="text-[#262626] font-semibold text-sm">Referidos ({referrals.length})</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7565]">
            Aún no tienes referidos. Comparte tu enlace para empezar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F5EE] text-[#6B7565]">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-xs">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">Plan</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">Estado</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">Comisión</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-t border-[#EAE7DC]">
                    <td className="px-4 py-2 text-[#262626]">{r.referred_email ?? "—"}</td>
                    <td className="px-4 py-2 text-[#6B7565]">{r.plan ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-sm"
                        style={{
                          backgroundColor:
                            r.status === "paid" ? "#ACBFA420" :
                            r.status === "churned" ? "#FEE2E2" : "#EAE7DC",
                          color:
                            r.status === "paid" ? "#065F46" :
                            r.status === "churned" ? "#991B1B" : "#6B7565",
                        }}
                      >
                        {r.status === "paid" ? "Pagó" : r.status === "churned" ? "Canceló" : "Registrado"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-[#262626] font-medium">
                      {formatUSD(r.commission_cents)}
                    </td>
                    <td className="px-4 py-2 text-right text-[#6B7565] text-xs">
                      {new Date(r.created_at).toLocaleDateString("es-BO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credit ledger */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE7DC]">
          <h2 className="text-[#262626] font-semibold text-sm">Historial de créditos</h2>
        </div>
        {credits.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7565]">Sin movimientos todavía.</div>
        ) : (
          <ul className="divide-y divide-[#EAE7DC]">
            {credits.map((c) => (
              <li key={c.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-[#262626]">
                    {c.description ?? (c.reason === "commission" ? "Comisión" : c.reason)}
                  </p>
                  <p className="text-xs text-[#6B7565]">{new Date(c.created_at).toLocaleString("es-BO")}</p>
                </div>
                <p
                  className="font-mono text-sm font-medium"
                  style={{ color: c.amount_cents >= 0 ? "#059669" : "#DC2626" }}
                >
                  {c.amount_cents >= 0 ? "+" : ""}{formatUSD(c.amount_cents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="bg-white border rounded-sm p-4"
      style={{ borderColor: accent ? "#FF7F11" : "#EAE7DC" }}
    >
      <p className="label-caps text-[#6B7565] text-xs">{label}</p>
      <p
        className="font-serif text-2xl mt-1"
        style={{ color: accent ? "#FF7F11" : "#262626" }}
      >
        {value}
      </p>
    </div>
  );
}
