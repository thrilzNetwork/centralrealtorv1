"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Step = "welcome" | "social" | "email" | "password" | "name" | "brand" | "whatsapp" | "theme" | "done";
type MessageRole = "agent" | "user";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type?: "text" | "input-email" | "input-password" | "input-text" | "input-whatsapp" | "input-url" | "theme-picker";
  logoUrl?: string; // for social preview messages
}

interface SocialBrandData {
  handle:    string;
  avatar_url: string;
}

const THEME_OPTIONS = [
  { id: "realtor-v1", label: "Realtor V1", desc: "Profesional con mapa y filtros avanzados" },
];

const STEPS: Record<Step, { message: string; inputType?: Message["type"] }> = {
  welcome:  { message: "Hola 👋 Soy tu asistente de configuración. En 2 minutos tendrás tu portal inmobiliario listo. ¿Empezamos?" },
  social:   { message: "Opcional: ¿cuál es tu usuario de Instagram? Lo usaré para tomar tu foto de perfil y pre-cargar tu marca. (Ej: @miagencia  — puedes omitir este paso)", inputType: "input-text" },
  email:    { message: "¿Cuál es tu correo electrónico?", inputType: "input-email" },
  password: { message: "Elige una contraseña segura (mínimo 8 caracteres).", inputType: "input-password" },
  name:     { message: "¿Cuál es tu nombre completo? (Aparecerá en tu portal)", inputType: "input-text" },
  brand:    { message: "¿Cómo se llama tu marca o agencia? (Ej: Inmobiliaria Sur, García Propiedades)", inputType: "input-text" },
   whatsapp: { message: "¿Cuál es tu número de WhatsApp? (Incluye el código de país, Ej: +591 71234567). Los clientes lo usarán para contactarte.", inputType: "input-whatsapp" },
  theme:    { message: "Elige la plantilla visual de tu portal:", inputType: "theme-picker" },
  done:     { message: "🎉 ¡Todo listo! Estamos creando tu portal. Serás redirigido en un momento..." },
};

export function ChatWizard() {
  const [step, setStep]         = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "agent", content: STEPS.welcome.message },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping,   setIsTyping]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const [socialData, setSocialData] = useState<SocialBrandData | null>(null);

  const [data, setData] = useState({
    email: "", password: "", fullName: "", brandName: "", whatsapp: "", socialUrl: "", theme: "realtor-v1",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function addMessage(role: MessageRole, content: string, type?: Message["type"], logoUrl?: string) {
    setMessages((prev) => [...prev, { id: Date.now().toString() + Math.random(), role, content, type, logoUrl }]);
  }

  async function agentReply(next: Step) {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 380));
    setIsTyping(false);
    addMessage("agent", STEPS[next].message, STEPS[next].inputType);
    setStep(next);
    setInputValue("");
  }

  async function handleSubmit(value?: string) {
    const val = (value ?? inputValue).trim();
    if (!val) return;

    addMessage("user", step === "password" ? "••••••••" : val);
    setInputValue("");

    switch (step) {
      case "welcome":
        agentReply("email");
        break;

      // ── Social (disabled) ─────────────────────────────────────────────────
      case "social": {
        agentReply("email");
        break;
      }

      // ── Email ────────────────────────────────────────────────────────────
      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(val)) {
          addMessage("agent", "Ese correo no parece válido. Escríbelo completo, por ejemplo: maria@gmail.com");
          setStep("email");
          break;
        }
        setData((d) => ({ ...d, email: val }));
        agentReply("password");
        break;
      }

      case "password":
        if (val.length < 8) {
          addMessage("agent", "La contraseña debe tener al menos 8 caracteres. Intenta de nuevo.");
          setStep("password");
          break;
        }
        setData((d) => ({ ...d, password: val }));
        agentReply("name");
        break;

      case "name":
        setData((d) => ({ ...d, fullName: val }));
        agentReply("brand");
        break;

      case "brand":
        setData((d) => ({ ...d, brandName: val }));
        agentReply("whatsapp");
        break;

      case "whatsapp":
        setData((d) => ({ ...d, whatsapp: val }));
        agentReply("theme");
        break;

      case "theme":
        setData((d) => ({ ...d, theme: val }));
        await handleFinalSubmit({ ...data, theme: val });
        break;
    }
  }

  async function handleFinalSubmit(finalData: typeof data) {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 300));
    setIsTyping(false);
    setLoading(true);

    try {
      // ── Step 1: Create account ────────────────────────────────────────────
      const createRes = await fetch("/api/onboarding/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:     finalData.email,
          password:  finalData.password,
          fullName:  finalData.fullName,
          brandName: finalData.brandName,
          whatsapp:  finalData.whatsapp,
          theme:     finalData.theme,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createJson.error ?? "No se pudo crear la cuenta. Intenta de nuevo.");

      // ── Step 2: Sign in ────────────────────────────────────────────────────
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    finalData.email,
        password: finalData.password,
      });

      if (signInError) {
        addMessage("agent", "¡Tu portal fue creado! Ingresa con tu correo y contraseña en /login.");
        await new Promise((r) => setTimeout(r, 2000));
        window.location.href = "/login";
        return;
      }

      // ── Step 3: Apply social branding if we have it ───────────────────────
      if (socialData?.avatar_url) {
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logo_url: socialData.avatar_url }),
          });
        } catch {
          // Optional — silently ignore
        }
      }

      // ── Step 4: Redirect to dashboard ────────────────────────────────────
      addMessage("agent", "🎉 ¡Tu portal está activo! Te estamos redirigiendo a tu oficina virtual...");
      await new Promise((r) => setTimeout(r, 1500));
      window.location.href = "/dashboard";
      return;

    } catch (err) {
      console.error("Onboarding error:", err);
      const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      addMessage("agent", `${msg} Selecciona la plantilla de nuevo para reintentar.`);
      setStep("theme");
    } finally {
      setLoading(false);
    }
  }

  const isAwaitingInput  = step !== "welcome" && step !== "done";
  const showInput        = isAwaitingInput && STEPS[step].inputType !== "theme-picker";
  const showThemePicker  = step === "theme";

  // Step counter — exclude "done" from total
  const stepKeys = Object.keys(STEPS).filter(s => s !== "done") as Step[];
  const stepNum  = stepKeys.indexOf(step) + 1;
  const stepTotal = stepKeys.length;

  return (
    <div className="min-h-dvh bg-[#F7F5EE] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EAE7DC] bg-white px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#FF7F11] animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#262626]">Asistente Central Bolivia</p>
          <p className="label-caps text-[#ACBFA4]">Configuración de Portal</p>
        </div>
        <div className="ml-auto">
          <span className="label-caps text-[#6B7565]">
            {step === "done" ? "Completado" : `Paso ${stepNum} de ${stepTotal}`}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Avatar */}
              {msg.role === "agent" ? (
                <div className="w-7 h-7 rounded-full bg-[#262626] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F11]" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#ACBFA4] flex-shrink-0 mt-0.5" />
              )}

              <div className="flex flex-col gap-2 max-w-sm">
                {/* Bubble */}
                <div className={`px-4 py-3 rounded-sm text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "agent"
                    ? "bg-white border border-[#EAE7DC] text-[#262626]"
                    : "bg-[#FF7F11] text-white"
                }`}>
                  {msg.content}
                </div>

                {/* Social preview logo */}
                {msg.logoUrl && (
                  <div className="flex items-center gap-3 bg-white border border-[#EAE7DC] rounded-sm px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.logoUrl}
                      alt="Foto de perfil"
                      className="w-12 h-12 rounded-full object-cover border border-[#EAE7DC]"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <p className="text-xs text-[#6B7565]">Foto de perfil importada</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-[#262626] flex-shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F11]" />
              </div>
              <div className="bg-white border border-[#EAE7DC] px-4 py-3 rounded-sm">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#ACBFA4] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Theme picker */}
          {showThemePicker && !isTyping && (
            <div className="flex flex-col gap-3 pl-10 animate-fade-up">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSubmit(t.id)}
                  disabled={loading}
                  className="text-left border border-[#D8D3C8] bg-white hover:border-[#FF7F11] hover:bg-[#FFF8F2] transition-all px-4 py-3 rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#262626]">{t.label}</span>
                    <span className="text-xs text-[#FF7F11] opacity-0 group-hover:opacity-100 transition-opacity">Seleccionar →</span>
                  </div>
                  <p className="text-xs text-[#6B7565] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          )}


          {/* Welcome CTA */}
          {step === "welcome" && !isTyping && (
            <div className="pl-10 animate-fade-up">
              <Button onClick={() => handleSubmit("sí")} size="sm">Sí, empecemos</Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      {showInput && !isTyping && (
        <div className="border-t border-[#EAE7DC] bg-white px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            <div className="flex gap-3">
              <input
                type={
                  step === "password" ? "password" :
                  step === "email"    ? "email"    :
                  step === "whatsapp" ? "tel"       :
                  "text"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                placeholder={
                  step === "email"    ? "tu@correo.com"               :
                  step === "password" ? "Mínimo 8 caracteres"          :
                  step === "whatsapp" ? "+591 7xxxxxxx"                :
                  step === "social"   ? "@tuusuario" :
                  step === "name"     ? (data.fullName  || "Tu nombre completo")  :
                  step === "brand"    ? (data.brandName || "Tu marca o agencia")  :
                  "Escribe aquí..."
                }
                defaultValue={
                  step === "name"  && data.fullName  ? data.fullName  :
                  step === "brand" && data.brandName ? data.brandName :
                  undefined
                }
                className="flex-1 border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 transition-colors bg-[#F7F5EE]"
                autoFocus
              />
              <Button onClick={() => handleSubmit()} disabled={!inputValue.trim() || loading} loading={loading}>
                Enviar
              </Button>
            </div>

            {/* Social step: skip link */}
            {step === "social" && (
              <button
                type="button"
                onClick={() => {
                  addMessage("user", "Omitir");
                  agentReply("email");
                }}
                className="text-xs text-[#ACBFA4] hover:text-[#6B7565] transition-colors text-left"
              >
                Omitir este paso →
              </button>
            )}

            {/* Name/brand step: hint when pre-filled from social */}
            {(step === "name" || step === "brand") && data[step === "name" ? "fullName" : "brandName"] && (
              <p className="text-xs text-[#ACBFA4]">
                Pre-llenado desde tu perfil social. Edita si deseas cambiarlo.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
