# WorldSpeak AI - プロジェクトドキュメント

## 📋 プロジェクト概要
多言語AI音声会話学習アプリ - React Native + Expo + Supabase

## 🗂️ フォルダ構成

```
WorldSpeakAI/
├── 📁 app/                     # Expo Router画面
│   ├── (tabs)/                 # タブナビゲーション
│   │   ├── index.tsx          # ホーム画面
│   │   ├── settings.tsx       # 設定画面
│   │   ├── conversation.tsx   # 会話画面
│   │   ├── feedback.tsx       # フィードバック画面
│   │   └── profile.tsx        # プロフィール画面
│   ├── auth.tsx               # 認証画面
│   ├── _layout.tsx            # ルートレイアウト
│   └── +not-found.tsx         # 404画面
│
├── 📁 src/                     # ソースコード
│   ├── 🔧 lib/
│   │   └── supabase.ts        # Supabaseクライアント設定
│   ├── 🎭 contexts/
│   │   └── AuthContext.tsx    # 認証状態管理
│   ├── 🛠️ services/
│   │   ├── auth.service.ts     # 認証サービス
│   │   ├── profile.service.ts  # プロフィール管理
│   │   ├── conversation.service.ts # 会話管理
│   │   ├── translation.service.ts # 多言語サービス
│   │   └── subscription.service.ts # 課金管理
│   └── 🪝 hooks/
│       └── useConversation.ts  # 会話状態管理フック
│
├── 📁 supabase/               # データベース関連
│   ├── migrations/
│   │   └── 20240614_create_tables.sql # 初期マイグレーション
│   ├── direct_setup.sql       # Supabase直接実行用SQL
│   └── setup_rls.sql         # RLSポリシー設定
│
├── 📁 assets/                 # アセット
│   ├── images/               # 画像ファイル
│   └── fonts/                # フォントファイル
│
├── 📄 設定ファイル
├── package.json              # 依存関係
├── app.json                  # Expo設定
├── .env.example             # 環境変数テンプレート
└── expo-env.d.ts           # TypeScript型定義
```

## 🔗 データベース接続情報

### Supabase プロジェクト
- **プロジェクト名**: WorldSpeakAI
- **データベース**: PostgreSQL 15
- **認証**: Supabase Auth (Row Level Security有効)
- **ストレージ**: Supabase Storage (将来の音声ファイル用)

### 環境変数 (.env ファイル)
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration (決済用)
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# OpenAI Configuration (AI会話用)
OPENAI_API_KEY=your-openai-api-key
```

## 🗃️ データベーススキーマ

### 作成済みテーブル (11テーブル)

| テーブル名 | 説明 | 主要フィールド |
|-----------|------|----------------|
| **languages** | 対応言語マスタ | code, name, native_name, flag_emoji |
| **plan_limits** | プラン制限設定 | plan_type, monthly_seconds_limit, price_monthly |
| **user_profiles** | ユーザープロフィール | user_id, display_name, primary_language_code, current_plan |
| **translations** | 多言語翻訳データ | key, language_code, value, category, screen |
| **conversations** | 会話履歴 | user_id, title, conversation_type, message_count |
| **messages** | メッセージ履歴 | conversation_id, user_id, role, content, tokens_used |
| **conversation_sessions** | 会話セッション時間管理 | conversation_id, user_id, start_time, duration_seconds |
| **subscriptions** | サブスクリプション管理 | user_id, plan_type, status, current_period_end |
| **payment_history** | 決済履歴 | user_id, amount, currency, status, stripe_payment_intent_id |
| **feedbacks** | フィードバック | message_id, user_id, feedback_type, rating, comment |
| **app_settings** | アプリ設定 | key, value, description |

### カスタム関数 (8関数)
1. `check_monthly_usage_limit(UUID)` - 月間使用制限チェック
2. `get_remaining_seconds(UUID)` - 残り時間取得
3. `check_daily_message_limit(UUID)` - 日次メッセージ制限チェック
4. `start_conversation_session(UUID, UUID)` - 会話セッション開始
5. `end_conversation_session(UUID)` - 会話セッション終了
6. `get_translations(TEXT)` - 言語別翻訳取得
7. `get_user_statistics(UUID)` - ユーザー統計情報
8. `update_usage_time(UUID, INTEGER)` - 使用時間更新

## 🎯 プラン体系

| プラン | 月間時間 | 日次メッセージ | 料金 | 機能 |
|--------|----------|----------------|------|------|
| **Free** | 5分 (300秒) | 10メッセージ | ¥0 | 基本会話、シナリオ |
| **Premium** | 30分 (1800秒) | 50メッセージ | ¥980 | 全シナリオ、優先サポート |
| **Pro** | 120分 (7200秒) | 200メッセージ | ¥1980 | カスタムシナリオ、分析機能 |

## 🌍 対応言語 (12言語)

| コード | 言語名 | ネイティブ名 | フラグ |
|--------|--------|--------------|-------|
| ja | 日本語 | 日本語 | 🇯🇵 |
| en | English | English | 🇺🇸 |
| zh-CN | 中文（简体） | 中文（简体） | 🇨🇳 |
| ko | 한국어 | 한국어 | 🇰🇷 |
| es | Español | Español | 🇪🇸 |
| fr | Français | Français | 🇫🇷 |
| de | Deutsch | Deutsch | 🇩🇪 |
| it | Italiano | Italiano | 🇮🇹 |
| pt | Português | Português | 🇵🇹 |
| ru | Русский | Русский | 🇷🇺 |
| ar | العربية | العربية | 🇸🇦 |
| hi | हिन्दी | हिन्दी | 🇮🇳 |

## 🔐 認証フロー

### サインアップ
1. メールアドレス・パスワード入力
2. 表示名設定
3. 第一言語・学習言語選択
4. Supabase Auth でユーザー作成
5. user_profiles テーブルにプロフィール作成

### ログイン
1. メールアドレス・パスワード入力
2. Supabase Auth で認証
3. user_profiles から追加情報取得
4. AuthContext で状態管理

## 🛠️ 使用技術スタック

### フロントエンド
- **React Native** 0.74.5
- **Expo SDK** 53
- **TypeScript** 5.3.3
- **Expo Router** v3 (File-based routing)
- **Expo Linear Gradient** (UI効果)
- **Expo Blur** (ガラス効果)

### バックエンド
- **Supabase** (BaaS)
- **PostgreSQL** 15 (データベース)
- **Row Level Security** (セキュリティ)
- **Supabase Auth** (認証)
- **Supabase Storage** (ファイルストレージ)

### 状態管理
- **React Context API** (認証状態)
- **React Hooks** (ローカル状態)
- **AsyncStorage** (ローカルキャッシュ)

## 📱 画面構成

### 🏠 ホーム画面 (`/app/(tabs)/index.tsx`)
- ウェルカムメッセージ
- 会話開始ボタン
- ユーザー統計表示
- 認証状態による表示切り替え

### 🔐 認証画面 (`/app/auth.tsx`)
- サインアップ/ログイン切り替え
- 言語選択ドロップダウン
- バリデーション機能
- エラーハンドリング

### ⚙️ 設定画面 (`/app/(tabs)/settings.tsx`)
- 会話ジャンル選択
- 難易度設定
- 会話時間設定
- プロフィール管理リンク

### 💬 会話画面 (`/app/(tabs)/conversation.tsx`)
- 音声録音ボタン
- 時間表示・管理
- 台本ガイド表示
- セッション管理

### 📊 フィードバック画面 (`/app/(tabs)/feedback.tsx`)
- 会話評価(1-5段階)
- コメント入力
- 改善提案表示
- 履歴確認

### 👤 プロフィール画面 (`/app/(tabs)/profile.tsx`)
- ユーザー統計
- プラン情報
- 設定変更
- ログアウト

## 🚀 デプロイ準備

### 開発環境
```bash
npm install
npm start
# QRコードをExpo Goでスキャン
```

### 本番環境 (準備中)
- **Expo Application Services (EAS)** でビルド
- **Google Cloud Platform** でホスティング
- **Stripe** で決済処理
- **OpenAI API** でAI会話

## 🔧 メンテナンス

### データベースバックアップ
- Supabase自動バックアップ (7日間)
- 手動エクスポート機能あり

### ログ監視
- Supabase Logs (リアルタイム監視)
- エラー追跡とパフォーマンス監視

### セキュリティ
- Row Level Security (RLS) 全テーブル適用
- API Key ローテーション対応
- HTTPS/SSL 強制

---

**📅 最終更新**: 2024年6月21日  
**👨‍💻 開発者**: Claude Code + User  
**📧 サポート**: WorldSpeakAI チーム