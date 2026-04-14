import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/formatCurrency";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Propiedades — Dashboard" };

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  activo:    { label: "Activo",    bg: "#DCFCE7", text: "#16A34A" },
  borrador:  { label: "Borrador",  bg: "#F3F4F6", text: "#6B7280" },
  vendido:   { label: "Vendido",   bg: "#FEF9C3", text: "#CA8A04" },
  alquilado: { label: "Alquilado", bg: "#EDE9FE", text: "#7C3AED" },
  inactivo:  { label: "Inactivo",  bg: "#FEE2E2", text: "#DC2626" },
};

export default async function PropiedadesDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, property_type, status, price, currency, images, neighborhood, city, views, hearts, created_at, ai_generated")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="label-caps text-[#6B7565]">Mis Propiedades</span>
          <h1
            className="text-[#262626] mt-1"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
          >
            {listings?.length ?? 0} Propiedades
          </h1>
        </div>
        <Link
          href="/dashboard/propiedades/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7F11] text-white text-sm font-medium rounded-sm hover:bg-[#CC6500] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Propiedad
        </Link>
      </div>

      {!listings?.length ? (
        <div className="bg-white border border-[#EAE7DC] rounded-sm p-14 text-center">
          <p className="text-[#6B7565] mb-4">Aún no tienes propiedades.</p>
          <Link
            href="/dashboard/propiedades/nueva"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7F11] text-white text-sm font-medium rounded-sm hover:bg-[#CC6500] transition-colors"
          >
            Agregar tu primera propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
          <div className="divide-y divide-[#EAE7DC]">
            {listings.map((listing) => {
              const st = STATUS_STYLES[listing.status] ?? STATUS_STYLES.borrador;
              return (
                <div key={listing.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F7F5EE] transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 bg-[#E2E8CE] rounded-sm flex-shrink-0 overflow-hidden relative">
                    {listing.images?.[0] ? (
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#262626] truncate">{listing.title}</p>
                      {listing.ai_generated && (
                        <span className="label-caps text-[#FF7F11] flex-shrink-0">✦ IA</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7565]">
                      {listing.neighborhood ?? listing.city ?? "—"}
                      {listing.price ? ` · ${formatPrice(listing.price, listing.currency)}` : ""}
                    </p>
                  </div>

                  {/* Status */}
                  <div
                    className="px-2.5 py-1 rounded-sm label-caps flex-shrink-0"
                    style={{ backgroundColor: st.bg, color: st.text }}
                  >
                    {st.label}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-[#ACBFA4] flex-shrink-0">
                    <span>{listing.views} vistas</span>
                    <span>{listing.hearts} ♥</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Link
                      href={`/dashboard/propiedades/${listing.id}/editar`}
                      className="text-xs text-[#6B7565] hover:text-[#262626] border border-[#D8D3C8] px-3 py-1.5 rounded-sm transition-colors"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
