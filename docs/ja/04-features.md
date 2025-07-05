# 機能仕様書 - WorldSpeakAI

## 🔐 認証・セキュリティ機能

### 概要
Supabase Authを活用した堅牢な多段階認証システム

### 機能詳細

#### 1. ユーザー登録・認証
```typescript
interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  nativeLanguage: string;      // 母語設定
  targetLanguages: string[];   // 学習言語（複数可）
  timezone: string;           // タイムゾーン
  marketingConsent: boolean;  // マーケティング同意
}

interface AuthResponse {
  user: User;
  session: Session;
  profile: UserProfile;
}

// 実装例
class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    // 1. Supabase認証
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          native_language: data.nativeLanguage
        }
      }
    });
    
    // 2. プロフィール作成
    if (authData.user) {
      await this.createUserProfile(authData.user.id, data);
    }
    
    return authData;
  }
}
```

**バリデーション要件**
- メール形式: RFC 5322準拠
- パスワード: 最小8文字、大小英字+数字+特殊文字
- 重複チェック: リアルタイムメール存在確認
- CAPTCHA: ボット対策（3回失敗後）

#### 2. 多要素認証（MFA）
```typescript
interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  backupCodes: string[];
}

// TOTP実装
async enableTOTP(userId: string): Promise<{qrCode: string, secret: string}> {
  const secret = speakeasy.generateSecret({
    name: 'WorldSpeakAI',
    issuer: 'WorldSpeakAI'
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  return { qrCode, secret: secret.base32 };
}
```

#### 3. セッション管理
- JWTトークン（15分有効）
- リフレッシュトークン（30日有効）
- デバイス記憶機能
- 同時ログイン制限（プラン別）

## 🎤 多言語AI会話機能

### 概要
100+言語対応の革新的なAI会話システム。台本機能で初心者も安心

### 処理アーキテクチャ

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant LM as Language Manager
    participant WS as Web Speech API
    participant SG as Script Generator
    participant AI as Gemini AI Pro
    participant TTS as expo-speech
    participant DB as Supabase
    
    U->>UI: 会話開始
    UI->>LM: 言語ペア確認
    LM->>SG: 台本生成要求
    SG->>AI: Generate script (context)
    AI->>SG: Multilingual script
    SG->>UI: 台本表示
    
    U->>UI: マイクボタンタップ
    UI->>WS: startRecognition(targetLanguage)
    U->>WS: 音声入力
    WS->>UI: transcript
    
    UI->>AI: generateResponse({
        text: transcript,
        script: currentScript,
        languagePair: languages,
        specialization: field,
        culturalContext: context
    })
    
    AI->>UI: response + feedback
    UI->>TTS: speak(response, language, voice)
    UI->>DB: saveConversation()
```

### 主要機能

#### 1. 多言語音声認識
```typescript
class MultilingualSpeechRecognition {
  private recognition: SpeechRecognition;
  private languageOptimizer: LanguageOptimizer;
  
  async startRecognition(config: {
    language: string;
    dialect?: string;
    continuous: boolean;
    interimResults: boolean;
  }) {
    // 言語別最適化設定
    const optimizedConfig = this.languageOptimizer.optimize(config.language);
    
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // 言語固有の設定
    this.recognition.lang = `${config.language}${config.dialect ? '-' + config.dialect : ''}`;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = 3; // 複数候補で精度向上
    
    // 言語別の音声認識調整
    if (config.language === 'ja') {
      this.recognition.grammars = this.loadJapaneseGrammar();
    }
    
    this.recognition.onresult = (event) => {
      const results = this.processMultipleAlternatives(event.results);
      this.handleTranscript(results);
    };
  }
}
```

**対応言語例（主要100+言語）**
- アジア: 日本語、中国語（簡体/繁体）、韓国語、タイ語、ベトナム語等
- ヨーロッパ: 英語、フランス語、ドイツ語、スペイン語、イタリア語等
- 中東・アフリカ: アラビア語、ヘブライ語、スワヒリ語等
- その他: ヒンディー語、ロシア語、ポルトガル語等

#### 2. 革新的台本生成システム
```typescript
interface ScriptGenerationParams {
  scenario: ConversationScenario;
  languagePair: {
    native: string;
    target: string;
  };
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  specialization?: string;
  culturalContext: CulturalSettings;
  duration: number; // 予想会話時間
}

class ScriptGenerationEngine {
  async generateAdaptiveScript(params: ScriptGenerationParams): Promise<ConversationScript> {
    const prompt = `
    Generate a conversation script for language learning:
    - Native Language: ${params.languagePair.native}
    - Target Language: ${params.languagePair.target}
    - Level: ${params.userLevel}
    - Scenario: ${params.scenario}
    - Specialization: ${params.specialization || 'general'}
    - Cultural Context: ${JSON.stringify(params.culturalContext)}
    
    Requirements:
    1. Create natural dialogue flow with ${params.duration} minutes of content
    2. Include cultural nuances and appropriate formality
    3. Gradually increase complexity
    4. Provide alternative phrases for flexibility
    5. Include pronunciation hints for difficult words
    6. Add contextual explanations in native language
    `;
    
    const script = await this.geminiAI.generateContent(prompt);
    return this.processAndEnhanceScript(script, params);
  }
  
  private processAndEnhanceScript(
    rawScript: string, 
    params: ScriptGenerationParams
  ): ConversationScript {
    return {
      id: generateId(),
      scenario: params.scenario,
      difficulty: this.calculateDifficulty(rawScript, params.userLevel),
      segments: this.parseSegments(rawScript),
      alternatives: this.generateAlternatives(rawScript),
      culturalNotes: this.extractCulturalNotes(rawScript),
      pronunciationGuides: this.addPronunciationGuides(rawScript, params.languagePair.target)
    };
  }
}
```

#### 3. 専門分野対応AI会話
```typescript
interface SpecializedConversation {
  field: 'medical' | 'legal' | 'tech' | 'business' | 'academic' | 'engineering';
  subfield?: string;
  terminology: TerminologyDatabase;
  contextualKnowledge: string[];
}

class SpecializedAIConversation {
  private terminologyDB: Map<string, TerminologyDatabase>;
  
  async processSpecializedInput(params: {
    text: string;
    field: string;
    languagePair: LanguagePair;
    professionalContext: boolean;
  }): Promise<SpecializedResponse> {
    // 専門用語認識
    const terms = await this.identifyTerminology(params.text, params.field);
    
    // コンテキスト強化プロンプト
    const enhancedPrompt = `
    Professional ${params.field} conversation:
    User (${params.languagePair.target}): ${params.text}
    Identified terms: ${terms.join(', ')}
    
    Respond professionally considering:
    1. Field-specific terminology in ${params.languagePair.target}
    2. Appropriate formality level
    3. Technical accuracy
    4. Cultural business practices if applicable
    `;
    
    const response = await this.geminiAI.generateContent(enhancedPrompt);
    
    return {
      text: response.text,
      technicalTerms: this.highlightTerminology(response.text, params.field),
      explanations: this.generateTermExplanations(terms, params.languagePair),
      relatedVocabulary: this.suggestRelatedTerms(terms, params.field)
    };
  }
}
```

#### 4. リアルタイム発音評価
```typescript
interface PronunciationFeedback {
  overallScore: number;
  segments: {
    word: string;
    score: number;
    issues: string[];
    suggestion: string;
  }[];
  nativeComparison: AudioWaveform;
}

class PronunciationAnalyzer {
  async analyzePronunciation(
    userAudio: Blob,
    targetText: string,
    language: string
  ): Promise<PronunciationFeedback> {
    // 音素レベル分析
    const phoneticAnalysis = await this.convertToPhonemes(userAudio, language);
    const targetPhonemes = await this.textToPhonemes(targetText, language);
    
    // スコアリング
    const score = this.calculatePronunciationScore(phoneticAnalysis, targetPhonemes);
    
    // 詳細フィードバック生成
    return {
      overallScore: score,
      segments: this.analyzeSegments(phoneticAnalysis, targetPhonemes),
      nativeComparison: await this.generateNativeReference(targetText, language)
    };
  }
}
```

## 💰 革新的マイク時間制限システム

### 概要
「実際に話した時間だけカウント」する公平な使用量管理

### 実装詳細
```typescript
class MicrophoneTimeTracker {
  private activeTime: number = 0;
  private silenceThreshold: number = 2000; // 2秒
  private voiceActivityDetector: VoiceActivityDetector;
  
  startTracking() {
    let lastVoiceTime = Date.now();
    let isActive = false;
    
    this.voiceActivityDetector.on('voiceStart', () => {
      if (!isActive) {
        isActive = true;
        this.onActiveStart();
      }
      lastVoiceTime = Date.now();
    });
    
    this.voiceActivityDetector.on('voiceEnd', () => {
      // 2秒以上の無音で一時停止
      setTimeout(() => {
        if (Date.now() - lastVoiceTime >= this.silenceThreshold) {
          isActive = false;
          this.onActivePause();
        }
      }, this.silenceThreshold);
    });
  }
  
  private async updateUsage(seconds: number) {
    await supabase.rpc('increment_mic_usage', {
      user_id: this.userId,
      seconds: seconds,
      timestamp: new Date().toISOString()
    });
  }
}
```

### プラン別制限
| プラン | 月間マイク時間 | 同時セッション | 履歴保存期間 |
|--------|--------------|--------------|------------|
| Free | 60分 | 1 | 7日間 |
| Standard | 15時間（900分） | 3 | 無制限 |
| Premium | 50時間（3000分） | 無制限 | 無制限 |

## 👤 高度なプロフィール・学習管理

### 多言語学習プロフィール
```typescript
interface MultilingualProfile {
  id: string;
  userId: string;
  
  // 基本情報
  personalInfo: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    timezone: string;
    preferredLearningTime: string[];
  };
  
  // 言語設定
  languages: {
    native: string;
    learning: {
      language: string;
      level: ProficiencyLevel;
      startDate: Date;
      goals: string[];
      specializations: string[];
    }[];
  };
  
  // 学習統計
  statistics: {
    totalMicMinutes: number;
    totalConversations: number;
    languageBreakdown: Map<string, LanguageStats>;
    streakDays: number;
    lastActiveDate: Date;
  };
  
  // AI最適化データ
  aiOptimization: {
    preferredTopics: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
    pacingPreference: 'slow' | 'normal' | 'fast';
    culturalSensitivities: string[];
  };
}
```

## 📊 AIコーチング・分析機能（Premium）

### 1. パーソナライズド学習分析
```typescript
interface LearningAnalytics {
  // 言語スキル評価
  skillAssessment: {
    speaking: {
      fluency: number;
      accuracy: number;
      pronunciation: number;
      vocabulary: number;
      confidence: number;
    };
    comprehension: {
      listening: number;
      contextual: number;
      cultural: number;
    };
  };
  
  // 進捗トレンド
  progressTrends: {
    daily: ProgressPoint[];
    weekly: ProgressSummary[];
    monthly: ProgressReport;
  };
  
  // 強み・弱み分析
  strengthsAndWeaknesses: {
    strengths: SkillArea[];
    improvements: SkillArea[];
    recommendations: LearningRecommendation[];
  };
}
```

### 2. AIコーチング機能
```typescript
class AICoach {
  async generateDailyPlan(profile: MultilingualProfile): Promise<DailyLearningPlan> {
    const analysis = await this.analyzeRecentPerformance(profile);
    
    return {
      suggestedScenarios: this.selectOptimalScenarios(analysis),
      focusAreas: this.identifyDailyFocus(analysis),
      estimatedTime: this.calculateOptimalDuration(profile),
      motivationalMessage: this.generateMotivation(profile, analysis)
    };
  }
  
  async provideRealTimeFeedback(
    conversation: Conversation
  ): Promise<RealTimeFeedback> {
    return {
      grammaticalCorrections: this.identifyGrammarIssues(conversation),
      vocabularySuggestions: this.suggestBetterPhrases(conversation),
      culturalTips: this.provideCulturalContext(conversation),
      pronunciationAlerts: this.flagPronunciationIssues(conversation)
    };
  }
}
```

### 3. 詳細レポート生成
```typescript
interface ComprehensiveReport {
  period: 'weekly' | 'monthly' | 'quarterly';
  
  // エグゼクティブサマリー
  summary: {
    totalLearningTime: number;
    conversationsCompleted: number;
    overallImprovement: number;
    keyAchievements: Achievement[];
  };
  
  // 詳細分析
  detailedAnalysis: {
    languageBreakdown: Map<string, LanguageProgress>;
    topicMastery: Map<string, MasteryLevel>;
    commonMistakes: ErrorPattern[];
    improvementAreas: ImprovementSuggestion[];
  };
  
  // 次期目標
  nextPeriodGoals: {
    recommended: Goal[];
    stretch: Goal[];
    maintenance: Goal[];
  };
  
  // ビジュアル要素
  charts: {
    progressChart: ChartData;
    skillRadar: RadarChartData;
    heatmap: HeatmapData;
  };
}
```

## 🔔 スマート通知・リマインダー

### 学習促進システム
```typescript
class SmartNotificationSystem {
  async scheduleNotifications(profile: MultilingualProfile) {
    // 最適学習時間の予測
    const optimalTimes = await this.predictOptimalLearningTimes(profile);
    
    // パーソナライズドメッセージ
    const notifications: Notification[] = [
      {
        type: 'daily_reminder',
        time: optimalTimes[0],
        message: this.generateMotivationalMessage(profile),
        actionable: true
      },
      {
        type: 'streak_maintenance',
        condition: 'no_activity_today',
        message: `${profile.statistics.streakDays}日連続達成中！今日も続けましょう`,
        priority: 'high'
      },
      {
        type: 'achievement_unlock',
        trigger: 'milestone_reached',
        message: 'New achievement unlocked!',
        celebration: true
      }
    ];
    
    return this.scheduleAll(notifications);
  }
}
```

## 🌐 オフライン機能（将来実装）

### オフラインモード設計
```typescript
interface OfflineCapabilities {
  // ダウンロード可能コンテンツ
  downloadableContent: {
    scripts: ConversationScript[];
    audioLessons: AudioLesson[];
    vocabularyPacks: VocabularyPack[];
  };
  
  // オフライン時の機能
  offlineFeatures: {
    scriptPractice: boolean;
    pronunciationPractice: boolean;
    vocabularyReview: boolean;
    basicConversation: boolean; // 限定的なAI応答
  };
  
  // 同期管理
  syncManager: {
    pendingUploads: ConversationData[];
    lastSyncTime: Date;
    autoSync: boolean;
  };
}
```

## 🎮 ゲーミフィケーション要素

### 実績・バッジシステム
```typescript
interface GamificationSystem {
  // 実績カテゴリ
  achievements: {
    conversation: Achievement[]; // 会話回数、時間
    streak: Achievement[];       // 連続学習日数
    vocabulary: Achievement[];   // 習得単語数
    specialization: Achievement[]; // 専門分野マスター
    multilingual: Achievement[]; // 複数言語学習
  };
  
  // レベルシステム
  levelingSystem: {
    currentLevel: number;
    currentXP: number;
    nextLevelXP: number;
    levelBenefits: Benefit[];
  };
  
  // リーダーボード（オプトイン）
  leaderboard?: {
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  };
}
```

この機能仕様書により、claude codeは以下を明確に理解できます：

1. **各機能の詳細な実装方法**
2. **型定義による厳密な仕様**
3. **エラーハンドリングの具体例**
4. **パフォーマンスを考慮した設計**
5. **将来の拡張性を考慮した構造**