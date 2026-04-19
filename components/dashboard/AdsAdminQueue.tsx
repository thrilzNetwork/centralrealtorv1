"use client";

import { useState, useEffect, useCallback } from "react";
import { ADS_STATUS_LABELS, ADS_STATUS_COLORS } from "@/lib/ads/constants";
import { Button } from "@/components/ui/Button";

type Tab = "aplicaciones" | "cola" | "en_curso" | "completadas";

interface Application {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  social_links: string;
  meta_business_url: string | null;
  meta_account_status: string;
  property_types: string;
  experience: string;
  status: string;
  review_notes: string | null;
  created_at: string;
  profiles?: { full_name: string; email: string; slug: string };
}

interface AdRequest {
  id: string;
  platforms: string[];
  objective: string;
  total_budget_cents: number;
  spend_reported_cents: number;
  status: string;
  creative_brief: string | null;
  audience_notes: string | null;
  external_campaign_ids: Record<string, string>;
  results: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string; email: string; slug: string };
  listings?: { title: string } | null;
}

const TAB_STATUSES: Record<Tab, string | null> = {
  aplicaciones: null,
  cola: "queued",
  en_curso: "active",
  completadas: "completed",
};

export function AdsAdminQueue() {
  const [tab, setTab] = useState<Tab>("aplicaciones");
  const [applications, setApplications] = useState<Application[]>([]);
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedReq, setSelectedReq] = useState<AdRequest | null>(null);
  const [appNotes, setAppNotes] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [statusChange, setStatusChange] = useState("");
  const [campaignIds, setCampaignIds] = useState<Record<string, string>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [spendCents, setSpendCents] = useState("");
  const [leads, setLeads] = useState("");

  const loadApplications = useCallback(async () => {
    const res = await fetch("/api/ads/admin/applications");
    if (res.ok) { const j = await res.json(); setApplications(j.applications ?? []); }
  }, []);

  const loadRequests = useCallback(async (status: string | null) => {
    const url = status ? `/api/ads/admin/requests?status=${status}` : "/api/ads/admin/requests";
    const res = await fetch(url);
    if (res.ok) { const j = await res.json(); setRequests(j.requests ?? []); }
  }, []);

  useEffect(() => {
    if (tab === "aplicaciones") loadApplications();
    else loadRequests(TAB_STATUSES[tab]);
  }, [tab, loadApplications, loadRequests]);

  async function reviewApp(decision: "approved" | "rejected" | "suspended") {
    if (!selectedApp) return;
    setAppLoading(true);
    await fetch(`/api/ads/admin/applications/${selectedApp.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes: appNotes }),
    });
    setAppLoading(false);
    setSelectedApp(null);
    setAppNotes("");
    loadApplications();
  }

  async function claimRequest(id: string) {
    await fetch(`/api/ads/admin/requests/${id}/claim`, { method: "POST" });
    loadRequests(TAB_STATUSES[tab]);
  }

  async function postUpdate() {
    if (!selectedReq || !updateMsg) return;
    setUpdateLoading(true);
    await fetch(`/api/ads/admin/requests/${selectedReq.id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: updateMsg, status_change: statusChange || undefined }),
    });
    setUpdateMsg("");
    setStatusChange("");
    setUpdateLoading(false);
    loadRequests(TAB_STATUSES[tab]);
  }

  async function launchRequest() {
    if (!selectedReq) return;
    setUpdateLoading(true);
    await fetch(`/api/ads/admin/requests/${selectedReq.id}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ external_campaign_ids: campaignIds }),
    });
    setUpdateLoading(false);
    setSelectedReq(null);
    setCampaignIds({});
    loadRequests(TAB_STATUSES[tab]);
  }

  async function reportSpend() {
    if (!selectedReq) return;
    setUpdateLoading(true);
    const results: Record<string, unknown> = {};
    if (leads) results.leads = Number(leads);
    await fetch(`/api/ads/admin/requests/${selectedReq.id}/report-spend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spend_reported_cents: spendCents ? Math.round(parseFloat(spendCents) * 100) : undefined,
        results: Object.keys(results).length ? results : undefined,
      }),
    });
    setUpdateLoading(false);
    setSpendCents("");
    setLeads("");
    loadRequests(TAB_STATUSES[tab]);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "aplicaciones", label: "Aplicaciones" },
    { id: "cola",        label: "Cola" },
    { id: "en_curso",    label: "En curso" },
    { id: "completadas", label: "Completadas" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#EAE7DC] mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${tab === t.id ? "border-[#FF7F11] text-[#FF7F11]" : "border-transparent text-[#6B7565] hover:text-[#262626]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {tab === "aplicaciones" && (
        <div>
          {applications.length === 0 ? (
            <p className="text-sm text-[#6B7565]">No hay solicitudes.</p>
          ) : (
            <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EAE7DC] bg-[#F7F5EE]">
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Solicitante</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Ciudad</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Meta</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {applications.map(a => (
                    <tr key={a.id} className="border-b border-[#EAE7DC]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#262626]">{a.full_name}</p>
                        <p className="text-xs text-[#6B7565]">{a.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-[#6B7565]">{a.city}</td>
                      <td className="px-4 py-3">
                        <span className={`label-caps text-[10px] px-2 py-0.5 rounded-sm ${a.meta_account_status === "good" ? "bg-green-50 text-green-700" : a.meta_account_status === "restricted" ? "bg-yellow-50 text-yellow-700" : "bg-[#F7F5EE] text-[#6B7565]"}`}>
                          {a.meta_account_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`label-caps text-[10px] px-2 py-0.5 rounded-sm ${a.status === "pending" ? "bg-yellow-50 text-yellow-700" : a.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedApp(a); setAppNotes(a.review_notes ?? ""); }}
                          className="text-xs text-[#FF7F11] hover:underline"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Requests tabs */}
      {tab !== "aplicaciones" && (
        <div>
          {requests.length === 0 ? (
            <p className="text-sm text-[#6B7565]">No hay campañas.</p>
          ) : (
            <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EAE7DC] bg-[#F7F5EE]">
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Cliente</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Plataformas</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Presupuesto</th>
                    <th className="text-left px-4 py-3 label-caps text-[#6B7565] text-[10px]">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b border-[#EAE7DC]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#262626]">{r.profiles?.full_name}</p>
                        <p className="text-xs text-[#6B7565]">{r.listings?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-[#6B7565]">{r.platforms.join(", ")}</td>
                      <td className="px-4 py-3 text-[#262626]">${(r.total_budget_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`label-caps text-[10px] px-2 py-0.5 rounded-sm ${ADS_STATUS_COLORS[r.status] ?? ""}`}>
                          {ADS_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {r.status === "queued" && (
                          <button onClick={() => claimRequest(r.id)} className="text-xs text-[#FF7F11] hover:underline">
                            Asignar
                          </button>
                        )}
                        <button onClick={() => setSelectedReq(r)} className="text-xs text-[#262626] hover:underline">
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Application review drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE7DC] flex-shrink-0">
              <h3 className="font-serif text-lg text-[#262626]">{selectedApp.full_name}</h3>
              <button onClick={() => setSelectedApp(null)} className="text-[#6B7565]">✕</button>
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col gap-4 text-sm">
              <Detail label="Email" value={selectedApp.profiles?.email ?? "—"} />
              <Detail label="Teléfono" value={selectedApp.phone} />
              <Detail label="Ciudad" value={selectedApp.city} />
              <Detail label="Redes sociales" value={selectedApp.social_links} />
              {selectedApp.meta_business_url && (
                <Detail label="Meta Business URL" value={selectedApp.meta_business_url} link />
              )}
              <Detail label="Estado cuenta Meta" value={selectedApp.meta_account_status} />
              <Detail label="Tipo de propiedades" value={selectedApp.property_types} />
              <Detail label="Experiencia" value={selectedApp.experience} />

              <div className="flex flex-col gap-1.5 mt-4">
                <label className="label-caps text-[#6B7565] text-[10px]">Notas de revisión</label>
                <textarea
                  value={appNotes}
                  onChange={e => setAppNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] resize-none"
                  placeholder="Razón de aprobación o rechazo..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EAE7DC] flex gap-3 flex-shrink-0">
              <Button onClick={() => reviewApp("approved")} loading={appLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                Aprobar
              </Button>
              <Button onClick={() => reviewApp("rejected")} loading={appLoading} className="flex-1 bg-red-600 hover:bg-red-700">
                Rechazar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request management drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE7DC] flex-shrink-0">
              <div>
                <h3 className="font-serif text-lg text-[#262626]">{selectedReq.profiles?.full_name}</h3>
                <p className="text-xs text-[#6B7565]">{selectedReq.platforms.join(", ")} · ${(selectedReq.total_budget_cents / 100).toFixed(2)}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-[#6B7565]">✕</button>
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col gap-5 text-sm">
              {selectedReq.audience_notes && <Detail label="Audiencia" value={selectedReq.audience_notes} />}
              {selectedReq.creative_brief && (
                <div>
                  <p className="label-caps text-[#6B7565] text-[10px] mb-1">Brief creativo</p>
                  <p className="text-[#262626] whitespace-pre-wrap bg-[#F7F5EE] rounded-sm p-3">{selectedReq.creative_brief}</p>
                </div>
              )}

              {/* Launch section */}
              {(selectedReq.status === "queued" || selectedReq.status === "in_review") && (
                <div className="border border-[#EAE7DC] rounded-sm p-4 flex flex-col gap-3">
                  <p className="label-caps text-[#6B7565] text-[10px]">IDs de campaña externa</p>
                  {selectedReq.platforms.map(p => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-[#6B7565]">{p}</span>
                      <input
                        value={campaignIds[p] ?? ""}
                        onChange={e => setCampaignIds(prev => ({ ...prev, [p]: e.target.value }))}
                        placeholder={`ID de campaña ${p}`}
                        className="flex-1 border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11]"
                      />
                    </div>
                  ))}
                  <Button onClick={launchRequest} loading={updateLoading} className="w-full bg-green-600 hover:bg-green-700">
                    🚀 Lanzar campaña
                  </Button>
                </div>
              )}

              {/* Report spend section */}
              {selectedReq.status === "active" && (
                <div className="border border-[#EAE7DC] rounded-sm p-4 flex flex-col gap-3">
                  <p className="label-caps text-[#6B7565] text-[10px]">Reportar resultados</p>
                  <input
                    type="number"
                    value={spendCents}
                    onChange={e => setSpendCents(e.target.value)}
                    placeholder="Gasto real (USD)"
                    className="border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11]"
                  />
                  <input
                    type="number"
                    value={leads}
                    onChange={e => setLeads(e.target.value)}
                    placeholder="Leads generados"
                    className="border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11]"
                  />
                  <Button onClick={reportSpend} loading={updateLoading} size="sm">
                    Actualizar resultados
                  </Button>
                </div>
              )}

              {/* Add update */}
              <div className="flex flex-col gap-3">
                <p className="label-caps text-[#6B7565] text-[10px]">Agregar actualización</p>
                <textarea
                  value={updateMsg}
                  onChange={e => setUpdateMsg(e.target.value)}
                  rows={3}
                  placeholder="Mensaje al cliente..."
                  className="w-full border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11] resize-none"
                />
                <select
                  value={statusChange}
                  onChange={e => setStatusChange(e.target.value)}
                  className="border border-[#D8D3C8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF7F11]"
                >
                  <option value="">Sin cambio de estado</option>
                  {["in_review","approved","launching","active","paused","completed","cancelled"].map(s => (
                    <option key={s} value={s}>{ADS_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <Button onClick={postUpdate} loading={updateLoading} size="sm">
                  Enviar actualización
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div>
      <p className="label-caps text-[#6B7565] text-[10px] mb-0.5">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#FF7F11] hover:underline text-sm break-all">{value}</a>
      ) : (
        <p className="text-[#262626] text-sm">{value}</p>
      )}
    </div>
  );
}
