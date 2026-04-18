import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Image enhance route. Uses Gemini 2.5 Flash image model ("Nano Banana") to
// edit / upscale a listing photo based on an instruction. The uploaded image
// is passed inline (base64) and the model returns an enhanced version.

const IMAGE_MODEL = "gemini-2.5-flash-image-preview";
const GEMINI_REST = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const DEFAULT_INSTRUCTION =
  "Enhance this real estate photo: improve exposure, balance colors, sharpen details, keep it photorealistic. Do not add or remove objects.";

type Body = {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  instruction?: string;
};

async function fetchAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`could not fetch image: ${r.status}`);
  const mimeType = r.headers.get("content-type") ?? "image/jpeg";
  const buf = Buffer.from(await r.arrayBuffer());
  return { base64: buf.toString("base64"), mimeType };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está configurado. Mejora de imagen deshabilitada." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;

  let base64 = body.imageBase64 ?? "";
  let mimeType = body.mimeType ?? "image/jpeg";
  if (!base64 && body.imageUrl) {
    try {
      const fetched = await fetchAsBase64(body.imageUrl);
      base64 = fetched.base64;
      mimeType = fetched.mimeType;
    } catch (err) {
      console.error("enhance fetch error:", err);
      return NextResponse.json({ error: "No se pudo descargar la imagen original." }, { status: 400 });
    }
  }

  if (!base64) {
    return NextResponse.json({ error: "imageBase64 o imageUrl requerido." }, { status: 400 });
  }

  const instruction = body.instruction?.trim() || DEFAULT_INSTRUCTION;

  try {
    const resp = await fetch(`${GEMINI_REST(IMAGE_MODEL)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: instruction },
              { inlineData: { data: base64, mimeType } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("gemini enhance error:", resp.status, errText);
      return NextResponse.json(
        { error: `Gemini devolvió ${resp.status}.` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    let outBase64 = "";
    let outMime = "image/png";
    let notes = "";
    for (const part of parts) {
      if (part.inlineData) {
        outBase64 = part.inlineData.data;
        outMime = part.inlineData.mimeType;
      } else if (part.text) {
        notes = part.text;
      }
    }

    if (!outBase64) {
      return NextResponse.json({ error: "El modelo no devolvió una imagen mejorada." }, { status: 502 });
    }

    let imageUrl = "";
    try {
      const buffer = Buffer.from(outBase64, "base64");
      const ext = outMime === "image/jpeg" ? "jpg" : "png";
      const fileName = `${user.id}/enhanced/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, buffer, { contentType: outMime, upsert: false });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    } catch {
      // fall through to data URL
    }

    if (!imageUrl) imageUrl = `data:${outMime};base64,${outBase64}`;

    return NextResponse.json({
      imageUrl,
      notes,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("enhance error:", err);
    return NextResponse.json({ error: "Error al mejorar la imagen." }, { status: 500 });
  }
}
