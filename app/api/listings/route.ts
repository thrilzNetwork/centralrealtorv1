import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { listingPublished } from "@/lib/email/templates";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://centralbolivia.com"
  );
}

async function fireListingPublishedEmail(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  title: string,
  slug: string,
) {
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .single();
  if (!profile?.email) return;
  const url = siteUrl();
  const tpl = listingPublished({
    title,
    publicUrl: `${url}/propiedades/${slug}`,
    dashboardUrl: `${url}/dashboard/propiedades`,
  });
  sendEmail({
    to: profile.email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  }).catch(() => {});
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  // Generate unique slug
  const baseSlug = slugify(`${body.title ?? "propiedad"}-${body.city ?? "bolivia"}`);
  let finalSlug = baseSlug;
  let counter = 0;

  while (true) {
    const { data } = await admin
      .from("listings")
      .select("slug")
      .eq("slug", finalSlug)
      .maybeSingle();
    if (!data) break;
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  const { data, error } = await supabase.from("listings").insert({
    profile_id: user.id,
    slug: finalSlug,
    title: body.title,
    description: body.description ?? null,
    ai_generated: body.ai_generated ?? false,
    property_type: body.property_type ?? "casa",
    status: body.status ?? "borrador",
    address: body.address ?? null,
    neighborhood: body.neighborhood ?? null,
    city: body.city ?? null,
    department: body.department ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    place_id: body.place_id ?? null,
    price: body.price ?? null,
    currency: body.currency ?? "USD",
    area_m2: body.area_m2 ?? null,
    bedrooms: body.bedrooms ?? null,
    bathrooms: body.bathrooms ?? null,
    parking: body.parking ?? null,
    images: body.images ?? [],
    neighborhood_summary: body.neighborhood_summary ?? null,
    ai_prompt_used: body.ai_prompt_used ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.status === "activo") {
    fireListingPublishedEmail(admin, user.id, data.title ?? "", data.slug ?? finalSlug).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: prevListing } = await supabase
    .from("listings")
    .select("status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  // Only allow updating the caller's own listing
  const { data, error } = await supabase
    .from("listings")
    .update({
      title: fields.title,
      description: fields.description ?? null,
      property_type: fields.property_type ?? "casa",
      status: fields.status ?? "borrador",
      address: fields.address ?? null,
      neighborhood: fields.neighborhood ?? null,
      city: fields.city ?? null,
      department: fields.department ?? null,
      lat: fields.lat ?? null,
      lng: fields.lng ?? null,
      price: fields.price ?? null,
      currency: fields.currency ?? "USD",
      area_m2: fields.area_m2 ?? null,
      bedrooms: fields.bedrooms ?? null,
      bathrooms: fields.bathrooms ?? null,
      parking: fields.parking ?? null,
      images: fields.images ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("profile_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (
    data?.status === "activo" &&
    prevListing?.status !== "activo"
  ) {
    const admin = createAdminClient();
    fireListingPublishedEmail(
      admin,
      user.id,
      data.title ?? "",
      data.slug ?? "",
    ).catch(() => {});
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
