"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { readStoredRefCode } from "@/components/affiliate/RefCapture";

interface Props {
  onSuccess: () => void;
}

export function AdsApplicationForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    full_name: "",
    document_id: "",
    phone: "",
    city: "",
    social_links: "",
    meta_business_url: "",
    meta_account_status: "good" as "good" | "restricted" | "none",
    property_types: "",
    experience: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) { setError("Debes aceptar los términos para continuar."); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/ads/application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, referral_code: readStoredRefCode() ?? undefined }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Error al enviar solicitud");
      setLoading(false);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre completo" value={form.full_name} onChange={e => set("full_name", e.target.value)} required />
        <Input label="CI (número)" value={form.document_id} onChange={e => set("document_id", e.target.value)} placeholder="1234567" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Teléfono / WhatsApp" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+591 7xxxxxxx" required />
        <Input label="Ciudad" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Santa Cruz" required />
      </div>
      <Input
        label="Links de redes sociales (IG, FB, TikTok)"
        value={form.social_links}
        onChange={e => set("social_links", e.target.value)}
        placeholder="https://instagram.com/tu_cuenta, ..."
        required
      />
      <Input
        label="URL de tu Meta Business Manager (opcional)"
        value={form.meta_business_url}
        onChange={e => set("meta_business_url", e.target.value)}
        placeholder="https://business.facebook.com/..."
      />
      <div className="flex flex-col gap-1.5">
        <label className="label-caps text-[#6B7565] text-[11px]">Estado de tu cuenta Meta</label>
        <select
          value={form.meta_account_status}
          onChange={e => set("meta_account_status", e.target.value as typeof form.meta_account_status)}
          className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11]"
        >
          <option value="good">Buena — sin bans ni restricciones recientes</option>
          <option value="restricted">Restringida — tengo alguna limitación activa</option>
          <option value="none">No tengo cuenta de Meta Business</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="label-caps text-[#6B7565] text-[11px]">Tipo de propiedades que publicitás</label>
        <input
          value={form.property_types}
          onChange={e => set("property_types", e.target.value)}
          placeholder="Casas residenciales, departamentos, terrenos..."
          required
          className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="label-caps text-[#6B7565] text-[11px]">Experiencia en bienes raíces</label>
        <textarea
          value={form.experience}
          onChange={e => set("experience", e.target.value)}
          placeholder="Ej: 5 años vendiendo propiedades en Santa Cruz. Trabajo con 3 constructoras..."
          rows={3}
          required
          className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] resize-none"
        />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 bg-[#F7F5EE] rounded-sm p-4">
        <input
          id="terms"
          type="checkbox"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          className="mt-0.5 flex-shrink-0"
        />
        <label htmlFor="terms" className="text-xs text-[#6B7565] leading-relaxed">
          Las campañas que publiquen mi marca desde las cuentas de Central deben cumplir las políticas de Meta, TikTok y Google. Central puede pausar o cerrar mi acceso si detecta contenido engañoso o que ponga en riesgo sus cuentas publicitarias.
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">{error}</p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Enviar solicitud
      </Button>
    </form>
  );
}
