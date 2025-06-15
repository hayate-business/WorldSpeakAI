# WorldSpeak AI - Expo Goでの確認方法

## 準備

1. スマートフォンにExpo Goアプリをインストール
   - iOS: [App Store](https://apps.apple.com/app/apple-store/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. 開発環境の準備
   ```bash
   # Node.jsが必要です（v16以上推奨）
   node --version
   
   # npmパッケージのインストール
   npm install
   ```

## 起動方法

1. プロジェクトディレクトリに移動
   ```bash
   cd /home/kakid/projects/WorldSpeakAI
   ```

2. Expoサーバーを起動
   ```bash
   npm start
   # または
   npx expo start
   ```

3. 表示されるQRコードをスマートフォンで読み取る
   - iOS: カメラアプリでQRコードを読み取り、Expo Goで開く
   - Android: Expo GoアプリのQRコードスキャナーで読み取る

## 実装済み画面

1. **スタート画面** (`app/(tabs)/index.tsx`)
   - アプリロゴとコンセプト表示
   - 特徴の紹介（レベル別学習、即時フィードバック、AIネイティブ発音）
   - 「AIと英会話を始める」ボタン

2. **設定画面** (`app/settings.tsx`)
   - ジャンル選択（日常会話、ビジネス、システム開発）
   - 会話の長さ選択（スタンダード、長め）
   - 難易度選択（簡単、普通、難しい）

3. **英会話画面** (`app/conversation.tsx`)
   - AIとユーザーのチャット表示
   - 台本ガイド（展開/折りたたみ可能）
   - マイク録音ボタン（3秒のデモ録音）

4. **フィードバック画面** (`app/feedback.tsx`)
   - 総合評価（円グラフ表示）
   - カテゴリ別フィードバック（発音、文法、ネイティブ表現）
   - 改善提案とおすすめフレーズ

## トラブルシューティング

### QRコードが表示されない場合
```bash
# ターミナルで以下を実行
npx expo start --tunnel
```

### 接続できない場合
- 開発PCとスマートフォンが同じWi-Fiネットワークに接続されているか確認
- ファイアウォールの設定を確認（ポート19000-19001を開放）

### エラーが発生する場合
```bash
# キャッシュをクリア
npx expo start -c

# node_modulesを再インストール
rm -rf node_modules
npm install
```

## 開発時の注意点

- ホットリロード機能により、コードを変更すると自動的に反映されます
- デバッグツールは、スマホを振る（シェイク）ことで開けます
- コンソールログはターミナルに表示されます