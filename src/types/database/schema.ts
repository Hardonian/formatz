/**
 * Database Schema Types
 *
 * Generated types matching the Supabase database schema.
 * These types ensure type safety across the application.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          plan_type: 'free' | 'pro' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          plan_type?: 'free' | 'pro' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          plan_type?: 'free' | 'pro' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversion_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          source_format: ConversionFormat;
          target_format: ConversionFormat;
          configuration: Json;
          is_public: boolean;
          is_favorite: boolean;
          usage_count: number;
          avg_rating: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          source_format: ConversionFormat;
          target_format: ConversionFormat;
          configuration: Json;
          is_public?: boolean;
          is_favorite?: boolean;
          usage_count?: number;
          avg_rating?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          source_format?: ConversionFormat;
          target_format?: ConversionFormat;
          configuration?: Json;
          is_public?: boolean;
          is_favorite?: boolean;
          usage_count?: number;
          avg_rating?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversion_history: {
        Row: {
          id: string;
          user_id: string | null;
          template_id: string | null;
          source_format: string;
          target_format: string;
          input_size_bytes: number;
          output_size_bytes: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          processing_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          template_id?: string | null;
          source_format: string;
          target_format: string;
          input_size_bytes?: number;
          output_size_bytes?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          processing_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          template_id?: string | null;
          source_format?: string;
          target_format?: string;
          input_size_bytes?: number;
          output_size_bytes?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          processing_time_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      template_ratings: {
        Row: {
          id: string;
          template_id: string;
          user_id: string;
          rating: number;
          review: string | null;
          is_helpful: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          user_id: string;
          rating: number;
          review?: string | null;
          is_helpful?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          user_id?: string;
          rating?: number;
          review?: string | null;
          is_helpful?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'light' | 'dark' | 'auto';
          default_source_format: string;
          default_target_format: string;
          auto_save_history: boolean;
          max_file_size_mb: number;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: 'light' | 'dark' | 'auto';
          default_source_format?: string;
          default_target_format?: string;
          auto_save_history?: boolean;
          max_file_size_mb?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: 'light' | 'dark' | 'auto';
          default_source_format?: string;
          default_target_format?: string;
          auto_save_history?: boolean;
          max_file_size_mb?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_stats: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      get_user_dashboard: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      search_templates: {
        Args: {
          query_text: string;
          source_format_filter?: string;
          target_format_filter?: string;
          min_rating?: number;
          result_limit?: number;
        };
        Returns: Array<{
          id: string;
          name: string;
          description: string;
          source_format: string;
          target_format: string;
          avg_rating: number;
          rating_count: number;
          usage_count: number;
          owner_username: string;
          relevance: number;
        }>;
      };
      create_user_api_key: {
        Args: {
          user_uuid: string;
          key_name: string;
          expires_in_days?: number;
        };
        Returns: Json;
      };
      duplicate_template: {
        Args: {
          template_uuid: string;
          new_owner_uuid: string;
          new_name?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type ConversionFormat =
  | 'json'
  | 'xml'
  | 'csv'
  | 'yaml'
  | 'toml'
  | 'txt'
  | 'html'
  | 'markdown';

export type PlanType = 'free' | 'pro' | 'enterprise';
export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ThemeType = 'light' | 'dark' | 'auto';
