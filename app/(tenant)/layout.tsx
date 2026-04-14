import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveBySlug } from "@/lib/tenant/resolver";
import { TenantProvider } from "@/components/themes/TenantContext";
import type { ReactNode } from "react";

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");

  if (!tenantSlug) return notFound();

  const profile = await resolveBySlug(tenantSlug);
  if (!profile) return notFound();

  return (
    <TenantProvider profile={profile} slug={tenantSlug}>
      {/* Inject tenant CSS variables */}
      <style>{`
        :root {
          --tenant-primary: ${profile.primary_color};
          --tenant-secondary: ${profile.secondary_color};
        }
      `}</style>
      {children}
    </TenantProvider>
  );
}
