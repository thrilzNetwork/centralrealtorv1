import type { Metadata } from "next";
import { AffiliatePageClient } from "@/components/affiliate/AffiliatePageClient";

export const metadata: Metadata = {
  title: "Programa de Afiliados — Central Bolivia",
  description:
    "Gana créditos recurrentes recomendando Central Bolivia. Comisiones de 10% a 30% por cada asesor que refieras. Aplica hoy.",
};

export default function AffiliatePage() {
  return <AffiliatePageClient />;
}
