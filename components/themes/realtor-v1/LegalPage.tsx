"use client";

import { useTenant } from "@/components/themes/TenantContext";
import { RealtorV1Footer } from "./RealtorV1Footer";
import Link from "next/link";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPage({ title, children }: LegalPageProps) {
  const { profile } = useTenant();

  return (
    <div className="min-h-screen bg-[#F7F5EE] font-sans flex flex-col">
      {/* Simple Header */}
      <header className="border-b border-[#EAE7DC] bg-white px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#FF7F11] rounded-sm" />
          <span className="text-[#262626] font-serif text-lg tracking-tight">
            {profile.full_name}
          </span>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-[#6B7565] hover:text-[#262626] transition-colors"
        >
          ← Volver al portal
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

      <RealtorV1Footer />
    </div>
  );
}
