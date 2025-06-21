import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanLimit {
  id: number;
  plan_type: string;
  monthly_seconds_limit: number;
  daily_message_limit: number | null;
  features: {
    voice_conversation?: boolean;
    text_chat?: boolean;
    basic_scenarios?: boolean;
    all_scenarios?: boolean;
    priority_support?: boolean;
    custom_scenarios?: boolean;
    analytics?: boolean;
  };
  price_monthly: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

class SubscriptionService {
  // Get user's current subscription
  async getCurrentSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get all available plans
  async getAvailablePlans() {
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

  // Get plan details
  async getPlanDetails(planType: string) {
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

  // Get payment history
  async getPaymentHistory(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Create subscription (would be called after Stripe payment)
  async createSubscription(subscription: {
    user_id: string;
    plan_type: string;
    stripe_subscription_id: string;
    current_period_start: string;
    current_period_end: string;
  }) {
    try {
      // First, cancel any existing subscriptions
      await this.cancelExistingSubscriptions(subscription.user_id);

      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscription,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile with new plan
      await supabase
        .from('user_profiles')
        .update({ current_plan: subscription.plan_type })
        .eq('user_id', subscription.user_id);

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    try {
      const updates = cancelAtPeriodEnd
        ? { cancel_at_period_end: true }
        : { status: 'canceled' as const };

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      // If immediate cancellation, update user profile
      if (!cancelAtPeriodEnd && data) {
        await supabase
          .from('user_profiles')
          .update({ current_plan: 'free' })
          .eq('user_id', data.user_id);
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Cancel all existing subscriptions for a user
  private async cancelExistingSubscriptions(userId: string) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling existing subscriptions:', error);
    }
  }

  // Record payment
  async recordPayment(payment: {
    user_id: string;
    subscription_id?: string;
    amount: number;
    currency?: string;
    stripe_payment_intent_id?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .insert({
          ...payment,
          currency: payment.currency || 'jpy',
          status: 'succeeded',
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Check if user has active premium subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const { data } = await this.getCurrentSubscription(userId);
    return !!data && data.status === 'active' && data.plan_type !== 'free';
  }

  // Format plan features for display
  formatPlanFeatures(features: PlanLimit['features']): string[] {
    const featureList: string[] = [];

    if (features.voice_conversation) featureList.push('音声会話');
    if (features.text_chat) featureList.push('テキストチャット');
    if (features.basic_scenarios) featureList.push('基本シナリオ');
    if (features.all_scenarios) featureList.push('全シナリオ');
    if (features.priority_support) featureList.push('優先サポート');
    if (features.custom_scenarios) featureList.push('カスタムシナリオ');
    if (features.analytics) featureList.push('分析機能');

    return featureList;
  }

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  }

  // Calculate days remaining in subscription
  calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

export const subscriptionService = new SubscriptionService();