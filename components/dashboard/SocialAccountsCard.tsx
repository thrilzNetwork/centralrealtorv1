"use client";

import { useState } from "react";

type Platform = "instagram" | "facebook" | "tiktok";

interface Props {
  instagram: boolean;
  facebook: boolean;
  tiktok: boolean;
  fbAvailable: boolean;
  tiktokAvailable: boolean;
  justConnected: boolean;
  error: boolean;
}

const PLATFORMS: { key: Platform; label: string; icon: React.ReactNode; linkHref: string }[] = [
  {
    key: "instagram",
    label: "Instagram",
    linkHref: "/api/auth/meta-link",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    linkHref: "/api/auth/meta-link",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    linkHref: "/api/auth/tiktok-link",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.79a4.85 4.85 0 0 1-1.01-.1z" />
      </svg>
    ),
  },
];

export function SocialAccountsCard({
  instagram,
  facebook,
  tiktok,
  fbAvailable,
  tiktokAvailable,
  justConnected,
  error,
}: Props) {
  const connected: Record<Platform, boolean> = { instagram, facebook, tiktok };
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const [localConnected, setLocalConnected] = useState(connected);

  async function handleDisconnect(platform: Platform) {
    setDisconnecting(platform);
    try {
      await fetch(`/api/social/disconnect?platform=${platform}`, { method: "DELETE" });
      setLocalConnected((prev) => ({ ...prev, [platform]: false }));
    } finally {
      setDisconnecting(null);
    }
  }

  const isAvailable = (p: Platform) => {
    if (p === "tiktok") return tiktokAvailable;
    return fbAvailable;
  };

  return (
    <div className="mt-8 bg-white border border-[#EAE7DC] rounded-sm p-6">
      <div className="border-b border-[#EAE7DC] pb-4 mb-5">
        <h2
          className="text-[#262626]"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}
        >
          Cuentas conectadas
        </h2>
        <p className="text-xs text-[#6B7565] mt-1">
          Conecta tus redes sociales para publicar directamente desde CM Digital
        </p>
      </div>

      {justConnected && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700">
          Cuenta conectada correctamente
        </div>
      )}
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-sm text-xs text-red-600">
          No se pudo conectar la cuenta. Inténtalo de nuevo.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {PLATFORMS.map(({ key, label, icon, linkHref }) => {
          const isConn = localConnected[key];
          const available = isAvailable(key);

          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3 border border-[#EAE7DC] rounded-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#262626]">{icon}</span>
                <span className="text-sm font-medium text-[#262626]">{label}</span>
                {isConn ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm text-xs text-[#6B7565]">
                    No conectado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isConn ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(key)}
                    disabled={disconnecting === key}
                    className="text-xs text-[#6B7565] hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {disconnecting === key ? "Desconectando..." : "Desconectar"}
                  </button>
                ) : available ? (
                  <a
                    href={linkHref}
                    className="px-3 py-1.5 text-xs font-medium bg-[#262626] text-white rounded-sm hover:bg-[#FF7F11] transition-colors"
                  >
                    Conectar
                  </a>
                ) : (
                  <span className="px-2 py-1 text-xs bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm text-[#6B7565]">
                    Próximamente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
