-- WorldSpeak AI Database Schema
-- Created: 2024-06-14
-- Description: Multi-language voice conversation app with usage limits and subscription features

-- ==========================================
-- 1. TABLES CREATION
-- ==========================================

-- User profiles table (additional user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  primary_language_code TEXT,
  learning_language_code TEXT,
  current_plan TEXT DEFAULT 'free',
  monthly_seconds_used INTEGER DEFAULT 0,
  usage_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Languages master table
CREATE TABLE IF NOT EXISTS languages (
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

-- Translations table for multi-language UI
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  language_code TEXT REFERENCES languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  category TEXT,
  screen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language_code)
);

-- Plan limits table
CREATE TABLE IF NOT EXISTS plan_limits (
  id SERIAL PRIMARY KEY,
  plan_type TEXT UNIQUE NOT NULL,
  monthly_seconds_limit INTEGER NOT NULL,
  daily_message_limit INTEGER,
  features JSONB,
  price_monthly INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
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

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  response_time_ms INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation sessions for time tracking
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  session_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'jpy',
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. INDEXES
-- ==========================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON translations(key, language_code);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_start_time ON conversation_sessions(start_time);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- conversations policies
CREATE POLICY "Users can manage own conversations" ON conversations 
  FOR ALL USING (auth.uid() = user_id);

-- messages policies
CREATE POLICY "Users can manage own messages" ON messages 
  FOR ALL USING (auth.uid() = user_id);

-- conversation_sessions policies
CREATE POLICY "Users can manage own sessions" ON conversation_sessions 
  FOR ALL USING (auth.uid() = user_id);

-- feedbacks policies
CREATE POLICY "Users can manage own feedbacks" ON feedbacks 
  FOR ALL USING (auth.uid() = user_id);

-- subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- payment_history policies
CREATE POLICY "Users can view own payments" ON payment_history 
  FOR SELECT USING (auth.uid() = user_id);

-- Master tables - readable by all authenticated users
CREATE POLICY "Anyone can read languages" ON languages 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read translations" ON translations 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read plan limits" ON plan_limits 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read app settings" ON app_settings 
  FOR SELECT TO authenticated USING (true);

-- ==========================================
-- 4. INITIAL DATA
-- ==========================================

-- Insert languages
INSERT INTO languages (code, name, native_name, flag_emoji, sort_order) VALUES
('ja', '日本語', '日本語', '🇯🇵', 1),
('en', 'English', 'English', '🇺🇸', 2),
('zh-CN', '中文（简体）', '中文（简体）', '🇨🇳', 3),
('ko', '한국어', '한국어', '🇰🇷', 4),
('es', 'Español', 'Español', '🇪🇸', 5),
('fr', 'Français', 'Français', '🇫🇷', 6)
ON CONFLICT (code) DO NOTHING;

-- Insert plan limits
INSERT INTO plan_limits (plan_type, monthly_seconds_limit, daily_message_limit, price_monthly, features) VALUES
('free', 300, 10, 0, '{"voice_conversation": true, "text_chat": true, "basic_scenarios": true}'),
('premium', 1800, 50, 980, '{"voice_conversation": true, "text_chat": true, "all_scenarios": true, "priority_support": true}'),
('pro', 7200, 200, 1980, '{"voice_conversation": true, "text_chat": true, "all_scenarios": true, "priority_support": true, "custom_scenarios": true, "analytics": true}')
ON CONFLICT (plan_type) DO NOTHING;

-- Insert translations
INSERT INTO translations (key, language_code, value, category, screen) VALUES
-- Settings screen
('settings.title', 'ja', '設定', 'ui', 'settings'),
('settings.title', 'en', 'Settings', 'ui', 'settings'),
('settings.title', 'zh-CN', '设置', 'ui', 'settings'),
('settings.title', 'ko', '설정', 'ui', 'settings'),
('settings.primary_language', 'ja', '第一言語', 'ui', 'settings'),
('settings.primary_language', 'en', 'Primary Language', 'ui', 'settings'),
('settings.primary_language', 'zh-CN', '母语', 'ui', 'settings'),
('settings.primary_language', 'ko', '모국어', 'ui', 'settings'),
('settings.learning_language', 'ja', '学習言語', 'ui', 'settings'),
('settings.learning_language', 'en', 'Learning Language', 'ui', 'settings'),
('settings.learning_language', 'zh-CN', '学习语言', 'ui', 'settings'),
('settings.learning_language', 'ko', '학습 언어', 'ui', 'settings'),

-- Buttons
('button.send', 'ja', '送信', 'ui', 'chat'),
('button.send', 'en', 'Send', 'ui', 'chat'),
('button.send', 'zh-CN', '发送', 'ui', 'chat'),
('button.send', 'ko', '전송', 'ui', 'chat'),
('button.start_conversation', 'ja', '会話開始', 'ui', 'home'),
('button.start_conversation', 'en', 'Start Conversation', 'ui', 'home'),
('button.start_conversation', 'zh-CN', '开始对话', 'ui', 'home'),
('button.start_conversation', 'ko', '대화 시작', 'ui', 'home'),
('button.end_conversation', 'ja', '会話終了', 'ui', 'chat'),
('button.end_conversation', 'en', 'End Conversation', 'ui', 'chat'),
('button.end_conversation', 'zh-CN', '结束对话', 'ui', 'chat'),
('button.end_conversation', 'ko', '대화 종료', 'ui', 'chat'),

-- Error messages
('error.time_limit_exceeded', 'ja', '今月の会話時間を超過しました', 'error', 'global'),
('error.time_limit_exceeded', 'en', 'Monthly conversation time exceeded', 'error', 'global'),
('error.time_limit_exceeded', 'zh-CN', '已超过本月对话时间限制', 'error', 'global'),
('error.time_limit_exceeded', 'ko', '이번 달 대화 시간을 초과했습니다', 'error', 'global'),
('error.daily_limit_exceeded', 'ja', '本日の利用制限に達しました', 'error', 'global'),
('error.daily_limit_exceeded', 'en', 'Daily usage limit reached', 'error', 'global'),
('error.daily_limit_exceeded', 'zh-CN', '已达到今日使用限制', 'error', 'global'),
('error.daily_limit_exceeded', 'ko', '오늘의 사용 제한에 도달했습니다', 'error', 'global'),

-- Plan names
('plan.free', 'ja', '無料プラン', 'ui', 'subscription'),
('plan.free', 'en', 'Free Plan', 'ui', 'subscription'),
('plan.premium', 'ja', 'プレミアムプラン', 'ui', 'subscription'),
('plan.premium', 'en', 'Premium Plan', 'ui', 'subscription'),
('plan.pro', 'ja', 'プロプラン', 'ui', 'subscription'),
('plan.pro', 'en', 'Pro Plan', 'ui', 'subscription')
ON CONFLICT (key, language_code) DO NOTHING;

-- Insert app settings
INSERT INTO app_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'メンテナンスモードの有効/無効'),
('max_message_length', '2000', '1メッセージの最大文字数'),
('free_tier_reset_day', '1', '無料プランのリセット日（毎月）'),
('voice_enabled', 'true', '音声会話機能の有効/無効')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 5. TRIGGERS AND FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();