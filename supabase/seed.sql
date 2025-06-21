-- ==========================================
-- SEED DATA FOR DEVELOPMENT/TESTING
-- ==========================================

-- Additional languages for testing
INSERT INTO languages (code, name, native_name, flag_emoji, sort_order) VALUES
('de', 'Deutsch', 'Deutsch', '🇩🇪', 7),
('it', 'Italiano', 'Italiano', '🇮🇹', 8),
('pt', 'Português', 'Português', '🇵🇹', 9),
('ru', 'Русский', 'Русский', '🇷🇺', 10),
('ar', 'العربية', 'العربية', '🇸🇦', 11),
('hi', 'हिन्दी', 'हिन्दी', '🇮🇳', 12)
ON CONFLICT (code) DO NOTHING;

-- Additional translations for common UI elements
INSERT INTO translations (key, language_code, value, category, screen) VALUES
-- Navigation
('nav.home', 'ja', 'ホーム', 'ui', 'navigation'),
('nav.home', 'en', 'Home', 'ui', 'navigation'),
('nav.conversations', 'ja', '会話履歴', 'ui', 'navigation'),
('nav.conversations', 'en', 'Conversations', 'ui', 'navigation'),
('nav.profile', 'ja', 'プロフィール', 'ui', 'navigation'),
('nav.profile', 'en', 'Profile', 'ui', 'navigation'),
('nav.subscription', 'ja', 'サブスクリプション', 'ui', 'navigation'),
('nav.subscription', 'en', 'Subscription', 'ui', 'navigation'),

-- Common actions
('action.save', 'ja', '保存', 'ui', 'common'),
('action.save', 'en', 'Save', 'ui', 'common'),
('action.cancel', 'ja', 'キャンセル', 'ui', 'common'),
('action.cancel', 'en', 'Cancel', 'ui', 'common'),
('action.delete', 'ja', '削除', 'ui', 'common'),
('action.delete', 'en', 'Delete', 'ui', 'common'),
('action.edit', 'ja', '編集', 'ui', 'common'),
('action.edit', 'en', 'Edit', 'ui', 'common'),

-- Conversation screen
('conversation.speaking', 'ja', '話しています...', 'ui', 'conversation'),
('conversation.speaking', 'en', 'Speaking...', 'ui', 'conversation'),
('conversation.listening', 'ja', '聞いています...', 'ui', 'conversation'),
('conversation.listening', 'en', 'Listening...', 'ui', 'conversation'),
('conversation.processing', 'ja', '処理中...', 'ui', 'conversation'),
('conversation.processing', 'en', 'Processing...', 'ui', 'conversation'),

-- Feedback
('feedback.title', 'ja', 'フィードバック', 'ui', 'feedback'),
('feedback.title', 'en', 'Feedback', 'ui', 'feedback'),
('feedback.pronunciation', 'ja', '発音', 'ui', 'feedback'),
('feedback.pronunciation', 'en', 'Pronunciation', 'ui', 'feedback'),
('feedback.grammar', 'ja', '文法', 'ui', 'feedback'),
('feedback.grammar', 'en', 'Grammar', 'ui', 'feedback'),
('feedback.vocabulary', 'ja', '語彙', 'ui', 'feedback'),
('feedback.vocabulary', 'en', 'Vocabulary', 'ui', 'feedback'),

-- Usage display
('usage.remaining_time', 'ja', '残り時間', 'ui', 'usage'),
('usage.remaining_time', 'en', 'Remaining Time', 'ui', 'usage'),
('usage.minutes', 'ja', '分', 'ui', 'usage'),
('usage.minutes', 'en', 'minutes', 'ui', 'usage'),
('usage.upgrade_prompt', 'ja', 'より多くの会話時間が必要ですか？', 'ui', 'usage'),
('usage.upgrade_prompt', 'en', 'Need more conversation time?', 'ui', 'usage'),
('usage.upgrade_button', 'ja', 'アップグレード', 'ui', 'usage'),
('usage.upgrade_button', 'en', 'Upgrade', 'ui', 'usage')
ON CONFLICT (key, language_code) DO NOTHING;

-- Test user profile (only for development)
-- Note: This should be removed in production
DO $$
BEGIN
    IF current_database() = 'postgres' AND current_setting('app.env', true) = 'development' THEN
        -- Create a test user profile if auth.users has test data
        INSERT INTO user_profiles (
            user_id,
            display_name,
            primary_language_code,
            learning_language_code,
            current_plan
        )
        SELECT 
            id,
            'Test User',
            'ja',
            'en',
            'premium'
        FROM auth.users
        WHERE email = 'test@example.com'
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;