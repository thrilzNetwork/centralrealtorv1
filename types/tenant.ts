import type { Database, ThemeType } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export interface TenantProfile {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  theme: ThemeType;
  bio: string | null;
  city: string;
  // Site customizer
  hero_title: string | null;
  hero_headline: string | null;
  hero_subtitle: string | null;
  hero_images: string[] | null;
  broker_name: string | null;
  broker_logo_url: string | null;
  broker_agent_code: string | null;
}

export interface TenantContext {
  profile: TenantProfile;
  slug: string;
}
