# Supabaseテーブル作成手順

テーブルが作成されていない問題を解決します。以下の手順でSupabaseに直接SQLを実行してください。

## 🚀 実行手順

### 1. Supabaseダッシュボードにアクセス
1. [https://app.supabase.com](https://app.supabase.com) にログイン
2. WorldSpeakAIプロジェクトを選択
3. 左サイドバーの **「SQL Editor」** をクリック

### 2. メインスクリプトの実行
1. **「New Query」** をクリック
2. `/supabase/direct_setup.sql` の内容を**全て**コピー&ペースト
3. **「Run」** ボタンをクリックして実行
4. 実行完了まで待つ（1-2分）

### 3. RLSポリシーの設定
1. 再度 **「New Query」** をクリック
2. `/supabase/setup_rls.sql` の内容を**全て**コピー&ペースト
3. **「Run」** ボタンをクリックして実行

### 4. 確認
1. 左サイドバーの **「Table Editor」** をクリック
2. **「public」** スキーマを選択
3. 以下の11テーブルが作成されていることを確認：
   - ✅ languages
   - ✅ plan_limits  
   - ✅ user_profiles
   - ✅ translations
   - ✅ conversations
   - ✅ messages
   - ✅ conversation_sessions
   - ✅ subscriptions
   - ✅ payment_history
   - ✅ feedbacks
   - ✅ app_settings

## 📊 確認クエリ

テーブルが正しく作成されたかチェックする場合は、SQL Editorで以下を実行：

```sql
-- テーブル一覧を確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- データが入っているか確認
SELECT 'languages' as table_name, COUNT(*) as count FROM public.languages
UNION ALL
SELECT 'plan_limits', COUNT(*) FROM public.plan_limits
UNION ALL
SELECT 'translations', COUNT(*) FROM public.translations
UNION ALL
SELECT 'app_settings', COUNT(*) FROM public.app_settings;
```

## ❗ よくある問題と解決方法

### 問題1: 「relation "auth.users" does not exist」エラー
**解決**: Supabaseの認証機能が有効になっていることを確認してください。
1. Authentication → Settings → Enable email confirmations をチェック

### 問題2: 権限エラー
**解決**: プロジェクトのOwnerまたはAdmin権限でログインしていることを確認してください。

### 問題3: 一部テーブルが作成されない
**解決**: スクリプトを2回に分けて実行してください：
1. 最初にテーブルとデータの作成部分のみ
2. 次にRLSポリシーの設定部分

## 🔧 環境変数の設定

テーブル作成後、アプリで使用するために環境変数を設定してください：

```bash
# .envファイルを作成
cp .env.example .env

# 以下の値をSupabaseダッシュボードから取得して設定
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 環境変数の取得方法
1. Supabaseダッシュボードの **「Settings」** → **「API」**
2. **「Project URL」** をコピー → `EXPO_PUBLIC_SUPABASE_URL`
3. **「anon public」** keyをコピー → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## ✅ 完了後のテスト

```bash
# アプリを起動してテスト
npm start

# 新規アカウント作成でテーブルへの書き込みテスト
# プロフィール画面で統計データの読み取りテスト
```

---

これで完全にテーブルが作成されるはずです！問題があれば教えてください。