/**
 * Universal Property Scraper
 * Extracts property data from any real estate listing URL using regex-based HTML parsing.
 * Optimized for Bolivian portals: Century21.com.bo, InfoCasas, Viva.com.bo, etc.
 */

export interface ScrapedProperty {
  title:         string;
  description:   string;
  price:         number | null;
  currency:      string;
  listing_type:  "venta" | "alquiler" | "anticretico" | null;
  property_type: string;
  address:       string;
  city:          string | null;
  area_m2:       number | null;
  bedrooms:      number | null;
  bathrooms:     number | null;
  parking:       number | null;
  amenities:     string[];
  images:        string[];
  source_url:    string;
}

export async function scrapeProperty(url: string): Promise<ScrapedProperty> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("URL inválida. Verifica que sea una dirección web completa.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Solo se aceptan URLs con protocolo http o https.");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
        "Cache-Control":   "no-cache",
        "Referer":         "https://www.google.com/",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`No se pudo acceder al sitio (${response.status}). Verifica que la URL sea pública.`);
    }

    const html = await response.text();
    return parseProperty(html, url, parsedUrl.hostname);
  } catch (error) {
    if (error instanceof Error && error.message.includes("No se pudo")) throw error;
    console.error("Universal scraper error:", error);
    throw new Error("No se pudo extraer la propiedad. Verifica que la URL sea accesible y tenga información de inmueble.");
  }
}

function parseProperty(html: string, sourceUrl: string, hostname: string): ScrapedProperty {
  // Strip scripts/styles but keep raw html for image scanning
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  const text = stripTags(cleanHtml);
  const base = `${new URL(sourceUrl).protocol}//${new URL(sourceUrl).host}`;
  const isC21 = hostname.includes("c21.com.bo") || hostname.includes("century21");

  // ── Listing type ─────────────────────────────────────────────────────────
  let listing_type: ScrapedProperty["listing_type"] = null;
  const lt = (text + " " + sourceUrl).toLowerCase();
  if (/anticr[eé]tico/.test(lt))       listing_type = "anticretico";
  else if (/alquiler|arriendo|renta/.test(lt)) listing_type = "alquiler";
  else if (/venta|vende|sale/.test(lt)) listing_type = "venta";

  // ── Title ─────────────────────────────────────────────────────────────────
  const ogTitle =
    matchMeta(cleanHtml, "og:title") ||
    matchMeta(cleanHtml, "twitter:title");
  const h1Match = cleanHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rawTitle = ogTitle || (h1Match ? stripTags(h1Match[1]) : null) || "";
  // Clean portal boilerplate from title (e.g. "| Century 21 Bolivia")
  const title = rawTitle
    .replace(/\s*[\|–\-]\s*(Century\s*21|RE\/MAX|InfoCasas|Viva\.com\.bo|Inmuebles24|Plusvalia).*$/i, "")
    .trim() || "Propiedad";

  // ── Description ───────────────────────────────────────────────────────────
  const ogDesc = matchMeta(cleanHtml, "og:description") || matchMeta(cleanHtml, "description");
  // Also try to find a substantial paragraph block in the body
  const paragraphs = [...cleanHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => stripTags(m[1]).trim())
    .filter(p => p.length > 80 && p.length < 2000 && !/cookie|privacy|©/i.test(p));
  const longestPara = paragraphs.sort((a, b) => b.length - a.length)[0] ?? "";
  let description = ogDesc || longestPara || `Propiedad extraída de ${hostname}`;
  if (description.length > 1500) description = description.slice(0, 1500).trim() + "…";

  // ── Price ─────────────────────────────────────────────────────────────────
  let price: number | null = null;
  let currency = "USD";

  // Try JSON-LD first (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const inner = block.replace(/<[^>]+>/g, "");
      const priceM = inner.match(/"price"\s*:\s*"?([\d.]+)"?/);
      const currM  = inner.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/);
      if (priceM) {
        price = parseFloat(priceM[1]);
        if (currM) currency = currM[1];
        break;
      }
    }
  }

  // Fallback: regex patterns ordered by specificity
  if (!price) {
    const pricePatterns = [
      { re: /(?:USD|US\$)\s*[:\-]?\s*([\d,.]+)/i,             cur: "USD" },
      { re: /([\d,.]+)\s*(?:USD|US\$)/i,                       cur: "USD" },
      { re: /\$\s*([\d,.]+)/,                                   cur: "USD" },
      { re: /(?:Bs\.?|BOB)\s*[:\-]?\s*([\d,.]+)/i,            cur: "BOB" },
      { re: /([\d,.]+)\s*(?:Bs\.?|BOB)/i,                      cur: "BOB" },
      { re: /[Pp]recio[\s:Ss]*[Aa]lquiler[\s:]*\$?\s*([\d,.]+)/i, cur: "USD" },
      { re: /[Pp]recio[\s:]*\$?\s*([\d,.]+)/i,                 cur: "USD" },
    ];
    for (const { re, cur } of pricePatterns) {
      const m = cleanHtml.match(re);
      if (m) {
        const raw = m[1].replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100_000_000) {
          price = Math.round(parsed);
          currency = cur;
          break;
        }
      }
    }
  }

  // ── Area ─────────────────────────────────────────────────────────────────
  // Prefer "Construcción" area over "Terreno" — construction reflects usable space
  let area_m2: number | null = null;
  const constMatch = text.match(/[Cc]onstrucci[oó]n[\s:\-]*([\d.,]+)\s*m[²2²]/i);
  const terrenoMatch = text.match(/[Tt]erreno[\s:\-]*([\d.,]+)\s*m[²2²]/i);
  const genericM2 = text.match(/([\d.,]+)\s*m[²2²]/i) ||
                    text.match(/([\d.,]+)\s*(?:m2|mts2?|metros\s*cuadrados?|mt2)/i);
  const supMatch = text.match(/[Ss]uperficie[\s:\-]*([\d.,]+)/i);

  const parseArea = (s: string) => { const v = parseFloat(s.replace(",", ".")); return isNaN(v) || v <= 0 || v > 100000 ? null : v; };
  area_m2 = (constMatch && parseArea(constMatch[1]))
         || (supMatch   && parseArea(supMatch[1]))
         || (terrenoMatch && parseArea(terrenoMatch[1]))
         || (genericM2  && parseArea(genericM2[1]));

  // ── Bedrooms ──────────────────────────────────────────────────────────────
  const bedMatch =
    text.match(/(\d+)\s*(?:[Dd]ormitorio|[Hh]abitaci[oó]n|[Rr]ec[aá]mara|[Cc]uarto|[Bb]edroom)/i) ||
    text.match(/(?:[Dd]ormitorio|[Hh]abitaci[oó]n|[Bb]edroom)s?\s*[:\-]?\s*(\d+)/i) ||
    cleanHtml.match(/"bedrooms?"\s*:\s*"?(\d+)"?/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1]) : null;

  // ── Bathrooms ─────────────────────────────────────────────────────────────
  const bathMatch =
    text.match(/(\d+)\s*(?:[Bb]a[ñn]o|[Bb]athroom|[Ww][Cc])/i) ||
    text.match(/(?:[Bb]a[ñn]o|[Bb]athroom)s?\s*[:\-]?\s*(\d+)/i) ||
    cleanHtml.match(/"bathrooms?"\s*:\s*"?(\d+)"?/i);
  const bathrooms = bathMatch ? parseInt(bathMatch[1]) : null;

  // ── Parking ───────────────────────────────────────────────────────────────
  const parkMatch =
    text.match(/(\d+)\s*(?:[Ee]stacionamiento|[Gg]araje|[Pp]arking|[Cc]ochera)/i) ||
    text.match(/(?:[Ee]stacionamiento|[Gg]araje|[Pp]arking)s?\s*[:\-]?\s*(\d+)/i);
  const parking = parkMatch ? parseInt(parkMatch[1]) : null;

  // ── Amenities ─────────────────────────────────────────────────────────────
  const AMENITY_KEYWORDS: { key: string; label: string }[] = [
    { key: "piscina|pileta|pool",                             label: "Piscina" },
    { key: "gym|gimnasio",                                    label: "Gimnasio" },
    { key: "churrasquer|parrilla|bbq",                        label: "Parrilla/BBQ" },
    { key: "aire acondicionado|a\\/c|a\\.c\\.",               label: "Aire Acondicionado" },
    { key: "amueblado|amoblado|furnished",                    label: "Amueblado" },
    { key: "vigilancia|seguridad|security",                   label: "Vigilancia" },
    { key: "jardín|jardin|garden",                            label: "Jardín" },
    { key: "terraza|rooftop",                                 label: "Terraza" },
    { key: "ascensor|elevador|elevator",                      label: "Ascensor" },
    { key: "internet|wifi|wi-fi",                             label: "Internet/WiFi" },
    { key: "cocina equipada|cocina integral",                 label: "Cocina Equipada" },
    { key: "acepta mascotas|mascotas|pet",                    label: "Acepta Mascotas" },
    { key: "área social|area social",                         label: "Área Social" },
    { key: "lavandería|laundry|lavanderia",                   label: "Lavandería" },
    { key: "vista panorámica|vista panoramica|panoramic",     label: "Vista Panorámica" },
    { key: "construcción nueva|construccion nueva",           label: "Construcción Nueva" },
    { key: "anticretico|anticr[eé]tico",                     label: "Anticrético Disponible" },
  ];

  const lowerText = text.toLowerCase();
  const amenities = AMENITY_KEYWORDS
    .filter(({ key }) => new RegExp(key, "i").test(lowerText))
    .map(({ label }) => label);

  // ── Address ───────────────────────────────────────────────────────────────
  let address = "";
  // Try structured data first
  const ldAddress = html.match(/"streetAddress"\s*:\s*"([^"]+)"/i);
  if (ldAddress) {
    address = ldAddress[1].trim();
  } else {
    // Look for labeled address/location
    const addrPatterns = [
      /[Dd]irecci[oó]n\s*[:\-]?\s*([^\n<]{5,120})/,
      /[Uu]bicaci[oó]n\s*[:\-]?\s*([^\n<]{5,120})/,
      /<address[^>]*>([\s\S]*?)<\/address>/i,
    ];
    for (const re of addrPatterns) {
      const m = cleanHtml.match(re);
      if (m) { address = stripTags(m[1]).trim(); break; }
    }
  }
  // On C21, the breadcrumb often contains: Departamento > Renta > Bolivia > Santa Cruz > Oeste
  if (!address && isC21) {
    const breadcrumb = cleanHtml.match(/(?:breadcrumb|crumbs)[^>]*>([\s\S]*?)<\/[^>]+>/i);
    if (breadcrumb) address = stripTags(breadcrumb[1]).replace(/\s*[>›»]\s*/g, ", ").trim();
  }

  // ── City ─────────────────────────────────────────────────────────────────
  const CITIES = ["Santa Cruz de la Sierra", "Santa Cruz", "La Paz", "Cochabamba", "Sucre", "Tarija", "Potosí", "Potosi", "Oruro", "Trinidad", "Cobija"];
  let city: string | null = null;
  const searchIn = address + " " + text;
  for (const c of CITIES) {
    if (new RegExp(`\\b${c}\\b`, "i").test(searchIn)) { city = c; break; }
  }

  // ── Images ────────────────────────────────────────────────────────────────
  const images: string[] = [];

  // og:image / twitter:image first
  const ogImage = matchMeta(html, "og:image") || matchMeta(html, "twitter:image");
  if (ogImage) images.push(resolveUrl(ogImage, base));

  // srcset / data-src (lazy-loaded images common on real estate sites)
  const srcsetMatches = [...html.matchAll(/(?:data-src|data-lazy|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*?)["']/gi)];
  for (const m of srcsetMatches) {
    const src = resolveUrl(m[1].split(" ")[0], base);
    if (isPropertyImage(src, hostname) && !images.includes(src)) images.push(src);
    if (images.length >= 20) break;
  }

  // Standard img src
  if (images.length < 20) {
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    for (const m of imgMatches) {
      const src = resolveUrl(m[1], base);
      if (isPropertyImage(src, hostname) && !images.includes(src)) images.push(src);
      if (images.length >= 20) break;
    }
  }

  // JSON-embedded image arrays (common in SPAs and gallery scripts)
  if (images.length < 5) {
    const jsonImgs = [...html.matchAll(/"(?:url|src|image|photo|foto|img)"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)];
    for (const m of jsonImgs) {
      const src = m[1];
      if (!images.includes(src)) images.push(src);
      if (images.length >= 20) break;
    }
  }

  return {
    title:         title || "Propiedad",
    description:   description || `Propiedad extraída de ${hostname}`,
    price,
    currency,
    listing_type,
    property_type: detectPropertyType(text),
    address,
    city,
    area_m2,
    bedrooms,
    bathrooms,
    parking,
    amenities,
    images: images.slice(0, 20),
    source_url: sourceUrl,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function matchMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }
  return null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function resolveUrl(src: string, base: string): string {
  if (!src || src.startsWith("data:")) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}

function isPropertyImage(src: string, hostname: string): boolean {
  if (!src || src.startsWith("data:") || src.length < 10) return false;
  if (!/\.(jpg|jpeg|png|webp)/i.test(src)) return false;
  const lowerSrc = src.toLowerCase();
  // Exclude obvious non-property images
  if (/logo|icon|avatar|sprite|thumb-nav|banner-top|pixel|tracking|blank|placeholder/i.test(lowerSrc)) return false;
  // Exclude app store badges
  if (/google-play|app-store|appstore|disponible.*google|disponible.*app/i.test(lowerSrc)) return false;
  // Exclude flag icons and country badges (common on multi-country portals)
  if (/flag|bandera|isotipo/i.test(lowerSrc)) return false;
  // Exclude UI/search icons often scraped as images
  if (/search|magnif|lupa/i.test(lowerSrc)) return false;
  // Exclude very small images (likely icons/badges)
  if (/th\.(outside)?24x24|th\.(outside)?110x50|th\.(outside)?700x200/i.test(lowerSrc)) return false;
  return true;
}

function detectPropertyType(text: string, title?: string): string {
  // Title has highest signal — check it first
  const titleLower = (title ?? "").toLowerCase();
  if (/\b(casa|house|chalet|villa|duplex|townhouse)\b/.test(titleLower)) return "casa";
  if (/\b(departamento|apartamento|depto|piso|flat|apartment)\b/.test(titleLower)) return "departamento";
  if (/\b(terreno|lote|solar|land|lot)\b/.test(titleLower)) return "terreno";
  if (/\b(oficina|office)\b/.test(titleLower)) return "oficina";
  if (/\b(local\s*comercial|local|comercial|shop|store|galería)\b/.test(titleLower)) return "local_comercial";

  // Fall back to body text with casa checked first (most common)
  const t = text.toLowerCase();
  if (/\b(casa|house|chalet|villa|duplex|townhouse)\b/.test(t)) return "casa";
  if (/\b(departamento|apartamento|depto|piso|flat|apartment)\b/.test(t)) return "departamento";
  if (/\b(terreno|lote|solar|land|lot)\b/.test(t)) return "terreno";
  if (/\b(oficina|office)\b/.test(t)) return "oficina";
  if (/\b(local\s*comercial|local|comercial|shop|store|galería)\b/.test(t)) return "local_comercial";
  return "otro";
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}
