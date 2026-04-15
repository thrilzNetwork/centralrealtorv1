import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type Tone = "agresivo" | "lujo" | "empatico";
type Platform = "instagram" | "facebook" | "tiktok";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  agresivo: "Usa urgencia, escasez y llamadas a la acción directas. Frases cortas y contundentes. Emojis de fuego y dinero. Orientado a conversión inmediata.",
  lujo: "Lenguaje sofisticado, aspiracional y exclusivo. Describe la experiencia de vida, no solo la propiedad. Sin emojis exagerados, máximo 2 sutiles. Tono de revista de arquitectura.",
  empatico: "Cálido, cercano y honesto. Habla al estilo de un amigo de confianza. Destaca el hogar, la familia, el bienestar. Emojis naturales y amigables.",
};

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  instagram: "Caption de Instagram: máximo 2200 caracteres. Usa saltos de línea para respirar. Incluye 10-15 hashtags al final relevantes para Bolivia y el tipo de propiedad. CTA claro.",
  facebook: "Post de Facebook: conversacional, puede ser más largo (hasta 500 palabras). Sin exceso de hashtags (máximo 5). Incluye pregunta al final para generar engagement.",
  tiktok: "Script para video TikTok de 30 segundos. Formato: hook (3s) + puntos clave (20s) + CTA (7s). Muy dinámico, primera persona, lenguaje joven pero profesional.",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { listing_id, tone, platform, custom_notes } = body as {
      listing_id: string;
      tone: Tone;
      platform: Platform;
      custom_notes?: string;
    };

    if (!listing_id || !tone || !platform) {
      return NextResponse.json({ error: "listing_id, tone y platform son requeridos" }, { status: 400 });
    }

    // Fetch listing data
    const { data: listing } = await supabase
      .from("listings")
      .select("title, description, price, currency, property_type, bedrooms, bathrooms, parking, address, area_m2")
      .eq("id", listing_id)
      .eq("profile_id", user.id)
      .single();

    if (!listing) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    // Fetch realtor's brand voice
    const { data: profile } = await supabase
      .from("profiles")
      .select("brand_voice, full_name")
      .eq("id", user.id)
      .single();

    const brandVoiceSection = profile?.brand_voice
      ? `\nVOZ DE MARCA DEL AGENTE:\n${profile.brand_voice}\n`
      : "";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres un Community Manager experto en bienes raíces bolivianos.
${brandVoiceSection}
INSTRUCCIONES DE TONO: ${TONE_INSTRUCTIONS[tone]}

INSTRUCCIONES DE PLATAFORMA: ${PLATFORM_INSTRUCTIONS[platform]}

DATOS DE LA PROPIEDAD:
- Título: ${listing.title}
- Tipo: ${listing.property_type}
- Precio: ${listing.price} ${listing.currency}
- Área: ${listing.area_m2 ? `${listing.area_m2} m²` : "N/D"}
- Dormitorios: ${listing.bedrooms ?? "N/D"}
- Baños: ${listing.bathrooms ?? "N/D"}
- Estacionamientos: ${listing.parking ?? "N/D"}
- Ubicación: ${listing.address ?? "Bolivia"}
- Descripción base: ${listing.description?.slice(0, 500) ?? ""}
${custom_notes ? `\nNOTAS ESPECIALES DEL AGENTE: ${custom_notes}` : ""}

Genera el copy ahora. Solo el texto de la publicación, sin explicaciones adicionales.`;

    const result = await model.generateContent(prompt);
    const copy = result.response.text().trim();

    return NextResponse.json({
      copy,
      platform,
      tone,
      char_count: copy.length,
    });
  } catch (err) {
    console.error("generate-post error:", err);
    return NextResponse.json({ error: "Error al generar el copy" }, { status: 500 });
  }
}
