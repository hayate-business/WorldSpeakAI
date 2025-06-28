import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import { sendMessageToGemini } from '../src/lib/gemini';

interface Message {
  id: string;
  text: string;
  isAI: boolean;
}

export default function ConversationScreen() {
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI conversation partner. Tap the microphone to start talking!",
      isAI: true,
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [currentRecognition, setCurrentRecognition] = useState<any>(null);

  // Initialize speech recognition support check
  useEffect(() => {
    // Check for speech recognition support with fallback
    const checkSpeechSupport = () => {
      if (typeof window === 'undefined') return false;
      
      // Check for Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setDebugInfo('Web Speech Recognition available');
        return true;
      }
      
      // Check if running on mobile - show different message
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setDebugInfo('Mobile detected - Speech recognition may require HTTPS');
        // Don't show alert immediately on mobile, let user try first
        return false;
      } else {
        setDebugInfo('Desktop: Please use Chrome, Safari, or Edge');
        Alert.alert(
          'Browser Not Supported',
          'Please use Chrome, Safari, or Edge for voice recognition.',
          [{ text: 'OK' }]
        );
        return false;
      }
    };

    checkSpeechSupport();

    // Cleanup on unmount
    return () => {
      if (currentRecognition) {
        currentRecognition.stop();
        setCurrentRecognition(null);
      }
    };
  }, []);

  const handleBack = useCallback(() => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      router.replace('/settings');
    }
  }, []);

  const handleEnd = useCallback(() => {
    try {
      router.push('/feedback');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('エラー', '画面遷移でエラーが発生しました。もう一度お試しください。');
    }
  }, []);

  const startRecording = async () => {
    try {
      setRecognizedText('');
      
      // Check if speech recognition is available with better error handling
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          Alert.alert(
            'Speech Recognition Not Available', 
            'モバイルではHTTPS接続が必要です。ChromeまたはSafariでhttps://でアクセスしてください。',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert(
            'Speech Recognition Not Available', 
            'Chrome、Safari、またはEdgeブラウザをご利用ください。',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
        return;
      }

      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Create and configure speech recognition
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setDebugInfo('🎤 Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech result:', transcript);
        setRecognizedText(transcript);
        setDebugInfo(`Recognized: "${transcript}"`);
        
        // Add user message to chat immediately
        const userMessage: Message = {
          id: Date.now().toString(),
          text: transcript,
          isAI: false,
        };
        setMessages(prev => [...prev, userMessage]);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        setDebugInfo(`Speech error: ${event.error}`);
        
        let errorMessage = 'Speech recognition error: ';
        switch(event.error) {
          case 'not-allowed':
            errorMessage += 'Microphone access was denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorMessage += 'No speech was detected. Please try speaking again.';
            break;
          case 'network':
            errorMessage += 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage += event.error;
        }
        
        Alert.alert('Speech Recognition Error', errorMessage);
        setIsRecording(false);
        recordingAnimation.setValue(1);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setDebugInfo('Speech recognition ended');
        setIsRecording(false);
        recordingAnimation.setValue(1);
        
        // Process recognized text
        if (recognizedText) {
          processUserMessage(recognizedText);
        }
      };

      // Start recognition
      recognition.start();
      setCurrentRecognition(recognition);
      console.log('Speech recognition started');
      
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      setDebugInfo(`Start error: ${error.message}`);
      Alert.alert('Error', `Failed to start speech recognition: ${error.message}`);
      setIsRecording(false);
      recordingAnimation.setValue(1);
    }
  };

  const stopRecording = async () => {
    try {
      recordingAnimation.setValue(1);
      
      if (currentRecognition) {
        currentRecognition.stop();
        setCurrentRecognition(null);
      }
      
      setIsRecording(false);
    } catch (error: any) {
      console.error('Error stopping speech recognition:', error);
      setIsProcessing(false);
    }
  };

  const processUserMessage = async (text: string) => {
    setIsProcessing(true);
    setDebugInfo('Processing with Gemini...');

    try {
      // Create conversation prompt for Gemini
      const conversationPrompt = `Please respond naturally to this message in a conversational way, as if you're having a friendly chat. Keep your response concise and engaging.

User said: "${text}"

Please respond:`;
      
      // Send to Gemini
      const geminiResponse = await sendMessageToGemini(conversationPrompt);
      
      console.log('Gemini response:', geminiResponse);
      setDebugInfo(`Gemini responded: "${geminiResponse}"`);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: geminiResponse,
        isAI: true,
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      console.log('Speaking response...');
      Speech.speak(geminiResponse, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
      
      setDebugInfo('Response spoken. Ready for next input.');
    } catch (error: any) {
      console.error('Error processing message:', error);
      setDebugInfo(`Error: ${error.message}`);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble processing your message. Please try again.',
        isAI: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Error', 'Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset recognized text for next input
      setRecognizedText('');
    }
  };

  const toggleRecording = useCallback(async () => {
    try {
      if (!isRecording) {
        console.log('Starting recording process...');
        setIsRecording(true);
        await startRecording();
      } else {
        console.log('Stopping recording process...');
        await stopRecording();
      }
    } catch (error: any) {
      console.error('Toggle recording error:', error);
      setDebugInfo(`Toggle error: ${error.message}`);
      // Reset state on any error
      setIsRecording(false);
    }
  }, [isRecording, recognizedText]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={10} style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI英会話</Text>
            <TouchableOpacity onPress={handleEnd} style={styles.endButton}>
              <Text style={styles.endButtonText}>終了</Text>
            </TouchableOpacity>
          </BlurView>
          
          {/* Debug info for development */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isAI ? styles.aiMessageContainer : styles.userMessageContainer,
              ]}
            >
              <View style={[styles.avatar, message.isAI ? styles.aiAvatar : styles.userAvatar]}>
                <Text style={styles.avatarText}>{message.isAI ? 'AI' : 'You'}</Text>
              </View>
              <View style={[styles.messageBubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
                <Text style={[styles.messageText, !message.isAI && styles.userMessageText]}>
                  {message.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.scriptHeader}
            onPress={() => setShowScript(!showScript)}
            activeOpacity={0.7}
          >
            <Text style={styles.scriptTitle}>台本ガイド</Text>
            <Ionicons 
              name={showScript ? "chevron-down" : "chevron-up"} 
              size={20} 
              color="#757575" 
            />
          </TouchableOpacity>

          {showScript && (
            <View style={styles.scriptContent}>
              <Text style={styles.scriptText}>
                I work as a <Text style={styles.blank}>______</Text>. 
                It&apos;s <Text style={styles.blank}>______</Text> but I enjoy it because{' '}
                <Text style={styles.blank}>______</Text>.
              </Text>
              <Text style={styles.scriptHint}>
                職業、仕事の特徴、楽しい理由を入れて答えてみましょう
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Animated.View style={{ transform: [{ scale: recordingAnimation }] }}>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.recordingButton, isProcessing && styles.processingButton]}
                onPress={toggleRecording}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                <Ionicons name="mic" size={24} color="white" />
                <Text style={styles.micText}>
                  {isRecording ? '🎤 録音中...' : isProcessing ? '🤖 処理中...' : '🎙️ タップして話す'}
                </Text>
                {recognizedText ? (
                  <Text style={styles.recognizedText}>
                    認識: &quot;{recognizedText}&quot;
                  </Text>
                ) : null}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 0,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  endButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  endButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  aiAvatar: {
    backgroundColor: '#2196F3',
  },
  userAvatar: {
    backgroundColor: '#4CAF50',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#E3F2FD',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#212121',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#1976D2',
  },
  bottomSection: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  scriptTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  scriptContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
    marginBottom: 8,
  },
  blank: {
    color: '#2196F3',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  scriptHint: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 20,
  },
  micButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  processingButton: {
    backgroundColor: '#FF9800',
  },
  micText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    margin: 8,
    borderRadius: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  recognizedText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});