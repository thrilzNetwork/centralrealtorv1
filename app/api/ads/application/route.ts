import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("ads_applications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, wallet_balance_cents")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    application: data ?? null,
    ads_access_status: profile?.ads_access_status ?? "none",
    wallet_balance_cents: profile?.wallet_balance_cents ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.ads_access_status === "approved") {
    return NextResponse.json({ error: "Ya tienes acceso aprobado" }, { status: 409 });
  }
  if (profile?.ads_access_status === "pending") {
    return NextResponse.json({ error: "Ya tienes una solicitud en revisión" }, { status: 409 });
  }

  const body = await request.json();
  const {
    full_name, document_id, phone, city, social_links,
    meta_business_url, meta_account_status, property_types, experience, referral_code,
  } = body as Record<string, string>;

  if (!full_name || !document_id || !phone || !city || !social_links || !property_types || !experience) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("ads_applications")
    .insert({
      profile_id:         user.id,
      full_name:          full_name.trim(),
      document_id:        document_id.trim(),
      phone:              phone.trim(),
      city:               city.trim(),
      social_links:       social_links.trim(),
      meta_business_url:  meta_business_url?.trim() || null,
      meta_account_status: meta_account_status ?? "good",
      property_types:     property_types.trim(),
      experience:         experience.trim(),
      referral_code:      referral_code?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({ ads_access_status: "pending" })
    .eq("id", user.id);

  // Notify staff via WhatsApp (fire-and-forget)
  const staffWa = process.env.STAFF_WHATSAPP;
  if (staffWa) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: staffWa,
        message: `📋 Nueva solicitud Ads Accelerator\n${full_name} (${profile?.email})\nCiudad: ${city}\nRevisa en /dashboard/ads-admin`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, application_id: app.id });
}
