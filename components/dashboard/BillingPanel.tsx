"use client";

import { useState } from "react";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";

type Billing = "monthly" | "annual";

const PLANS = [
  {
    key: "profesional",
    name: "Pro Essential",
    monthly: 49,
    annual: 490,
    features: [
      "Portal con tu marca",
      "Propiedades ilimitadas",
      "CM Digital (Community Manager IA)",
      "AI Scheduler (agenda visitas automática)",
      "Web de Lujo (tema premium)",
    ],
    highlight: false,
  },
  {
    key: "broker",
    name: "Elite Suite",
    monthly: 69,
    annual: 690,
    features: [
      "Todo de Pro Essential",
      "Mejora de imágenes con IA (Nano Banana)",
      "Video IA con Veo (recorridos cinemáticos)",
      "Dominio propio (próximamente)",
      "Soporte prioritario por email",
    ],
    highlight: true,
  },
];

interface BillingPanelProps {
  currentPlan: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  hasCustomer: boolean;
  userId?: string;
  entitySlug?: string;
  isNew?: boolean;
  isExpired?: boolean;
}

export function BillingPanel({
  currentPlan,
  subscriptionStatus,
  trialEndsAt,
  userId = "N/A",
  entitySlug = "N/A",
  isNew = false,
  isExpired = false,
}: BillingPanelProps) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const normalizedPlan = (currentPlan ?? "basico").toLowerCase();
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const trialEnds = trialEndsAt ? new Date(trialEndsAt) : null;
  const trialActive = trialEnds ? trialEnds.getTime() > Date.now() : false;

  const openCustomerPortal = async () => {
    try {
      setLoadingPortal(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("No pudimos abrir el portal de facturación. Escríbenos por WhatsApp.");
        setLoadingPortal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al abrir el portal de facturación.");
      setLoadingPortal(false);
    }
  };

  const handleStripeCheckout = async (planKey: string) => {
    try {
      setLoadingPlan(planKey);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar el pago con tarjeta. Asegúrate de tener los API Keys configurados.");
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error de red durante el checkout.");
      setLoadingPlan(null);
    }
  };

  const getWhatsAppLink = (planName: string) => {
    const text = `Hola, quiero cobrar mi Plan ${planName} en Central Bolivia. Mi ID de usuario es ${userId} (Slug: ${entitySlug}). Por favor mándenme el QR para transferencia.`;
    return `https://wa.me/19546488174?text=${encodeURIComponent(text)}`;
  };

  const currentPlanLabel =
    normalizedPlan === "broker"
      ? "Elite Suite"
      : normalizedPlan === "profesional"
      ? "Pro Essential"
      : "Básico";

  const statusLabel: Record<string, string> = {
    active: "Activo",
    trialing: "En prueba",
    past_due: "Pago pendiente",
    canceled: "Cancelado",
    paused: "Pausado",
    incomplete: "Incompleto",
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Current plan summary */}
      <div
        className="max-w-4xl rounded-sm border p-5 flex flex-wrap items-center justify-between gap-4"
        style={{
          borderColor: isActive ? "#FF7F11" : "#EAE7DC",
          backgroundColor: isActive ? "#FFF7F0" : "#F7F5EE",
        }}
      >
        <div>
          <p className="label-caps text-[#6B7565] mb-1">Plan actual</p>
          <div className="flex items-center gap-3">
            <p className="font-serif text-xl text-[#262626]">{currentPlanLabel}</p>
            {subscriptionStatus && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full border"
                style={{
                  borderColor: isActive ? "#FF7F11" : "#D8D3C8",
                  color: isActive ? "#FF7F11" : "#6B7565",
                  backgroundColor: "white",
                }}
              >
                {statusLabel[subscriptionStatus] ?? subscriptionStatus}
              </span>
            )}
          </div>
          {trialActive && trialEnds && (
            <p className="text-xs text-[#6B7565] mt-1">
              Prueba gratis hasta {trialEnds.toLocaleDateString("es-BO")}
            </p>
          )}
          {isExpired && (
            <p className="text-xs text-red-600 mt-1">Tu prueba terminó — elige un plan para continuar.</p>
          )}
        </div>
        {isActive && (
          <button
            onClick={openCustomerPortal}
            disabled={loadingPortal}
            className="flex items-center gap-2 py-2.5 px-4 text-sm rounded-sm border border-[#D8D3C8] bg-white text-[#262626] hover:bg-[#F7F5EE] transition-colors"
          >
            {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loadingPortal ? "Abriendo..." : "Gestionar suscripción"}
          </button>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 max-w-4xl">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
            billing === "monthly"
              ? "bg-[#262626] text-white border-[#262626]"
              : "bg-white text-[#6B7565] border-[#EAE7DC] hover:border-[#262626]"
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => setBilling("annual")}
          className={`px-4 py-2 text-sm rounded-sm border transition-colors flex items-center gap-2 ${
            billing === "annual"
              ? "bg-[#262626] text-white border-[#262626]"
              : "bg-white text-[#6B7565] border-[#EAE7DC] hover:border-[#262626]"
          }`}
        >
          Anual
          <span className="text-xs px-1.5 py-0.5 rounded-sm bg-[#FF7F11] text-white font-medium">
            2 meses gratis
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {PLANS.map((plan) => {
          const isCurrent = isActive && normalizedPlan === plan.key;
          return (
          <div
            key={plan.key}
            className="bg-white border rounded-sm p-8 flex flex-col gap-6 relative transition-all hover:shadow-md"
            style={{
              borderColor: isCurrent ? "#FF7F11" : plan.highlight ? "#FF7F11" : "#EAE7DC",
              boxShadow: plan.highlight || isCurrent ? "0 10px 40px -10px #FF7F1130" : undefined,
            }}
          >
            {isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="label-caps bg-[#262626] text-white px-4 py-1.5 rounded-sm shadow-md flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Plan actual
                </span>
              </div>
            )}
            {!isCurrent && plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="label-caps bg-[#FF7F11] text-white px-4 py-1.5 rounded-sm shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Estatus Digital
                </span>
              </div>
            )}

            <div>
              <p className="label-caps text-[#6B7565] mb-2">{plan.name}</p>
              {billing === "annual" ? (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-[#FF7F11]">${Math.round(plan.annual / 12)}</span>
                    <span className="text-sm text-[#6B7565]">/ mes</span>
                  </div>
                  <p className="text-xs text-[#6B7565] mt-1">${plan.annual}/año · ahorras ${plan.monthly * 12 - plan.annual}</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-[#FF7F11]">${plan.monthly}</span>
                  <span className="text-sm text-[#6B7565]">/ mes</span>
                </div>
              )}
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#262626]">
                  <svg
                    className="w-4 h-4 text-[#FF7F11] flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f.includes("AI Branding") ? (
                    <span className="font-medium text-[#FF7F11]">{f}</span>
                  ) : (
                    f
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 mt-2 pt-6 border-t border-[#EAE7DC]/60">
              {isCurrent ? (
                <button
                  onClick={openCustomerPortal}
                  disabled={loadingPortal}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium rounded-sm transition-all border border-[#262626] text-[#262626] bg-white hover:bg-[#F7F5EE]"
                >
                  {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {loadingPortal ? "Abriendo..." : "Gestionar suscripción"}
                </button>
              ) : (
                <button
                  onClick={() => handleStripeCheckout(plan.key)}
                  disabled={loadingPlan !== null}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium rounded-sm transition-all shadow-sm"
                  style={
                    plan.highlight
                      ? { backgroundColor: "#FF7F11", color: "white" }
                      : { backgroundColor: "#262626", color: "white" }
                  }
                >
                  {loadingPlan === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {loadingPlan === plan.key
                    ? "Redirigiendo..."
                    : isActive
                    ? (normalizedPlan === "broker" ? "Cambiar a este plan" : "Subir a este plan")
                    : "Pagar con Tarjeta"}
                </button>
              )}

              <p className="text-center text-[10px] label-caps text-[#6B7565]">
                Promoción: Setup Fee ($100) GRATIS hasta el 1 de mayo
              </p>

              <a
                href={getWhatsAppLink(plan.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-sm transition-all border border-[#D8D3C8] text-[#6B7565] hover:bg-[#F7F5EE]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366] flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </div>
          );
        })}
      </div>

      {isNew && (
        <div className="max-w-4xl text-center">
          <p className="text-sm text-[#6B7565] mb-3">¿Prefieres explorar primero?</p>
          <a
            href="/dashboard?bienvenido=1"
            className="inline-block text-sm text-[#6B7565] underline underline-offset-2 hover:text-[#262626] transition-colors"
          >
            Empezar demo gratuita de 3 días →
          </a>
        </div>
      )}

      <div className="bg-[#F7F5EE] border border-[#EAE7DC] p-5 rounded-sm max-w-4xl text-center mt-4">
        <h4 className="font-serif text-[#262626] text-lg mb-2">Seguridad Incorporada</h4>
        <p className="text-sm text-[#6B7565] leading-relaxed">
          Tu portal incluye hospedaje premium, certificado SSL, base de datos privada y backups diarios incorporados directamente en tu plan.
        </p>
      </div>
    </div>
  );
}
