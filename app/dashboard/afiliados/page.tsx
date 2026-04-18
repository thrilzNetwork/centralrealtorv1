import type { Metadata } from "next";
import { AffiliateDashboard } from "@/components/dashboard/AffiliateDashboard";

export const metadata: Metadata = { title: "Afiliados — Central Bolivia" };

export default function AfiliadosPage() {
  return <AffiliateDashboard />;
}
