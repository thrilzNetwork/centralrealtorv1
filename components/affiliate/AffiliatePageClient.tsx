"use client";

import Link from "next/link";
import { useState } from "react";

const TIERS = [
  { name: "Inicial",   refs: "1–5 referidos",   pct: "10%", color: "#ACBFA4" },
  { name: "Pro",       refs: "6–15 referidos",  pct: "20%", color: "#FF7F11" },
  { name: "Elite",     refs: "16+ referidos",   pct: "30%", color: "#262626" },
];

const BENEFITS = [
  { icon: "💰", title: "Créditos recurrentes", desc: "Ganas créditos cada mes mientras tu referido siga activo." },
  { icon: "🎁", title: "1 mes gratis para ellos", desc: "Tu enlace le da a tu referido el primer mes completo gratis." },
  { icon: "📊", title: "Dashboard en vivo", desc: "Ve tus referidos, comisiones y progreso de nivel en tiempo real." },
  { icon: "🚀", title: "Sube de nivel", desc: "A más referidos pagados, mayor % de comisión — hasta 30%." },
];

export function AffiliatePageClient() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name:     fd.get("full_name"),
      email:         fd.get("email"),
      phone:         fd.get("phone"),
      audience_size: fd.get("audience_size"),
      channels:      fd.get("channels"),
      message:       fd.get("message"),
      social_links:  fd.get("social_links"),
    };
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EAE7DC] bg-white px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#FF7F11] rounded-sm" />
          <span className="text-[#262626] font-serif text-lg tracking-tight">Central Bolivia</span>
        </Link>
        <Link href="/" className="text-xs font-medium text-[#6B7565] hover:text-[#262626]">
          ← Volver al inicio
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 py-16 text-center max-w-3xl mx-auto">
          <p className="label-caps text-[#FF7F11] mb-3">Programa de Afiliados</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#262626] tracking-tight mb-4">
            Gana créditos recomendando<br />la herramienta que ya usas
          </h1>
          <p className="text-[#6B7565] text-lg mb-8 max-w-xl mx-auto">
            Comparte tu enlace, tus colegas reciben su primer mes gratis, y tú ganas hasta <strong>30% de comisión recurrente</strong> en créditos de plataforma.
          </p>
          <a
            href="#apply"
            className="inline-block bg-[#FF7F11] text-white px-8 py-3 rounded-sm font-medium text-sm hover:-translate-y-0.5 transition-transform"
          >
            Aplicar al programa →
          </a>
        </section>

        {/* Benefits */}
        <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white border border-[#EAE7DC] rounded-sm p-5">
                <div className="text-2xl mb-2">{b.icon}</div>
                <h3 className="text-[#262626] font-semibold text-sm mb-1">{b.title}</h3>
                <p className="text-[#6B7565] text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tier system */}
        <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto">
          <p className="label-caps text-[#6B7565] text-center mb-2">Estructura de comisiones</p>
          <h2 className="font-serif text-3xl text-[#262626] text-center mb-10">
            A más referidos, mayor comisión
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="bg-white border-2 rounded-sm p-6 text-center"
                style={{ borderColor: t.color }}
              >
                <p className="label-caps mb-1" style={{ color: t.color }}>{t.name}</p>
                <p className="font-serif text-5xl text-[#262626] my-3">{t.pct}</p>
                <p className="text-[#6B7565] text-sm">{t.refs}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#6B7565] mt-4">
            Las comisiones se acumulan como crédito en tu cuenta y se aplican automáticamente a tu próxima factura.
          </p>
        </section>

        {/* How it works */}
        <section className="px-4 sm:px-6 py-12 bg-white border-y border-[#EAE7DC]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl text-[#262626] text-center mb-10">Cómo funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: 1, t: "Aplica",       d: "Completa el formulario de abajo. Revisamos cada solicitud." },
                { n: 2, t: "Recibe tu código", d: "Al ser aprobado, te enviamos tu enlace personalizado." },
                { n: 3, t: "Comparte",     d: "Publica en redes, envía por WhatsApp, habla con tu red." },
                { n: 4, t: "Gana créditos", d: "Cada referido pagado suma a tu balance mensual." },
              ].map((s) => (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#FF7F11]/10 text-[#FF7F11] flex items-center justify-center font-semibold mb-3">
                    {s.n}
                  </div>
                  <h3 className="text-[#262626] font-semibold text-sm mb-1">{s.t}</h3>
                  <p className="text-[#6B7565] text-xs">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application form */}
        <section id="apply" className="px-4 sm:px-6 py-16 max-w-2xl mx-auto">
          <p className="label-caps text-[#FF7F11] text-center mb-2">Aplicar</p>
          <h2 className="font-serif text-3xl text-[#262626] text-center mb-2">
            Solicita unirte al programa
          </h2>
          <p className="text-[#6B7565] text-sm text-center mb-10">
            Revisamos todas las solicitudes manualmente. Buscamos socios con comunidad real en el sector inmobiliario.
          </p>

          {sent ? (
            <div className="bg-white border border-[#ACBFA4] rounded-sm p-8 text-center">
              <p className="text-3xl mb-3">✓</p>
              <h3 className="font-serif text-xl text-[#262626] mb-2">¡Solicitud recibida!</h3>
              <p className="text-[#6B7565] text-sm">
                Te contactaremos por email en las próximas 48 horas con una respuesta.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#EAE7DC] rounded-sm p-6 sm:p-8 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Nombre completo *</label>
                  <input name="full_name" required maxLength={120}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Email *</label>
                  <input type="email" name="email" required maxLength={255}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">WhatsApp</label>
                  <input name="phone" placeholder="+591 7..." maxLength={40}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps text-[#6B7565]">Tamaño de audiencia</label>
                  <input name="audience_size" placeholder="Ej: 10k IG, 500 contactos" maxLength={120}
                    className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Canales donde promocionarás</label>
                <input name="channels" placeholder="Instagram, YouTube, grupos de WhatsApp, eventos..." maxLength={500}
                  className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Enlaces a redes / portafolio</label>
                <input name="social_links" placeholder="https://instagram.com/... https://youtube.com/..." maxLength={1000}
                  className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">¿Por qué encajas con Central?</label>
                <textarea name="message" rows={4} maxLength={2000}
                  placeholder="Cuéntanos sobre tu red, tu experiencia en real estate, y cómo promocionarías Central."
                  className="border border-[#D8D3C8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF7F11] resize-none" />
              </div>

              {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-sm">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="bg-[#FF7F11] text-white px-6 py-3 rounded-sm font-medium text-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-wait"
              >
                {sending ? "Enviando..." : "Enviar solicitud"}
              </button>
              <p className="text-[10px] text-[#ACBFA4] text-center">
                Al aplicar aceptas nuestros{" "}
                <Link href="/terms" className="underline">Términos</Link>
                {" "}y{" "}
                <Link href="/privacy" className="underline">Privacidad</Link>.
              </p>
            </form>
          )}
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-[#262626] text-center mb-10">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                q: "¿Cuándo recibo mi comisión?",
                a: "Los créditos se suman a tu balance el día que tu referido realiza su primer pago. Cada mes que siga activo, se suma su comisión correspondiente.",
              },
              {
                q: "¿Los créditos se pueden retirar en efectivo?",
                a: "Por ahora los créditos se aplican contra tu facturación mensual en Central. Puedes cubrir 100% de tu plan con créditos si acumulas suficiente.",
              },
              {
                q: "¿Cómo saben que un referido es mío?",
                a: "Al aprobar tu solicitud recibes un código único (ej: ALEJO20). Cuando alguien se registra usando tu enlace (con ?ref=TUCODIGO), queda vinculado a tu cuenta automáticamente.",
              },
              {
                q: "¿Puedo referir a cualquiera?",
                a: "Sí, mientras sea un asesor inmobiliario real en Bolivia. No aceptamos cuentas falsas, referidos propios, ni tráfico incentivado.",
              },
            ].map((f) => (
              <details key={f.q} className="bg-white border border-[#EAE7DC] rounded-sm p-4 group">
                <summary className="cursor-pointer text-[#262626] font-medium text-sm list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-[#FF7F11] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-[#6B7565] text-sm mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#EAE7DC] bg-white px-4 sm:px-6 py-8 text-center">
        <p className="text-xs text-[#6B7565]">© {new Date().getFullYear()} Central Bolivia · Thirlz Network LLC</p>
      </footer>
    </div>
  );
}
