"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Profile } from "@/types/tenant";

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "Santa Cruz");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, whatsapp, bio, city }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {/* Basic info */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-[#262626] border-b border-[#EAE7DC] pb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}>
          Información Personal
        </h2>

        <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+59171234567" />
        <Input label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Santa Cruz" />

        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Bio / Descripción</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Cuéntanos sobre ti y tu especialidad..."
            className="w-full border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] transition-colors resize-none"
          />
        </div>

        {/* Portal URL */}
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Tu URL de portal</label>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-[#EAE7DC] rounded-sm bg-[#F7F5EE] px-3 py-2.5 min-w-0 flex-1">
              <span className="text-xs text-[#ACBFA4] shrink-0">centralbolivia.com/</span>
              <span className="text-sm text-[#262626] font-medium truncate">{profile?.slug}</span>
            </div>
            <a
              href={`https://${profile?.slug}.centralbolivia.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FF7F11] text-white text-xs font-medium rounded-sm hover:bg-[#CC6500] transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver Portal
            </a>
          </div>
        </div>
      </div>

      {/* Brand identity link */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#262626]">Logo y colores de marca</p>
          <p className="text-xs text-[#6B7565] mt-0.5">
            Gestiona tu identidad visual en Brand Manager
          </p>
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
        {saved ? "✓ Guardado" : "Guardar Cambios"}
      </Button>
    </form>
  );
}
