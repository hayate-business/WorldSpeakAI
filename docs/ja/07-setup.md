# セットアップガイド

## 📋 前提条件

### 必要なソフトウェア
- **Node.js**: v18.0.0以上
- **npm**: v9.0.0以上
- **Git**: v2.0.0以上
- **Expo CLI**: 最新版

### 推奨開発環境
- **OS**: macOS, Windows 10/11, Ubuntu 20.04+
- **エディタ**: VS Code (推奨拡張機能付き)
- **ブラウザ**: Chrome (開発者ツール使用)

## 🚀 クイックスタート

### 1. リポジトリのクローン
```bash
# HTTPSでクローン
git clone https://github.com/hayate-business/WorldSpeakAI.git

# または SSHでクローン
git clone git@github.com:hayate-business/WorldSpeakAI.git

# ディレクトリへ移動
cd WorldSpeakAI
```

### 2. 依存関係のインストール
```bash
# npmを使用
npm install

# またはyarnを使用
yarn install
```

### 3. 環境変数の設定
```bash
# .env.localファイルを作成
cp .env.example .env.local
```

`.env.local`ファイルを編集:
```env
# Supabase設定
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI設定
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud設定（オプション）
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
```

### 4. 開発サーバーの起動
```bash
# Expoで起動
npm start

# または特定プラットフォーム
npm run web      # Web版
npm run ios      # iOS版
npm run android  # Android版
```

## 🔧 詳細セットアップ

### Supabaseセットアップ

#### 1. Supabaseプロジェクト作成
1. [Supabase](https://supabase.com)にアクセス
2. 新規プロジェクト作成
3. プロジェクト設定からURLとAnon Keyを取得

#### 2. データベーススキーマ適用
```bash
# Supabase CLIインストール
npm install -g supabase

# ログイン
supabase login

# マイグレーション実行
supabase db push --db-url "postgresql://postgres:password@localhost:5432/postgres"
```

または、Supabaseダッシュボードから直接SQLを実行:
```sql
-- /supabase/migrations/20240614_create_tables.sql の内容をコピー&ペースト
```

#### 3. Row Level Security設定
```sql
-- /supabase/setup_rls.sql の内容を実行
```

#### 4. ストレージバケット作成
```sql
-- アバター用バケット
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 音声ファイル用バケット  
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);
```

### Gemini AI セットアップ

#### 1. Google AI Studioアクセス
1. [Google AI Studio](https://makersuite.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」をクリック

#### 2. APIキー取得
```bash
# APIキーを環境変数に設定
echo "GEMINI_API_KEY=your_api_key_here" >> .env.local
```

#### 3. 使用制限確認
- 無料枠: 60リクエスト/分
- 有料プラン: 制限緩和

### VS Code推奨設定

#### 拡張機能
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "msjsdiag.vscode-react-native",
    "expo.vscode-expo-tools"
  ]
}
```

#### 設定ファイル (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.expo": true,
    "**/.expo-shared": true,
    "**/node_modules": true
  }
}
```

## 🧪 開発環境テスト

### 1. 環境変数確認
```bash
# .env.localが正しく読み込まれているか確認
npm run check-env
```

### 2. Supabase接続テスト
```typescript
// src/lib/supabase.ts で接続確認
const testConnection = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Supabase connection:', error ? 'Failed' : 'Success');
};
```

### 3. Gemini API テスト
```javascript
// src/lib/gemini.js でテスト
const testGemini = async () => {
  const response = await sendMessageToGemini('Hello, test');
  console.log('Gemini response:', response);
};
```

## 📱 モバイル開発セットアップ

### iOS開発（macOSのみ）
```bash
# Xcodeインストール（App Store経由）
# CocoaPodsインストール
sudo gem install cocoapods

# iOS依存関係インストール
cd ios && pod install && cd ..

# iOS シミュレータで実行
npm run ios
```

### Android開発
```bash
# Android Studioインストール
# https://developer.android.com/studio

# 環境変数設定
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Androidエミュレータで実行
npm run android
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. Metro bundlerエラー
```bash
# キャッシュクリア
npx expo start -c
```

#### 2. 依存関係の競合
```bash
# node_modules削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

#### 3. Supabase接続エラー
- URLとAnon Keyの確認
- ネットワーク接続確認
- CORS設定確認

#### 4. 音声認識が動作しない
- HTTPS接続確認
- マイク権限確認
- 対応ブラウザ確認

## 🔄 アップデート手順

### 最新版への更新
```bash
# 最新コードを取得
git pull origin main

# 依存関係更新
npm update

# Expoアップデート
expo upgrade

# 開発サーバー再起動
npm start -c
```

## 📞 サポート

問題が解決しない場合:
1. [GitHub Issues](https://github.com/hayate-business/WorldSpeakAI/issues)で報告
2. [ドキュメント](./09-troubleshooting.md)を確認
3. コミュニティフォーラムで質問（今後開設予定）