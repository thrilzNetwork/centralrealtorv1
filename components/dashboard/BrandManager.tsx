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

interface GeneratedAsset {
  id: string;
  label: string;
  type: CreativeType;
  content: string;
  platform: string | null;
  generatedAt: string;
}

const CREATIVE_TYPES: { value: CreativeType; label: string; icon: string; desc: string }[] = [
  { value: "logo_concept",  label: "Concepto de Logo",       icon: "🎨", desc: "Ideas visuales para tu logo" },
  { value: "tagline",       label: "Tagline / Slogan",        icon: "✍️", desc: "Frases memorables de marca" },
  { value: "color_palette", label: "Paleta de Colores",       icon: "🖌️", desc: "Colores que comunican tu marca" },
  { value: "social_post",   label: "Post Redes Sociales",     icon: "📲", desc: "Copy listo para publicar" },
  { value: "listing_desc",  label: "Descripción Propiedad",   icon: "🏠", desc: "Texto persuasivo para listings" },
];

const PLATFORMS = ["instagram", "facebook", "tiktok"];
const TONES = [
  { value: "lujo",      label: "Lujo" },
  { value: "agresivo",  label: "Urgente" },
  { value: "empatico",  label: "Empático" },
];

const STORAGE_KEY = "brand_assets_v1";

function loadAssets(): GeneratedAsset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAssets(assets: GeneratedAsset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.slice(0, 50)));
}

export function BrandManager({ profile }: { profile: Profile | null }) {
  const [tab, setTab] = useState<"studio" | "library" | "voice">("studio");
  const [creativeType, setCreativeType] = useState<CreativeType>("logo_concept");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("empatico");
  const [customPrompt, setCustomPrompt] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAsset | null>(null);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [copied, setCopied] = useState(false);

  // Brand voice state
  const [brandVoiceFile, setBrandVoiceFile] = useState<File | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(profile?.brand_voice ?? "");

  useEffect(() => {
    setAssets(loadAssets());
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/media/generate-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: creativeType,
          platform: creativeType === "social_post" ? platform : undefined,
          tone: creativeType === "social_post" ? tone : undefined,
          listingTitle: listingTitle || undefined,
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
      setError(err instanceof Error ? err.message : "Error al generar");
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
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploadingVoice(false);
    }
  }

  const selectedTypeConfig = CREATIVE_TYPES.find(t => t.value === creativeType);

  return (
    <div className="flex flex-col gap-6">
      {/* Brand identity header */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex items-center gap-4">
        {profile?.logo_url ? (
          <img src={profile.logo_url} alt="Logo" className="w-14 h-14 object-contain border border-[#EAE7DC] rounded-sm p-1" />
        ) : (
          <div
            className="w-14 h-14 rounded-sm flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: profile?.primary_color ?? "#FF7F11" }}
          >
            {profile?.full_name?.[0]?.toUpperCase() ?? "M"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[#262626] font-medium truncate">{profile?.full_name ?? "Mi Marca"}</p>
          <p className="text-xs text-[#6B7565] mt-0.5">{profile?.city ?? "Bolivia"}</p>
          <div className="flex gap-1.5 mt-2">
            {[profile?.primary_color, profile?.secondary_color].filter(Boolean).map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-[#EAE7DC]" style={{ backgroundColor: c! }} title={c!} />
            ))}
          </div>
        </div>
        <a href="/dashboard/perfil" className="text-xs text-[#FF7F11] hover:underline whitespace-nowrap">Editar identidad →</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#EAE7DC] rounded-sm p-1 w-fit">
        {([
          { key: "studio",  label: "🎨 Creative Studio" },
          { key: "library", label: "📁 Mis Creativos" },
          { key: "voice",   label: "🎙️ Voz de Marca" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-sm text-xs font-medium transition-all"
            style={tab === key
              ? { background: "#fff", color: "#262626", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { color: "#6B7565" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── STUDIO TAB ── */}
      {tab === "studio" && (
        <div className="flex flex-col gap-5">
          {/* Creative type selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CREATIVE_TYPES.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                onClick={() => setCreativeType(value)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-sm border text-center transition-all"
                style={creativeType === value
                  ? { borderColor: "#FF7F11", background: "#FFF8F2" }
                  : { borderColor: "#EAE7DC", background: "#fff" }}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-[#262626] leading-tight">{label}</span>
                <span className="text-[10px] text-[#6B7565] leading-tight">{desc}</span>
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
            <h3 className="text-[#262626] font-medium text-sm">{selectedTypeConfig?.icon} {selectedTypeConfig?.label}</h3>

            {creativeType === "social_post" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Plataforma</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Tono</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]"
                  >
                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {(creativeType === "social_post" || creativeType === "listing_desc") && (
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Propiedad (opcional)</label>
                <input
                  type="text"
                  value={listingTitle}
                  onChange={e => setListingTitle(e.target.value)}
                  placeholder="Casa en Equipetrol, 3 hab., $150,000"
                  className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">
                {creativeType === "logo_concept" ? "Estilo o dirección creativa (opcional)" :
                 creativeType === "color_palette" ? "Preferencias o referentes (opcional)" :
                 creativeType === "tagline" ? "Enfoque o público objetivo (opcional)" :
                 "Detalles adicionales (opcional)"}
              </label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={2}
                placeholder={
                  creativeType === "logo_concept" ? "Ej: minimalista, moderno, con edificio abstracto..." :
                  creativeType === "color_palette" ? "Ej: prefiero tonos tierra, nada muy brillante..." :
                  creativeType === "tagline" ? "Ej: enfocado en familias jóvenes de clase media..." :
                  "Ej: urgente, incluir el precio, propiedad con piscina..."
                }
                className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#FF7F11]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">{error}</p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button onClick={handleGenerate} loading={generating} disabled={generating}>
                {generating ? "Generando con IA..." : `Generar ${selectedTypeConfig?.label}`}
              </Button>
              <span className="text-xs text-[#ACBFA4]">Powered by Gemini · ~$0.00</span>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="label-caps text-[#FF7F11]">{result.label}</span>
                  <p className="text-xs text-[#ACBFA4] mt-0.5">
                    {new Date(result.generatedAt).toLocaleString("es-BO")} · Guardado en Mis Creativos
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(result.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE] transition-colors"
                  >
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                  <button
                    onClick={() => handleDownload(result)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE] transition-colors"
                  >
                    ⬇ Descargar
                  </button>
                </div>
              </div>
              <div className="bg-[#F7F5EE] rounded-sm p-4">
                <pre className="text-sm text-[#262626] whitespace-pre-wrap leading-relaxed font-sans">{result.content}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === "library" && (
        <div className="flex flex-col gap-3">
          {assets.length === 0 ? (
            <div className="bg-white border border-[#EAE7DC] rounded-sm p-10 text-center">
              <p className="text-2xl mb-2">📂</p>
              <p className="text-[#6B7565] text-sm">Aún no has generado ningún creativo.</p>
              <button onClick={() => setTab("studio")} className="mt-3 text-sm text-[#FF7F11] hover:underline">
                Ir al Creative Studio →
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#6B7565]">{assets.length} creativos guardados localmente en este dispositivo.</p>
              {assets.map(asset => (
                <div key={asset.id} className="bg-white border border-[#EAE7DC] rounded-sm p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="label-caps text-[#FF7F11]">{asset.label}</span>
                      {asset.platform && <span className="ml-2 text-xs text-[#6B7565]">· {asset.platform}</span>}
                      <p className="text-xs text-[#ACBFA4] mt-0.5">{new Date(asset.generatedAt).toLocaleString("es-BO")}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(asset.content)}
                        className="px-2.5 py-1 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={() => handleDownload(asset)}
                        className="px-2.5 py-1 text-xs border border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE]"
                      >
                        ⬇
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="px-2.5 py-1 text-xs border border-red-100 text-red-400 rounded-sm hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7565] line-clamp-3 whitespace-pre-wrap">{asset.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── VOICE TAB ── */}
      {tab === "voice" && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-[#262626] font-medium">Kit de Voz de Marca</h3>
              <p className="text-sm text-[#6B7565] mt-1">
                Sube un PDF o texto con tu filosofía, valores y forma de comunicarte. La IA extraerá tu voz de marca para personalizar todos los creativos generados.
              </p>
            </div>

            <div className="flex gap-3 items-end flex-wrap">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-[#D8D3C8] text-sm rounded-sm hover:bg-[#F7F5EE] transition-colors">
                {brandVoiceFile ? `📄 ${brandVoiceFile.name}` : "Seleccionar PDF o .txt"}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={e => setBrandVoiceFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button onClick={handleVoiceUpload} disabled={!brandVoiceFile || uploadingVoice} size="sm" loading={uploadingVoice}>
                {uploadingVoice ? "Analizando..." : "Extraer Voz de Marca"}
              </Button>
            </div>

            {currentVoice && (
              <div className="bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-4">
                <p className="label-caps text-[#6B7565] mb-2">Tu Voz de Marca Actual</p>
                <p className="text-sm text-[#262626] leading-relaxed italic">"{currentVoice}"</p>
                <p className="text-xs text-[#ACBFA4] mt-2">Esta voz se usa automáticamente en todos los creativos generados.</p>
              </div>
            )}

            {!currentVoice && (
              <div className="border border-dashed border-[#D8D3C8] rounded-sm p-4 text-center">
                <p className="text-sm text-[#ACBFA4]">Sin voz de marca configurada aún.</p>
                <p className="text-xs text-[#ACBFA4] mt-1">Los creativos usarán valores predeterminados.</p>
              </div>
            )}
          </div>

          {/* Brand colors quick reference */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-6">
            <h3 className="text-[#262626] font-medium mb-3">Colores de Marca</h3>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Principal", color: profile?.primary_color ?? "#FF7F11" },
                { label: "Secundario", color: profile?.secondary_color ?? "#ACBFA4" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-sm border border-[#EAE7DC]" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-xs font-medium text-[#262626]">{label}</p>
                    <p className="text-xs text-[#6B7565] font-mono">{color}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="/dashboard/perfil" className="mt-3 inline-block text-xs text-[#FF7F11] hover:underline">
              Cambiar colores en Mi Perfil →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
