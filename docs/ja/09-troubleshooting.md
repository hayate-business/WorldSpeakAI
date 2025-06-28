# トラブルシューティング

## 🔧 よくある問題と解決方法

### 認証関連

#### ログインできない
**症状**: メールアドレスとパスワードを入力してもログインできない

**原因と解決方法**:
1. **メールアドレスの確認**
   ```javascript
   // メールアドレスの形式を確認
   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   ```

2. **Supabase接続確認**
   ```javascript
   // コンソールで接続テスト
   const { data, error } = await supabase.auth.getSession();
   console.log('Connection:', error ? 'Failed' : 'Success');
   ```

3. **環境変数確認**
   ```bash
   # .env.localファイルを確認
   cat .env.local | grep SUPABASE
   ```

#### セッションが維持されない
**症状**: ログイン後、アプリを再起動するとログアウトされる

**解決方法**:
```javascript
// AuthContext.tsxで自動ログイン実装を確認
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

### 音声認識関連

#### "Speech Recognition Not Available"エラー
**症状**: マイクボタンをタップしても音声認識が開始されない

**原因と解決方法**:

1. **ブラウザ互換性**
   | ブラウザ | サポート状況 | 備考 |
   |----------|------------|------|
   | Chrome | ✅ 完全対応 | 推奨 |
   | Safari | ✅ 対応 | iOS 14.5+ |
   | Firefox | ❌ 非対応 | 代替手段必要 |
   | Edge | ✅ 対応 | Chromium版 |

2. **HTTPS接続確認**
   ```javascript
   // HTTPSでアクセスしているか確認
   if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
     alert('HTTPSで接続してください');
   }
   ```

3. **モバイルブラウザ対応**
   ```javascript
   // モバイル判定と対応メッセージ
   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
   if (isMobile && !window.SpeechRecognition && !window.webkitSpeechRecognition) {
     alert('ChromeまたはSafariブラウザをご利用ください');
   }
   ```

#### マイク権限エラー
**症状**: "Microphone access was denied"エラーが表示される

**解決方法**:

1. **ブラウザ設定確認**
   - Chrome: `chrome://settings/content/microphone`
   - Safari: 設定 > Safari > Webサイト > マイク
   - Edge: `edge://settings/content/microphone`

2. **権限リセット**
   ```javascript
   // 権限を再要求
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       stream.getTracks().forEach(track => track.stop());
       console.log('マイク権限取得成功');
     })
     .catch(err => {
       console.error('マイク権限エラー:', err);
     });
   ```

### AI応答関連

#### Gemini APIエラー
**症状**: "Failed to process your message"エラーが表示される

**原因と解決方法**:

1. **APIキー確認**
   ```bash
   # 環境変数確認
   echo $GEMINI_API_KEY
   
   # APIキーテスト
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent \
     -H "x-goog-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

2. **レート制限対策**
   ```javascript
   // リトライロジック実装
   const sendWithRetry = async (prompt, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         return await sendMessageToGemini(prompt);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
       }
     }
   };
   ```

3. **エラーコード別対処**
   | コード | 原因 | 対処法 |
   |--------|------|--------|
   | 401 | APIキー無効 | キー再生成 |
   | 429 | レート制限 | 待機後リトライ |
   | 500 | サーバーエラー | 時間を置いて再試行 |

### パフォーマンス問題

#### アプリの動作が重い
**症状**: 会話画面でレスポンスが遅い

**解決方法**:

1. **メッセージ数制限**
   ```javascript
   // 表示メッセージ数を制限
   const displayMessages = messages.slice(-50);
   ```

2. **メモリリーク確認**
   ```javascript
   // クリーンアップ処理確認
   useEffect(() => {
     return () => {
       // リスナー解除
       if (recognition) recognition.stop();
       // タイマークリア
       clearTimeout(timeoutId);
     };
   }, []);
   ```

### ビルド・デプロイ関連

#### Metro bundlerエラー
**症状**: "Metro has encountered an error"

**解決方法**:
```bash
# キャッシュクリア
npx expo start -c

# またはMetroキャッシュ削除
rm -rf node_modules/.cache/metro
```

#### TypeScriptエラー
**症状**: ビルド時に型エラーが発生

**解決方法**:
```bash
# 型定義更新
npm install --save-dev @types/react@latest @types/react-native@latest

# TypeScript設定確認
npx tsc --noEmit
```

### データベース関連

#### Supabaseクエリエラー
**症状**: データ取得・保存ができない

**解決方法**:

1. **RLSポリシー確認**
   ```sql
   -- ポリシー一覧確認
   SELECT * FROM pg_policies;
   
   -- RLS有効化確認
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **権限確認**
   ```javascript
   // 認証状態確認
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

## 🚨 エラーメッセージ一覧

### 日本語エラーメッセージ対応表

| エラーメッセージ | 原因 | 対処法 |
|----------------|------|--------|
| "ネットワークエラーが発生しました" | インターネット接続問題 | 接続確認、リトライ |
| "認証に失敗しました" | セッション期限切れ | 再ログイン |
| "音声認識を開始できません" | マイク権限なし | 権限設定確認 |
| "AIからの応答がありません" | API制限/エラー | 時間を置いて再試行 |
| "データの保存に失敗しました" | DB接続エラー | ネットワーク確認 |

## 🐛 デバッグ方法

### ブラウザ開発者ツール

1. **Console確認**
   ```javascript
   // デバッグ情報出力
   console.log('Current state:', { isRecording, messages, error });
   ```

2. **Network監視**
   - APIリクエスト確認
   - レスポンス内容確認
   - エラーステータス確認

3. **Application Storage**
   - LocalStorage確認
   - SessionStorage確認
   - IndexedDB確認

### React Native Debugger

1. **Expo Dev Tools**
   ```bash
   # デバッグモード起動
   expo start --dev-client
   ```

2. **Console.log確認**
   ```javascript
   // アプリ内デバッグ表示
   {__DEV__ && (
     <View style={styles.debugContainer}>
       <Text style={styles.debugText}>{debugInfo}</Text>
     </View>
   )}
   ```

## 📝 ログ収集

### エラーログ収集
```javascript
// グローバルエラーハンドラー
window.addEventListener('error', (event) => {
  console.error('Global error:', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});

// Promiseエラーハンドラー
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

### パフォーマンスログ
```javascript
// 処理時間測定
const startTime = performance.now();
// 処理実行
const endTime = performance.now();
console.log(`処理時間: ${endTime - startTime}ms`);
```

## 🆘 サポート連絡先

解決しない場合の連絡先:
1. **GitHub Issues**: [https://github.com/hayate-business/WorldSpeakAI/issues](https://github.com/hayate-business/WorldSpeakAI/issues)
2. **メールサポート**: support@worldspeak.ai（今後開設予定）
3. **コミュニティフォーラム**: 準備中

問題報告時に含めるべき情報:
- エラーメッセージ全文
- 使用環境（OS、ブラウザ、バージョン）
- 再現手順
- スクリーンショット（可能であれば）
- コンソールログ