"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { CreativeType } from "@/app/api/media/generate-creative/route";

interface Profile {
  full_name: string | null;
  brand_voice: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  city: string | null;
}

interface Listing {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  currency: string | null;
}

interface GeneratedAsset {
  id: string;
  label: string;
  type: CreativeType;
  content: string;
  platform: string | null;
  generatedAt: string;
}

// ─── Static data ─────────────────────────────────────────────

const CREATIVE_CARDS: {
  value: CreativeType;
  label: string;
  icon: string;
  desc: string;
  color: string;
}[] = [
  { value: "logo_concept",  label: "Concepto de Logo",     icon: "🎨", desc: "Ideas visuales para tu logo",      color: "#F59E0B" },
  { value: "tagline",       label: "Tagline / Slogan",      icon: "✍️", desc: "Frases memorables de marca",       color: "#8B5CF6" },
  { value: "color_palette", label: "Paleta de Colores",     icon: "🖌️", desc: "Colores que comunican tu marca",   color: "#EC4899" },
  { value: "social_post",   label: "Post Redes Sociales",   icon: "📲", desc: "Copy listo para publicar",         color: "#3B82F6" },
  { value: "listing_desc",  label: "Descripción Propiedad", icon: "🏠", desc: "Texto persuasivo para listings",   color: "#10B981" },
  { value: "video_script",  label: "Guión de Video",        icon: "🎬", desc: "Script para Reels / TikTok",       color: "#EF4444" },
];

const VIDEO_STYLES = [
  { value: "cinematic",   label: "Cinematográfico", icon: "🎬" },
  { value: "aerial",      label: "Aéreo · Drone",   icon: "🚁" },
  { value: "walkthrough", label: "Recorrido",       icon: "🚶" },
  { value: "lifestyle",   label: "Lifestyle",       icon: "☀️" },
  { value: "luxury",      label: "Lujo",            icon: "💎" },
];

const PLATFORMS = ["instagram", "facebook", "tiktok"];
const TONES = [
  { value: "lujo",     label: "Lujo" },
  { value: "agresivo", label: "Urgente" },
  { value: "empatico", label: "Empático" },
];

const COLOR_PRESETS = [
  { name: "Naranja", value: "#FF7F11" },
  { name: "Salvia",  value: "#ACBFA4" },
  { name: "Ébano",   value: "#262626" },
  { name: "Cobalto", value: "#1B4FD8" },
  { name: "Esmeralda", value: "#059669" },
  { name: "Vino",    value: "#9B1C1C" },
];

const STORAGE_KEY = "brand_assets_v2";

function loadAssets(): GeneratedAsset[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveAssets(assets: GeneratedAsset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.slice(0, 50)));
}

// ─── Component ───────────────────────────────────────────────

export function BrandManager({
  profile,
  listings = [],
}: {
  profile: Profile | null;
  listings?: Listing[];
}) {
  const [tab, setTab] = useState<"crear" | "biblioteca" | "identidad">("crear");

  // ── Studio state ──
  const [creativeType, setCreativeType] = useState<CreativeType>("social_post");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("empatico");
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [manualListingText, setManualListingText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);

  // ── Identidad state ──
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color ?? "#FF7F11");
  const [secondaryColor, setSecondaryColor] = useState(profile?.secondary_color ?? "#ACBFA4");
  const [brandVoiceFile, setBrandVoiceFile] = useState<File | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(profile?.brand_voice ?? "");
  const [colorPdfFile, setColorPdfFile] = useState<File | null>(null);
  const [extractingColors, setExtractingColors] = useState(false);
  const [colorExtractMsg, setColorExtractMsg] = useState<string | null>(null);
  const [savingIdentidad, setSavingIdentidad] = useState(false);
  const [savedIdentidad, setSavedIdentidad] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => { setAssets(loadAssets()); }, []);

  // ── Helpers ──
  function listingTitle(): string | undefined {
    if (selectedListingId) {
      const l = listings.find(x => x.id === selectedListingId);
      if (l) {
        let t = l.title ?? "";
        if (l.city) t += `, ${l.city}`;
        if (l.price) t += ` — ${l.currency ?? "USD"} ${l.price.toLocaleString()}`;
        return t;
      }
    }
    return manualListingText || undefined;
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    setResult(null);
    try {
      const res = await fetch("/api/media/generate-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: creativeType,
          platform: creativeType === "social_post" ? platform : undefined,
          tone: creativeType === "social_post" ? tone : undefined,
          videoStyle: creativeType === "video_script" ? videoStyle : undefined,
          listingTitle: listingTitle(),
          customPrompt: customPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      const asset: GeneratedAsset = {
        id: crypto.randomUUID(),
        label: data.label,
        type: data.type,
        content: data.content,
        platform: data.platform,
        generatedAt: data.generatedAt,
      };
      setResult(asset);
      const updated = [asset, ...assets];
      setAssets(updated);
      saveAssets(updated);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload(asset: GeneratedAsset) {
    const blob = new Blob([asset.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.label.toLowerCase().replace(/\s+/g, "-")}-${asset.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDeleteAsset(id: string) {
    const updated = assets.filter((a: GeneratedAsset) => a.id !== id);
    setAssets(updated);
    saveAssets(updated);
    if (result?.id === id) setResult(null);
  }

  // ── Identidad handlers ──
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setIdError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "logos");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setIdError(uploadData.error ?? "Error al subir logo"); return; }
      const newUrl = uploadData.url as string;
      setLogoUrl(newUrl);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleColorPdfExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setColorPdfFile(file);
    setExtractingColors(true);
    setColorExtractMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-brand-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar PDF");
      if (data.primary_color) setPrimaryColor(data.primary_color);
      if (data.secondary_color) setSecondaryColor(data.secondary_color);
      setColorExtractMsg(data.colors?.length ? "✓ Colores aplicados desde el PDF" : "No se encontraron colores en el PDF");
    } catch (err) {
      setColorExtractMsg(err instanceof Error ? err.message : "Error al procesar PDF");
    } finally {
      setExtractingColors(false);
      e.target.value = "";
      setColorPdfFile(null);
    }
  }

  async function handleVoiceUpload() {
    if (!brandVoiceFile) return;
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append("file", brandVoiceFile);
      const res = await fetch("/api/brand-voice", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar");
      setCurrentVoice(data.brand_voice);
      setBrandVoiceFile(null);
    } catch (err) {
      setIdError(err instanceof Error ? err.message : "Error al subir voz");
    } finally {
      setUploadingVoice(false);
    }
  }

  async function handleSaveIdentidad() {
    setSavingIdentidad(true);
    setIdError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setSavedIdentidad(true);
      setTimeout(() => setSavedIdentidad(false), 3000);
    } catch (err) {
      setIdError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingIdentidad(false);
    }
  }

  const needsProperty = creativeType === "social_post" || creativeType === "listing_desc" || creativeType === "video_script";
  const selectedCard = CREATIVE_CARDS.find(c => c.value === creativeType)!;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Brand header strip ── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 flex items-center gap-4">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain border border-[#EAE7DC] rounded-sm p-1 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-sm flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: primaryColor }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? "M"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[#262626] font-medium truncate text-sm">{profile?.full_name ?? "Mi Marca"}</p>
          <p className="text-xs text-[#6B7565]">{profile?.city ?? "Bolivia"}</p>
          <div className="flex gap-1.5 mt-1.5">
            {[primaryColor, secondaryColor].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-[#EAE7DC]" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[#EAE7DC] rounded-sm p-1 w-fit">
        {([
          { key: "crear",     label: "✦ Crear" },
          { key: "biblioteca",label: "📁 Biblioteca" },
          { key: "identidad", label: "🎨 Identidad" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-sm text-xs font-medium transition-all"
            style={tab === key
              ? { background: "#fff", color: "#262626", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { color: "#6B7565" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: CREAR
      ══════════════════════════════════════════════════════ */}
      {tab === "crear" && (
        <div className="flex flex-col gap-5">
          {/* Creative type grid — Canva-style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CREATIVE_CARDS.map(({ value, label, icon, desc, color }) => (
              <button key={value} onClick={() => { setCreativeType(value); setResult(null); setGenError(null); }}
                className="group flex flex-col gap-2 p-4 rounded-sm border text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={creativeType === value
                  ? { borderColor: color, background: `${color}0f`, boxShadow: `0 0 0 1px ${color}40` }
                  : { borderColor: "#EAE7DC", background: "#fff" }}>
                <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${color}18` }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#262626] leading-tight">{label}</p>
                  <p className="text-[10px] text-[#6B7565] mt-0.5 leading-tight">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Options panel */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm flex items-center justify-center text-base"
                style={{ backgroundColor: `${selectedCard.color}18` }}>
                {selectedCard.icon}
              </div>
              <h3 className="text-[#262626] font-semibold text-sm">{selectedCard.label}</h3>
            </div>

            {/* Video style picker */}
            {creativeType === "video_script" && (
              <div className="flex flex-col gap-2">
                <label className="label-caps text-[#6B7565]">Estilo de video</label>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_STYLES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setVideoStyle(s.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-sm border text-xs font-medium transition-all"
                      style={videoStyle === s.value
                        ? { borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }
                        : { borderColor: "#EAE7DC", background: "#fff", color: "#6B7565" }}>
                      <span>{s.icon}</span>{s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Platform + tone for social posts */}
            {creativeType === "social_post" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Plataforma</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Tono</label>
                  <select value={tone} onChange={e => setTone(e.target.value)}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]">
                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Property picker */}
            {needsProperty && (
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Propiedad</label>
                {listings.length > 0 ? (
                  <select value={selectedListingId} onChange={e => setSelectedListingId(e.target.value)}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]">
                    <option value="">— Sin propiedad específica —</option>
                    {listings.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.title ?? "Sin título"}{l.city ? ` · ${l.city}` : ""}{l.price ? ` · ${l.currency ?? "USD"} ${l.price.toLocaleString()}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={manualListingText} onChange={e => setManualListingText(e.target.value)}
                    placeholder="Casa en Equipetrol, 3 hab., $150,000"
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
                )}
              </div>
            )}

            {/* Custom prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">
                {creativeType === "logo_concept" ? "Estilo o dirección (opcional)" :
                 creativeType === "color_palette" ? "Preferencias de colores (opcional)" :
                 creativeType === "tagline" ? "Público objetivo (opcional)" :
                 creativeType === "video_script" ? "Notas del director (opcional)" :
                 "Detalles adicionales (opcional)"}
              </label>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={2}
                placeholder={
                  creativeType === "logo_concept" ? "Ej: minimalista, moderno, con edificio abstracto..." :
                  creativeType === "color_palette" ? "Ej: tonos tierra, nada muy brillante..." :
                  creativeType === "video_script" ? "Ej: quiero incluir la piscina, clima de atardecer..." :
                  "Ej: urgente, incluir el precio..."
                }
                className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#FF7F11]" />
            </div>

            {genError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">{genError}</p>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button onClick={handleGenerate} loading={generating} disabled={generating}>
                {generating ? "Generando con IA..." : `Generar ${selectedCard.label}`}
              </Button>
              <span className="text-xs text-[#ACBFA4]">Gemini · ~$0.00</span>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span className="label-caps text-[#FF7F11]">{result.label}</span>
                  <p className="text-xs text-[#ACBFA4] mt-0.5">
                    {new Date(result.generatedAt).toLocaleString("es-BO")} · Guardado en Biblioteca
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(result.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]">
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                  <button onClick={() => handleDownload(result)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]">
                    ⬇ Descargar
                  </button>
                </div>
              </div>
              <div className="bg-[#F7F5EE] rounded-sm p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-[#262626] whitespace-pre-wrap leading-relaxed font-sans">{result.content}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: BIBLIOTECA
      ══════════════════════════════════════════════════════ */}
      {tab === "biblioteca" && (
        <div className="flex flex-col gap-3">
          {assets.length === 0 ? (
            <div className="bg-white border border-[#EAE7DC] rounded-sm p-10 text-center">
              <p className="text-2xl mb-2">📂</p>
              <p className="text-[#6B7565] text-sm">Aún no has generado ningún creativo.</p>
              <button onClick={() => setTab("crear")} className="mt-3 text-sm text-[#FF7F11] hover:underline">
                Ir a Crear →
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#6B7565]">{assets.length} creativos guardados en este dispositivo.</p>
              {assets.map(asset => (
                <div key={asset.id} className="bg-white border border-[#EAE7DC] rounded-sm p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <span className="label-caps text-[#FF7F11]">{asset.label}</span>
                      {asset.platform && <span className="ml-2 text-xs text-[#6B7565]">· {asset.platform}</span>}
                      <p className="text-xs text-[#ACBFA4] mt-0.5">{new Date(asset.generatedAt).toLocaleString("es-BO")}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleCopy(asset.content)}
                        className="px-2.5 py-1 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]">Copiar</button>
                      <button onClick={() => handleDownload(asset)}
                        className="px-2.5 py-1 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]">⬇</button>
                      <button onClick={() => handleDeleteAsset(asset.id)}
                        className="px-2.5 py-1 text-xs border border-red-100 text-red-400 rounded-sm hover:bg-red-50">✕</button>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7565] line-clamp-3 whitespace-pre-wrap">{asset.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: IDENTIDAD
      ══════════════════════════════════════════════════════ */}
      {tab === "identidad" && (
        <div className="flex flex-col gap-5">

          {/* Logo */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
            <h3 className="text-[#262626] font-semibold text-sm">Logo</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain border border-[#EAE7DC] rounded-sm p-1 bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-sm flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: primaryColor }}>
                  {profile?.full_name?.[0]?.toUpperCase() ?? "M"}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-[#D8D3C8] text-sm rounded-sm hover:bg-[#F7F5EE] transition-colors">
                  {uploadingLogo
                    ? <><div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />Subiendo…</>
                    : "Subir logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl("")}
                    className="text-xs text-red-500 hover:underline text-left">Eliminar logo</button>
                )}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-[#262626] font-semibold text-sm">Colores de Marca</h3>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-[#D8D3C8] text-xs text-[#6B7565] rounded-sm hover:border-[#FF7F11] hover:bg-[#FFF8F2] transition-colors">
                {extractingColors
                  ? <><div className="w-3.5 h-3.5 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />Extrayendo…</>
                  : <><span>📄</span> Extraer de PDF</>}
                <input type="file" accept=".pdf" className="hidden" onChange={handleColorPdfExtract} disabled={extractingColors} />
              </label>
            </div>
            {colorExtractMsg && (
              <p className={`text-xs px-3 py-2 rounded-sm ${colorExtractMsg.startsWith("✓") ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                {colorExtractMsg}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "Color Principal", color: primaryColor, setColor: setPrimaryColor },
                { label: "Color Secundario", color: secondaryColor, setColor: setSecondaryColor },
              ].map(({ label, color, setColor }) => (
                <div key={label}>
                  <label className="label-caps text-[#6B7565] block mb-2">{label}</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} type="button" title={c.name}
                        onClick={() => setColor(c.value)}
                        className="w-7 h-7 rounded-full transition-transform active:scale-90 border-2"
                        style={{ backgroundColor: c.value, borderColor: color === c.value ? "#262626" : "transparent" }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                      className="w-10 h-9 cursor-pointer border border-[#D8D3C8] rounded-sm" />
                    <input type="text" value={color} onChange={e => setColor(e.target.value)}
                      className="text-sm font-mono text-[#6B7565] border border-[#D8D3C8] rounded-sm px-2 py-1 w-24 focus:outline-none focus:border-[#FF7F11]" />
                  </div>
                </div>
              ))}
            </div>
            {/* Live preview */}
            <div className="rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#1e1e1e" }}>
                <span className="text-white text-sm">{profile?.full_name ?? "Tu Nombre"}</span>
                <div className="px-3 py-1 rounded-sm text-white text-xs font-semibold" style={{ backgroundColor: primaryColor }}>
                  Ver Portal
                </div>
              </div>
            </div>
          </div>

          {/* Brand voice */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
            <h3 className="text-[#262626] font-semibold text-sm">Voz de Marca</h3>
            <p className="text-xs text-[#6B7565]">
              Sube un PDF o .txt con tu filosofía y valores. La IA extraerá tu voz de marca para personalizar todos los creativos.
            </p>
            <div className="flex gap-3 items-end flex-wrap">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-[#D8D3C8] text-sm rounded-sm hover:bg-[#F7F5EE] transition-colors">
                {brandVoiceFile ? `📄 ${brandVoiceFile.name}` : "Seleccionar PDF o .txt"}
                <input type="file" accept=".pdf,.txt" className="hidden"
                  onChange={e => setBrandVoiceFile(e.target.files?.[0] ?? null)} />
              </label>
              <Button onClick={handleVoiceUpload} disabled={!brandVoiceFile || uploadingVoice} size="sm" loading={uploadingVoice}>
                {uploadingVoice ? "Analizando..." : "Extraer Voz"}
              </Button>
            </div>
            {currentVoice && (
              <div className="bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-4">
                <p className="label-caps text-[#6B7565] mb-1.5">Voz de Marca Actual</p>
                <p className="text-sm text-[#262626] leading-relaxed italic">"{currentVoice}"</p>
              </div>
            )}
          </div>

          {idError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">{idError}</p>
          )}

          <Button onClick={handleSaveIdentidad} loading={savingIdentidad} size="lg" className="w-full sm:w-auto">
            {savedIdentidad ? "✓ Identidad guardada" : "Guardar Identidad"}
          </Button>
        </div>
      )}
    </div>
  );
}
