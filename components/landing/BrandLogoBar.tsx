"use client";

export function BrandLogoBar() {
  return (
    <div className="border-y border-[#EAE7DC] bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="label-caps text-[#ACBFA4] tracking-widest text-[10px]">
            Confianza de los mejores agentes
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          <img
            src="/brandlogos.png"
            alt="Brand Logos"
            className="h-auto max-w-full object-contain"
            style={{ maxHeight: '60px' }}
          />
        </div>
      </div>
    </div>
  );
}
