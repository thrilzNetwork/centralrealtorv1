"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ─── Types ────────────────────────────────────────────────────
interface SiteSettings {
  hero_title:        string | null;
  hero_headline:     string | null;
  hero_subtitle:     string | null;
  hero_images:       string[] | null;
  broker_name:       string | null;
  broker_logo_url:   string | null;
  broker_agent_code: string | null;
  primary_color:     string;
  secondary_color:   string;
  logo_url:          string | null;
}

const BROKER_PRESETS = [
  { name: "Century 21",      color: "#FFCB00" },
  { name: "Re/Max",          color: "#E02020" },
  { name: "Coldwell Banker", color: "#003087" },
  { name: "Keller Williams", color: "#B40000" },
  { name: "ERA Real Estate", color: "#FF6600" },
  { name: "Independiente",   color: null },
];

// ─── Section heading ─────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6 flex flex-col gap-4">
      <div className="border-b border-[#EAE7DC] pb-3">
        <h2 style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}
          className="text-[#262626]">{title}</h2>
        {subtitle && <p className="text-xs text-[#ACBFA4] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Image uploader row ───────────────────────────────────────
function HeroImageManager({
  images, onChange, primary,
}: { images: string[]; onChange: (imgs: string[]) => void; primary: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "hero-images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al subir"); break; }
      if (data.url) onChange([...images, data.url]);
    }
    setUploading(false);
    e.target.value = "";
  }

  function remove(idx: number) { onChange(images.filter((_, i) => i !== idx)); }
  function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...images]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; onChange(arr);
  }
  function moveDown(idx: number) {
    if (idx === images.length - 1) return;
    const arr = [...images]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; onChange(arr);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={url + i} className="relative rounded-sm overflow-hidden border border-[#EAE7DC]" style={{ aspectRatio: "16/9" }}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button type="button" onClick={() => moveUp(i)} className="w-7 h-7 bg-white/20 text-white text-xs rounded flex items-center justify-center hover:bg-white/40">↑</button>
                <button type="button" onClick={() => moveDown(i)} className="w-7 h-7 bg-white/20 text-white text-xs rounded flex items-center justify-center hover:bg-white/40">↓</button>
                <button type="button" onClick={() => remove(i)} className="w-7 h-7 bg-red-500/80 text-white text-xs rounded flex items-center justify-center hover:bg-red-600">✕</button>
              </div>
              <div className="absolute top-1 left-1 w-5 h-5 rounded text-xs text-white flex items-center justify-center font-bold"
                style={{ backgroundColor: primary }}>{i + 1}</div>
            </div>
          ))}
        </div>
      )}
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#D8D3C8] text-sm text-[#6B7565] rounded-sm hover:bg-[#F7F5EE] transition-colors">
        {uploading
          ? <><div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" /> Subiendo...</>
          : <><span className="text-lg leading-none">+</span> Agregar imagen{images.length > 0 ? "s" : ""}</>}
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {images.length === 0 && (
        <p className="text-xs text-[#ACBFA4]">Sin imágenes se usarán fotos genéricas. Sube 3–5 para el mejor efecto.</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────
export function SiteCustomizerForm({ settings }: { settings: SiteSettings | null }) {
  const [heroTitle,    setHeroTitle]    = useState(settings?.hero_title    ?? "Aquí encontrarás");
  const [heroHeadline, setHeroHeadline] = useState(settings?.hero_headline ?? "tu hogar");
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.hero_subtitle ?? "");
  const [heroImages,   setHeroImages]   = useState<string[]>(settings?.hero_images ?? []);

  const [brokerName,      setBrokerName]      = useState(settings?.broker_name       ?? "");
  const [brokerLogoUrl,   setBrokerLogoUrl]   = useState(settings?.broker_logo_url   ?? "");
  const [brokerAgentCode, setBrokerAgentCode] = useState(settings?.broker_agent_code ?? "");
  const [uploadingBroker, setUploadingBroker] = useState(false);

  // Primary color is read-only here — editable only in Brand Manager
  const primaryColor = settings?.primary_color ?? "#FF7F11";

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function uploadFile(file: File, bucket: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return res.ok ? data.url : null;
  }

  async function handleBrokerLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingBroker(true);
    const url = await uploadFile(file, "logos");
    if (url) setBrokerLogoUrl(url);
    setUploadingBroker(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_title:        heroTitle        || null,
        hero_headline:     heroHeadline     || null,
        hero_subtitle:     heroSubtitle     || null,
        hero_images:       heroImages,
        broker_name:       brokerName       || null,
        broker_logo_url:   brokerLogoUrl    || null,
        broker_agent_code: brokerAgentCode  || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al guardar"); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">

      {/* ── Hero Text ──────────────────────────────────────── */}
      <Section title="Texto del Hero" subtitle="Las palabras grandes que aparecen en la portada de tu sitio">
        <Input label="Primera línea (texto normal)" value={heroTitle}
          onChange={e => setHeroTitle(e.target.value)} placeholder="Aquí encontrarás" />
        <Input label="Segunda línea (acento en color)" value={heroHeadline}
          onChange={e => setHeroHeadline(e.target.value)} placeholder="tu hogar" />
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Subtítulo (opcional)</label>
          <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={2}
            placeholder="Ej: Especialista en propiedades exclusivas de Santa Cruz"
            className="w-full border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] transition-colors resize-none" />
        </div>
        {/* Live preview */}
        <div className="rounded-sm p-4 mt-1" style={{ background: "#1e1e1e" }}>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: primaryColor }}>— Preview</p>
          <h3 style={{ fontFamily: "Noto Serif, Georgia, serif", fontSize: "1.5rem", color: "#fff", fontWeight: 400, lineHeight: 1.15, margin: 0 }}>
            {heroTitle || "Aquí encontrarás"}{" "}
            <em style={{ color: primaryColor, fontStyle: "italic" }}>{heroHeadline || "tu hogar"}</em>
          </h3>
          {heroSubtitle && (
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>{heroSubtitle}</p>
          )}
        </div>
      </Section>

      {/* ── Hero Images ────────────────────────────────────── */}
      <Section title="Imágenes del Hero" subtitle="Fotos que rotan en la portada (recomendado: 3–5 imágenes horizontales)">
        <HeroImageManager images={heroImages} onChange={setHeroImages} primary={primaryColor} />
      </Section>

      {/* ── Broker / Agencia ───────────────────────────────── */}
      <Section title="Agencia o Broker" subtitle="Si trabajas bajo una marca como Re/Max, Century 21 u otra">
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Marca conocida (opcional)</label>
          <div className="flex flex-wrap gap-2">
            {BROKER_PRESETS.map(bp => (
              <button key={bp.name} type="button"
                onClick={() => setBrokerName(bp.name === "Independiente" ? "" : bp.name)}
                className="px-3 py-1.5 text-xs border rounded-sm transition-colors"
                style={{
                  borderColor: brokerName === bp.name ? "#FF7F11" : "#D8D3C8",
                  background:  brokerName === bp.name ? "#FFF8F2" : "white",
                  color: "#262626",
                }}>{bp.name}</button>
            ))}
          </div>
        </div>

        <Input label="Nombre de agencia / broker" value={brokerName}
          onChange={e => setBrokerName(e.target.value)} placeholder="Ej: Century 21 Bolivia" />
        <Input label="Código de agente (opcional)" value={brokerAgentCode}
          onChange={e => setBrokerAgentCode(e.target.value)} placeholder="Ej: RAUS. APONTE #2134" />

        <div className="flex flex-col gap-2">
          <label className="label-caps text-[#6B7565]">Logo de la agencia</label>
          <div className="flex items-center gap-4 flex-wrap">
            {brokerLogoUrl ? (
              <div className="relative">
                <img src={brokerLogoUrl} alt="Broker" className="h-12 object-contain border border-[#EAE7DC] rounded-sm p-1 bg-white max-w-[160px]" />
                <button type="button" onClick={() => setBrokerLogoUrl("")}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
              </div>
            ) : (
              <div className="w-16 h-12 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm flex items-center justify-center">
                <span className="text-xs text-[#ACBFA4]">Sin logo</span>
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-[#D8D3C8] text-sm text-[#262626] rounded-sm hover:bg-[#F7F5EE] transition-colors">
              {uploadingBroker ? <><div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />Subiendo…</> : "Subir logo de agencia"}
              <input type="file" accept="image/*" className="hidden" onChange={handleBrokerLogoUpload} />
            </label>
          </div>
          <p className="text-xs text-[#ACBFA4]">Aparecerá en el header junto a tu nombre.</p>
        </div>
      </Section>

      {/* ── Brand identity link ────────────────────────────── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#262626]">Logo personal y colores de marca</p>
          <p className="text-xs text-[#6B7565] mt-0.5">Edita tu identidad visual en Brand Manager</p>
        </div>
        <a href="/dashboard/marca?tab=identidad"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#FF7F11] border border-[#FF7F11]/30 rounded-sm hover:bg-[#FF7F11]/10 transition-colors whitespace-nowrap">
          Ir a Brand Manager →
        </a>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-sm">{error}</p>
      )}

      <Button type="submit" loading={saving} size="lg" className="w-full sm:w-auto">
        {saved ? "✓ Cambios guardados" : "Guardar Cambios"}
      </Button>
    </form>
  );
}
