import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractColors(text: string): string[] {
  // Match standard hex colors: #RGB or #RRGGBB
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
  const found = new Set<string>();
  let match;
  while ((match = hexRegex.exec(text)) !== null) {
    const hex = match[0].toUpperCase();
    // Expand #RGB to #RRGGBB
    if (hex.length === 4) {
      const r = hex[1], g = hex[2], b = hex[3];
      found.add(`#${r}${r}${g}${g}${b}${b}`);
    } else {
      found.add(hex);
    }
  }

  // Filter out near-white and near-black (those are usually backgrounds/text, not brand colors)
  const filtered = [...found].filter(hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 30 && brightness < 230; // not too dark or too light
  });

  return filtered.slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith(".pdf")) return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "El PDF no puede superar 20 MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse is declared as serverExternalPackage in next.config.ts to avoid
    // the bundler loading its test files, which breaks in serverless environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = ((await import("pdf-parse")) as any).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    const colors = extractColors(text);

    if (colors.length === 0) {
      return NextResponse.json({
        colors: [],
        message: "No se encontraron colores hexadecimales en el PDF. Intenta ingresar los colores manualmente.",
      });
    }

    return NextResponse.json({
      colors,
      primary_color: colors[0],
      secondary_color: colors[1] ?? null,
    });
  } catch (err) {
    console.error("parse-brand-pdf error:", err);
    return NextResponse.json({ error: "Error al procesar el PDF" }, { status: 500 });
  }
}
