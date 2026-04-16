import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type CreativeType = "logo_concept" | "social_post" | "tagline" | "color_palette" | "listing_desc";

const PLATFORM_CHARS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, platform, tone, listingTitle, customPrompt } = body as {
    type: CreativeType;
    platform?: string;
    tone?: string;
    listingTitle?: string;
    customPrompt?: string;
  };

  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  // Fetch realtor profile for brand voice + name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, brand_voice, primary_color, secondary_color, city")
    .eq("id", user.id)
    .single();

  const brandVoice = profile?.brand_voice ?? "";
  const agentName = profile?.full_name ?? "Asesor Inmobiliario";
  const city = profile?.city ?? "Bolivia";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let prompt = "";
  let label = "";

  switch (type) {
    case "logo_concept":
      label = "Concepto de Logo";
      prompt = `Eres un diseñador de marca experto en bienes raíces.
Crea un concepto detallado de logo para el agente inmobiliario "${agentName}" en ${city}.
${brandVoice ? `Voz de marca: ${brandVoice}` : ""}
${customPrompt ? `Instrucción adicional: ${customPrompt}` : ""}

Entrega:
1. Concepto visual (forma, ícono, símbolo sugerido)
2. Tipografía recomendada (fuente primaria y secundaria)
3. Paleta de colores sugerida (con códigos hex)
4. Significado y mensaje que transmite el logo
5. Variantes recomendadas (horizontal, cuadrado, símbolo solo)

Responde en español, de forma clara y estructurada. Máximo 400 palabras.`;
      break;

    case "social_post": {
      const plat = platform ?? "instagram";
      const maxChars = PLATFORM_CHARS[plat] ?? 2200;
      label = `Post ${plat.charAt(0).toUpperCase() + plat.slice(1)}`;
      prompt = `Eres un community manager inmobiliario experto.
Crea un post para ${plat} del agente "${agentName}".
${brandVoice ? `Voz de marca: ${brandVoice}` : ""}
${tone ? `Tono: ${tone}` : ""}
${listingTitle ? `Propiedad a promocionar: ${listingTitle}` : ""}
${customPrompt ? `Contexto adicional: ${customPrompt}` : ""}

Incluye: caption atractivo, emojis, hashtags relevantes para Bolivia.
Máximo ${maxChars} caracteres. Responde solo con el texto del post, listo para copiar y pegar.`;
      break;
    }

    case "tagline":
      label = "Tagline / Slogan";
      prompt = `Eres un copywriter especializado en marcas inmobiliarias.
Crea 5 opciones de tagline/slogan para el agente "${agentName}" en ${city}.
${brandVoice ? `Voz de marca: ${brandVoice}` : ""}
${customPrompt ? `Instrucción: ${customPrompt}` : ""}

Cada tagline debe ser memorable, corto (máximo 8 palabras) y transmitir confianza y profesionalismo.
Numera las opciones y explica brevemente por qué funciona cada una. En español.`;
      break;

    case "color_palette":
      label = "Paleta de Colores";
      prompt = `Eres un diseñador de marca especializado en bienes raíces.
Crea una paleta de colores profesional para "${agentName}".
${brandVoice ? `Voz de marca: ${brandVoice}` : ""}
${profile?.primary_color ? `Color actual del agente: ${profile.primary_color}` : ""}
${customPrompt ? `Preferencias: ${customPrompt}` : ""}

Entrega:
- 5 colores con código hex y nombre
- Cuándo usar cada color (primario, secundario, acento, fondo, texto)
- Combinaciones recomendadas
- Psicología de los colores elegidos

En español, formato claro.`;
      break;

    case "listing_desc":
      label = "Descripción de Propiedad";
      prompt = `Eres un copywriter experto en bienes raíces.
Escribe una descripción atractiva y convincente para una propiedad.
Agente: "${agentName}"
${brandVoice ? `Voz de marca: ${brandVoice}` : ""}
${listingTitle ? `Propiedad: ${listingTitle}` : ""}
${customPrompt ? `Detalles de la propiedad: ${customPrompt}` : ""}

La descripción debe:
- Empezar con un gancho emocional
- Destacar características únicas
- Usar lenguaje aspiracional pero honesto
- Tener máximo 300 palabras
- Estar en español

Solo entrega la descripción, lista para copiar.`;
      break;
  }

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    // Estimated cost: Gemini 1.5 Flash ~$0.00 for short prompts at current pricing
    // Track usage in a simple way (input + output tokens approximation)
    const estimatedCost = 0.00; // Flash is free tier for most usage

    return NextResponse.json({
      content,
      label,
      type,
      platform: platform ?? null,
      estimatedCost,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("generate-creative error:", err);
    return NextResponse.json({ error: "Error al generar el creativo" }, { status: 500 });
  }
}
