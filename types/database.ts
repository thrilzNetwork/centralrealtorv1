export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ThemeType = "modern" | "luxury" | "classic" | "realtor-v1";
export type ListingStatus = "borrador" | "activo" | "vendido" | "alquilado" | "inactivo";
export type PropertyType = "casa" | "departamento" | "terreno" | "oficina" | "local_comercial" | "otro";
export type PlanType = "basico" | "profesional" | "broker";
export type LeadStatus = "nuevo" | "contactado" | "en_seguimiento" | "cerrado";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: PlanType;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string;
          trial_ends_at: string;
          max_agents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: PlanType;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string;
          max_agents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: PlanType;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string;
          max_agents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          whatsapp: string | null;
          slug: string;
          custom_domain: string | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          theme: ThemeType;
          bio: string | null;
          city: string;
          is_broker_admin: boolean;
          onboarding_completed: boolean;
          stripe_customer_id: string | null;
          hero_title: string | null;
          hero_headline: string | null;
          hero_subtitle: string | null;
          hero_images: string[] | null;
          broker_name: string | null;
          broker_logo_url: string | null;
          broker_agent_code: string | null;
          kb_documents: unknown[];
          brand_voice: string | null;
          chatbot_config: Record<string, unknown>;
          google_refresh_token: string | null;
          google_calendar_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          whatsapp?: string | null;
          slug: string;
          custom_domain?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          theme?: ThemeType;
          bio?: string | null;
          city?: string;
          is_broker_admin?: boolean;
          onboarding_completed?: boolean;
          stripe_customer_id?: string | null;
          hero_title?: string | null;
          hero_headline?: string | null;
          hero_subtitle?: string | null;
          hero_images?: string[] | null;
          broker_name?: string | null;
          broker_logo_url?: string | null;
          broker_agent_code?: string | null;
          kb_documents?: unknown[];
          brand_voice?: string | null;
          chatbot_config?: Record<string, unknown>;
          google_refresh_token?: string | null;
          google_calendar_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string | null;
          whatsapp?: string | null;
          slug?: string;
          custom_domain?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          theme?: ThemeType;
          bio?: string | null;
          city?: string;
          is_broker_admin?: boolean;
          onboarding_completed?: boolean;
          stripe_customer_id?: string | null;
          hero_title?: string | null;
          hero_headline?: string | null;
          hero_subtitle?: string | null;
          hero_images?: string[] | null;
          broker_name?: string | null;
          broker_logo_url?: string | null;
          broker_agent_code?: string | null;
          kb_documents?: unknown[];
          brand_voice?: string | null;
          chatbot_config?: Record<string, unknown>;
          google_refresh_token?: string | null;
          google_calendar_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          profile_id: string;
          organization_id: string | null;
          slug: string;
          title: string;
          description: string | null;
          ai_generated: boolean;
          property_type: PropertyType;
          status: ListingStatus;
          address: string | null;
          neighborhood: string | null;
          city: string | null;
          department: string | null;
          lat: number | null;
          lng: number | null;
          place_id: string | null;
          price: number | null;
          currency: string;
          area_m2: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          parking: number | null;
          floor: number | null;
          total_floors: number | null;
          images: string[];
          video_url: string | null;
          neighborhood_summary: string | null;
          ai_prompt_used: string | null;
          source_pdf_url: string | null;
          views: number;
          hearts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          organization_id?: string | null;
          slug: string;
          title: string;
          description?: string | null;
          ai_generated?: boolean;
          property_type?: PropertyType;
          status?: ListingStatus;
          address?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          department?: string | null;
          lat?: number | null;
          lng?: number | null;
          place_id?: string | null;
          price?: number | null;
          currency?: string;
          area_m2?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          total_floors?: number | null;
          images?: string[];
          video_url?: string | null;
          neighborhood_summary?: string | null;
          ai_prompt_used?: string | null;
          source_pdf_url?: string | null;
          views?: number;
          hearts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          organization_id?: string | null;
          slug?: string;
          title?: string;
          description?: string | null;
          ai_generated?: boolean;
          property_type?: PropertyType;
          status?: ListingStatus;
          address?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          department?: string | null;
          lat?: number | null;
          lng?: number | null;
          place_id?: string | null;
          price?: number | null;
          currency?: string;
          area_m2?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          total_floors?: number | null;
          images?: string[];
          video_url?: string | null;
          neighborhood_summary?: string | null;
          ai_prompt_used?: string | null;
          source_pdf_url?: string | null;
          views?: number;
          hearts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      members: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          auth_user_id: string | null;
          profile_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          auth_user_id?: string | null;
          profile_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          auth_user_id?: string | null;
          profile_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          listing_id: string;
          profile_id: string;
          member_id: string | null;
          visitor_email: string | null;
          visitor_name: string | null;
          visitor_phone: string | null;
          status: LeadStatus;
          notes: string | null;
          notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          profile_id: string;
          member_id?: string | null;
          visitor_email?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          profile_id?: string;
          member_id?: string | null;
          visitor_email?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          lead_id: string | null;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          lead_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          lead_id?: string | null;
          type?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      domain_mappings: {
        Row: {
          id: string;
          profile_id: string;
          domain: string;
          verified: boolean;
          vercel_domain_id: string | null;
          dns_instructions: Json | null;
          created_at: string;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          domain: string;
          verified?: boolean;
          vercel_domain_id?: string | null;
          dns_instructions?: Json | null;
          created_at?: string;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          domain?: string;
          verified?: boolean;
          vercel_domain_id?: string | null;
          dns_instructions?: Json | null;
          created_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_listing_views: {
        Args: { listing_slug: string };
        Returns: void;
      };
      increment_listing_hearts: {
        Args: { listing_id: string };
        Returns: void;
      };
    };
    Enums: {
      theme_type: ThemeType;
      listing_status: ListingStatus;
      property_type: PropertyType;
      plan_type: PlanType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
