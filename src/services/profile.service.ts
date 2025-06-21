import { supabase } from '@/lib/supabase';

export interface UserStatistics {
  total_conversations: number;
  total_messages: number;
  total_seconds_used: number;
  current_month_seconds: number;
  remaining_seconds: number;
  current_plan: string;
  favorite_messages_count: number;
}

class ProfileService {
  // Get all available languages
  async getLanguages() {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get languages for primary selection
  async getPrimaryLanguages() {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_primary_language', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get languages for learning selection
  async getLearningLanguages() {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_learning_language', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: {
    display_name?: string;
    primary_language_code?: string;
    learning_language_code?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get user statistics
  async getUserStatistics(userId: string): Promise<{ data: UserStatistics | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_statistics', { p_user_id: userId });

      if (error) throw error;

      // The RPC returns an array, so we need to get the first item
      const statistics = Array.isArray(data) && data.length > 0 ? data[0] : data;

      return { data: statistics as UserStatistics, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get remaining seconds for the user
  async getRemainingSeconds(userId: string): Promise<{ data: number | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('get_remaining_seconds', { p_user_id: userId });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Check if user has exceeded monthly limit
  async checkMonthlyLimit(userId: string): Promise<{ data: boolean | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('check_monthly_usage_limit', { p_user_id: userId });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get plan limits
  async getPlanLimits() {
    try {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('is_active', true)
        .order('monthly_seconds_limit', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get current plan details
  async getCurrentPlanDetails(planType: string) {
    try {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_type', planType)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Format seconds to minutes and seconds
  formatSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }

  // Format seconds to hours and minutes
  formatSecondsToHoursMinutes(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  }
}

export const profileService = new ProfileService();