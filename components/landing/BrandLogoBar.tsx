"use client";

const BRANDS = [
  { name: "Century 21",      domain: "century21.com" },
  { name: "RE/MAX",          domain: "remax.com" },
  { name: "Coldwell Banker", domain: "coldwellbanker.com" },
  { name: "Keller Williams", domain: "kw.com" },
  { name: "ERA",             domain: "era.com" },
];

export function BrandLogoBar() {
  return (
    <div className="border-y border-[#EAE7DC] bg-white py-5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-10">
        {BRANDS.map((b) => (
          <BrandLogo key={b.name} name={b.name} domain={b.domain} />
        ))}
        <span className="label-caps opacity-50 text-[#6B7565]">Independientes</span>
      </div>
    </div>
  );
}

function BrandLogo({ name, domain }: { name: string; domain: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      title={name}
      style={{ height: 28, maxWidth: 100, objectFit: "contain", filter: "grayscale(1)", opacity: 0.45 }}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        el.style.display = "none";
        const span = document.createElement("span");
        span.textContent = name;
        span.className = "label-caps opacity-50 text-[#6B7565]";
        el.parentNode?.insertBefore(span, el);
      }}
    />
  );
}
