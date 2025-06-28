# デプロイメント

## 🚀 デプロイ方法

WorldSpeakAIは複数のプラットフォームにデプロイ可能です。

## 📱 Expo Go（開発・テスト用）

### 1. Expo Goアプリインストール
- [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
- [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. 開発サーバー起動
```bash
npm start
```

### 3. QRコードスキャン
- iOS: カメラアプリでQRコードをスキャン
- Android: Expo GoアプリでQRコードをスキャン

## 🌐 Web版デプロイ

### Vercelへのデプロイ

#### 1. ビルド
```bash
# Web用ビルド
npx expo export --platform web

# または
npm run build:web
```

#### 2. Vercelセットアップ
```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数設定
vercel env add EXPO_PUBLIC_SUPABASE_URL
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

#### 3. カスタムドメイン設定
```bash
vercel domains add worldspeak.ai
```

### Netlifyへのデプロイ

#### 1. netlify.toml作成
```toml
[build]
  command = "expo export --platform web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. デプロイ
```bash
# Netlify CLIインストール
npm i -g netlify-cli

# デプロイ
netlify deploy --prod
```

## 📱 ネイティブアプリビルド

### iOS App Store

#### 1. Apple Developer登録
- [Apple Developer Program](https://developer.apple.com/programs/)に登録
- 年間$99の費用

#### 2. EAS Build設定
```bash
# EAS CLIインストール
npm install -g eas-cli

# ログイン
eas login

# プロジェクト設定
eas build:configure
```

#### 3. eas.json設定
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "bundleIdentifier": "com.worldspeak.ai"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

#### 4. ビルド実行
```bash
# プロダクションビルド
eas build --platform ios --profile production

# テストフライト提出
eas submit --platform ios
```

### Google Play Store

#### 1. Google Play Console登録
- [Google Play Console](https://play.google.com/console)に登録
- 初回$25の登録料

#### 2. Android設定
```json
// app.json に追加
{
  "expo": {
    "android": {
      "package": "com.worldspeak.ai",
      "versionCode": 1,
      "permissions": [
        "RECORD_AUDIO"
      ],
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

#### 3. ビルド&提出
```bash
# プロダクションビルド
eas build --platform android --profile production

# Play Store提出
eas submit --platform android
```

## 🐳 Dockerコンテナ

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係コピー
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコピー
COPY . .

# ビルド
RUN npm run build:web

# 環境変数
ENV NODE_ENV=production

# ポート公開
EXPOSE 3000

# 起動コマンド
CMD ["npm", "run", "serve"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
      - EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

## ⚙️ 本番環境設定

### 環境変数管理

#### 1. 本番用.env作成
```env
# .env.production
NODE_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
GEMINI_API_KEY=your-production-gemini-key
```

#### 2. セキュリティ設定
- APIキーの暗号化
- HTTPSの強制
- CORSポリシーの設定
- レート制限の実装

### パフォーマンス最適化

#### 1. アセット最適化
```bash
# 画像圧縮
npx expo-optimize

# バンドルサイズ分析
npx expo export --dump-assetmap
```

#### 2. コード最適化
- Tree shaking有効化
- 動的インポート使用
- 不要な依存関係削除

### モニタリング設定

#### 1. Sentry統合
```bash
# Sentryインストール
npm install @sentry/react-native

# 初期化
npx @sentry/wizard -i reactNative -p ios android
```

#### 2. Analytics設定
```javascript
// Google Analytics
import Analytics from 'expo-analytics';

const analytics = new Analytics('UA-XXXXXXXXX-X');
analytics.hit(new PageHit('Home'));
```

## 📊 デプロイチェックリスト

### 事前確認
- [ ] 全テストがパス
- [ ] ESLintエラーなし
- [ ] TypeScriptエラーなし
- [ ] 環境変数設定完了
- [ ] APIキー本番用に更新

### ビルド確認
- [ ] ビルドサイズ確認（< 50MB推奨）
- [ ] 起動時間測定（< 3秒目標）
- [ ] メモリ使用量確認
- [ ] ネットワークエラーハンドリング

### デプロイ後確認
- [ ] 本番環境での動作確認
- [ ] エラーモニタリング有効化
- [ ] パフォーマンスモニタリング
- [ ] ユーザーフィードバック収集

## 🔄 CI/CD設定

### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: 18
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build:web
      env:
        EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```