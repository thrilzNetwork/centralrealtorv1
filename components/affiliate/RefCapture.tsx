"use client";

import { useEffect } from "react";

// Tiny client-only script: if the URL carries ?ref=CODE, stash it in
// localStorage for 30 days so signup can attribute the new user.
export function RefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (!ref) return;
      const clean = ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
      if (!clean) return;
      const payload = { code: clean, ts: Date.now() };
      localStorage.setItem("central_ref_code", JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, []);

  return null;
}

const COOKIE_DAYS = 30;

export function readStoredRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("central_ref_code");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code: string; ts: number };
    const ageMs = Date.now() - parsed.ts;
    if (ageMs > COOKIE_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("central_ref_code");
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function clearStoredRefCode() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem("central_ref_code"); } catch {}
}
