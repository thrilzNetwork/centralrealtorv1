"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

type Tone = "agresivo" | "lujo" | "empatico";
type Platform = "instagram" | "facebook" | "tiktok";

const CHAR_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  tiktok: 150,
};

const TONE_LABELS: Record<Tone, string> = {
  agresivo: "Agresivo",
  lujo: "Lujo",
  empatico: "Empático",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function CMDigitalPanel({ listingId }: { listingId: string }) {
  const [tone, setTone] = useState<Tone>("lujo");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [copy, setCopy] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [socialConnected, setSocialConnected] = useState<Record<Platform, boolean>>({
    instagram: false,
    facebook: false,
    tiktok: false,
  });

  useEffect(() => {
    fetch("/api/social/status")
      .then((r) => r.json())
      .then((data: Record<Platform, boolean>) => setSocialConnected(data))
      .catch(() => {});
  }, []);

  const charLimit = CHAR_LIMITS[platform];
  const isOverLimit = copy.length > charLimit;

  async function handleGenerate() {
    setGenerating(true);
    setCopy("");
    setPublishResult(null);
    try {
      const res = await fetch("/api/cm/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, tone, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar");
      setCopy(data.copy ?? "");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/cm/publish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, copy }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishResult({ ok: false, message: data.error ?? "Error al publicar" });
      } else {
        setPublishResult({ ok: true, message: `Publicado en ${PLATFORM_LABELS[platform]}` });
      }
    } catch {
      setPublishResult({ ok: false, message: "Error de conexión" });
    } finally {
      setPublishing(false);
    }
  }

  const canPublish = socialConnected[platform] && platform !== "tiktok";

  return (
    <div className="mt-2 bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-5">
      <div className="border-b border-[#EAE7DC] pb-3 flex items-center justify-between">
        <div>
          <h2
            className="text-[#262626]"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}
          >
            CM Digital
          </h2>
          <p className="text-xs text-[#6B7565] mt-0.5">
            Genera una publicación optimizada para redes sociales con IA
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 bg-[#FF7F11]/10 text-[#FF7F11] text-xs font-medium rounded-sm border border-[#FF7F11]/20">
          IA
        </span>
      </div>

      {/* Tone selector */}
      <div>
        <p className="text-xs font-medium text-[#6B7565] uppercase tracking-widest mb-2">Tono</p>
        <div className="flex gap-2">
          {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                tone === t
                  ? "bg-[#262626] text-white border-[#262626]"
                  : "bg-white text-[#6B7565] border-[#EAE7DC] hover:border-[#262626]"
              }`}
            >
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Platform tabs */}
      <div>
        <p className="text-xs font-medium text-[#6B7565] uppercase tracking-widest mb-2">Plataforma</p>
        <div className="flex gap-2">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPlatform(p); setPublishResult(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                platform === p
                  ? "bg-[#FF7F11] text-white border-[#FF7F11]"
                  : "bg-white text-[#6B7565] border-[#EAE7DC] hover:border-[#FF7F11]"
              }`}
            >
              {PLATFORM_LABELS[p]}
              {socialConnected[p] && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        type="button"
        onClick={handleGenerate}
        loading={generating}
        size="sm"
        className="self-start"
      >
        {generating ? "Generando..." : "Generar copy"}
      </Button>

      {/* Output */}
      {copy && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7565] uppercase tracking-widest">
              Resultado
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isOverLimit ? "text-red-500 font-medium" : "text-[#6B7565]"}`}>
                {copy.length}/{charLimit} chars
              </span>
              {isOverLimit && (
                <span className="text-xs text-red-500">⚠ Excede el límite de {PLATFORM_LABELS[platform]}</span>
              )}
            </div>
          </div>
          <textarea
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            rows={8}
            className="w-full text-sm text-[#262626] bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-3 resize-y focus:outline-none focus:border-[#FF7F11] transition-colors leading-relaxed"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm hover:bg-[#EAE7DC] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>

            {canPublish ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#262626] text-white rounded-sm hover:bg-[#FF7F11] transition-colors disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Publicando...
                  </>
                ) : (
                  "Publicar ahora"
                )}
              </button>
            ) : (
              <span
                title={
                  platform === "tiktok"
                    ? "TikTok requiere video — próximamente"
                    : "Conecta tu cuenta en Brand Manager"
                }
                className="px-3 py-1.5 text-xs font-medium bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm text-[#6B7565] cursor-not-allowed"
              >
                Publicar ahora
              </span>
            )}
          </div>

          {publishResult && (
            <div
              className={`px-3 py-2 rounded-sm text-xs ${
                publishResult.ok
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {publishResult.message}
              {!publishResult.ok && platform !== "tiktok" && !socialConnected[platform] && (
                <a href="/dashboard/marca" className="ml-2 underline">
                  Conectar cuenta
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
