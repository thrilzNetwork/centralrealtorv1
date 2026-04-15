import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "El archivo no puede superar 10 MB" }, { status: 400 });

    let text = "";

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // pdf-parse is in serverExternalPackages — safe to import dynamically
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((await import("pdf-parse")) as any).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      // Plain text or other text-based file
      text = await file.text();
    }

    if (!text || text.trim().length < 30) {
      return NextResponse.json({ error: "No se pudo extraer texto del archivo." }, { status: 422 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres un experto en estrategia de marca para el mercado inmobiliario latinoamericano.
Analiza el siguiente documento de referencia de marca y extrae su voz de marca en exactamente 300 palabras.

Cubre estos aspectos:
1. Tono general (formal/informal, cercano/distante, aspiracional/práctico)
2. Frases y vocabulario clave que usa la marca
3. Tono emocional (confianza, lujo, cercanía, urgencia, etc.)
4. Propuestas de valor principales
5. Lo que NUNCA diría esta marca

Documento de referencia:
---
${text.slice(0, 4000)}
---

Responde en español, en párrafos fluidos (no listas). Máximo 300 palabras.`;

    const result = await model.generateContent(prompt);
    const brandVoice = result.response.text().trim();

    // Save to profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ brand_voice: brandVoice })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ brand_voice: brandVoice });
  } catch (err) {
    console.error("brand-voice error:", err);
    return NextResponse.json({ error: "Error al procesar el archivo de marca" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("brand_voice")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ brand_voice: data?.brand_voice ?? null });
}
