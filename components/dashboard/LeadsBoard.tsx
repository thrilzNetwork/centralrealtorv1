"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LeadStatus = "nuevo" | "contactado" | "en_seguimiento" | "cerrado";

const WA_TEMPLATES = [
  { id: "saludo",      label: "Saludo",       body: "Hola {name} 👋, soy de Central Bolivia. Vi tu interés en {listing}. ¿Cuándo puedo contactarte?" },
  { id: "visita",      label: "Agendar visita", body: "Hola {name}, ¿te gustaría visitar {listing} esta semana? Dime qué día te viene mejor 🗓️" },
  { id: "precio",      label: "Info precio",  body: "Hola {name}, el precio de {listing} es {price}. ¿Conversamos los detalles?" },
  { id: "seguimiento", label: "Seguimiento",  body: "Hola {name} 😊, ¿pudiste revisar la info de {listing}? Estoy aquí para cualquier pregunta." },
  { id: "cierre",      label: "Cierre",       body: "Hola {name}, si estás listo/a para hacer una oferta por {listing}, podemos avanzar hoy. 🤝" },
  { id: "libre",       label: "Libre",        body: "" },
];

interface Lead {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  listings: { title: string; slug: string; images: string[] } | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  nuevo:          { label: "Nuevo",          color: "#FF7F11", bg: "#FFF0E8" },
  contactado:     { label: "Contactado",     color: "#5BAFB0", bg: "#E6F7F7" },
  en_seguimiento: { label: "En Seguimiento", color: "#7C68EE", bg: "#F0EEFF" },
  cerrado:        { label: "Cerrado",        color: "#6B7565", bg: "#F0F0EE" },
};

export function LeadsBoard({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [exporting, setExporting] = useState(false);
  const [showWaPanel, setShowWaPanel] = useState(false);
  const [waTemplateId, setWaTemplateId] = useState("saludo");
  const [waMessage, setWaMessage] = useState("");

  async function handleExportCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/leads?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const filtered = filterStatus === "all"
    ? leads
    : leads.filter((l) => l.status === filterStatus);

  async function updateLead(id: string, updates: Partial<Lead>) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("leads").update(updates).eq("id", id);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    if (selected?.id === id) setSelected((s) => s ? { ...s, ...updates } : null);
    setSaving(false);
  }

  function fillTemplate(templateId: string, lead: Lead): string {
    const tpl = WA_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return "";
    return tpl.body
      .replace(/{name}/g, lead.visitor_name ?? "")
      .replace(/{listing}/g, lead.listings?.title ?? "la propiedad")
      .replace(/{price}/g, "consultar precio");
  }

  function openLead(lead: Lead) {
    setSelected(lead);
    setNotes(lead.notes ?? "");
    setShowWaPanel(false);
    setWaTemplateId("saludo");
    setWaMessage(fillTemplate("saludo", lead));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* List panel */}
      <div className="flex-1 min-w-0">
        {/* Toolbar: filters + export */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(["all", "nuevo", "contactado", "en_seguimiento", "cerrado"] as const).map((s) => {
            const cfg = s === "all" ? { label: "Todos", color: "#262626", bg: "#E2E8CE" } : STATUS_CONFIG[s];
            const count = s === "all" ? leads.length : leads.filter((l) => l.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-sm text-xs font-medium transition-all border"
                style={
                  filterStatus === s
                    ? { backgroundColor: cfg.color, color: "white", borderColor: cfg.color }
                    : { backgroundColor: "transparent", color: "#6B7565", borderColor: "#D8D3C8" }
                }
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || leads.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B7565] border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE] disabled:opacity-40 transition-colors"
          >
            {exporting ? "Exportando..." : "⬇ CSV"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-10 text-center">
            <p className="text-[#6B7565] text-sm">No hay leads en esta categoría.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden divide-y divide-[#EAE7DC]">
            {filtered.map((lead) => {
              const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.nuevo;
              const date = new Date(lead.created_at).toLocaleDateString("es-BO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <button
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${selected?.id === lead.id ? "bg-[#F7F5EE]" : "hover:bg-[#F7F5EE]"}`}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {lead.visitor_name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#262626] truncate">
                      {lead.visitor_name ?? "Visitante anónimo"}
                    </p>
                    <p className="text-xs text-[#6B7565] truncate">
                      {lead.visitor_email ?? "—"} · {lead.listings?.title ?? "Contacto general"}
                    </p>
                  </div>

                  {/* Status pill */}
                  <span
                    className="label-caps px-2 py-1 rounded-sm flex-shrink-0 text-xs"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>

                  <span className="label-caps text-[#ACBFA4] flex-shrink-0 hidden sm:block">{date}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="lg:w-80 bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-[#262626]"
                style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.2rem", fontWeight: 500 }}
              >
                {selected.visitor_name ?? "Anónimo"}
              </p>
              <p className="text-xs text-[#6B7565] mt-0.5">
                {new Date(selected.created_at).toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#ACBFA4] hover:text-[#262626]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-2">
            {selected.visitor_email && (
              <a href={`mailto:${selected.visitor_email}`} className="flex items-center gap-2 text-sm text-[#262626] hover:text-[#FF7F11] transition-colors">
                <svg className="w-4 h-4 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {selected.visitor_email}
              </a>
            )}
            {selected.visitor_phone && (
              <div className="flex flex-col gap-0">
                <button
                  onClick={() => setShowWaPanel(v => !v)}
                  className="flex items-center gap-2 text-sm text-[#262626] hover:text-[#25d366] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#ACBFA4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.529 5.859L0 24l6.335-1.607A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.914 0-3.71-.5-5.27-1.377L2.5 21.5l.907-3.992A9.95 9.95 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                  <span>{selected.visitor_phone}</span>
                  <span className="ml-auto text-[10px] text-[#FF7F11] font-medium">{showWaPanel ? "▲ cerrar" : "💬 enviar"}</span>
                </button>

                {showWaPanel && (
                  <div className="mt-3 border border-[#25d366]/30 rounded-sm p-3 bg-[#f0fff4] flex flex-col gap-3">
                    <p className="label-caps text-[#25d366]">Plantilla de mensaje</p>
                    <div className="flex flex-wrap gap-1.5">
                      {WA_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setWaTemplateId(t.id);
                            setWaMessage(fillTemplate(t.id, selected));
                          }}
                          className="px-2.5 py-1 rounded-sm text-xs font-medium border transition-all"
                          style={waTemplateId === t.id
                            ? { background: "#25d366", color: "#fff", borderColor: "#25d366" }
                            : { background: "#fff", color: "#6B7565", borderColor: "#D8D3C8" }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={waMessage}
                      onChange={e => setWaMessage(e.target.value)}
                      rows={4}
                      className="w-full border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#25d366]"
                      placeholder="Escribe tu mensaje..."
                    />
                    <button
                      onClick={() => {
                        const phone = selected.visitor_phone!.replace(/\D/g, "");
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, "_blank");
                        const timestamp = new Date().toLocaleString("es-BO");
                        const logEntry = `\n[WhatsApp ${timestamp}]: ${waMessage}`;
                        const newNotes = (notes || "") + logEntry;
                        setNotes(newNotes);
                        updateLead(selected.id, { notes: newNotes });
                      }}
                      className="w-full py-2 bg-[#25d366] text-white text-sm font-medium rounded-sm hover:bg-[#1ea952] transition-colors"
                    >
                      Abrir WhatsApp →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property */}
          {selected.listings && (
            <div className="bg-[#F7F5EE] rounded-sm px-3 py-2.5">
              <p className="label-caps text-[#6B7565] mb-0.5">Propiedad</p>
              <p className="text-sm text-[#262626] truncate">{selected.listings.title}</p>
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="label-caps text-[#6B7565] block mb-2">Estado del Lead</label>
            <select
              value={selected.status}
              onChange={(e) => updateLead(selected.id, { status: e.target.value as LeadStatus })}
              className="w-full border border-[#D8D3C8] rounded-sm px-3 py-2.5 text-sm text-[#262626] focus:outline-none focus:border-[#FF7F11] cursor-pointer"
            >
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label-caps text-[#6B7565] block mb-2">Notas Privadas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Agregar notas sobre este lead..."
              className="w-full border border-[#D8D3C8] rounded-sm px-3 py-2.5 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] transition-colors resize-none"
            />
          </div>

          <button
            onClick={() => updateLead(selected.id, { notes })}
            disabled={saving}
            className="w-full py-2.5 bg-[#262626] text-white text-sm font-medium rounded-sm hover:bg-[#323232] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Notas"}
          </button>
        </div>
      )}
    </div>
  );
}
