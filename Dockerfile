# WorldSpeak AI - Production Dockerfile
FROM node:20-alpine AS builder

# アプリディレクトリを作成
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# Expo for web ビルド
RUN npx expo export --platform web

# Production stage
FROM nginx:alpine

# Expo web buildの成果物をnginxに配置
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/nginx.conf

# ポート8080を公開
EXPOSE 8080

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]