"use client";

import Link from "next/link";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#F7F5EE] font-sans flex flex-col">
      {/* Simple Header */}
      <header className="border-b border-[#EAE7DC] bg-white px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#FF7F11] rounded-sm" />
          <span className="text-[#262626] font-serif text-lg tracking-tight">
            Central Bolivia
          </span>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-[#6B7565] hover:text-[#262626] transition-colors"
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#262626] mb-8">
            {title}
          </h1>
          <div className="text-[#262626] leading-relaxed space-y-6 text-sm sm:text-base">
            {children}
          </div>
        </div>
      </main>

      {/* Simple Footer for Root Pages */}
      <footer className="bg-[#1a1a1a] text-[#6B7565] py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="text-sm text-white">
            © 2026 Central Bolivia
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="label-caps text-xs hover:text-white transition-colors">Inicio</Link>
            <Link href="/privacy" className="label-caps text-xs hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="label-caps text-xs hover:text-white transition-colors">Términos</Link>
          </div>
          <div className="text-xs">
            Operado por Thirlz Network LLC
          </div>
        </div>
      </footer>
    </div>
  );
}
