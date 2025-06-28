# データベース設計

## 🗄️ データベース概要

- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage
- **リアルタイム**: Supabase Realtime

## 📊 テーブル構造

### 1. profiles テーブル
ユーザープロフィール情報を管理

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  native_language TEXT DEFAULT 'ja',
  learning_goals TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_level ON profiles(level);
```

### 2. conversations テーブル
会話セッションを記録

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  topic TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- 秒単位
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

### 3. messages テーブル
会話内のメッセージを保存

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 4. subscriptions テーブル
サブスクリプション情報を管理

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'standard', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 5. usage_logs テーブル
使用状況を追跡

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversations_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- 秒単位
  words_spoken INTEGER DEFAULT 0,
  ai_responses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- インデックス
CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, date DESC);
```

### 6. achievements テーブル
達成バッジを管理

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, type)
);
```

## 🔒 Row Level Security (RLS)

### profiles テーブルのRLS
```sql
-- ユーザーは自分のプロフィールのみ閲覧・更新可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### conversations テーブルのRLS
```sql
-- ユーザーは自分の会話のみ閲覧・作成可能
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### messages テーブルのRLS
```sql
-- ユーザーは自分のメッセージのみ閲覧・作成可能
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🔄 トリガーとファンクション

### 更新日時の自動更新
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles テーブルに適用
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- subscriptions テーブルに適用
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 会話終了時の処理
```sql
CREATE OR REPLACE FUNCTION end_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- 会話時間と メッセージ数を計算
  NEW.duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  NEW.message_count = (
    SELECT COUNT(*) FROM messages 
    WHERE conversation_id = NEW.id
  );
  
  -- 使用ログを更新
  INSERT INTO usage_logs (user_id, date, conversations_count, total_duration)
  VALUES (NEW.user_id, CURRENT_DATE, 1, NEW.duration)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    conversations_count = usage_logs.conversations_count + 1,
    total_duration = usage_logs.total_duration + EXCLUDED.total_duration;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_end_conversation
  BEFORE UPDATE OF ended_at ON conversations
  FOR EACH ROW
  WHEN (OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL)
  EXECUTE FUNCTION end_conversation();
```

## 📈 パフォーマンス最適化

### インデックス戦略
1. **主キーインデックス**: 自動作成
2. **外部キーインデックス**: リレーション高速化
3. **検索用インデックス**: よく使うWHERE句に対応
4. **複合インデックス**: 複数条件の検索最適化

### パーティショニング検討
```sql
-- 将来的な実装: messages テーブルの月次パーティション
CREATE TABLE messages_2024_01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### バックアップ戦略
- **自動バックアップ**: Supabase標準（日次）
- **ポイントインタイムリカバリ**: Pro プラン以上
- **定期的なエクスポート**: 月次での完全バックアップ