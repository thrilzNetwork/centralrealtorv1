"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function BrandVoiceUpload({ initialVoice }: { initialVoice?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(initialVoice || "");

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/brand-voice", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error uploading file");
      setCurrentVoice(data.brand_voice);
      setFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-10 p-6 bg-white border border-[#EAE7DC] rounded-sm flex flex-col gap-4">
      <div>
        <span className="label-caps text-[#6B7565]">Voz de Marca</span>
        <h3 className="text-[#262626] mt-1 font-serif text-lg">Identidad AI</h3>
        <p className="text-sm text-[#6B7565] mt-1">
          Sube un PDF o texto con tu filosofía, valores y tono. Gemini extraerá tu "voz de marca" para generar posts automáticos.
        </p>
      </div>

      <div className="flex gap-3 items-end">
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-xs text-[#6B7565] file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-[#F7F5EE] file:text-[#262626] hover:file:bg-[#EAE7DC] transition-all cursor-pointer"
        />
        <Button onClick={handleUpload} disabled={!file || uploading} size="sm">
          {uploading ? "Analizando..." : "Extraer Voz"}
        </Button>
      </div>

      {currentVoice && (
        <div className="mt-4 p-4 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm">
          <p className="text-xs font-medium text-[#6B7565] mb-2 uppercase">Tu Voz de Marca Actual:</p>
          <p className="text-sm text-[#262626] leading-relaxed italic">"{currentVoice}"</p>
        </div>
      )}
    </div>
  );
}
