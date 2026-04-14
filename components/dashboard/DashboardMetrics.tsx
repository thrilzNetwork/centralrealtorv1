"use client";

interface MetricCardProps {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}

function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm p-5 flex flex-col gap-1">
      <span className="label-caps text-[#6B7565]">{label}</span>
      <span
        className="text-3xl font-light mt-1"
        style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          color: accent ? "#FF7F11" : "#262626",
        }}
      >
        {value.toLocaleString()}
      </span>
      {sub && <span className="text-xs text-[#ACBFA4]">{sub}</span>}
    </div>
  );
}

interface DashboardMetricsProps {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  newLeads: number;
  totalViews: number;
  totalHearts: number;
}

export function DashboardMetrics({
  totalListings,
  activeListings,
  totalLeads,
  newLeads,
  totalViews,
  totalHearts,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <MetricCard label="Propiedades" value={totalListings} sub={`${activeListings} activas`} />
      <MetricCard label="Leads Totales" value={totalLeads} sub={`${newLeads} nuevos`} accent={newLeads > 0} />
      <MetricCard label="Visitas" value={totalViews} sub="en todas las propiedades" />
      <MetricCard label="Guardados" value={totalHearts} sub="veces marcada como favorita" />
      <MetricCard label="Activas" value={activeListings} />
      <MetricCard label="En Borrador" value={totalListings - activeListings} sub="sin publicar" />
    </div>
  );
}
