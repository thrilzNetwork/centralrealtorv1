import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveBySlug } from "@/lib/tenant/resolver";
import { TenantProvider } from "@/components/themes/TenantContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { RealtorV1Page } from "@/components/themes/realtor-v1/RealtorV1Page";
import { ArrowRight, MapPin, Layout, Target, Users, Play } from "lucide-react";
import { LandingChatbot } from "@/components/LandingChatbot";
import { BrandLogoBar } from "@/components/landing/BrandLogoBar";
import { AccessGate } from "@/components/landing/AccessGate";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");
  if (tenantSlug) {
    const profile = await resolveBySlug(tenantSlug);
    return {
      title: profile?.full_name ?? "Portal Inmobiliario",
      description: profile?.bio ?? `Portal inmobiliario en ${profile?.city ?? "Bolivia"}`,
    };
  }
  return {
    title: "Central Bolivia — Tu agente digital 24/7",
    description: "Portal inmobiliario propio con mapa interactivo, captura de leads y tecnología. Listo en 2 minutos.",
  };
}

// ─── Page ──────────────────────────────────────────────────────
export default async function HomePage() {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");

  if (tenantSlug) {
    const profile = await resolveBySlug(tenantSlug);
    if (!profile) return notFound();

    const supabase = createAdminClient();
    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("status", "activo")
      .order("created_at", { ascending: false })
      .limit(20);

    return (
      <TenantProvider profile={profile} slug={tenantSlug}>
        <style>{`
          :root {
            --tenant-primary: ${profile.primary_color};
            --tenant-secondary: ${profile.secondary_color};
          }
        `}</style>
        <RealtorV1Page listings={listings ?? []} />
      </TenantProvider>
    );
  }

  return <MarketingPage />;
}

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  { icon: <MapPin className="w-6 h-6" />, title: "Mapa Interactivo", desc: "Tus propiedades aparecen como pins en el mapa de tu portal. Los compradores ubican cada inmueble al instante." },
  { icon: <Layout className="w-6 h-6" />, title: "Portal con tu Marca", desc: "Logo, colores, dominio propio. Tu portal se ve como una agencia profesional desde el día uno." },
  { icon: <Target className="w-6 h-6" />, title: "Lead Sniper", desc: "Cuando un comprador guarda una propiedad, recibes notificación en WhatsApp al instante — nunca pierdas un cliente." },
  { icon: <Users className="w-6 h-6" />, title: "Multi-agente", desc: "Escala tu equipo sin límites. Cada agente tiene su propio portal bajo la misma plataforma." },
];

const STATS = [
  { n: "24/7", label: "Tu portal trabaja" },
  { n: "2 min", label: "Para lanzar tu sitio" },
  { n: "100%", label: "Tu marca, tu dominio" },
];

function MarketingPage() {
  return (
    <>
      <AccessGate />
      <div className="min-h-screen bg-[#F7F5EE] font-sans landing-content">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5EE]/95 backdrop-blur-sm border-b border-[#EAE7DC]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between h-[4.5rem]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#FF7F11] rounded-sm" />
            <span className="text-[#262626] font-serif text-lg tracking-tight">Central Bolivia</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="label-caps text-[#6B7565] hover:text-[#262626] transition-colors duration-150">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 max-w-6xl mx-auto px-6 sm:px-8">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-px bg-[#FF7F11]" />
            <span className="label-caps text-[#6B7565] tracking-[0.2em]">PropTech · Bolivia</span>
          </div>

          <h1
            className="text-[#262626] font-serif leading-[0.97] mb-8"
            style={{ fontSize: "clamp(4rem, 9vw, 9.5rem)", letterSpacing: "-0.035em", fontWeight: 300 }}
          >
            Tu Agencia de<br />
            Inteligencia<br />
            <em style={{ color: "#FF7F11", fontStyle: "normal" }}>Inmobiliaria que nunca duerme.</em>
          </h1>

          <p className="text-[#6B7565] leading-relaxed max-w-xl mb-12" style={{ fontSize: "1.2rem" }}>
            Mientras descansas, tu portal captura leads, agenda visitas en tu calendario y genera videos cinemáticos de tus propiedades. Central se encarga de la tecnología y el marketing — tú solo te encargas de cerrar el negocio.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/bienvenido"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#FF7F11] text-white font-medium rounded-sm hover:bg-[#CC6500] transition-colors duration-200 active:scale-[0.98] cursor-pointer"
              style={{ fontSize: "0.9rem", letterSpacing: "0.02em" }}
            >
              Activar mi portal gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2.5 px-8 py-4 border border-[#D8D3C8] text-[#262626] font-medium rounded-sm hover:border-[#262626] hover:bg-white transition-all duration-200 cursor-pointer"
              style={{ fontSize: "0.9rem" }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Ver demo
            </a>
          </div>
          <p className="text-xs text-[#ACBFA4] mt-5 tracking-wide">
            3 días gratuitos · Sin tarjeta de crédito · Desde $49/mes
          </p>
        </div>

        {/* Stats */}
        <div className="mt-20 flex flex-wrap gap-16">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span
                className="font-serif text-[#FF7F11] leading-none mb-1"
                style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 300 }}
              >{s.n}</span>
              <span className="label-caps text-[#ACBFA4]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof bar */}
      <BrandLogoBar />

      {/* Problem / Solution */}
      <section className="py-24 max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="label-caps text-[#ACBFA4] tracking-[0.2em]">El problema</span>
            <h2
              className="text-[#262626] mt-4 mb-10 font-serif leading-[1.05]"
              style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.025em" }}
            >
              Los mejores agentes<br />pierden clientes<br />
              <em style={{ color: "#FF7F11", fontStyle: "normal" }}>por no estar disponibles.</em>
            </h2>
            <div className="flex flex-col divide-y divide-[#EAE7DC]">
              {[
                { pain: "Un comprador visita tu portal a las 11pm — no hay nadie.", fix: "Tu portal captura sus datos y te avisa al instante por WhatsApp." },
                { pain: "Tus propiedades son difíciles de ubicar sin un mapa.", fix: "Cada propiedad aparece como pin en el mapa interactivo de tu portal." },
                { pain: "Tu presencia digital no refleja tu nivel profesional.", fix: "Logo, colores y dominio propio — listo en 2 minutos, sin código." },
              ].map((item, i) => (
                <div key={i} className="py-5 flex gap-5">
                  <span
                    className="font-serif text-[#FF7F11] flex-shrink-0 leading-none mt-0.5"
                    style={{ fontSize: "1.5rem", fontWeight: 300 }}
                  >0{i + 1}</span>
                  <div>
                    <p className="text-sm text-[#ACBFA4] line-through mb-1.5">{item.pain}</p>
                    <p className="text-sm text-[#262626] leading-relaxed">{item.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock portal preview */}
          <div className="bg-[#1C1C1C] rounded-sm p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              </div>
              <div className="flex-1 bg-white/5 rounded h-5 mx-2 flex items-center px-3">
                <span className="text-white/25 text-[10px] tracking-wide">tuagencia.centralbolivia.com</span>
              </div>
            </div>
            <div className="bg-[#141414] rounded-sm overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-[#FF7F11]/15 via-transparent to-transparent flex items-end p-4">
                <div>
                  <div className="h-1.5 w-20 bg-white/15 rounded mb-2" />
                  <div className="h-3 w-32 bg-white/30 rounded" />
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white/4 rounded-sm overflow-hidden">
                    <div className="h-14 bg-white/8" />
                    <div className="p-2.5">
                      <div className="h-1.5 w-3/4 bg-white/15 rounded mb-1.5" />
                      <div className="h-1.5 w-1/2 bg-[#FF7F11]/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-white/30 text-xs">3 visitantes activos</span>
              </div>
              <span className="text-[#FF7F11]/60 text-xs font-mono">LIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#1C1C1C] py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
            <div>
              <span className="label-caps text-[#ACBFA4]/60 tracking-[0.2em]">Funcionalidades</span>
              <h2
                className="text-white mt-4 font-serif leading-[1.05]"
                style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)", fontWeight: 300, letterSpacing: "-0.025em" }}
              >
                Todo lo que necesita<br />
                <em style={{ color: "#FF7F11", fontStyle: "normal" }}>un agente moderno.</em>
              </h2>
            </div>
            <Link
              href="/bienvenido"
              className="inline-flex items-center gap-2 label-caps text-[#FF7F11] hover:gap-3 transition-all duration-200 whitespace-nowrap cursor-pointer"
            >
              Crear mi portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-sm overflow-hidden">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-[#1C1C1C] p-8 hover:bg-white/3 transition-colors duration-200 cursor-default group"
              >
                <div className="w-10 h-10 rounded-sm bg-[#FF7F11]/10 flex items-center justify-center mb-6 group-hover:bg-[#FF7F11]/20 transition-colors duration-200">
                  <span className="text-[#FF7F11]">{f.icon}</span>
                </div>
                <h3 className="text-white font-medium mb-3 text-sm tracking-wide">{f.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 max-w-6xl mx-auto px-6 sm:px-8">
        <div className="mb-16">
          <span className="label-caps text-[#ACBFA4] tracking-[0.2em]">Proceso</span>
          <h2
            className="text-[#262626] mt-4 font-serif"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.025em" }}
          >
            De cero a portal<br />en 3 pasos.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE7DC]">
          {[
            { step: "01", title: "Crea tu cuenta", desc: "El asistente conversacional configura tu portal en 2 minutos. Sin formularios, sin código." },
            { step: "02", title: "Agrega propiedades", desc: "Sube fotos, describe el inmueble y geolocaliza. Aparece en el mapa de tu portal al instante." },
            { step: "03", title: "Trabaja 24/7", desc: "Tu portal captura leads mientras duermes. Cada lead llega a tu WhatsApp con contacto directo." },
          ].map((item) => (
            <div key={item.step} className="sm:px-10 py-8 sm:py-0 first:pl-0 last:pr-0">
              <span
                className="font-serif text-[#FF7F11] block mb-5 leading-none"
                style={{ fontSize: "3rem", fontWeight: 300 }}
              >{item.step}</span>
              <h3 className="text-[#262626] font-medium mb-3 tracking-tight">{item.title}</h3>
              <p className="text-sm text-[#6B7565] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo video */}
      <section id="demo" className="py-24 bg-white border-y border-[#EAE7DC]" style={{ scrollMarginTop: "4.5rem" }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="mb-12">
            <span className="label-caps text-[#ACBFA4] tracking-[0.2em]">Demo en vivo</span>
            <h2
              className="text-[#262626] mt-4 font-serif"
              style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.025em" }}
            >
              Míralo funcionar<br />
              <em style={{ color: "#FF7F11", fontStyle: "normal" }}>en 2 minutos.</em>
            </h2>
          </div>
          <div className="relative mx-auto rounded-sm overflow-hidden shadow-2xl shadow-black/10 border border-[#EAE7DC]" style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://www.youtube.com/embed/qb92U0A-Aus"
              title="Central Bolivia Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 max-w-6xl mx-auto px-6 sm:px-8">
        <div className="mb-16">
          <span className="label-caps text-[#ACBFA4] tracking-[0.2em]">Planes</span>
          <h2
            className="text-[#262626] mt-4 font-serif"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.025em" }}
          >
            Invierte en tu<br />presencia digital.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { title: "Pro Essential", price: "$49", per: "/mes", desc: "Tu oficina digital profesional con IA, lista en 2 minutos.", features: ["Portal con tu marca y colores", "Propiedades ilimitadas", "CM Digital (Community Manager IA)", "Google Calendar + Gmail Sync", "Web de Lujo (tema premium)"], highlight: false },
            { title: "Elite Suite", price: "$69", per: "/mes", desc: "El estatus digital para el top 10% de agentes bolivianos.", features: ["Todo de Pro Essential", "Dominio propio incluido", "Nano Banana Pro (mejora de imágenes IA)", "Veo AI Video (recorridos cinemáticos)", "Soporte prioritario 24/7"], highlight: true },
          ].map((p) => (
            <div
              key={p.title}
              className={`rounded-sm p-10 flex flex-col gap-8 relative transition-shadow duration-300 ${
                p.highlight
                  ? "bg-[#262626] text-white"
                  : "bg-white border border-[#EAE7DC] hover:shadow-lg hover:shadow-black/5"
              }`}
            >
              {p.highlight && (
                <div className="absolute top-8 right-8">
                  <span className="label-caps text-[#FF7F11] bg-[#FF7F11]/10 px-3 py-1.5 rounded-sm text-[10px]">Más popular</span>
                </div>
              )}
              <div>
                <span className={`label-caps tracking-[0.15em] ${p.highlight ? "text-white/40" : "text-[#ACBFA4]"}`}>{p.title}</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className={`font-serif font-light leading-none ${p.highlight ? "text-white" : "text-[#262626]"}`}
                    style={{ fontSize: "clamp(3rem, 5vw, 4rem)" }}
                  >{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-white/40" : "text-[#ACBFA4]"}`}>{p.per}</span>
                </div>
                <p className={`text-sm mt-3 leading-relaxed ${p.highlight ? "text-white/50" : "text-[#6B7565]"}`}>{p.desc}</p>
              </div>

              <ul className="flex flex-col gap-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-3 text-sm ${p.highlight ? "text-white/70" : "text-[#262626]"}`}>
                    <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.highlight ? "text-[#FF7F11]" : "text-[#FF7F11]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/bienvenido"
                className={`w-full py-4 text-center text-sm font-medium rounded-sm transition-colors duration-200 cursor-pointer ${
                  p.highlight
                    ? "bg-[#FF7F11] text-white hover:bg-[#CC6500]"
                    : "border border-[#D8D3C8] text-[#262626] hover:border-[#262626] hover:bg-[#F7F5EE]"
                }`}
              >
                Empezar con 3 días gratis
              </Link>
              <p className={`text-[10px] text-center mt-3 label-caps ${p.highlight ? "text-white/40" : "text-[#ACBFA4]"}`}>
                Promoción Early Adopter: Setup Fee ($100) GRATIS antes del 1 de mayo
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-[#EAE7DC]">
          <div className="bg-[#FFF7F0] border border-[#FFE0C0] rounded-sm px-5 py-3 flex items-center gap-3">
            <span className="label-caps text-[#FF7F11] text-[10px]">Próximamente</span>
            <span className="text-sm text-[#9A4E00]">Datos competitivos nacionales para usuarios activos.</span>
          </div>
          <a href="tel:+19546488174" className="label-caps text-[#6B7565] hover:text-[#FF7F11] transition-colors duration-150 whitespace-nowrap cursor-pointer">
            +1 (954) 648-8174
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FF7F11] py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
          <div>
            <span className="label-caps text-white/60 tracking-[0.2em]">Empieza hoy</span>
            <h2
              className="text-white mt-4 font-serif leading-[1.0]"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", fontWeight: 300, letterSpacing: "-0.03em" }}
            >
              Tu portal<br />activo en<br />2 minutos.
            </h2>
          </div>
          <div className="flex flex-col gap-4 flex-shrink-0">
            <Link
              href="/bienvenido"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#262626] text-white font-medium rounded-sm hover:bg-black transition-colors duration-200 cursor-pointer"
              style={{ fontSize: "0.9rem", letterSpacing: "0.02em" }}
            >
              Activar mi portal gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-white/50 text-xs text-center tracking-wide">3 días gratis · Sin tarjeta de crédito</p>
          </div>
        </div>
      </section>

      <LandingChatbot />

      {/* Footer */}
      <footer className="bg-[#111] text-[#6B7565] py-12">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pb-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#FF7F11] rounded-sm" />
              <span className="text-white/80 text-sm font-serif tracking-tight">Central Bolivia</span>
            </div>
            <div className="flex gap-8">
              <Link href="/login" className="label-caps text-[#6B7565] hover:text-white transition-colors duration-150 cursor-pointer">Ingresar</Link>
              <Link href="/bienvenido" className="label-caps text-[#6B7565] hover:text-white transition-colors duration-150 cursor-pointer">Registro</Link>
              <a href="tel:+19546488174" className="label-caps text-[#6B7565] hover:text-white transition-colors duration-150 cursor-pointer">Contacto</a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-[#6B7565]/60">© 2025 Central Bolivia. Hecho en Bolivia 🇧🇴</p>
            <p className="text-xs text-[#6B7565]/40 tracking-wide">PropTech · Santa Cruz · Bolivia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
