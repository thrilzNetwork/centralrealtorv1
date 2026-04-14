"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TenantProfile } from "@/types/tenant";

interface TenantContextValue {
  profile: TenantProfile;
  slug: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  profile,
  slug,
}: {
  children: ReactNode;
  profile: TenantProfile;
  slug: string;
}) {
  return (
    <TenantContext.Provider value={{ profile, slug }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
