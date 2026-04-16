"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

type Message = { role: "user" | "model"; text: string };

interface TenantChatbotProps {
  slug: string;
  agentName: string;
  primaryColor?: string;
  logoUrl?: string | null;
}

export function TenantChatbot({ slug, agentName, primaryColor = "#FF7F11", logoUrl }: TenantChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: `¡Hola! Soy el asistente de ${agentName}. ¿En qué puedo ayudarte hoy? 🏠` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          message: text,
          // Send last 6 messages as context (excluding the initial greeting)
          history: next.slice(1, -1).slice(-6),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.reply ?? "Lo siento, ocurrió un error." }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", text: "Lo siento, no pude conectarme. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer"
        style={{ backgroundColor: primaryColor }}
        aria-label="Abrir chat"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : logoUrl ? (
          <img src={logoUrl} alt={agentName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-sm shadow-2xl overflow-hidden border border-[#EAE7DC] bg-white animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={agentName} className="w-full h-full object-cover" />
              ) : (
                <MessageCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-tight">{agentName}</p>
              <p className="text-white/70 text-xs">Asistente virtual · Responde en segundos</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-h-80 bg-[#F7F5EE]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-sm text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white"
                      : "bg-white text-[#262626] border border-[#EAE7DC]"
                  }`}
                  style={m.role === "user" ? { backgroundColor: primaryColor } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#EAE7DC] px-3 py-2 rounded-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6B7565]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#EAE7DC] bg-white flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 text-sm px-3 py-2 border border-[#D8D3C8] rounded-sm focus:outline-none focus:border-[#FF7F11] bg-[#F7F5EE]"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-sm flex items-center justify-center transition-opacity cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
              aria-label="Enviar"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
