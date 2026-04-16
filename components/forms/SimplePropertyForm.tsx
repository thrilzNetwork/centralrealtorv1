"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/geo/AddressAutocomplete";
import { MiniMap } from "@/components/geo/MiniMap";
import type { AutocompleteSuggestion } from "@/lib/geo/client";

type PropertyType = "casa" | "departamento" | "terreno" | "oficina" | "local_comercial" | "otro";

export function SimplePropertyForm() {
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeAttested, setScrapeAttested] = useState(false);
  const [importTab, setImportTab] = useState<"url" | "pdf">("url");
  const [pdfParsing, setPdfParsing] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [propertyType, setPropertyType] = useState<PropertyType>("casa");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [parking, setParking] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [listingStatus, setListingStatus] = useState("borrador");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Coords from address autocomplete
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfParsing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-property-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar PDF");
      if (data.title)       setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.price)       setPrice(data.price.toString());
      if (data.currency)    setCurrency(data.currency);
      if (data.property_type) setPropertyType(data.property_type as PropertyType);
      if (data.area_m2)     setArea(data.area_m2.toString());
      if (data.bedrooms)    setBedrooms(data.bedrooms.toString());
      if (data.bathrooms)   setBathrooms(data.bathrooms.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar PDF");
    } finally {
      setPdfParsing(false);
      e.target.value = "";
    }
  }

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    
    setScraping(true);
    setError(null);

    try {
      const res = await fetch("/api/scrape-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al extraer");

      // Pre-fill form
      if (data.title)         setTitle(data.title);
      if (data.description)   setDescription(data.description);
      if (data.price)         setPrice(data.price.toString());
      if (data.currency)      setCurrency(data.currency);
      if (data.property_type) setPropertyType(data.property_type as PropertyType);
      if (data.area_m2)       setArea(data.area_m2.toString());
      if (data.bedrooms)      setBedrooms(data.bedrooms.toString());
      if (data.bathrooms)     setBathrooms(data.bathrooms.toString());
      if (data.parking)       setParking(data.parking.toString());
      if (data.address)       setAddress(data.address);
      if (data.images)        setImages(data.images);
      if (data.amenities?.length) setAmenitiesText(data.amenities.join(", "));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer");
    } finally {
      setScraping(false);
    }
  }

  function handleAddressSelect(s: AutocompleteSuggestion) {
    setAddress(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    setError(null);
    const urls: string[] = [];
    for (const file of files.slice(0, 20 - images.length)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "listings");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) urls.push(data.url);
    }
    setImages(prev => [...prev, ...urls]);
    setUploadingImages(false);
    e.target.value = "";
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: amenitiesText
            ? `${description}\n\nCaracterísticas: ${amenitiesText}`.trim()
            : description,
          price:        price     ? parseFloat(price)    : null,
          currency,
          property_type: propertyType,
          area_m2:      area      ? parseFloat(area)     : null,
          bedrooms:     bedrooms  ? parseInt(bedrooms)   : null,
          bathrooms:    bathrooms ? parseInt(bathrooms)  : null,
          status:       listingStatus,
          address:      address || null,
          lat:          coords?.lat ?? null,
          lng:          coords?.lng ?? null,
          images:       images.length > 0 ? images : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      
      window.location.href = "/dashboard/propiedades";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Import Section */}
      <div className="bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-6">
        {/* Tab switcher */}
        <div className="flex gap-1 mb-5 bg-[#EAE7DC] rounded-sm p-1 w-fit">
          {(["url", "pdf"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setImportTab(tab)}
              className="px-4 py-1.5 rounded-sm text-xs font-medium transition-all"
              style={importTab === tab
                ? { background: "#fff", color: "#262626", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#6B7565" }}
            >
              {tab === "url" ? "🔗 Importar URL" : "📄 Subir PDF"}
            </button>
          ))}
        </div>

        {importTab === "url" ? (
          <>
            <p className="text-sm text-[#6B7565] mb-4">
              Pega el link de cualquier propiedad pública y los datos se completarán automáticamente.
            </p>
            <div className="flex gap-3 mb-3">
              <input
                type="url"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="https://c21.com.bo/v/resultados/... o cualquier URL"
                className="flex-1 border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11]"
              />
              <Button onClick={handleScrape} loading={scraping} disabled={!scrapeUrl.trim() || !scrapeAttested} variant="secondary">
                {scraping ? "Extrayendo..." : "Extraer datos"}
              </Button>
            </div>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scrapeAttested}
                onChange={(e) => setScrapeAttested(e.target.checked)}
                className="mt-0.5 accent-[#FF7F11]"
              />
              <span className="text-xs text-[#6B7565]">
                Confirmo que esta publicación es de acceso público y tengo derecho a importar su información. No extraeré contenido con derechos de autor sin autorización.
              </span>
            </label>
          </>
        ) : (
          <>
            <p className="text-sm text-[#6B7565] mb-4">
              Sube el PDF de la propiedad y extraeremos automáticamente precio, área, habitaciones y descripción.
            </p>
            <label className={`cursor-pointer flex items-center justify-center gap-3 border-2 border-dashed border-[#D8D3C8] rounded-sm p-6 text-sm text-[#6B7565] transition-colors hover:border-[#FF7F11] hover:bg-[#FFF8F2] ${pdfParsing ? "opacity-60 pointer-events-none" : ""}`}>
              {pdfParsing ? (
                <><div className="w-5 h-5 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" /> Procesando PDF...</>
              ) : (
                <><span className="text-2xl">📄</span> Haz clic para seleccionar el PDF de la propiedad</>
              )}
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={pdfParsing} />
            </label>
            <p className="text-xs text-[#ACBFA4] mt-2">Máximo 5 MB. Funciona con PDFs de texto; los PDFs escaneados (solo imágenes) no extraen datos.</p>
          </>
        )}
      </div>

      {/* Form */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6">
        <h2
          className="text-[#262626] mb-5"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}
        >
          Datos de la Propiedad
        </h2>

        <div className="flex flex-col gap-5">
          <Input
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Casa de Lujo en Equipetrol"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="label-caps text-[#6B7565]">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe la propiedad..."
              className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 resize-none"
            />
          </div>

          {/* Address with autocomplete */}
          <AddressAutocomplete
            label="Dirección"
            value={address}
            onChange={setAddress}
            onSelect={handleAddressSelect}
            placeholder="Av. San Martín 456, Equipetrol, Santa Cruz"
            hint="Empieza a escribir — sugerencias vía OpenStreetMap"
          />

          {/* Map preview */}
          {coords && (
            <div className="mt-2">
              <p className="label-caps text-[#6B7565] mb-2">Ubicación en mapa</p>
              <MiniMap lat={coords.lat} lng={coords.lng} label={address} />
            </div>
          )}

          {/* Images — upload manually or imported from scraper */}
          <div className="flex flex-col gap-2">
            <label className="label-caps text-[#6B7565]">Imágenes de la propiedad</label>
            <label className={`cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-[#D8D3C8] rounded-sm p-4 text-sm text-[#6B7565] transition-colors hover:border-[#FF7F11] hover:bg-[#FFF8F2] ${uploadingImages || images.length >= 20 ? "opacity-60 pointer-events-none" : ""}`}>
              {uploadingImages ? (
                <><div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" /> Subiendo...</>
              ) : (
                <><span className="text-lg">🖼️</span> Subir imágenes {images.length > 0 ? `(${images.length}/20)` : ""}</>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImages || images.length >= 20} />
            </label>
            {images.length > 0 && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                      <div className="w-20 h-20 rounded-sm overflow-hidden border border-[#EAE7DC]">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#262626] text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer hover:bg-red-600"
                        aria-label="Eliminar imagen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#ACBFA4]">Pasa el cursor sobre una imagen y haz clic en ✕ para eliminarla</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">Tipo</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
              >
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="terreno">Terreno</option>
                <option value="oficina">Oficina</option>
                <option value="local_comercial">Local Comercial</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">Estado</label>
              <select
                value={listingStatus}
                onChange={(e) => setListingStatus(e.target.value)}
                className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
              >
                <option value="borrador">Borrador</option>
                <option value="activo">Publicar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150000"
            />
            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="BOB">BOB (Bs.)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Input label="Área m²"     type="number" value={area}      onChange={(e) => setArea(e.target.value)}      placeholder="150" />
            <Input label="Hab."        type="number" value={bedrooms}   onChange={(e) => setBedrooms(e.target.value)}   placeholder="3" />
            <Input label="Baños"       type="number" value={bathrooms}  onChange={(e) => setBathrooms(e.target.value)}  placeholder="2" />
            <Input label="Parking"     type="number" value={parking}    onChange={(e) => setParking(e.target.value)}    placeholder="1" />
          </div>

          {amenitiesText && (
            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">Características detectadas</label>
              <div className="flex flex-wrap gap-1.5">
                {amenitiesText.split(",").map(a => a.trim()).filter(Boolean).map(a => (
                  <span key={a} className="px-2.5 py-1 bg-[#F7F5EE] border border-[#EAE7DC] text-xs text-[#6B7565] rounded-sm">{a}</span>
                ))}
              </div>
              <p className="text-xs text-[#ACBFA4]">Extraídas automáticamente — se guardarán en la descripción.</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!title.trim()}
            size="lg"
            className="flex-1"
          >
            {listingStatus === "activo" ? "Publicar Propiedad" : "Guardar Borrador"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => { window.location.href = "/dashboard/propiedades"; }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
