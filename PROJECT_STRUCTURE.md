# WorldSpeakAI プロジェクト構成ガイド

## 📁 プロジェクト全体図

```
WorldSpeakAI/
├── 📱 app/                    # メインアプリの画面ファイル
├── 🧩 components/             # 再利用可能な部品
├── 🎨 assets/                # 画像・フォントなどの素材
├── ⚙️ constants/             # 設定値（色など）
├── 🔧 hooks/                 # 機能の部品
├── 🌐 ui-demo/               # Webデモ版
├── 📦 node_modules/          # インストール済みライブラリ
├── 📋 package.json           # プロジェクト情報・設定
├── 📋 app.json               # アプリの基本設定
└── 📄 その他設定ファイル
```

## 🎯 重要なフォルダの詳細

### 📱 `app/` フォルダ - アプリの画面
**👆 最も重要なフォルダです！**

```
app/
├── _layout.tsx              # アプリ全体の設定（ナビゲーション、フォントなど）
├── (tabs)/                  # タブで切り替わる画面
│   ├── index.tsx           # ホーム画面（スタート画面）
│   ├── explore.tsx         # 探索画面
│   └── _layout.tsx         # タブの設定
├── settings.tsx            # 設定画面（会話の設定）
├── conversation.tsx        # 英会話画面（メイン機能）
├── feedback.tsx           # フィードバック画面（結果表示）
└── +not-found.tsx         # エラー画面（404）
```

**🔥 画面の流れ**
1. **index.tsx** (スタート) → 
2. **settings.tsx** (設定) → 
3. **conversation.tsx** (会話) → 
4. **feedback.tsx** (結果)

### 🧩 `components/` フォルダ - 再利用部品
**🔧 よく使う部品を保管する場所**

```
components/
├── ThemedText.tsx          # テーマに対応したテキスト表示
├── ThemedView.tsx          # テーマに対応した背景
├── Collapsible.tsx         # 開閉できるセクション
├── ParallaxScrollView.tsx  # スクロール効果
├── HapticTab.tsx          # タッチ時の振動フィードバック
├── HelloWave.tsx          # 手振りアニメーション
├── ExternalLink.tsx       # 外部リンク
└── ui/                    # プラットフォーム別の部品
    ├── IconSymbol.tsx     # アイコン表示
    └── TabBarBackground.tsx # タブバーの背景
```

### 🎨 `assets/` フォルダ - 素材
**🖼️ 画像やフォントを保管する場所**

```
assets/
├── images/                # 画像ファイル
│   ├── icon.png          # アプリアイコン
│   ├── splash-icon.png   # 起動画面アイコン
│   ├── favicon.png       # ファビコン
│   └── react-logo.png    # Reactロゴ
└── fonts/                # フォントファイル
    └── SpaceMono-Regular.ttf
```

### 🗂️ その他の重要なフォルダ

**⚙️ `constants/` フォルダ - 設定値**
```
constants/
└── Colors.ts            # アプリの色設定
```

**🔧 `hooks/` フォルダ - 機能部品**
```
hooks/
├── useColorScheme.ts    # ダーク/ライトモード検出
└── useThemeColor.ts     # テーマカラー管理
```

## 📋 設定ファイルの説明

### 重要な設定ファイル

| ファイル名 | 役割 | 編集頻度 |
|-----------|------|----------|
| **package.json** | プロジェクト情報・依存関係 | 🔴 高 |
| **app.json** | アプリの基本設定（名前、アイコンなど） | 🟡 中 |
| **tsconfig.json** | TypeScript設定 | 🟢 低 |
| **eslint.config.js** | コード品質チェック設定 | 🟢 低 |

### 📦 `package.json` の重要な項目

```json
{
  "name": "worldspeakai",           // プロジェクト名
  "version": "1.0.0",              // バージョン
  "scripts": {                     // 実行コマンド
    "start": "expo start",         // 開発サーバー起動
    "android": "expo start --android",  // Android用
    "ios": "expo start --ios",          // iOS用
    "web": "expo start --web"           // Web用
  },
  "dependencies": {                // 必要なライブラリ
    "expo": "~53.0.11",
    "react": "19.0.0",
    "react-native": "0.79.3"
  }
}
```

## 🚀 よく使うコマンド

### 基本操作
```bash
# プロジェクトフォルダに移動
cd /home/kakid/projects/WorldSpeakAI

# 開発サーバー起動（一番よく使う）
npm start

# 新しいライブラリをインストール
npm install ライブラリ名

# キャッシュクリア（エラー時）
npm start -- --clear
```

### スマホでの確認（Expo Go）
```bash
# メイン開発サーバー起動
npm start

# QRコードをスマホのExpo Goアプリでスキャン
```

## 🎯 ファイル編集時の注意点

### ✅ よく編集するファイル
- **`app/`** 内の画面ファイル (.tsx)
- **`components/`** 内の部品ファイル
- **`constants/Colors.ts`** (色の変更)
- **`package.json`** (新しいライブラリ追加時)

### ⚠️ 注意が必要なファイル
- **`app.json`** - アプリの基本設定
- **`_layout.tsx`** - ナビゲーション設定
- **`tsconfig.json`** - TypeScript設定

### 🚫 触らない方が良いファイル
- **`node_modules/`** - 自動生成されるフォルダ
- **`.expo/`** - Expo開発用キャッシュ
- **`expo-env.d.ts`** - 型定義ファイル

## 🔍 ファイルを探すときのコツ

### 画面を修正したい場合
→ **`app/`** フォルダの該当ファイルを探す

### デザインを変更したい場合
→ **`components/`** や **`constants/Colors.ts`** を確認

### 画像を追加・変更したい場合
→ **`assets/images/`** に配置

### 新しい機能を追加したい場合
→ **`app/`** に新しい画面ファイルを作成

## 📚 参考情報

- **Expo公式ドキュメント**: https://docs.expo.dev/
- **React Native公式ドキュメント**: https://reactnative.dev/
- **TypeScript公式ドキュメント**: https://www.typescriptlang.org/

---

**💡 このドキュメントは、システム開発の知識がなくても理解できるよう、専門用語を避けて説明しています。何か分からないことがあれば、遠慮なく質問してください！**