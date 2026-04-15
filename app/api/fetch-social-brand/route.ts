import { NextResponse, type NextRequest } from "next/server";

function getMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function cleanText(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    let fetchUrl = url.trim();
    if (!fetchUrl.startsWith("http")) fetchUrl = `https://${fetchUrl}`;

    // Validate it's Instagram or Facebook
    const isInstagram = /instagram\.com/i.test(fetchUrl);
    const isFacebook  = /facebook\.com|fb\.com/i.test(fetchUrl);
    if (!isInstagram && !isFacebook) {
      return NextResponse.json({ error: "Solo se admiten URLs de Instagram o Facebook" }, { status: 400 });
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-BO,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `No se pudo acceder al perfil (${res.status})` }, { status: 422 });
    }

    const html = await res.text();

    const logoUrl      = getMeta(html, "og:image");
    const rawTitle     = cleanText(getMeta(html, "og:title"));
    const rawDesc      = cleanText(getMeta(html, "og:description"));
    const siteName     = cleanText(getMeta(html, "og:site_name"));

    // Clean up Instagram/Facebook boilerplate from title
    let name = rawTitle;
    if (name) {
      name = name.replace(/\s*[•·|–-]\s*(Instagram|Facebook).*$/i, "").trim() || name;
      name = name.replace(/^(Instagram|Facebook)\s*[•·|–-]\s*/i, "").trim() || name;
    }

    // Clean up description
    let bio = rawDesc;
    if (bio) {
      // Remove follower counts / Instagram boilerplate
      bio = bio.replace(/\d+(\.\d+)?[KkMm]?\s*(Followers|Following|Posts|seguidores|publicaciones).*$/i, "").trim() || bio;
      if (bio.length > 200) bio = bio.slice(0, 200).trim();
    }

    if (!logoUrl && !name) {
      return NextResponse.json({
        error: "No se encontraron datos de marca en el perfil. Es posible que el perfil sea privado.",
      }, { status: 422 });
    }

    return NextResponse.json({
      logo_url:  logoUrl  ?? null,
      name:      name     ?? null,
      bio:       bio      ?? null,
      site_name: siteName ?? null,
      source:    isInstagram ? "instagram" : "facebook",
    });
  } catch (err) {
    console.error("fetch-social-brand error:", err);
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Tiempo de espera agotado. Verifica la URL e intenta de nuevo." }, { status: 408 });
    }
    return NextResponse.json({ error: "Error al obtener el perfil" }, { status: 500 });
  }
}
