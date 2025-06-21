import { useState, useEffect, useCallback } from 'react';
import { conversationService } from '@/services/conversation.service';
import { profileService } from '@/services/profile.service';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

export interface UseConversationReturn {
  // State
  isRecording: boolean;
  isProcessing: boolean;
  currentSessionId: string | null;
  remainingSeconds: number;
  canStartConversation: boolean;
  
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  endConversation: () => Promise<void>;
  checkUsageLimit: () => Promise<boolean>;
  
  // Data
  sessionStartTime: Date | null;
  sessionDuration: number;
}

export const useConversation = (conversationId: string) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [canStartConversation, setCanStartConversation] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);

  // Load remaining time on mount
  useEffect(() => {
    if (user) {
      loadRemainingTime();
      checkDailyLimit();
    }
  }, [user]);

  // Update duration every second when recording
  useEffect(() => {
    if (isRecording && sessionStartTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
        
        // Update remaining seconds
        const newRemaining = Math.max(0, remainingSeconds - 1);
        setRemainingSeconds(newRemaining);
        
        // Auto-stop if time limit reached
        if (newRemaining === 0) {
          stopRecording();
          Alert.alert(
            '時間制限',
            '今月の会話時間を使い切りました。プランをアップグレードしてください。',
            [{ text: 'OK' }]
          );
        }
      }, 1000);
      
      setDurationInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [isRecording, sessionStartTime, remainingSeconds]);

  const loadRemainingTime = async () => {
    if (!user) return;
    
    const { data, error } = await profileService.getRemainingSeconds(user.id);
    if (!error && data !== null) {
      setRemainingSeconds(data);
      setCanStartConversation(data > 0);
    }
  };

  const checkDailyLimit = async () => {
    if (!user) return;
    
    const { data, error } = await conversationService.checkDailyLimit(user.id);
    if (!error && data !== null) {
      if (!data) {
        setCanStartConversation(false);
        Alert.alert(
          '利用制限',
          '本日の利用制限に達しました。明日またお試しください。',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const checkUsageLimit = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Check monthly limit
    const { data: monthlyOk } = await profileService.checkMonthlyLimit(user.id);
    if (!monthlyOk) {
      Alert.alert(
        '月間制限',
        '今月の会話時間を超過しました。プランをアップグレードしてください。',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Check daily limit
    const { data: dailyOk } = await conversationService.checkDailyLimit(user.id);
    if (!dailyOk) {
      Alert.alert(
        '日次制限',
        '本日の利用制限に達しました。明日またお試しください。',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const startRecording = async () => {
    if (!user || !conversationId || isRecording || !canStartConversation) return;
    
    // Check limits before starting
    const canStart = await checkUsageLimit();
    if (!canStart) return;
    
    setIsProcessing(true);
    
    try {
      // Start conversation session
      const { data: sessionId, error } = await conversationService.startSession(
        conversationId,
        user.id
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setSessionStartTime(new Date());
        setSessionDuration(0);
        setIsRecording(true);
      }
    } catch (error: any) {
      console.error('Start recording error:', error);
      Alert.alert('エラー', '録音を開始できませんでした。');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (!currentSessionId || !isRecording) return;
    
    setIsProcessing(true);
    setIsRecording(false);
    
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
    
    try {
      // End conversation session
      const { data: duration, error } = await conversationService.endSession(currentSessionId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Reload remaining time
      await loadRemainingTime();
      
      setCurrentSessionId(null);
      setSessionStartTime(null);
    } catch (error: any) {
      console.error('Stop recording error:', error);
      Alert.alert('エラー', '録音を停止できませんでした。');
    } finally {
      setIsProcessing(false);
    }
  };

  const endConversation = async () => {
    if (isRecording) {
      await stopRecording();
    }
  };

  return {
    // State
    isRecording,
    isProcessing,
    currentSessionId,
    remainingSeconds,
    canStartConversation,
    
    // Actions
    startRecording,
    stopRecording,
    endConversation,
    checkUsageLimit,
    
    // Data
    sessionStartTime,
    sessionDuration,
  };
};