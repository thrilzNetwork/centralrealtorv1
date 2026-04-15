import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CHUNK_SIZE = 500; // characters per chunk

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  // Split by paragraphs first, then by size
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 20);
  let current = "";
  for (const para of paragraphs) {
    if ((current + " " + para).length > CHUNK_SIZE) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + " " + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "El archivo no puede superar 5 MB" }, { status: 400 });

    let text = "";
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((await import("pdf-parse")) as any).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = await file.text();
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "No se pudo extraer texto del archivo." }, { status: 422 });
    }

    const chunks = chunkText(text);

    // Load existing kb_documents and append
    const { data: profile } = await supabase
      .from("profiles")
      .select("kb_documents")
      .eq("id", user.id)
      .single();

    const existing = (profile?.kb_documents as unknown[]) ?? [];

    const newDoc = {
      name: file.name,
      content_chunks: chunks,
      created_at: new Date().toISOString(),
    };

    const updated = [...existing, newDoc];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ kb_documents: updated })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      name: file.name,
      chunks: chunks.length,
      total_docs: updated.length,
    });
  } catch (err) {
    console.error("kb-upload error:", err);
    return NextResponse.json({ error: "Error al procesar el documento" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("kb_documents")
      .eq("id", user.id)
      .single();

    const existing = (profile?.kb_documents as Array<{ name: string }>) ?? [];
    const updated = existing.filter(d => d.name !== name);

    await supabase.from("profiles").update({ kb_documents: updated }).eq("id", user.id);
    return NextResponse.json({ total_docs: updated.length });
  } catch (err) {
    console.error("kb-delete error:", err);
    return NextResponse.json({ error: "Error al eliminar el documento" }, { status: 500 });
  }
}
