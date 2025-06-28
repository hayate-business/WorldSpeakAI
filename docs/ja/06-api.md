# API仕様

## 🔌 API概要

WorldSpeakAIは複数の外部APIとSupabaseの内部APIを組み合わせて動作します。

## 📡 Supabase API

### 認証API

#### サインアップ
```typescript
// エンドポイント
POST /auth/v1/signup

// リクエスト
interface SignUpRequest {
  email: string;
  password: string;
  options?: {
    data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

// レスポンス
interface SignUpResponse {
  user: User;
  session: Session;
}

// 使用例
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  options: {
    data: {
      full_name: '山田太郎'
    }
  }
});
```

#### ログイン
```typescript
// エンドポイント
POST /auth/v1/token?grant_type=password

// リクエスト
interface SignInRequest {
  email: string;
  password: string;
}

// レスポンス
interface SignInResponse {
  user: User;
  session: Session;
  access_token: string;
  refresh_token: string;
}
```

#### セッション更新
```typescript
// エンドポイント
POST /auth/v1/token?grant_type=refresh_token

// 自動的にSupabase clientが処理
const { data: { session } } = await supabase.auth.refreshSession();
```

### データベースAPI (PostgREST)

#### プロフィール取得
```typescript
// エンドポイント
GET /rest/v1/profiles?id=eq.{user_id}

// 使用例
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// レスポンス型
interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  native_language: string;
  learning_goals: string[];
  created_at: string;
  updated_at: string;
}
```

#### 会話履歴取得
```typescript
// エンドポイント
GET /rest/v1/conversations?user_id=eq.{user_id}&order=created_at.desc

// 使用例
const { data, error } = await supabase
  .from('conversations')
  .select(`
    *,
    messages (
      id,
      content,
      is_ai,
      created_at
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### メッセージ保存
```typescript
// エンドポイント
POST /rest/v1/messages

// リクエスト
interface CreateMessageRequest {
  conversation_id: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  audio_url?: string;
}

// 使用例
const { data, error } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    user_id: userId,
    content: messageText,
    is_ai: false
  });
```

### ストレージAPI

#### アバター画像アップロード
```typescript
// エンドポイント
POST /storage/v1/object/avatars/{user_id}

// 使用例
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  });

// 公開URL取得
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

## 🤖 Google Gemini AI API

### 設定
```javascript
// API Key設定
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### テキスト生成
```typescript
// エンドポイント
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

// リクエスト
interface GenerateContentRequest {
  contents: [{
    parts: [{
      text: string;
    }];
  }];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
}

// 使用例
export async function sendMessageToGemini(prompt) {
  try {
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150
      }
    });
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
```

### エラーコード
| コード | 説明 | 対処法 |
|--------|------|--------|
| 400 | 不正なリクエスト | プロンプト形式確認 |
| 401 | 認証エラー | APIキー確認 |
| 429 | レート制限超過 | リトライ実装 |
| 500 | サーバーエラー | 時間を置いて再試行 |

## 🎤 Web Speech API

### 音声認識
```javascript
// ブラウザ内蔵API（外部エンドポイントなし）
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// 設定例
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';           // 言語設定
recognition.continuous = false;        // 継続的認識
recognition.interimResults = false;    // 中間結果
recognition.maxAlternatives = 1;       // 候補数

// イベントハンドラ
recognition.onstart = () => console.log('認識開始');
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log('認識結果:', transcript);
};
recognition.onerror = (event) => {
  console.error('認識エラー:', event.error);
};
recognition.onend = () => console.log('認識終了');

// 開始/停止
recognition.start();
recognition.stop();
```

### 対応言語コード
| 言語 | コード |
|------|--------|
| 英語（米国） | en-US |
| 英語（英国） | en-GB |
| 日本語 | ja-JP |
| 中国語 | zh-CN |
| 韓国語 | ko-KR |

## 🔊 expo-speech API

### 音声合成
```javascript
import * as Speech from 'expo-speech';

// 基本的な使用
Speech.speak('Hello, world!', {
  language: 'en',      // 言語
  pitch: 1.0,         // ピッチ (0.5-2.0)
  rate: 0.9,          // 速度 (0.1-2.0)
  volume: 1.0,        // 音量 (0.0-1.0)
  voice: 'com.apple.ttsbundle.Samantha-compact' // 音声タイプ
});

// 利用可能な音声取得
const voices = await Speech.getAvailableVoicesAsync();
console.log(voices);

// 発話状態確認
const isSpeaking = await Speech.isSpeakingAsync();

// 発話停止
Speech.stop();

// 一時停止/再開
Speech.pause();
Speech.resume();
```

## 📊 使用制限とベストプラクティス

### API制限
| サービス | 制限 | 備考 |
|----------|------|------|
| Supabase Auth | 制限なし | 標準プラン |
| Supabase Database | 500MB | 無料プラン |
| Gemini AI | 60 req/min | 無料枠 |
| Web Speech API | 制限なし | ブラウザ依存 |

### エラーハンドリング
```typescript
// 統一エラーハンドラー
class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// リトライロジック
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### キャッシング戦略
```typescript
// メモリキャッシュ実装例
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  
  set(key: string, data: T, ttl: number = 300000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
}
```