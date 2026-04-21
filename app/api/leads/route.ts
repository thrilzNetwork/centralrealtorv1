import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function scoreAndTier(data: {
  visitorPhone?: string | null;
  visitorEmail?: string | null;
  message?: string | null;
}): { score: number; score_tier: "hot" | "warm" | "cold" } {
  let s = 0;
  if (data.visitorPhone) s += 30;
  if (data.visitorEmail) s += 20;
  if ((data.message?.length ?? 0) > 50) s += 20;
  const lower = data.message?.toLowerCase() ?? "";
  if (/precio|costo|valor|cuánto|cuanto/.test(lower)) s += 15;
  if (/visita|ver|recorri|conocer/.test(lower)) s += 15;
  const tier: "hot" | "warm" | "cold" = s >= 70 ? "hot" : s >= 40 ? "warm" : "cold";
  return { score: s, score_tier: tier };
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { key: "leads", limit: 5, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const {
      listingId,
      profileId,
      visitorName,
      visitorEmail,
      visitorPhone,
      message,
      type = "heart",
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    // listingId is required only for heart actions
    if (type === "heart" && !listingId) {
      return NextResponse.json({ error: "listingId required for heart" }, { status: 400 });
    }

    // Validate email format if provided
    if (visitorEmail && !EMAIL_RE.test(visitorEmail)) {
      return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 });
    }

    // Sanitize phone — strip everything except digits, +, -, spaces
    const cleanPhone = visitorPhone ? visitorPhone.replace(/[^\d+\-\s()]/g, "").trim() : null;

    const admin = createAdminClient();

    const { score, score_tier } = scoreAndTier({ visitorPhone: cleanPhone, visitorEmail, message });

    const insertPayload: Record<string, unknown> = {
      profile_id: profileId,
      visitor_name: visitorName ? String(visitorName).slice(0, 120) : null,
      visitor_email: visitorEmail ? String(visitorEmail).slice(0, 255).toLowerCase() : null,
      visitor_phone: cleanPhone,
      status: "nuevo",
      score,
      score_tier,
    };

    // listing_id is optional (contact_form can come from homepage)
    if (listingId) insertPayload.listing_id = listingId;
    // Store message in notes field
    if (message) insertPayload.notes = message;

    const { data: lead, error: leadError } = await admin
      .from("leads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertPayload as any)
      .select()
      .single();

    if (leadError) {
      if (leadError.code === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }

    // Increment hearts on listing via RPC
    if (type === "heart" && listingId) {
      const { error: rpcError } = await admin.rpc("increment_listing_hearts", { listing_id: listingId });
      if (rpcError) console.error("increment_listing_hearts failed:", rpcError.message);
    }

    // Notify realtor (in-app)
    await admin.from("notifications").insert({
      profile_id: profileId,
      lead_id: lead.id,
      type: type === "heart" ? "new_lead" : "contact_form",
      title:
        type === "heart"
          ? "Nueva persona guardó una propiedad"
          : "Nuevo mensaje de contacto",
      body: visitorEmail
        ? `${visitorName ?? "Visitante"} (${visitorEmail})`
        : (visitorName ?? "Visitante anónimo"),
    });

    // Gmail notification — fire-and-forget (best-effort, no await)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centralbolivia.com";
    const emailSubject =
      type === "heart"
        ? `Nuevo interesado: ${visitorName ?? "Visitante"} guardó una propiedad`
        : `Nuevo mensaje de ${visitorName ?? "Visitante"}`;
    const emailBody =
      type === "heart"
        ? `${visitorName ?? "Un visitante"}${visitorEmail ? ` (${visitorEmail})` : ""} guardó una de tus propiedades en Central Bolivia.\n\nRevisa tu panel: ${siteUrl}/dashboard`
        : `${visitorName ?? "Un visitante"}${visitorEmail ? ` (${visitorEmail})` : ""} te envió un mensaje:\n\n${message ?? "(sin mensaje)"}\n\nRevisa tu panel: ${siteUrl}/dashboard`;

    fetch(`${siteUrl}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, subject: emailSubject, body: emailBody }),
    }).catch(() => {/* best-effort */});

    // Auto-responder to visitor if they provided email
    if (visitorEmail) {
      const { data: realtorProfile } = await admin
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", profileId)
        .single();
      const realtorName = realtorProfile?.full_name ?? "El asesor";
      const visitorAutoSubject = "Recibimos tu consulta — Central Bolivia";
      const visitorAutoBody = [
        `Hola ${visitorName ?? ""}👋`,
        "",
        `${realtorName} ya recibió tu mensaje y te contactará pronto.`,
        "Mientras tanto, sigue explorando propiedades en tu portal.",
        "",
        `${siteUrl}`,
        "",
        "Central Bolivia",
      ].join("\n");
      fetch(`${siteUrl}/api/notifications/email/visitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: visitorEmail,
          to_name: visitorName ?? "",
          subject: visitorAutoSubject,
          body: visitorAutoBody,
          profile_id: profileId,
        }),
      }).catch(() => {});
    }

    // WhatsApp notification to realtor via Twilio (best-effort)
    fetch(`${siteUrl}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profileId,
        message: `🏠 Nuevo lead${score_tier === "hot" ? " 🔥 HOT" : score_tier === "warm" ? " ☀️ cálido" : ""}: *${visitorName ?? "Visitante"}*${visitorEmail ? ` (${visitorEmail})` : ""}${cleanPhone ? ` · ${cleanPhone}` : ""}. Score ${score}/100.`,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("leads route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Require authentication; the user can only read their own leads
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*, listings(title, slug)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "csv") {
    const rows = [
      ["Nombre", "Email", "Teléfono", "Estado", "Propiedad", "Notas", "Fecha"].join(","),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(data ?? []).map((l: any) =>
        [
          `"${l.visitor_name ?? ""}"`,
          `"${l.visitor_email ?? ""}"`,
          `"${l.visitor_phone ?? ""}"`,
          `"${l.status ?? ""}"`,
          `"${(l.listings as { title?: string } | null)?.title ?? ""}"`,
          `"${(l.notes ?? "").replace(/"/g, '""')}"`,
          `"${new Date(l.created_at).toLocaleDateString("es-BO")}"`,
        ].join(",")
      ),
    ].join("\n");

    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(data);
}
