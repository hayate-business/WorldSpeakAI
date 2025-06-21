-- ==========================================
-- WorldSpeak AI - Direct Supabase Setup
-- Execute this script directly in Supabase SQL Editor
-- ==========================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables in correct order (respecting foreign key dependencies)

-- Languages table (no dependencies)
CREATE TABLE IF NOT EXISTS public.languages (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_primary_language BOOLEAN DEFAULT true,
  is_learning_language BOOLEAN DEFAULT true,
  flag_emoji TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan limits table (no dependencies)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id SERIAL PRIMARY KEY,
  plan_type TEXT UNIQUE NOT NULL,
  monthly_seconds_limit INTEGER NOT NULL,
  daily_message_limit INTEGER,
  features JSONB,
  price_monthly INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (depends on auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  primary_language_code TEXT REFERENCES public.languages(code),
  learning_language_code TEXT REFERENCES public.languages(code),
  current_plan TEXT DEFAULT 'free',
  monthly_seconds_used INTEGER DEFAULT 0,
  usage_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translations table (depends on languages)
CREATE TABLE IF NOT EXISTS public.translations (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  language_code TEXT REFERENCES public.languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  category TEXT,
  screen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language_code)
);

-- Conversations table (depends on auth.users)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  conversation_type TEXT,
  is_archived BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (depends on conversations and auth.users)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  response_time_ms INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation sessions table (depends on conversations and auth.users)
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  session_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (depends on auth.users)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table (depends on auth.users and subscriptions)
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'jpy',
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedbacks table (depends on messages and auth.users)
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App settings table (no dependencies)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. CREATE INDEXES
-- ==========================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON public.translations(key, language_code);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_start_time ON public.conversation_sessions(start_time);

-- ==========================================
-- 4. INSERT INITIAL DATA
-- ==========================================

-- Insert languages
INSERT INTO public.languages (code, name, native_name, flag_emoji, sort_order) VALUES
('ja', '日本語', '日本語', '🇯🇵', 1),
('en', 'English', 'English', '🇺🇸', 2),
('zh-CN', '中文（简体）', '中文（简体）', '🇨🇳', 3),
('ko', '한국어', '한국어', '🇰🇷', 4),
('es', 'Español', 'Español', '🇪🇸', 5),
('fr', 'Français', 'Français', '🇫🇷', 6),
('de', 'Deutsch', 'Deutsch', '🇩🇪', 7),
('it', 'Italiano', 'Italiano', '🇮🇹', 8),
('pt', 'Português', 'Português', '🇵🇹', 9),
('ru', 'Русский', 'Русский', '🇷🇺', 10),
('ar', 'العربية', 'العربية', '🇸🇦', 11),
('hi', 'हिन्दी', 'हिन्दी', '🇮🇳', 12)
ON CONFLICT (code) DO NOTHING;

-- Insert plan limits
INSERT INTO public.plan_limits (plan_type, monthly_seconds_limit, daily_message_limit, price_monthly, features) VALUES
('free', 300, 10, 0, '{"voice_conversation": true, "text_chat": true, "basic_scenarios": true}'),
('premium', 1800, 50, 980, '{"voice_conversation": true, "text_chat": true, "all_scenarios": true, "priority_support": true}'),
('pro', 7200, 200, 1980, '{"voice_conversation": true, "text_chat": true, "all_scenarios": true, "priority_support": true, "custom_scenarios": true, "analytics": true}')
ON CONFLICT (plan_type) DO NOTHING;

-- Insert basic translations
INSERT INTO public.translations (key, language_code, value, category, screen) VALUES
-- Settings screen
('settings.title', 'ja', '設定', 'ui', 'settings'),
('settings.title', 'en', 'Settings', 'ui', 'settings'),
('settings.primary_language', 'ja', '第一言語', 'ui', 'settings'),
('settings.primary_language', 'en', 'Primary Language', 'ui', 'settings'),
('settings.learning_language', 'ja', '学習言語', 'ui', 'settings'),
('settings.learning_language', 'en', 'Learning Language', 'ui', 'settings'),

-- Buttons
('button.send', 'ja', '送信', 'ui', 'chat'),
('button.send', 'en', 'Send', 'ui', 'chat'),
('button.start_conversation', 'ja', '会話開始', 'ui', 'home'),
('button.start_conversation', 'en', 'Start Conversation', 'ui', 'home'),
('button.end_conversation', 'ja', '会話終了', 'ui', 'chat'),
('button.end_conversation', 'en', 'End Conversation', 'ui', 'chat'),

-- App content
('app.subtitle', 'ja', 'AIと英会話の練習ができる', 'ui', 'home'),
('app.subtitle', 'en', 'Practice English conversation with AI', 'ui', 'home'),
('app.description', 'ja', '今までにないAI特化型英会話アプリ', 'ui', 'home'),
('app.description', 'en', 'Revolutionary AI-powered conversation app', 'ui', 'home'),

-- Error messages
('error.time_limit_exceeded', 'ja', '今月の会話時間を超過しました', 'error', 'global'),
('error.time_limit_exceeded', 'en', 'Monthly conversation time exceeded', 'error', 'global'),
('error.daily_limit_exceeded', 'ja', '本日の利用制限に達しました', 'error', 'global'),
('error.daily_limit_exceeded', 'en', 'Daily usage limit reached', 'error', 'global'),

-- Plan names
('plan.free', 'ja', '無料プラン', 'ui', 'subscription'),
('plan.free', 'en', 'Free Plan', 'ui', 'subscription'),
('plan.premium', 'ja', 'プレミアムプラン', 'ui', 'subscription'),
('plan.premium', 'en', 'Premium Plan', 'ui', 'subscription'),
('plan.pro', 'ja', 'プロプラン', 'ui', 'subscription'),
('plan.pro', 'en', 'Pro Plan', 'ui', 'subscription')
ON CONFLICT (key, language_code) DO NOTHING;

-- Insert app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'メンテナンスモードの有効/無効'),
('max_message_length', '2000', '1メッセージの最大文字数'),
('free_tier_reset_day', '1', '無料プランのリセット日（毎月）'),
('voice_enabled', 'true', '音声会話機能の有効/無効')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 5. CREATE FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_translations_updated_at ON public.translations;
CREATE TRIGGER update_translations_updated_at 
    BEFORE UPDATE ON public.translations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has exceeded monthly limit
CREATE OR REPLACE FUNCTION public.check_monthly_usage_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_plan TEXT;
    v_monthly_limit INTEGER;
    v_seconds_used INTEGER;
    v_reset_date DATE;
BEGIN
    -- Get user's current plan and usage
    SELECT 
        up.current_plan,
        up.monthly_seconds_used,
        up.usage_reset_date
    INTO 
        v_current_plan,
        v_seconds_used,
        v_reset_date
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;

    -- Check if usage needs to be reset (new month)
    IF v_reset_date < date_trunc('month', CURRENT_DATE) THEN
        UPDATE public.user_profiles
        SET monthly_seconds_used = 0,
            usage_reset_date = date_trunc('month', CURRENT_DATE)
        WHERE user_id = p_user_id;
        v_seconds_used := 0;
    END IF;

    -- Get plan limit
    SELECT monthly_seconds_limit
    INTO v_monthly_limit
    FROM public.plan_limits
    WHERE plan_type = v_current_plan;

    -- Return true if within limit, false if exceeded
    RETURN v_seconds_used < v_monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage after conversation
CREATE OR REPLACE FUNCTION public.update_usage_time(
    p_user_id UUID,
    p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles
    SET monthly_seconds_used = monthly_seconds_used + p_duration_seconds,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining time for user
CREATE OR REPLACE FUNCTION public.get_remaining_seconds(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_current_plan TEXT;
    v_monthly_limit INTEGER;
    v_seconds_used INTEGER;
BEGIN
    -- Get user's current plan and usage
    SELECT 
        up.current_plan,
        up.monthly_seconds_used
    INTO 
        v_current_plan,
        v_seconds_used
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;

    -- Get plan limit
    SELECT monthly_seconds_limit
    INTO v_monthly_limit
    FROM public.plan_limits
    WHERE plan_type = v_current_plan;

    -- Return remaining seconds
    RETURN GREATEST(0, v_monthly_limit - v_seconds_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check daily message limit
CREATE OR REPLACE FUNCTION public.check_daily_message_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_plan TEXT;
    v_daily_limit INTEGER;
    v_today_count INTEGER;
BEGIN
    -- Get user's current plan
    SELECT current_plan
    INTO v_current_plan
    FROM public.user_profiles
    WHERE user_id = p_user_id;

    -- Get daily limit for the plan
    SELECT daily_message_limit
    INTO v_daily_limit
    FROM public.plan_limits
    WHERE plan_type = v_current_plan;

    -- If no daily limit, return true
    IF v_daily_limit IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Count today's messages
    SELECT COUNT(*)
    INTO v_today_count
    FROM public.messages
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

    -- Return true if within limit
    RETURN v_today_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a new conversation session
CREATE OR REPLACE FUNCTION public.start_conversation_session(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Check if user has available time
    IF NOT public.check_monthly_usage_limit(p_user_id) THEN
        RAISE EXCEPTION 'Monthly usage limit exceeded';
    END IF;

    -- Create new session
    INSERT INTO public.conversation_sessions (
        conversation_id,
        user_id,
        start_time,
        session_type
    ) VALUES (
        p_conversation_id,
        p_user_id,
        NOW(),
        'voice'
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end conversation session
CREATE OR REPLACE FUNCTION public.end_conversation_session(
    p_session_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_duration_seconds INTEGER;
    v_user_id UUID;
BEGIN
    -- Calculate duration and update session
    UPDATE public.conversation_sessions
    SET end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER
    WHERE id = p_session_id
    RETURNING duration_seconds, user_id INTO v_duration_seconds, v_user_id;

    -- Update user's usage
    PERFORM public.update_usage_time(v_user_id, v_duration_seconds);

    RETURN v_duration_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get translations for a specific language
CREATE OR REPLACE FUNCTION public.get_translations(p_language_code TEXT)
RETURNS TABLE(key TEXT, value TEXT, category TEXT, screen TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.key, t.value, t.category, t.screen
    FROM public.translations t
    WHERE t.language_code = p_language_code
    ORDER BY t.category, t.screen, t.key;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID)
RETURNS TABLE(
    total_conversations INTEGER,
    total_messages INTEGER,
    total_seconds_used INTEGER,
    current_month_seconds INTEGER,
    remaining_seconds INTEGER,
    current_plan TEXT,
    favorite_messages_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.conversations WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM public.messages WHERE user_id = p_user_id),
        (SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER FROM public.conversation_sessions WHERE user_id = p_user_id),
        (SELECT monthly_seconds_used FROM public.user_profiles WHERE user_id = p_user_id),
        public.get_remaining_seconds(p_user_id),
        (SELECT current_plan FROM public.user_profiles WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM public.messages WHERE user_id = p_user_id AND is_favorite = true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- 6. GRANT PERMISSIONS
-- ==========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_monthly_usage_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remaining_seconds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_message_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_conversation_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_conversation_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_translations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics(UUID) TO authenticated;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

-- Check table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'languages', 'plan_limits', 'user_profiles', 'translations',
        'conversations', 'messages', 'conversation_sessions', 
        'subscriptions', 'payment_history', 'feedbacks', 'app_settings'
    );
    
    RAISE NOTICE 'Successfully created % tables in public schema', table_count;
END $$;