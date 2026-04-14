import { SimplePropertyForm } from "@/components/forms/SimplePropertyForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva Propiedad — Dashboard" };

export default function NuevaPage() {
  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <span className="accent-line" />
        <h1
          className="text-[#262626]"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Nueva Propiedad
        </h1>
        <p className="text-sm text-[#6B7565] mt-2">
          Ingresa los datos de la propiedad. La dirección se completará automáticamente al seleccionar una ubicación.
        </p>
      </div>
      <SimplePropertyForm />
    </div>
  );
}
