// Şemadan (migrations 0001 + 0002) elle üretilmiş Supabase tipleri.
// `supabase gen types typescript` çıktısının eşdeğeri; CHECK kolonları, okuma
// tarafında daraltma gerektirenler için union olarak modellenmiştir.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; locale: string | null; created_at: string };
        Insert: { id: string; email?: string | null; locale?: string | null; created_at?: string };
        Update: { id?: string; email?: string | null; locale?: string | null; created_at?: string };
        Relationships: [];
      };
      canonical_topics: {
        Row: {
          id: string;
          canonical_query: string;
          search_params: Json;
          check_state: string;
          last_checked_at: string | null;
          created_at: string;
          authority_domain: string | null;
          authority_resolved: boolean;
        };
        Insert: {
          canonical_query: string;
          id?: string;
          search_params?: Json;
          check_state?: string;
          last_checked_at?: string | null;
          created_at?: string;
        };
        Update: {
          canonical_query?: string;
          search_params?: Json;
          check_state?: string;
          authority_domain?: string | null;
          authority_resolved?: boolean;
          last_checked_at?: string | null;
        };
        Relationships: [];
      };
      watches: {
        Row: {
          id: string;
          user_id: string;
          raw_intent: string;
          canonical_topic_id: string;
          archetype: "shared" | "personal";
          frequency_minutes: number;
          status: "active" | "paused";
          created_at: string;
          source_pref: "auto" | "news" | "official" | "web";
          deep_scan: boolean;
          stop_after_hit: boolean;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          raw_intent: string;
          canonical_topic_id: string;
          archetype: "shared" | "personal";
          frequency_minutes: number;
          id?: string;
          status?: "active" | "paused";
          created_at?: string;
          source_pref?: "auto" | "news" | "official" | "web";
          deep_scan?: boolean;
          stop_after_hit?: boolean;
          completed_at?: string | null;
        };
        Update: {
          raw_intent?: string;
          archetype?: "shared" | "personal";
          frequency_minutes?: number;
          status?: "active" | "paused";
          source_pref?: "auto" | "news" | "official" | "web";
          deep_scan?: boolean;
          stop_after_hit?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      personal_criteria: {
        Row: {
          id: string;
          user_id: string;
          watch_id: string;
          criteria_data: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          watch_id: string;
          criteria_data: Json;
          id?: string;
          created_at?: string;
        };
        Update: { criteria_data?: Json };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          kind: "problem" | "live";
          status: "open" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          kind: "problem" | "live";
          id?: string;
          status?: "open" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: { status?: "open" | "closed"; updated_at?: string };
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender: "user" | "admin";
          body: string;
          created_at: string;
        };
        Insert: {
          ticket_id: string;
          sender: "user" | "admin";
          body: string;
          id?: string;
          created_at?: string;
        };
        Update: { body?: string };
        Relationships: [];
      };
      check_runs: {
        Row: {
          id: string;
          topic_id: string;
          ran_at: string;
          result_summary: string | null;
          reasoning: string | null;
          decision: boolean;
          confidence: number | null;
          search_query: string | null;
          search_hits: Json | null;
          tokens_used: number | null;
        };
        Insert: {
          topic_id: string;
          id?: string;
          ran_at?: string;
          result_summary?: string | null;
          reasoning?: string | null;
          decision?: boolean;
          confidence?: number | null;
          search_query?: string | null;
          search_hits?: Json | null;
          tokens_used?: number | null;
        };
        Update: {
          result_summary?: string | null;
          reasoning?: string | null;
          decision?: boolean;
          confidence?: number | null;
        };
        Relationships: [];
      };
      detection_events: {
        Row: {
          id: string;
          topic_id: string;
          check_run_id: string;
          description: string;
          detected_at: string;
          facts: Json | null;
        };
        Insert: {
          topic_id: string;
          check_run_id: string;
          description: string;
          id?: string;
          detected_at?: string;
          facts?: Json | null;
        };
        Update: { description?: string; facts?: Json | null };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          watch_id: string;
          channel: string;
          status: string;
          sent_at: string | null;
          read_at: string | null;
        };
        Insert: {
          event_id: string;
          user_id: string;
          watch_id: string;
          channel: string;
          id?: string;
          status?: string;
          sent_at?: string | null;
          read_at?: string | null;
        };
        Update: { status?: string; sent_at?: string | null; read_at?: string | null };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          limits: Json;
          payment_ref: string | null;
          updated_at: string;
          billing_interval: "month" | "year" | null;
          amount_cents: number | null;
          currency: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
        };
        Insert: {
          user_id: string;
          id?: string;
          plan?: string;
          status?: string;
          limits?: Json;
          payment_ref?: string | null;
          updated_at?: string;
          billing_interval?: "month" | "year" | null;
          amount_cents?: number | null;
          currency?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: {
          plan?: string;
          status?: string;
          limits?: Json;
          payment_ref?: string | null;
          updated_at?: string;
          billing_interval?: "month" | "year" | null;
          amount_cents?: number | null;
          currency?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          fcm_token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          fcm_token: string;
          id?: string;
          platform?: string;
          created_at?: string;
        };
        Update: { fcm_token?: string; platform?: string };
        Relationships: [];
      };
      user_channels: {
        Row: {
          user_id: string;
          telegram_chat_id: string | null;
          email: string | null;
          whatsapp_to: string | null;
          enabled: string[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          telegram_chat_id?: string | null;
          email?: string | null;
          whatsapp_to?: string | null;
          enabled?: string[];
          updated_at?: string;
        };
        Update: {
          telegram_chat_id?: string | null;
          email?: string | null;
          whatsapp_to?: string | null;
          enabled?: string[];
        };
        Relationships: [];
      };
      user_feedback: {
        Row: { id: string; user_id: string; event_id: string; verdict: string; created_at: string };
        Insert: {
          user_id: string;
          event_id: string;
          verdict: string;
          id?: string;
          created_at?: string;
        };
        Update: { verdict?: string };
        Relationships: [];
      };
      plan_prices: {
        Row: {
          id: string;
          plan: string;
          billing_interval: "month" | "year";
          amount_cents: number;
          currency: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          plan: string;
          billing_interval: "month" | "year";
          amount_cents: number;
          id?: string;
          currency?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          plan?: string;
          billing_interval?: "month" | "year";
          amount_cents?: number;
          currency?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };
      traffic_events: {
        Row: {
          id: number;
          day: string;
          source: "site" | "app";
          ref: string | null;
          utm: string | null;
          path: string | null;
          lang: string | null;
          platform: "web" | "android" | "ios" | null;
          created_at: string;
        };
        Insert: {
          day: string;
          source: "site" | "app";
          ref?: string | null;
          utm?: string | null;
          path?: string | null;
          lang?: string | null;
          platform?: "web" | "android" | "ios" | null;
          id?: number;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      topics_due_for_check: {
        Args: { p_now: string };
        Returns: { id: string; canonical_query: string; last_checked_at: string | null }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
