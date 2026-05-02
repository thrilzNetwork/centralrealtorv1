"use client";

import { useState } from "react";

export function UnconfirmedBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function resend() {
    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "No pudimos reenviar el enlace. Intenta de nuevo.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("No pudimos reenviar el enlace. Intenta de nuevo.");
    }
  }

  return (
    <div className="mb-6 rounded-md border border-[#FF7F11]/30 bg-[#FF7F11]/10 px-4 py-3 text-sm text-[#262626] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        Confirma tu correo para asegurar tu cuenta. Te enviamos un enlace a{" "}
        <strong>{email}</strong>.
      </div>
      <div className="flex items-center gap-3">
        {status === "sent" ? (
          <span className="text-[#6B7565]">Enlace reenviado.</span>
        ) : (
          <button
            onClick={resend}
            disabled={status === "sending"}
            className="rounded-sm bg-[#262626] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a1a1a] disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Reenviar enlace"}
          </button>
        )}
      </div>
      {errorMsg && (
        <div className="text-xs text-red-700 sm:ml-3">{errorMsg}</div>
      )}
    </div>
  );
}
