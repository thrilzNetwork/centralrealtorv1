"use client";

import { useState } from "react";
import { CreditCard, QrCode, Loader2, Sparkles } from "lucide-react";

// Map Essential to the 'profesional' DB tier for $29,
// Map Premium to the 'broker' DB tier for $49.
const PLANS = [
  {
    key: "profesional",
    name: "Essential",
    price: "$29",
    features: [
      "Portal con tu marca",
      "Propiedades ilimitadas",
      "Mapa interactivo de propiedades",
      "Captación de leads a WhatsApp",
    ],
    highlight: false,
    allowQR: true,
  },
  {
    key: "broker",
    name: "Premium",
    price: "$49",
    features: [
      "Todo del plan Essential",
      "Dominio personalizado incluido",
      "AI Branding Content Manager",
      "Soporte prioritario 24/7",
    ],
    highlight: true,
    allowQR: false,
  },
];

interface BillingPanelProps {
  currentPlan: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  hasCustomer: boolean;
  userId?: string;
  entitySlug?: string;
}

export function BillingPanel({ userId = "N/A", entitySlug = "N/A" }: BillingPanelProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleStripeCheckout = async (planKey: string) => {
    try {
      setLoadingPlan(planKey);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
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

  return (
    <div className="flex flex-col gap-8">
      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="bg-white border rounded-sm p-8 flex flex-col gap-6 relative transition-all hover:shadow-md"
            style={{
              borderColor: plan.highlight ? "#FF7F11" : "#EAE7DC",
              boxShadow: plan.highlight ? "0 10px 40px -10px #FF7F1130" : undefined,
            }}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="label-caps bg-[#FF7F11] text-white px-4 py-1.5 rounded-sm shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Estatus Digital
                </span>
              </div>
            )}

            <div>
              <p className="label-caps text-[#6B7565] mb-2">{plan.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-[#FF7F11]">{plan.price}</span>
                <span className="text-sm text-[#6B7565]">/ mes</span>
              </div>
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
                {loadingPlan === plan.key ? "Redirigiendo..." : "Pagar con Tarjeta (Acceso Instantáneo)"}
              </button>
              
              {plan.allowQR ? (
                <a
                  href={getWhatsAppLink(plan.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-sm transition-all border border-[#D8D3C8] text-[#6B7565] hover:bg-[#F7F5EE]"
                >
                  <QrCode className="w-4 h-4" />
                  Pago Local QR (Activar por WhatsApp)
                </a>
              ) : (
                <p className="text-center text-xs text-[#6B7565] mt-1 hidden sm:block">
                  Suscripción Premium exclusivamente vía cobro con tarjeta.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F7F5EE] border border-[#EAE7DC] p-5 rounded-sm max-w-4xl text-center mt-4">
        <h4 className="font-serif text-[#262626] text-lg mb-2">Seguridad Incorporada</h4>
        <p className="text-sm text-[#6B7565] leading-relaxed">
          Tu portal incluye hospedaje premium, certificado SSL, base de datos privada y backups diarios incorporados directamente en tu plan.
        </p>
      </div>
    </div>
  );
}
