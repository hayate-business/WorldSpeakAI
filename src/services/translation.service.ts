import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Translation = {
  key: string;
  value: string;
  category: string | null;
  screen: string | null;
};

export type TranslationMap = {
  [key: string]: string;
};

class TranslationService {
  private translations: TranslationMap = {};
  private currentLanguage: string = 'ja';
  private cacheKey = 'translations_cache';

  // Initialize with language
  async initialize(languageCode: string) {
    this.currentLanguage = languageCode;
    await this.loadTranslations(languageCode);
  }

  // Load translations for a language
  async loadTranslations(languageCode: string) {
    try {
      // Try to load from cache first
      const cached = await this.getCachedTranslations(languageCode);
      if (cached) {
        this.translations = cached;
        return { error: null };
      }

      // Load from Supabase
      const { data, error } = await supabase
        .rpc('get_translations', { p_language_code: languageCode });

      if (error) throw error;

      // Convert array to map
      const translationMap: TranslationMap = {};
      if (Array.isArray(data)) {
        data.forEach((item: Translation) => {
          translationMap[item.key] = item.value;
        });
      }

      this.translations = translationMap;
      
      // Cache the translations
      await this.cacheTranslations(languageCode, translationMap);

      return { error: null };
    } catch (error: any) {
      console.error('Translation loading error:', error);
      // Fall back to default translations
      this.loadDefaultTranslations();
      return { error: error.message };
    }
  }

  // Get a translation by key
  t(key: string, defaultValue?: string): string {
    return this.translations[key] || defaultValue || key;
  }

  // Get all translations for a category
  getByCategory(category: string): TranslationMap {
    const filtered: TranslationMap = {};
    Object.entries(this.translations).forEach(([key, value]) => {
      if (key.startsWith(category)) {
        filtered[key] = value;
      }
    });
    return filtered;
  }

  // Get all translations for a screen
  getByScreen(screen: string): TranslationMap {
    // This would require storing metadata about translations
    // For now, return translations that match screen pattern
    const filtered: TranslationMap = {};
    Object.entries(this.translations).forEach(([key, value]) => {
      if (key.includes(`.${screen}.`)) {
        filtered[key] = value;
      }
    });
    return filtered;
  }

  // Switch language
  async switchLanguage(languageCode: string) {
    this.currentLanguage = languageCode;
    await this.loadTranslations(languageCode);
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Cache translations
  private async cacheTranslations(languageCode: string, translations: TranslationMap) {
    try {
      const cacheData = {
        languageCode,
        translations,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`${this.cacheKey}_${languageCode}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }

  // Get cached translations
  private async getCachedTranslations(languageCode: string): Promise<TranslationMap | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.cacheKey}_${languageCode}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is older than 24 hours
      const cacheAge = Date.now() - cacheData.timestamp;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        return null;
      }

      return cacheData.translations;
    } catch (error) {
      console.error('Cache load error:', error);
      return null;
    }
  }

  // Clear translation cache
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(key => key.startsWith(this.cacheKey));
      await AsyncStorage.multiRemove(translationKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Load default translations (fallback)
  private loadDefaultTranslations() {
    this.translations = {
      // Settings
      'settings.title': '設定',
      'settings.primary_language': '第一言語',
      'settings.learning_language': '学習言語',
      'settings.display_name': '表示名',
      'settings.save': '保存',
      
      // Navigation
      'nav.home': 'ホーム',
      'nav.conversations': '会話履歴',
      'nav.profile': 'プロフィール',
      'nav.subscription': 'サブスクリプション',
      
      // Buttons
      'button.send': '送信',
      'button.start_conversation': '会話開始',
      'button.end_conversation': '会話終了',
      'button.cancel': 'キャンセル',
      'button.save': '保存',
      'button.delete': '削除',
      
      // Conversation
      'conversation.speaking': '話しています...',
      'conversation.listening': '聞いています...',
      'conversation.processing': '処理中...',
      
      // Usage
      'usage.remaining_time': '残り時間',
      'usage.minutes': '分',
      'usage.upgrade_prompt': 'より多くの会話時間が必要ですか？',
      'usage.upgrade_button': 'アップグレード',
      
      // Errors
      'error.time_limit_exceeded': '今月の会話時間を超過しました',
      'error.daily_limit_exceeded': '本日の利用制限に達しました',
      'error.network': 'ネットワークエラーが発生しました',
      'error.unknown': 'エラーが発生しました',
      
      // Plans
      'plan.free': '無料プラン',
      'plan.premium': 'プレミアムプラン',
      'plan.pro': 'プロプラン',
      
      // Feedback
      'feedback.title': 'フィードバック',
      'feedback.pronunciation': '発音',
      'feedback.grammar': '文法',
      'feedback.vocabulary': '語彙',
      'feedback.excellent': '素晴らしい',
      'feedback.good': '良い',
      'feedback.needs_practice': '練習が必要',
    };
  }
}

// Create singleton instance
export const translationService = new TranslationService();

// Translation hook for React components
import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [language, setLanguage] = useState(translationService.getCurrentLanguage());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Force re-render when language changes
    const interval = setInterval(() => {
      const currentLang = translationService.getCurrentLanguage();
      if (currentLang !== language) {
        setLanguage(currentLang);
        forceUpdate({});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [language]);

  return {
    t: (key: string, defaultValue?: string) => translationService.t(key, defaultValue),
    language,
    switchLanguage: async (lang: string) => {
      await translationService.switchLanguage(lang);
      setLanguage(lang);
      forceUpdate({});
    },
  };
};