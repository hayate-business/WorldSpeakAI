-- ==========================================
-- WorldSpeak AI - Row Level Security Setup
-- Execute this AFTER the main setup script
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.conversation_sessions;
DROP POLICY IF EXISTS "Users can manage own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
DROP POLICY IF EXISTS "Anyone can read languages" ON public.languages;
DROP POLICY IF EXISTS "Anyone can read translations" ON public.translations;
DROP POLICY IF EXISTS "Anyone can read plan limits" ON public.plan_limits;
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- conversations policies
CREATE POLICY "Users can manage own conversations" ON public.conversations 
  FOR ALL USING (auth.uid() = user_id);

-- messages policies
CREATE POLICY "Users can manage own messages" ON public.messages 
  FOR ALL USING (auth.uid() = user_id);

-- conversation_sessions policies
CREATE POLICY "Users can manage own sessions" ON public.conversation_sessions 
  FOR ALL USING (auth.uid() = user_id);

-- feedbacks policies
CREATE POLICY "Users can manage own feedbacks" ON public.feedbacks 
  FOR ALL USING (auth.uid() = user_id);

-- subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- payment_history policies
CREATE POLICY "Users can view own payments" ON public.payment_history 
  FOR SELECT USING (auth.uid() = user_id);

-- Master tables - readable by all authenticated users
CREATE POLICY "Anyone can read languages" ON public.languages 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read translations" ON public.translations 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read plan limits" ON public.plan_limits 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read app settings" ON public.app_settings 
  FOR SELECT TO authenticated USING (true);

-- Verify RLS is enabled
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN (
        'user_profiles', 'languages', 'translations', 'plan_limits',
        'conversations', 'messages', 'conversation_sessions', 
        'subscriptions', 'payment_history', 'feedbacks', 'app_settings'
    )
    AND c.relrowsecurity = true;
    
    RAISE NOTICE 'RLS enabled on % tables', rls_count;
END $$;