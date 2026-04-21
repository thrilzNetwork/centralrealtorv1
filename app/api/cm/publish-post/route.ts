import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v19.0";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    platform: "instagram" | "facebook" | "tiktok";
    copy: string;
    image_url?: string;
  };
  const { platform, copy, image_url } = body;

  if (!platform || !copy) {
    return NextResponse.json({ error: "platform y copy son obligatorios" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_user_id, instagram_access_token, facebook_page_id, facebook_page_token")
    .eq("id", user.id)
    .single();

  if (platform === "tiktok") {
    return NextResponse.json(
      { error: "La publicación en TikTok requiere video. Próximamente." },
      { status: 501 }
    );
  }

  if (platform === "instagram") {
    if (!profile?.instagram_user_id || !profile?.instagram_access_token) {
      return NextResponse.json({ error: "Cuenta de Instagram no conectada" }, { status: 400 });
    }
    if (!image_url) {
      return NextResponse.json(
        { error: "Instagram requiere una imagen para publicar. Copia el texto y publícalo con una foto." },
        { status: 400 }
      );
    }

    const igId = profile.instagram_user_id;
    const token = profile.instagram_access_token;

    // Create media container
    const containerRes = await fetch(`${GRAPH}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url, caption: copy, access_token: token }),
    });
    const containerData = await containerRes.json() as { id?: string; error?: { message: string } };
    if (!containerData.id) {
      return NextResponse.json(
        { error: containerData.error?.message ?? "Error al crear el contenedor de Instagram" },
        { status: 500 }
      );
    }

    // Publish container
    const publishRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: token }),
    });
    const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
    if (!publishData.id) {
      return NextResponse.json(
        { error: publishData.error?.message ?? "Error al publicar en Instagram" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, post_id: publishData.id });
  }

  // Facebook
  if (!profile?.facebook_page_id || !profile?.facebook_page_token) {
    return NextResponse.json({ error: "Cuenta de Facebook no conectada" }, { status: 400 });
  }

  const feedBody: Record<string, string> = {
    message: copy,
    access_token: profile.facebook_page_token,
  };
  if (image_url) feedBody.link = image_url;

  const feedRes = await fetch(`${GRAPH}/${profile.facebook_page_id}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedBody),
  });
  const feedData = await feedRes.json() as { id?: string; error?: { message: string } };
  if (!feedData.id) {
    return NextResponse.json(
      { error: feedData.error?.message ?? "Error al publicar en Facebook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, post_id: feedData.id });
}
