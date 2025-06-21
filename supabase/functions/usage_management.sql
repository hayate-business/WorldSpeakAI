-- ==========================================
-- USAGE MANAGEMENT FUNCTIONS
-- ==========================================

-- Function to check if user has exceeded monthly limit
CREATE OR REPLACE FUNCTION check_monthly_usage_limit(p_user_id UUID)
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
    FROM user_profiles up
    WHERE up.user_id = p_user_id;

    -- Check if usage needs to be reset (new month)
    IF v_reset_date < date_trunc('month', CURRENT_DATE) THEN
        UPDATE user_profiles
        SET monthly_seconds_used = 0,
            usage_reset_date = date_trunc('month', CURRENT_DATE)
        WHERE user_id = p_user_id;
        v_seconds_used := 0;
    END IF;

    -- Get plan limit
    SELECT monthly_seconds_limit
    INTO v_monthly_limit
    FROM plan_limits
    WHERE plan_type = v_current_plan;

    -- Return true if within limit, false if exceeded
    RETURN v_seconds_used < v_monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage after conversation
CREATE OR REPLACE FUNCTION update_usage_time(
    p_user_id UUID,
    p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles
    SET monthly_seconds_used = monthly_seconds_used + p_duration_seconds,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining time for user
CREATE OR REPLACE FUNCTION get_remaining_seconds(p_user_id UUID)
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
    FROM user_profiles up
    WHERE up.user_id = p_user_id;

    -- Get plan limit
    SELECT monthly_seconds_limit
    INTO v_monthly_limit
    FROM plan_limits
    WHERE plan_type = v_current_plan;

    -- Return remaining seconds
    RETURN GREATEST(0, v_monthly_limit - v_seconds_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check daily message limit
CREATE OR REPLACE FUNCTION check_daily_message_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_plan TEXT;
    v_daily_limit INTEGER;
    v_today_count INTEGER;
BEGIN
    -- Get user's current plan
    SELECT current_plan
    INTO v_current_plan
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Get daily limit for the plan
    SELECT daily_message_limit
    INTO v_daily_limit
    FROM plan_limits
    WHERE plan_type = v_current_plan;

    -- If no daily limit, return true
    IF v_daily_limit IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Count today's messages
    SELECT COUNT(*)
    INTO v_today_count
    FROM messages
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

    -- Return true if within limit
    RETURN v_today_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CONVERSATION MANAGEMENT FUNCTIONS
-- ==========================================

-- Function to start a new conversation session
CREATE OR REPLACE FUNCTION start_conversation_session(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Check if user has available time
    IF NOT check_monthly_usage_limit(p_user_id) THEN
        RAISE EXCEPTION 'Monthly usage limit exceeded';
    END IF;

    -- Create new session
    INSERT INTO conversation_sessions (
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
CREATE OR REPLACE FUNCTION end_conversation_session(
    p_session_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_duration_seconds INTEGER;
    v_user_id UUID;
BEGIN
    -- Calculate duration and update session
    UPDATE conversation_sessions
    SET end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER
    WHERE id = p_session_id
    RETURNING duration_seconds, user_id INTO v_duration_seconds, v_user_id;

    -- Update user's usage
    PERFORM update_usage_time(v_user_id, v_duration_seconds);

    RETURN v_duration_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- UTILITY FUNCTIONS
-- ==========================================

-- Function to get translations for a specific language
CREATE OR REPLACE FUNCTION get_translations(p_language_code TEXT)
RETURNS TABLE(key TEXT, value TEXT, category TEXT, screen TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.key, t.value, t.category, t.screen
    FROM translations t
    WHERE t.language_code = p_language_code
    ORDER BY t.category, t.screen, t.key;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
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
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM messages WHERE user_id = p_user_id),
        (SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER FROM conversation_sessions WHERE user_id = p_user_id),
        (SELECT monthly_seconds_used FROM user_profiles WHERE user_id = p_user_id),
        get_remaining_seconds(p_user_id),
        (SELECT current_plan FROM user_profiles WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM messages WHERE user_id = p_user_id AND is_favorite = true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_monthly_usage_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_seconds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_message_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_conversation_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION end_conversation_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_translations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;