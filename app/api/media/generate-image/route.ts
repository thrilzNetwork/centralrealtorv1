import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export type ImageCreativeType = "image_social" | "image_property_card";

const IMAGE_MODEL = "gemini-2.5-flash-image-preview";
const GEMINI_REST = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, listingTitle, customPrompt } = body as {
    type: ImageCreativeType;
    listingTitle?: string;
    customPrompt?: string;
  };

  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, primary_color, secondary_color, city, brand_voice")
    .eq("id", user.id)
    .single();

  const agentName = profile?.full_name ?? "Asesor Inmobiliario";
  const city = profile?.city ?? "Bolivia";
  const primaryColor = profile?.primary_color ?? "#FF7F11";

  let prompt = "";
  let label = "";

  if (type === "image_social") {
    label = "Imagen Social";
    prompt = `Create a professional real estate social media image for agent "${agentName}" based in ${city}, Bolivia.
${listingTitle ? `Property being promoted: ${listingTitle}` : "General brand promotion image"}
${customPrompt ? `Style instructions: ${customPrompt}` : ""}
Brand accent color: ${primaryColor}
Requirements:
- Square 1:1 format
- Modern, clean, aspirational real estate aesthetic
- Elegant typography with agent name
- Photorealistic or high-quality illustrated style
- Professional and luxurious feel
- Include subtle brand elements`;
  } else if (type === "image_property_card") {
    label = "Tarjeta de Propiedad";
    prompt = `Create a property listing showcase card image for real estate agent "${agentName}" in ${city}, Bolivia.
${listingTitle ? `Property: ${listingTitle}` : "Real estate property showcase"}
${customPrompt ? `Design notes: ${customPrompt}` : ""}
Brand accent color: ${primaryColor}
Requirements:
- Professional property card layout
- Clean white/light background with brand color accents
- Elegant serif typography for property details
- Modern real estate marketing aesthetic
- Include agent name branding at bottom
- High-end, luxurious feel`;
  } else {
    return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está configurado en el servidor." },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch(`${GEMINI_REST(IMAGE_MODEL)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("gemini image REST error:", resp.status, errText);
      return NextResponse.json(
        { error: `Gemini devolvió ${resp.status}. Revisa GEMINI_API_KEY y acceso al modelo.` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    let imageBase64 = "";
    let mimeType = "image/png";
    let textContent = "";

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType;
      } else if (part.text) {
        textContent = part.text;
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image returned by model" }, { status: 500 });
    }

    // Try to upload to Supabase storage (logos bucket, creatives subfolder)
    let imageUrl = "";
    try {
      const buffer = Buffer.from(imageBase64, "base64");
      const ext = mimeType === "image/jpeg" ? "jpg" : "png";
      const fileName = `${user.id}/creatives/${Date.now()}-${type}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, buffer, { contentType: mimeType, upsert: false });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    } catch {
      // upload failed — fall back to data URL below
    }

    // Fall back to data URL if storage upload failed
    if (!imageUrl) {
      imageUrl = `data:${mimeType};base64,${imageBase64}`;
    }

    return NextResponse.json({
      imageUrl,
      label,
      type,
      content: textContent || label,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("generate-image error:", err);
    return NextResponse.json(
      { error: "Error al generar imagen. Verifica que GEMINI_API_KEY esté configurado." },
      { status: 500 }
    );
  }
}
