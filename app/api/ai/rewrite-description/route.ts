/**
 * AI Property Description Rewriter
 * Takes raw/scraped descriptions and rewrites them using best-in-class
 * real estate copywriting principles. Powered by Gemini.
 */
import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `Eres el mejor copywriter inmobiliario del mundo. Trabajas para los agentes de élite en Bolivia.

Tu trabajo: reescribir descripciones de propiedades para que vendan.

REGLAS:
- Escribe en español boliviano natural (usa "departamento", "cochera", "baño", "estar", "quincho", etc.)
- Tono: aspiracional pero honesto. Nada de hype falso.
- Estructura: abre con un gancho emocional (1 frase), luego describe la propiedad (2-3 párrafos), cierra con llamado a la acción.
- Destaca lo que hace ÚNICA a esta propiedad. No genérico.
- SIEMPRE incluye detalles de ubicación/barrio si los hay.
- No uses adjetivos vacíos ("hermosa", "increíble", "espectacular") sin respaldarlos con un detalle concreto.
- No uses frases de vendedor desesperado ("¡NO DEJE PASAR ESTA OPORTUNIDAD!", "¡ÚNICO!", "¡APROVECHE!").
- Mantén entre 150-400 palabras.
- Formatea con saltos de línea para lectura fácil (lectura web).
- Si la descripción original menciona datos (precio, m², habitaciones), mantenlos.
- Incluye 3-5 bullets de características clave al final si hay suficientes datos.

EJEMPLO DE BUEN OUTPUT:

"Imaginate despertar cada mañana con el sol de Santa Cruz entrando por los ventanales de tu estar. Eso es lo que ofrece este departamento en Equipetrol Norte."

(2-3 párrafos de descripción)

"Características:
• 180 m² de superficie total
• 3 dormitorios (principal con walking closet)
• 2 baños completos
• Cochera para 2 vehículos
• Terraza con parrilla"

"Agendá tu visita hoy y conocé lo que puede ser tu próximo hogar."
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { description, title, city, neighborhood, price, property_type, area_m2, bedrooms, bathrooms, parking, amenities } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Se requiere una descripción" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback: return improved version without AI
      return NextResponse.json({
        rewritten: cleanAndStructure(description, { title, city, neighborhood, price, property_type, area_m2, bedrooms, bathrooms, parking, amenities }),
        ai_generated: false,
        model: "fallback-structured",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contextParts = [];
    if (title) contextParts.push(`Título: ${title}`);
    if (city) contextParts.push(`Ciudad: ${city}`);
    if (neighborhood) contextParts.push(`Barrio/Zona: ${neighborhood}`);
    if (property_type) contextParts.push(`Tipo: ${property_type}`);
    if (price) contextParts.push(`Precio: ${price}`);
    if (area_m2) contextParts.push(`Área: ${area_m2} m²`);
    if (bedrooms) contextParts.push(`Habitaciones: ${bedrooms}`);
    if (bathrooms) contextParts.push(`Baños: ${bathrooms}`);
    if (parking) contextParts.push(`Estacionamiento: ${parking}`);
    if (amenities?.length) contextParts.push(`Características: ${Array.isArray(amenities) ? amenities.join(", ") : amenities}`);

    const contextBlock = contextParts.length ? `\n\nDATOS DE LA PROPIEDAD:\n${contextParts.join("\n")}` : "";

    const prompt = `DESCRIPCIÓN ORIGINAL:\n"""\n${description}\n"""${contextBlock}\n\nReescribe esta descripción siguiendo las reglas del sistema. Responde SOLO con la descripción reescrita, sin comillas, sin metadatos, sin "ACÁ ESTÁ".`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido. Dame la descripción y la reescribo siguiendo esas reglas exactas." }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const rewritten = result.response.text().trim();

    return NextResponse.json({
      rewritten: rewritten || description,
      ai_generated: true,
      model: "gemini-1.5-flash",
    });
  } catch (err) {
    console.error("AI rewrite error:", err);
    return NextResponse.json(
      { error: "Error al reescribir con IA. Intentá de nuevo." },
      { status: 500 }
    );
  }
}

function cleanAndStructure(description: string, data: Record<string, unknown>): string {
  let cleaned = description.trim();
  if (cleaned.length > 800) cleaned = cleaned.slice(0, 800).trim() + "…";

  const bullets: string[] = [];
  if (data.area_m2) bullets.push(`• ${data.area_m2} m² de superficie`);
  if (data.bedrooms) bullets.push(`• ${data.bedrooms} dormitorios`);
  if (data.bathrooms) bullets.push(`• ${data.bathrooms} baños`);
  if (data.parking) bullets.push(`• Estacionamiento para ${data.parking} vehículos`);
  if (data.neighborhood) bullets.push(`• Ubicado en ${data.neighborhood}${data.city ? `, ${data.city}` : ""}`);
  if (data.price) bullets.push(`• Precio: $${Number(data.price).toLocaleString("es-BO")}`);

  if (bullets.length) {
    cleaned += "\n\nCaracterísticas:\n" + bullets.join("\n");
  }

  return cleaned;
}
