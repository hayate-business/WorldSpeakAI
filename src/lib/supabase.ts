import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with AsyncStorage for auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for our database
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          primary_language_code: string | null;
          learning_language_code: string | null;
          current_plan: string;
          monthly_seconds_used: number;
          usage_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          primary_language_code?: string | null;
          learning_language_code?: string | null;
          current_plan?: string;
          monthly_seconds_used?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          primary_language_code?: string | null;
          learning_language_code?: string | null;
          current_plan?: string;
          monthly_seconds_used?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      languages: {
        Row: {
          id: number;
          code: string;
          name: string;
          native_name: string;
          is_primary_language: boolean;
          is_learning_language: boolean;
          flag_emoji: string | null;
          sort_order: number | null;
          created_at: string;
        };
      };
      translations: {
        Row: {
          id: number;
          key: string;
          language_code: string;
          value: string;
          category: string | null;
          screen: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      plan_limits: {
        Row: {
          id: number;
          plan_type: string;
          monthly_seconds_limit: number;
          daily_message_limit: number | null;
          features: any;
          price_monthly: number | null;
          is_active: boolean;
          created_at: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          conversation_type: string | null;
          is_archived: boolean;
          message_count: number;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          conversation_type?: string | null;
          is_archived?: boolean;
          message_count?: number;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          tokens_used: number | null;
          model_used: string | null;
          response_time_ms: number | null;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          tokens_used?: number | null;
          model_used?: string | null;
          response_time_ms?: number | null;
          is_favorite?: boolean;
          created_at?: string;
        };
      };
      conversation_sessions: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          start_time: string | null;
          end_time: string | null;
          duration_seconds: number | null;
          session_type: string | null;
          created_at: string;
        };
      };
      feedbacks: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          feedback_type: string;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          feedback_type: string;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payment_history: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          amount: number;
          currency: string;
          status: string;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
      };
      app_settings: {
        Row: {
          id: number;
          key: string;
          value: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      check_monthly_usage_limit: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      update_usage_time: {
        Args: { p_user_id: string; p_duration_seconds: number };
        Returns: void;
      };
      get_remaining_seconds: {
        Args: { p_user_id: string };
        Returns: number;
      };
      check_daily_message_limit: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      start_conversation_session: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: string;
      };
      end_conversation_session: {
        Args: { p_session_id: string };
        Returns: number;
      };
      get_translations: {
        Args: { p_language_code: string };
        Returns: Array<{
          key: string;
          value: string;
          category: string;
          screen: string;
        }>;
      };
      get_user_statistics: {
        Args: { p_user_id: string };
        Returns: {
          total_conversations: number;
          total_messages: number;
          total_seconds_used: number;
          current_month_seconds: number;
          remaining_seconds: number;
          current_plan: string;
          favorite_messages_count: number;
        };
      };
    };
  };
};

// Helper to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'An error occurred',
    details: error,
  };
};