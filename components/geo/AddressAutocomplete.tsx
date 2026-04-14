"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AutocompleteSuggestion } from "@/lib/geo/client";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Av. San Martín 456, Equipetrol, Santa Cruz",
  label = "Dirección de la propiedad",
  hint,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Import client-side to avoid SSR
      const { autocomplete } = await import("@/lib/geo/client");
      const results = await autocomplete(query, 5);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pick(s: AutocompleteSuggestion) {
    onChange(s.label);
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="label-caps text-[#6B7565]">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {hint && (
        <p className="text-xs text-[#ACBFA4]">{hint}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D8D3C8] rounded-sm shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              onMouseDown={() => pick(s)}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#F7F5EE]"
              style={i === activeIdx ? { backgroundColor: "#FFF0E8" } : undefined}
            >
              <svg
                className="w-4 h-4 text-[#FF7F11] flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="min-w-0">
                <p className="text-sm text-[#262626] leading-snug truncate">{s.label}</p>
                {(s.city ?? s.department) && (
                  <p className="text-xs text-[#ACBFA4] mt-0.5">
                    {[s.city, s.department].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
