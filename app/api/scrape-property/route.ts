import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeC21Property, isValidC21Url } from "@/lib/scraper/c21";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL from request
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: "URL requerida" },
        { status: 400 }
      );
    }

    // Validate URL
    if (!isValidC21Url(url)) {
      return NextResponse.json(
        { error: "Solo se aceptan URLs de Century 21 Bolivia (c21.com.bo)" },
        { status: 400 }
      );
    }

    // Scrape the property
    const property = await scrapeC21Property(url);

    return NextResponse.json(property);
  } catch (err) {
    console.error("scrape-property error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al extraer la propiedad" },
      { status: 500 }
    );
  }
}
