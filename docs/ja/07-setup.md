# セットアップガイド - WorldSpeakAI

## 📋 前提条件とシステム要件

### 必要なソフトウェア
| ソフトウェア | 最小バージョン | 推奨バージョン | 用途 |
|------------|-------------|-------------|------|
| **Node.js** | v18.0.0 | v20.x LTS | JavaScript実行環境 |
| **npm** | v9.0.0 | v10.x | パッケージ管理 |
| **Git** | v2.30.0 | v2.44.x | バージョン管理 |
| **Expo CLI** | v6.3.0 | 最新版 | React Native開発 |

### 推奨開発環境
- **OS**: macOS Monterey+, Windows 11, Ubuntu 22.04+ 
- **RAM**: 8GB以上（推奨: 16GB+）
- **ストレージ**: 10GB以上の空き容量
- **エディタ**: VS Code（拡張機能設定済み）
- **ブラウザ**: Chrome 100+（開発者ツール・音声API対応）

### 外部サービスアカウント
- **Supabase**: 無料アカウント
- **Google AI Studio**: Gemini APIアクセス用
- **Sentry**: エラー追跡（オプション）

## 🚀 クイックスタート（5分セットアップ）

### 1. プロジェクトクローンと依存関係インストール
```bash
# リポジトリクローン
git clone https://github.com/hayate-business/WorldSpeakAI.git
cd WorldSpeakAI

# 依存関係インストール（Node.js 18+推奨）
npm install

# TypeScript型チェック
npm run type-check
```

### 2. 環境変数のセットアップ
```bash
# 環境変数ファイル作成
cp .env.example .env.local

# 必要最小限の設定
cat > .env.local << EOF
# === 必須設定 ===
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...

# === 開発環境設定 ===
NODE_ENV=development
EXPO_PUBLIC_APP_VARIANT=development

# === オプション設定 ===
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_ID=your-analytics-id
EOF
```

### 3. 開発サーバー起動
```bash
# Web開発サーバー起動
npm run web

# または全プラットフォーム対応開発サーバー
npm start
```

**🎉 準備完了！** ブラウザで `http://localhost:8081` にアクセス

## 🔧 詳細セットアップ

### Supabaseプロジェクトセットアップ

#### 1. プロジェクト作成
```bash
# Supabase CLIインストール
npm install -g supabase

# 新規プロジェクト初期化
supabase init

# Supabaseにログイン
supabase login
```

#### 2. データベーススキーマ適用
```bash
# 本番環境へのマイグレーション実行
supabase db push

# ローカル開発環境セットアップ
supabase start

# シードデータ投入
supabase db reset --with-seed
```

#### 3. Row Level Security設定の確認
```sql
-- RLS有効化確認クエリ
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 期待される結果: profiles, conversations, messages, subscriptions等がtrue
```

#### 4. ストレージバケット自動作成
```bash
# 自動セットアップスクリプト実行
npm run setup:storage

# または手動作成
supabase storage create-bucket avatars --public
supabase storage create-bucket audio --private
supabase storage create-bucket conversation-exports --private
```

### Gemini AI APIセットアップ

#### 1. APIキー取得と設定
```bash
# Google AI Studioでのセットアップ手順自動化
npm run setup:gemini

# 手動設定の場合
# 1. https://makersuite.google.com/ にアクセス
# 2. "Get API key" > "Create API key in new project"
# 3. 生成されたキーを .env.local に設定
```

#### 2. API使用量制限設定
```typescript
// src/services/gemini.config.ts
const GEMINI_CONFIG = {
  development: {
    maxRequestsPerMinute: 60,
    maxTokensPerRequest: 1024,
    temperature: 0.7
  },
  production: {
    maxRequestsPerMinute: 1000, // 有料プラン
    maxTokensPerRequest: 2048,
    temperature: 0.6
  }
};
```

#### 3. API接続テスト
```bash
# Gemini API接続確認
npm run test:gemini

# 期待される出力
# ✅ Gemini API connection successful
# ✅ Model gemini-1.5-flash available
# ✅ Rate limits configured
```

### 多言語音声機能セットアップ

#### 1. Web Speech API設定確認
```typescript
// 音声認識対応確認スクリプト
npm run check:speech-support

// ブラウザ対応状況
const checkSpeechSupport = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  console.log('Speech Recognition:', SpeechRecognition ? '✅ Supported' : '❌ Not supported');
  
  // 対応言語一覧取得
  const recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  console.log('Language support:', recognition.lang);
};
```

#### 2. expo-speech設定
```bash
# expo-speechの音声エンジン確認
npm run check:speech-synthesis

# 利用可能な音声一覧表示
import * as Speech from 'expo-speech';

const listVoices = async () => {
  const voices = await Speech.getAvailableVoicesAsync();
  voices.forEach(voice => {
    console.log(`${voice.language}: ${voice.name} (${voice.quality})`);
  });
};
```

## 🧪 開発環境設定

### VS Code設定最適化

#### 1. 推奨拡張機能自動インストール
```bash
# VS Code拡張機能一括インストール
cat .vscode/extensions.json | jq -r '.recommendations[]' | xargs -I {} code --install-extension {}
```

#### 2. デバッグ設定
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Expo Web",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/expo/bin/cli.js",
      "args": ["start", "--web"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests", 
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### 3. タスク自動化
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Development Environment",
      "type": "shell",
      "command": "npm",
      "args": ["run", "setup:dev"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "Type Check",
      "type": "shell", 
      "command": "npm",
      "args": ["run", "type-check"],
      "group": "test"
    }
  ]
}
```

### ESLint・Prettier設定

#### 1. コード品質チェック
```bash
# リント実行
npm run lint

# 自動修正
npm run lint:fix

# 型チェック
npm run type-check

# 全チェック実行
npm run check-all
```

#### 2. Git hooks設定
```bash
# pre-commit hook設定
npx husky add .husky/pre-commit "npm run lint-staged"

# commit-msg hook設定  
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### テスト環境セットアップ

#### 1. Jest設定確認
```bash
# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

#### 2. E2Eテスト環境
```bash
# Maestroインストール（モバイルE2Eテスト）
curl -Ls "https://get.maestro.mobile.dev" | bash

# E2Eテスト実行
npm run test:e2e
```

## 📱 マルチプラットフォーム開発

### iOS開発環境（macOSのみ）

#### 1. Xcode設定
```bash
# Xcodeコマンドラインツールインストール
xcode-select --install

# CocoaPodsインストール
sudo gem install cocoapods

# iOS依存関係セットアップ
cd ios && pod install && cd ..

# iOS開発証明書設定
npm run ios:setup-certificates
```

#### 2. iOS固有設定
```bash
# iOSシミュレータで起動
npm run ios

# 特定デバイスで起動
npm run ios -- --simulator="iPhone 15 Pro"

# 実機デバイスで実行
npm run ios -- --device
```

### Android開発環境

#### 1. Android Studio設定
```bash
# 環境変数設定（~/.bashrc または ~/.zshrc に追加）
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 設定確認
npm run android:check-env
```

#### 2. エミュレータ設定
```bash
# 利用可能なエミュレータ一覧
emulator -list-avds

# エミュレータ起動
emulator -avd Pixel_5_API_31

# Android実行
npm run android
```

### Web最適化

#### 1. PWA設定
```bash
# PWAビルド
npm run build:pwa

# PWAローカルテスト
npm run serve:pwa

# Lighthouse監査
npm run audit:lighthouse
```

#### 2. パフォーマンス最適化
```typescript
// webpack.config.js カスタマイズ
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@ui-kitten/components']
    }
  }, argv);
  
  // バンドル分析有効化
  if (process.env.ANALYZE) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    config.plugins.push(new BundleAnalyzerPlugin());
  }
  
  return config;
};
```

## 🔄 環境別設定管理

### 開発・ステージング・本番環境分離

#### 1. 環境変数管理
```bash
# 開発環境
cp .env.development .env.local

# ステージング環境  
cp .env.staging .env.local

# 本番環境
cp .env.production .env.local
```

#### 2. EAS Build設定
```json
// eas.json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "ENVIRONMENT": "development"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

#### 3. 自動デプロイ設定
```bash
# GitHub Actions有効化
cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml

# EAS Secret設定
eas secret:create --scope project --name EXPO_TOKEN --value your_expo_token
eas secret:create --scope project --name SUPABASE_ACCESS_TOKEN --value your_supabase_token
```

## 📊 ヘルスチェックとモニタリング

### 1. 環境診断ツール
```bash
# 総合ヘルスチェック実行
npm run health-check

# 期待される出力例：
# ✅ Node.js version: v20.9.0
# ✅ Supabase connection: OK
# ✅ Gemini API: OK (60 requests/min available)
# ✅ Speech Recognition: Supported
# ✅ Audio recording: Available
# ⚠️  iOS Simulator: Not available (macOS required)
# ✅ Android Emulator: Ready
```

### 2. パフォーマンス監視
```typescript
// src/utils/performance.ts
export const performanceMonitor = {
  startTimer: (label: string) => {
    console.time(label);
    performance.mark(`${label}-start`);
  },
  
  endTimer: (label: string) => {
    console.timeEnd(label);
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
  },
  
  measureAPICall: async (apiCall: Promise<any>, endpoint: string) => {
    const start = performance.now();
    try {
      const result = await apiCall;
      const duration = performance.now() - start;
      console.log(`API ${endpoint}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`API ${endpoint} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
};
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. Metro bundlerエラー
```bash
# 方法1: キャッシュクリア
npm start -- --clear

# 方法2: node_modules再構築
rm -rf node_modules package-lock.json
npm install

# 方法3: Metroリセット
npx react-native start --reset-cache
```

#### 2. TypeScriptエラー
```bash
# 型定義更新
npm run type-check:fix

# 厳密なTypeScriptチェック一時無効化
# tsconfig.json で "strict": false に設定
```

#### 3. 音声認識問題
```typescript
// デバッグ用音声認識テスト
const debugSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('❌ Speech Recognition not supported');
    return;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => console.log('🎤 Recording started');
  recognition.onresult = (event) => console.log('✅ Result:', event.results[0][0].transcript);
  recognition.onerror = (event) => console.error('❌ Error:', event.error);
  recognition.onend = () => console.log('⏹️ Recording ended');
  
  recognition.start();
};
```

#### 4. Supabase接続問題
```bash
# Supabase接続診断
npm run debug:supabase

# ローカルSupabase起動（開発用）
supabase start

# リモートSupabase接続確認
npm run test:supabase-connection
```

### 詳細ログ確認

#### 1. デバッグモード有効化
```bash
# 詳細ログ出力
DEBUG=* npm start

# 特定モジュールのみ
DEBUG=supabase:* npm start
```

#### 2. エラー追跡
```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/expo';

export const initErrorTracking = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enableInExpoDevelopment: true
  });
};

export const logError = (error: Error, context?: any) => {
  console.error('Error:', error);
  Sentry.captureException(error, { extra: context });
};
```

## 🎯 次のステップ

セットアップ完了後の推奨手順：

1. **📖 [機能仕様書](./04-features.md)** を確認
2. **🏗️ [アーキテクチャ](./02-architecture.md)** を理解  
3. **🗄️ [データベース設計](./05-database.md)** を把握
4. **🚀 [デプロイメント](./08-deployment.md)** で本番環境構築
5. **🔧 [トラブルシューティング](./09-troubleshooting.md)** をブックマーク

## 📞 サポートリソース

### コミュニティサポート
- **GitHub Issues**: [バグ報告・機能要望](https://github.com/hayate-business/WorldSpeakAI/issues)
- **Discussions**: [質問・議論](https://github.com/hayate-business/WorldSpeakAI/discussions)
- **Discord**: [リアルタイムサポート](https://discord.gg/worldspeakai)

### ドキュメント
- **トラブルシューティング**: [詳細解決方法](./09-troubleshooting.md)
- **API仕様**: [エンドポイント詳細](./06-api.md)
- **デプロイメント**: [本番環境構築](./08-deployment.md)

---

**🚀 セットアップ完了！WorldSpeakAIの多言語AI会話機能を実装して、世界中の言語学習者に革新的な体験を提供しましょう！**