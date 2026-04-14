import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditListingForm } from "@/components/forms/EditListingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Propiedad — Dashboard" };

export default async function EditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!listing) notFound();

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Editar Propiedad</span>
        <h1
          className="text-[#262626] mt-1"
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "2rem",
            fontWeight: 500,
          }}
        >
          {listing.title}
        </h1>
      </div>
      <EditListingForm listing={listing} />
    </div>
  );
}
