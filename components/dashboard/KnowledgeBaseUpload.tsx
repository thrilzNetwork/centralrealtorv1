"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface KBDocument {
  name: string;
  content_chunks: string[];
  created_at: string;
}

export function KnowledgeBaseUpload({
  initialDocs,
}: {
  initialDocs?: KBDocument[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<KBDocument[]>(initialDocs ?? []);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/kb/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el archivo");
      // Refresh: optimistically add the new doc
      setDocs((prev) => [
        ...prev,
        { name: file.name, content_chunks: [], created_at: new Date().toISOString() },
      ]);
      setFile(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(name: string) {
    setDeleting(name);
    try {
      const res = await fetch("/api/kb/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setDocs((prev) => prev.filter((d) => d.name !== name));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-8 p-6 bg-white border border-[#EAE7DC] rounded-sm flex flex-col gap-4">
      <div>
        <span className="label-caps text-[#6B7565]">IA del Chatbot</span>
        <h3 className="text-[#262626] mt-1 font-serif text-lg">Base de Conocimiento</h3>
        <p className="text-sm text-[#6B7565] mt-1">
          Sube PDFs o documentos de texto — precios, políticas, preguntas frecuentes. El chatbot usará este contenido para responder a los visitantes.
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
          {uploading ? "Procesando..." : "Subir documento"}
        </Button>
      </div>

      {docs.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs font-medium text-[#6B7565] uppercase tracking-widest">
            Documentos ({docs.length})
          </p>
          {docs.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-[#6B7565] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-[#262626] truncate">{doc.name}</span>
                {doc.content_chunks.length > 0 && (
                  <span className="text-xs text-[#6B7565] flex-shrink-0">
                    {doc.content_chunks.length} fragmentos
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(doc.name)}
                disabled={deleting === doc.name}
                className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
              >
                {deleting === doc.name ? "..." : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && (
        <p className="text-xs text-[#6B7565] italic">
          Ningún documento añadido aún. El chatbot responderá solo con la información de tus propiedades.
        </p>
      )}
    </div>
  );
}
