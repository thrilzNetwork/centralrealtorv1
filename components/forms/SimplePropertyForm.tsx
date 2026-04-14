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
  const [listingStatus, setListingStatus] = useState("borrador");
  const [images, setImages] = useState<string[]>([]);
  
  // Coords from address autocomplete
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.price) setPrice(data.price.toString());
      if (data.currency) setCurrency(data.currency);
      if (data.property_type) setPropertyType(data.property_type as PropertyType);
      if (data.area_m2) setArea(data.area_m2.toString());
      if (data.bedrooms) setBedrooms(data.bedrooms.toString());
      if (data.bathrooms) setBathrooms(data.bathrooms.toString());
      if (data.address) setAddress(data.address);
      if (data.images) setImages(data.images);
      
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
          description,
          price: price ? parseFloat(price) : null,
          currency,
          property_type: propertyType,
          area_m2: area ? parseFloat(area) : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          status: listingStatus,
          address: address || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          images: images.length > 0 ? images : null,
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
      {/* URL Scraper Section */}
      <div className="bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#FF7F11] text-lg">🔗</span>
          <h2 className="text-[#262626] font-medium">Importar desde Century 21</h2>
        </div>
        <p className="text-sm text-[#6B7565] mb-4">
          Pega el link de una propiedad de Century 21 Bolivia y completa los datos automáticamente.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://c21.com.bo/v/resultados/..."
            className="flex-1 border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11]"
          />
          <Button
            onClick={handleScrape}
            loading={scraping}
            disabled={!scrapeUrl.trim()}
            variant="secondary"
          >
            {scraping ? "Extrayendo..." : "Extraer datos"}
          </Button>
        </div>
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

          {/* Image preview if scraped */}
          {images.length > 0 && (
            <div className="mt-2">
              <p className="label-caps text-[#6B7565] mb-2">Imágenes importadas ({images.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.slice(0, 5).map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-sm overflow-hidden flex-shrink-0 border border-[#EAE7DC]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-3 gap-3">
            <Input label="Área m²" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="150" />
            <Input label="Hab." type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="3" />
            <Input label="Baños" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="2" />
          </div>
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
