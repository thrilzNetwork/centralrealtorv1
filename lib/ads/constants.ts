export const PLATFORMS = [
  { id: "meta",   label: "Meta (FB + IG)" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google Ads" },
] as const;

export const OBJECTIVES = [
  { id: "leads",    label: "Generar leads" },
  { id: "views",    label: "Visualizaciones" },
  { id: "messages", label: "Mensajes / WhatsApp" },
  { id: "traffic",  label: "Tráfico al portal" },
] as const;

export const BUDGET_PRESETS = [50, 100, 250, 500] as const;

export const DURATION_OPTIONS = [3, 7, 14, 30] as const;

export const ADS_STATUS_LABELS: Record<string, string> = {
  draft:      "Borrador",
  queued:     "En cola",
  in_review:  "En revisión",
  approved:   "Aprobado",
  launching:  "Lanzando",
  active:     "Activo",
  paused:     "Pausado",
  completed:  "Completado",
  cancelled:  "Cancelado",
};

export const ADS_STATUS_COLORS: Record<string, string> = {
  draft:      "bg-[#F7F5EE] text-[#6B7565]",
  queued:     "bg-blue-50 text-blue-700",
  in_review:  "bg-yellow-50 text-yellow-700",
  approved:   "bg-green-50 text-green-700",
  launching:  "bg-orange-50 text-orange-700",
  active:     "bg-green-100 text-green-800",
  paused:     "bg-yellow-100 text-yellow-800",
  completed:  "bg-[#F7F5EE] text-[#262626]",
  cancelled:  "bg-red-50 text-red-700",
};

export function calcFee(totalCents: number): { feeCents: number; spendCents: number } {
  const feePercent = Number(process.env.NEXT_PUBLIC_ADS_FEE_PERCENT ?? 3) / 100;
  const feeCents  = Math.round(totalCents * feePercent);
  return { feeCents, spendCents: totalCents - feeCents };
}
