"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export function AccessGate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toLowerCase().trim() === "boom") {
      setIsVerified(true);
      localStorage.setItem("central_access_code", "boom");

      // Update the body class to remove 'hidden' from the landing page
      document.body.classList.remove("landing-hidden");

      setTimeout(() => {
        router.refresh();
      }, 500);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("central_access_code") === "boom") {
      setIsVerified(true);
      document.body.classList.remove("landing-hidden");
    } else {
      document.body.classList.add("landing-hidden");
    }
  }, []);

  if (isVerified) {
    // When verified, we need to trigger a re-render or a state change in the parent.
    // Since we are using a Client Component inside a Server Component,
    // we can use a custom event or simply let the user's session persist.
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F5EE] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-[#EAE7DC] p-10 rounded-sm shadow-2xl text-center flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#FF7F11] rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[#262626] font-serif text-3xl leading-tight">
              Acceso Exclusivo
            </h1>
            <p className="text-[#6B7565] text-sm leading-relaxed">
              Central Bolivia es actualmente <br />
              <span className="font-medium text-[#262626]">solo por invitación</span> hasta el 1 de mayo de 2026.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Introduce tu código de invitación"
              className={`w-full px-4 py-4 text-center text-lg font-mono border rounded-sm transition-all outline-none ${
                error ? "border-red-500 bg-red-50" : "border-[#D8D3C8] focus:border-[#FF7F11]"
              }`}
            />
            {error && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 left-0 right-0 text-center text-[10px] text-red-500 font-bold label-caps"
              >
                Código incorrecto
              </motion.span>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-[#262626] text-white text-sm font-medium rounded-sm hover:bg-black transition-colors label-caps tracking-widest"
          >
            Validar Acceso
          </button>
        </form>

        <p className="text-[10px] text-[#ACBFA4] text-center uppercase tracking-widest">
          Sujeto a disponibilidad de plazas
        </p>
      </motion.div>
    </div>
  );
}
