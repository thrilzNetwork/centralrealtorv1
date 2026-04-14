"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/geo/AddressAutocomplete";
import { MiniMap } from "@/components/geo/MiniMap";
import type { AutocompleteSuggestion } from "@/lib/geo/client";

type PropertyType =
  | "casa"
  | "departamento"
  | "terreno"
  | "oficina"
  | "local_comercial"
  | "otro";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  status: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  department: string | null;
  lat: number | null;
  lng: number | null;
  price: number | null;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  images: string[];
  ai_generated: boolean;
}

// ─── Image Manager ────────────────────────────────────────────
function ListingImageManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "listings");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Error al subir imagen");
        break;
      }
      if (data.url) onChange([...images, data.url]);
    }

    setUploading(false);
    e.target.value = "";
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...images];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  }

  function moveDown(idx: number) {
    if (idx === images.length - 1) return;
    const arr = [...images];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length === 0 ? (
        /* Empty state */
        <label className="cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#D8D3C8] rounded-sm py-10 hover:bg-[#F7F5EE] transition-colors">
          <svg className="w-10 h-10 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-[#262626]">Agregar fotos</p>
            <p className="text-xs text-[#ACBFA4] mt-0.5">PNG, JPG, WEBP · máx. 10 MB cada una</p>
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      ) : (
        <>
          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={url + i} className="relative rounded-sm overflow-hidden border border-[#EAE7DC] group"
                style={{ aspectRatio: "16/9" }}>
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />

                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => moveUp(i)}
                    className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white text-xs rounded transition-colors flex items-center justify-center"
                    title="Mover arriba">↑</button>
                  <button type="button" onClick={() => moveDown(i)}
                    className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white text-xs rounded transition-colors flex items-center justify-center"
                    title="Mover abajo">↓</button>
                  <button type="button" onClick={() => remove(i)}
                    className="w-7 h-7 bg-red-500/80 hover:bg-red-600 text-white text-xs rounded transition-colors flex items-center justify-center"
                    title="Eliminar">✕</button>
                </div>

                {/* Badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: i === 0 ? "#FF7F11" : "rgba(0,0,0,0.55)" }}>
                    {i === 0 ? "Portada" : i + 1}
                  </span>
                </div>
              </div>
            ))}

            {/* Add more tile */}
            <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#D8D3C8] rounded-sm hover:bg-[#F7F5EE] transition-colors"
              style={{ aspectRatio: "16/9" }}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-2xl leading-none text-[#ACBFA4]">+</span>
                  <span className="text-[11px] text-[#ACBFA4]">Agregar</span>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          <p className="text-xs text-[#ACBFA4]">
            {images.length} foto{images.length !== 1 ? "s" : ""} · La primera es la portada · Pasa el cursor para reordenar
          </p>
        </>
      )}

      {uploading && images.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-[#6B7565]">
          <div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
          Subiendo…
        </div>
      )}
      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────
export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();

  const [title, setTitle]           = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(
    (listing.property_type as PropertyType) ?? "casa"
  );
  const [status, setStatus]         = useState(listing.status);
  const [address, setAddress]       = useState(listing.address ?? "");
  const [lat, setLat]               = useState<number | null>(listing.lat);
  const [lng, setLng]               = useState<number | null>(listing.lng);
  const [neighborhood, setNeighborhood] = useState(listing.neighborhood ?? "");
  const [city, setCity]             = useState(listing.city ?? "");
  const [department, setDepartment] = useState(listing.department ?? "");
  const [price, setPrice]           = useState(listing.price?.toString() ?? "");
  const [currency, setCurrency]     = useState(listing.currency ?? "USD");
  const [area, setArea]             = useState(listing.area_m2?.toString() ?? "");
  const [bedrooms, setBedrooms]     = useState(listing.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms]   = useState(listing.bathrooms?.toString() ?? "");
  const [parking, setParking]       = useState(listing.parking?.toString() ?? "");
  const [images, setImages]         = useState<string[]>(listing.images ?? []);

  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  function handleAddressSelect(s: AutocompleteSuggestion) {
    setLat(s.lat);
    setLng(s.lng);
    if (s.neighborhood) setNeighborhood(s.neighborhood);
    if (s.city)         setCity(s.city);
    if (s.department)   setDepartment(s.department);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: listing.id,
        title,
        description:  description || null,
        property_type: propertyType,
        status,
        address:      address      || null,
        neighborhood: neighborhood || null,
        city:         city         || null,
        department:   department   || null,
        lat,
        lng,
        price:     price     ? parseFloat(price)     : null,
        currency,
        area_m2:   area      ? parseFloat(area)      : null,
        bedrooms:  bedrooms  ? parseInt(bedrooms)    : null,
        bathrooms: bathrooms ? parseInt(bathrooms)   : null,
        parking:   parking   ? parseInt(parking)     : null,
        images,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/listings?id=${listing.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/propiedades");
    } else {
      setError("No se pudo eliminar la propiedad.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">

      {/* ── General info ─────────────────────────────────── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-5">
        <h2 className="text-[#262626]"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}>
          Información General
        </h2>

        <Input label="Título" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Casa de Lujo en Equipetrol" required />

        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
            placeholder="Descripción de la propiedad..."
            className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-caps text-[#6B7565]">Tipo</label>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)}
              className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer">
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
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer">
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="vendido">Vendido</option>
              <option value="alquilado">Alquilado</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Precio" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="150000" />
          <div className="flex flex-col gap-1.5">
            <label className="label-caps text-[#6B7565]">Moneda</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer">
              <option value="USD">USD ($)</option>
              <option value="BOB">BOB (Bs.)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Input label="Área (m²)"     type="number" value={area}      onChange={e => setArea(e.target.value)}      placeholder="150" />
          <Input label="Habitaciones"  type="number" value={bedrooms}  onChange={e => setBedrooms(e.target.value)}  placeholder="3" />
          <Input label="Baños"         type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="2" />
          <Input label="Parking"       type="number" value={parking}   onChange={e => setParking(e.target.value)}   placeholder="1" />
        </div>
      </div>

      {/* ── Location ─────────────────────────────────────── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-5">
        <h2 className="text-[#262626]"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}>
          Ubicación
        </h2>

        <AddressAutocomplete label="Dirección" value={address}
          onChange={v => { setAddress(v); setLat(null); setLng(null); }}
          onSelect={handleAddressSelect}
          placeholder="Av. San Martín 456, Equipetrol, Santa Cruz"
          hint="Busca para actualizar coordenadas" />

        {lat !== null && lng !== null && <MiniMap lat={lat} lng={lng} label={address} />}

        <div className="grid grid-cols-3 gap-4">
          <Input label="Barrio / Zona" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Equipetrol" />
          <Input label="Ciudad"        value={city}         onChange={e => setCity(e.target.value)}         placeholder="Santa Cruz" />
          <Input label="Departamento"  value={department}   onChange={e => setDepartment(e.target.value)}   placeholder="Santa Cruz" />
        </div>
      </div>

      {/* ── Photos ───────────────────────────────────────── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 flex flex-col gap-4">
        <div className="border-b border-[#EAE7DC] pb-3">
          <h2 className="text-[#262626]"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}>
            Fotos de la Propiedad
          </h2>
          <p className="text-xs text-[#ACBFA4] mt-0.5">
            Sube hasta 20 fotos · La primera imagen será la portada en el portal
          </p>
        </div>
        <ListingImageManager images={images} onChange={setImages} />
      </div>

      {/* ── Feedback ─────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-2 rounded-sm">
          ✓ Cambios guardados correctamente.
        </p>
      )}

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" loading={saving} disabled={!title} size="lg" className="flex-1">
          Guardar cambios
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.push("/dashboard/propiedades")}>
          Cancelar
        </Button>

        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="px-4 py-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors border border-transparent hover:border-red-100">
            Eliminar
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-sm px-3 py-2">
            <span className="text-xs text-red-700">¿Confirmar?</span>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-sm transition-colors">
              {deleting ? "..." : "Sí, eliminar"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}
              className="text-xs text-red-600 hover:underline">No</button>
          </div>
        )}
      </div>
    </form>
  );
}
