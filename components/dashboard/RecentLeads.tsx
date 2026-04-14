"use client";

interface Lead {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  status?: string;
  created_at: string;
  listings?: { title?: string; slug?: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "#FF7F11" },
  contactado: { label: "Contactado", color: "#ACBFA4" },
  en_seguimiento: { label: "En Seguimiento", color: "#5BAFB0" },
  cerrado: { label: "Cerrado", color: "#6B7565" },
};

export function RecentLeads({ leads }: { leads: Record<string, unknown>[] }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-10 text-center">
        <p className="text-[#6B7565] text-sm">Aún no tienes leads. Cuando alguien guarde una propiedad, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
      <div className="divide-y divide-[#EAE7DC]">
        {leads.map((lead) => {
          const l = lead as unknown as Lead;
          const status = STATUS_LABELS[l.status ?? "nuevo"] ?? STATUS_LABELS.nuevo;
          const date = new Date(l.created_at).toLocaleDateString("es-BO", {
            day: "numeric",
            month: "short",
          });

          return (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F7F5EE] transition-colors">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#E2E8CE] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#262626]">
                {l.visitor_name?.[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#262626] truncate">
                  {l.visitor_name ?? "Visitante anónimo"}
                </p>
                <p className="text-xs text-[#6B7565] truncate">
                  {l.visitor_email} · {(l.listings as Lead["listings"])?.title ?? "Propiedad"}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="label-caps hidden sm:block" style={{ color: status.color }}>
                  {status.label}
                </span>
                <span className="label-caps text-[#ACBFA4]">{date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
