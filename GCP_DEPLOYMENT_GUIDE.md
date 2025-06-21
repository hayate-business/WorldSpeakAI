# GCPデプロイメントガイド - WorldSpeak AI

## 🚀 GCPデプロイ手順

### 前提条件

以下の情報が必要です：

#### 必須情報 (ユーザーから提供)
- [ ] **GCPプロジェクトID**: `your-gcp-project-id`
- [ ] **Supabase URL**: `https://your-project.supabase.co`
- [ ] **Supabase Anon Key**: `your-supabase-anon-key`
- [ ] **Service Account JSON**: GCP認証用のサービスアカウントキー

#### 推奨設定
- **リージョン**: asia-northeast1 (東京)
- **デプロイ方法**: Cloud Run (サーバーレス)
- **ドメイン**: Cloud Run提供URL または カスタムドメイン

## 📋 Step 1: GCP初期設定

### 1.1 Google Cloud SDKのインストール
```bash
# Cloud SDK インストール (Linuxの場合)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# プロジェクト設定
gcloud config set project YOUR_PROJECT_ID
gcloud config set compute/region asia-northeast1
```

### 1.2 必要なAPIの有効化
```bash
# 必要なサービスを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 1.3 サービスアカウントの作成
```bash
# サービスアカウント作成
gcloud iam service-accounts create worldspeak-ai \
    --description="WorldSpeak AI service account" \
    --display-name="WorldSpeak AI"

# 権限付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:worldspeak-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.developer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:worldspeak-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"
```

## 📋 Step 2: シークレット管理

### 2.1 Supabase認証情報をSecret Managerに保存
```bash
# Supabase URL を保存
echo "https://YOUR_SUPABASE_PROJECT.supabase.co" | \
gcloud secrets create supabase-url --data-file=-

# Supabase Anon Key を保存
echo "YOUR_SUPABASE_ANON_KEY" | \
gcloud secrets create supabase-anon-key --data-file=-

# サービスアカウントにシークレットアクセス権限を付与
gcloud secrets add-iam-policy-binding supabase-url \
    --member="serviceAccount:worldspeak-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-anon-key \
    --member="serviceAccount:worldspeak-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 📋 Step 3: コードの準備

### 3.1 環境変数ファイルの作成
```bash
# 本番用環境変数ファイル作成
cp .env.example .env.production

# .env.production の内容を編集
cat > .env.production << EOF
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_APP_ENV=production
NODE_ENV=production
EOF
```

### 3.2 設定ファイルの更新
```bash
# gcp-deploy.yamlのPROJECT_IDを更新
sed -i 's/PROJECT_ID/YOUR_PROJECT_ID/g' gcp-deploy.yaml

# cloudbuild.yamlのプロジェクト設定を確認
# nginx.confのSupabase URLを更新
sed -i 's/your-project.supabase.co/YOUR_SUPABASE_PROJECT.supabase.co/g' nginx.conf
```

## 📋 Step 4: Cloud Buildでデプロイ

### 4.1 手動ビルド・デプロイ
```bash
# Cloud Buildを使用してビルド・デプロイ
gcloud builds submit --config cloudbuild.yaml .
```

### 4.2 GitHub連携 (推奨)
```bash
# GitHub リポジトリと連携してCI/CDを設定
gcloud alpha builds triggers create github \
    --repo-name=WorldSpeakAI \
    --repo-owner=YOUR_GITHUB_USERNAME \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

## 📋 Step 5: デプロイ確認

### 5.1 Cloud Runサービスの確認
```bash
# デプロイされたサービスを確認
gcloud run services list --region=asia-northeast1

# サービスの詳細を表示
gcloud run services describe worldspeak-ai --region=asia-northeast1
```

### 5.2 アプリケーションのテスト
```bash
# デプロイされたURLを取得
SERVICE_URL=$(gcloud run services describe worldspeak-ai \
    --region=asia-northeast1 \
    --format="value(status.url)")

echo "App URL: $SERVICE_URL"

# ヘルスチェック
curl $SERVICE_URL/health
```

## 📋 Step 6: ドメイン設定 (オプション)

### 6.1 カスタムドメインの設定
```bash
# ドメインマッピングの作成
gcloud run domain-mappings create \
    --service=worldspeak-ai \
    --domain=worldspeak.your-domain.com \
    --region=asia-northeast1
```

### 6.2 SSL証明書の自動設定
Cloud Runは自動的にSSL証明書を発行・管理します。

## 🔧 運用・監視

### ログの確認
```bash
# Cloud Runのログを確認
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=worldspeak-ai" \
    --limit=50 \
    --format="table(timestamp,jsonPayload.message)"
```

### メトリクス監視
- Cloud Monitoring でCPU/メモリ使用率を監視
- アラートポリシーの設定
- 自動スケーリングの調整

### バックアップ・復旧
- Supabaseは自動バックアップ機能あり
- コードはGitHubで管理
- 設定ファイルのバージョン管理

## 💰 料金体系

### Cloud Run料金 (東京リージョン)
- **リクエスト**: ¥0.0000005 / リクエスト
- **CPU**: ¥0.0343 / vCPU時間 
- **メモリ**: ¥0.00378 / GB時間
- **無料枠**: 月200万リクエスト、36万vCPU秒、72万GB秒

### 推定月額料金 (1万リクエスト/月の場合)
- リクエスト料金: ¥5
- CPU/メモリ料金: ¥50-100
- **合計**: 約¥100-150/月

## 🚨 必要な情報チェックリスト

デプロイを実行するために、以下の情報をお教えください：

- [ ] **GCPプロジェクトID**: `_____________`
- [ ] **Supabaseプロジェクトの詳細URL**: `_____________`  
- [ ] **SupabaseのAnonymous public key**: `_____________`
- [ ] **GitHubリポジトリ名**: `_____________`
- [ ] **希望するドメイン名** (オプション): `_____________`

これらの情報をいただければ、即座にデプロイを実行できます！

---

**📞 サポート**: GCPデプロイで問題が発生した場合は、エラーログと共にお知らせください。