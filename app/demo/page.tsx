import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export const metadata = {
  title: "Demo — Central Bolivia",
  description: "Ve cómo funciona Central Bolivia en 2 minutos.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#F7F5EE] font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5EE]/95 backdrop-blur-sm border-b border-[#EAE7DC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between h-[4.5rem]">
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
      <section className="pt-36 pb-12 md:pb-20 max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-px bg-[#FF7F11]" />
            <span className="label-caps text-[#6B7565] tracking-[0.2em]">Demo en vivo</span>
          </div>

          <h1
            className="text-[#262626] font-serif leading-[0.97] mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)", letterSpacing: "-0.035em", fontWeight: 300 }}
          >
            Míralo funcionar<br />
            <em style={{ color: "#FF7F11", fontStyle: "normal" }}>en 2 minutos.</em>
          </h1>

          <p className="text-[#6B7565] leading-relaxed max-w-xl mb-12" style={{ fontSize: "1.2rem" }}>
            Descubre cómo Central Bolivia automatiza tu oficina inmobiliaria con IA: chatbot 24/7, CM Digital, videos cinemáticos y más.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="pb-12 md:pb-24 max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="relative mx-auto rounded-sm overflow-hidden shadow-2xl shadow-black/10 border border-[#EAE7DC]" style={{ aspectRatio: "16/9" }}>
          <iframe
            src="https://www.youtube.com/embed/qb92U0A-Aus"
            title="Central Bolivia Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FF7F11] py-12 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
          <div>
            <span className="label-caps text-white/60 tracking-[0.2em]">Empieza hoy</span>
            <h2
              className="text-white mt-4 font-serif leading-[1.0]"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", fontWeight: 300, letterSpacing: "-0.03em" }}
            >
              Tu oficina de IA<br />lista en<br />2 minutos.
            </h2>
          </div>
          <div className="flex flex-col gap-4 flex-shrink-0">
            <Link
              href="/bienvenido"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#262626] text-white font-medium rounded-sm hover:bg-black transition-colors duration-200 cursor-pointer"
              style={{ fontSize: "0.9rem", letterSpacing: "0.02em" }}
            >
              Activar mi oficina gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-white/50 text-xs text-center tracking-wide">3 días gratis · Sin tarjeta de crédito</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] text-[#6B7565] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
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
            <div className="flex flex-col gap-1">
              <p className="text-xs text-[#6B7565]/60">© 2026 Central Bolivia. Hecho en Bolivia 🇧🇴</p>
            </div>
            <p className="text-xs text-[#6B7565]/40 tracking-wide">PropTech · Santa Cruz · Bolivia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
