import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type KbDoc = { name: string; content_chunks: string[]; created_at: string };

/** Simple keyword relevance: count how many words from the query appear in the chunk */
function scoreChunk(chunk: string, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const lower = chunk.toLowerCase();
  return words.reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0);
}

/** Pull the top N most relevant chunks from the KB for the given query */
function retrieveContext(docs: KbDoc[], query: string, topN = 6): string {
  const scored: Array<{ chunk: string; score: number }> = [];
  for (const doc of docs) {
    for (const chunk of doc.content_chunks) {
      scored.push({ chunk, score: scoreChunk(chunk, query) });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.chunk)
    .join("\n---\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, message, history = [] } = body as {
      slug: string;
      message: string;
      history: Array<{ role: "user" | "model"; text: string }>;
    };

    if (!slug || !message) {
      return NextResponse.json({ error: "slug y message son requeridos" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Resolve tenant by slug
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, brand_voice, kb_documents, chatbot_config")
      .eq("slug", slug)
      .single();

    if (!profile) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

    // Fetch active listings for context
    const { data: listings } = await admin
      .from("listings")
      .select("title, price, currency, property_type, bedrooms, bathrooms, area_m2, address")
      .eq("profile_id", profile.id)
      .eq("status", "activo")
      .limit(10);

    const listingsSummary = (listings ?? [])
      .map(l => `• ${l.title} — ${l.price} ${l.currency}, ${l.bedrooms ?? "?"}d/${l.bathrooms ?? "?"}b, ${l.area_m2 ?? "?"}m², ${l.address ?? ""}`)
      .join("\n");

    // RAG: retrieve relevant KB chunks
    const kbDocs = (profile.kb_documents as unknown as KbDoc[]) ?? [];
    const kbContext = kbDocs.length > 0 ? retrieveContext(kbDocs, message) : "";

    const systemPrompt = `Eres el asistente virtual de ${profile.full_name}, un agente inmobiliario en Bolivia.
Responde siempre en español, de forma concisa y amigable.
${profile.brand_voice ? `\nVOZ DE MARCA:\n${profile.brand_voice}\n` : ""}

PROPIEDADES DISPONIBLES:
${listingsSummary || "No hay propiedades activas en este momento."}

${kbContext ? `INFORMACIÓN ADICIONAL (base de conocimiento del agente):\n${kbContext}` : ""}

Si el usuario quiere agendar una visita, pregunta su nombre, teléfono y horario preferido.
Si no sabes algo, invita al usuario a contactar directamente al agente.
Nunca inventes precios ni características de propiedades que no están en la lista.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for Gemini
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chatbot error:", err);
    return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 });
  }
}
