"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "central_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (SSR / private mode) — skip banner.
    }
  }, []);

  const persist = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Non-fatal; user dismisses for this session only.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md">
      <div className="bg-white border border-[#EAE7DC] rounded-sm shadow-lg p-5 flex flex-col gap-3">
        <p className="font-serif text-[#262626] text-base">Cookies y privacidad</p>
        <p className="text-sm text-[#6B7565] leading-relaxed">
          Usamos cookies propias para iniciar sesión y recordar preferencias.{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:text-[#262626]"
          >
            Política de privacidad
          </a>
          .
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => persist("rejected")}
            className="px-3 py-2 text-sm text-[#6B7565] hover:text-[#262626]"
          >
            Sólo esenciales
          </button>
          <button
            onClick={() => persist("accepted")}
            className="px-4 py-2 text-sm bg-[#FF7F11] text-white rounded-sm hover:bg-[#e56e00]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
