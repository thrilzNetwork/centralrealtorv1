import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type PropertyType = "casa" | "departamento" | "terreno" | "oficina" | "local_comercial" | "otro";
type ListingType = "venta" | "alquiler" | "anticrético";

/** Parse a Spanish-formatted number — handles both "83,3" (decimal comma) and "1.250" (thousands dot) */
function parseSpanishNumber(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    // Replace thousands dots, then replace decimal comma with dot
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  }
  // No comma — dots are thousands separators
  return parseFloat(trimmed.replace(/\./g, ""));
}

function extractPropertyData(text: string) {
  // ── Listing type ─────────────────────────────────────────────────────────
  let listing_type: ListingType = "venta";
  if (/alquiler|renta|arriendo/i.test(text)) listing_type = "alquiler";
  else if (/anticrético|anticretico/i.test(text)) listing_type = "anticrético";

  // ── Price ─────────────────────────────────────────────────────────────────
  let price: number | null = null;
  let currency = "USD";

  // C21 Bolivia format: "Precio De Alquiler: 503 USD" or "Precio De Venta: 85.000 USD"
  const priceC21 = text.match(/Precio\s+De\s+(?:Alquiler|Venta|Anticrético)[:\s]*([\d.,]+)\s*(USD|BS\.?|BOB)?/i);
  if (priceC21) {
    price = parseSpanishNumber(priceC21[1]);
    if (/bs|bob/i.test(priceC21[2] ?? "")) currency = "BOB";
  } else {
    const priceMatch =
      text.match(/(?:precio|price|valor)[^\d]*(?:USD|BS\.?|BOB)?\s*\$?\s*([\d.,]+)/i) ||
      text.match(/\$\s*([\d.,]+)/) ||
      text.match(/([\d.,]+)\s*(?:USD|usd)/i) ||
      text.match(/BS\.?\s*([\d.,]+)/i);
    if (priceMatch) {
      price = parseSpanishNumber(priceMatch[1]);
      if (/bs|bob/i.test(priceMatch[0])) currency = "BOB";
    }
  }

  // ── Area ──────────────────────────────────────────────────────────────────
  let area: number | null = null;

  // Prefer "Superficie: 77,40 m²" (usable/net area)
  const areaSuperficie = text.match(/Superficie[:\s]*([\d.,]+)\s*m[²2]/i);
  if (areaSuperficie) {
    area = parseSpanishNumber(areaSuperficie[1]);
  } else {
    const areaConstruccion = text.match(/Construcci[oó]n[:\s]*([\d.,]+)\s*M?[²2]/i);
    const areaTerreno = text.match(/Terreno[:\s]*([\d.,]+)\s*M?[²2]/i);
    const areaGeneric =
      text.match(/([\d.,]+)\s*m[²2]/i) ||
      text.match(/(?:área|area|superficie)[^\d]*([\d.,]+)/i);
    const candidate = areaConstruccion || areaTerreno || areaGeneric;
    if (candidate) area = parseSpanishNumber(candidate[1]);
  }

  // ── Bedrooms ──────────────────────────────────────────────────────────────
  let bedrooms: number | null = null;
  const bedMatch =
    text.match(/Dormitorios?[:\s]*(\d+)/i) ||
    text.match(/Habitaci[oó]nes?[:\s]*(\d+)/i) ||
    text.match(/(\d+)\s*(?:habitaci[oó]nes?|dormitorios?|cuartos?|bedrooms?)/i);
  if (bedMatch) bedrooms = parseInt(bedMatch[1]);

  // ── Bathrooms ────────────────────────────────────────────────────────────
  let bathrooms: number | null = null;
  const bathMatch =
    text.match(/Ba[ñn]os?[:\s]*(\d+)/i) ||
    text.match(/(\d+)\s*(?:ba[ñn]os?|bathrooms?)/i);
  if (bathMatch) bathrooms = parseInt(bathMatch[1]);

  // ── Parking ───────────────────────────────────────────────────────────────
  let parking: number | null = null;
  const parkMatch =
    text.match(/Estacionamientos?[:\s]*(\d+)/i) ||
    text.match(/Garajes?[:\s]*(\d+)/i) ||
    text.match(/Parking[:\s]*(\d+)/i);
  if (parkMatch) parking = parseInt(parkMatch[1]);

  // ── Property type ─────────────────────────────────────────────────────────
  let property_type: PropertyType = "otro";
  const t = text.toLowerCase();
  if (/departamento|depto|apartamento|apartment/i.test(t)) property_type = "departamento";
  else if (/terreno|lote|lot\b/i.test(t)) property_type = "terreno";
  else if (/oficina|office/i.test(t)) property_type = "oficina";
  else if (/local\s*comercial|tienda|store/i.test(t)) property_type = "local_comercial";
  else if (/casa|house|villa|chalet/i.test(t)) property_type = "casa";

  // ── City ──────────────────────────────────────────────────────────────────
  const cities = ["Santa Cruz", "La Paz", "Cochabamba", "Sucre", "Oruro", "Potosí", "Tarija", "Beni", "Pando", "Trinidad"];
  let city: string | null = null;
  for (const c of cities) {
    if (new RegExp(c, "i").test(text)) { city = c; break; }
  }

  // ── Address: text block after "UBICACIÓN DEL INMUEBLE" ───────────────────
  let address = "";
  const ubicacionMatch = text.match(/UBICACI[OÓ]N\s+DEL\s+INMUEBLE[\s\S]{0,30}\n([\s\S]{10,300}?)(?:\n{2,}|\f|$)/i);
  if (ubicacionMatch) {
    address = ubicacionMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  }

  // ── Title ─────────────────────────────────────────────────────────────────
  const propTypeLabel: Record<PropertyType, string> = {
    casa: "Casa", departamento: "Departamento", terreno: "Terreno",
    oficina: "Oficina", local_comercial: "Local Comercial", otro: "Propiedad",
  };
  const listingLabel = listing_type === "alquiler" ? "en Alquiler"
    : listing_type === "anticrético" ? "en Anticrético" : "en Venta";
  let title = "";
  if (address) {
    const zone = address.split(",")[0].trim();
    title = `${propTypeLabel[property_type]} ${listingLabel} — ${zone}`;
  } else {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 20)) {
      if (line.length > 8 && line.length < 120 && !/^\d+$/.test(line)) {
        title = line; break;
      }
    }
    if (!title) title = `${propTypeLabel[property_type]} ${listingLabel}${city ? ` en ${city}` : ""}`;
  }

  // ── Description: prefer "Características:" block ─────────────────────────
  let description = "";
  const caracterMatch = text.match(/Caracter[íi]sticas?:[\s\S]{0,20}\n([\s\S]{30,1200}?)(?:\n{2,}|DATOS GENERALES|UBICACI[OÓ]N|$)/i);
  if (caracterMatch) {
    description = caracterMatch[1]
      .split("\n").map((l) => l.trim()).filter(Boolean).join(" ").slice(0, 1200);
  } else {
    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 60);
    if (paragraphs.length > 0) {
      description = paragraphs.sort((a, b) => b.length - a.length)[0].slice(0, 1200);
    }
  }

  // ── Amenities from "DATOS GENERALES" ──────────────────────────────────────
  let amenities: string[] = [];
  const datosMatch = text.match(/DATOS\s+GENERALES[\s\S]{0,30}\n([\s\S]{10,600}?)(?:\n{2,}|UBICACI[OÓ]N|Caracter|$)/i);
  if (datosMatch) {
    amenities = datosMatch[1]
      .split("\n").map((l) => l.trim())
      .filter((l) => l.length > 2 && l.length < 60 && !/^\d+$/.test(l));
  }

  return { title, description, price, currency, listing_type, area_m2: area, bedrooms, bathrooms, parking, property_type, city, address, amenities };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "El PDF no puede superar 5 MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse is declared as serverExternalPackage in next.config.ts to avoid
    // the bundler loading its test files, which breaks in serverless environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = ((await import("pdf-parse")) as any).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "No se pudo extraer texto del PDF. Verifica que no sea una imagen escaneada." },
        { status: 422 }
      );
    }

    const data = extractPropertyData(text);
    return NextResponse.json({ ...data, rawTextLength: text.length });
  } catch (err) {
    console.error("parse-property-pdf error:", err);
    return NextResponse.json({ error: "Error al procesar el PDF" }, { status: 500 });
  }
}
