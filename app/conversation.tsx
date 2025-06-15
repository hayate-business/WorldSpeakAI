import React, { useState, useRef, useCallback } from 'react';
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
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface Message {
  id: string;
  text: string;
  isAI: boolean;
}

export default function ConversationScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! How are you doing today? I'd love to hear about your day.",
      isAI: true,
    },
    {
      id: '2',
      text: "I'm doing great, thank you! I just finished my work and I'm relaxing at home now.",
      isAI: false,
    },
    {
      id: '3',
      text: "That sounds wonderful! What kind of work do you do? It must feel good to relax after a productive day.",
      isAI: true,
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

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

  const toggleRecording = useCallback(() => {
    try {
      if (!isRecording) {
        setIsRecording(true);
        
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

        const recordingTimeout = setTimeout(() => {
          try {
            setIsRecording(false);
            pulseAnimation.stop();
            recordingAnimation.setValue(1);
            
            const newMessage: Message = {
              id: Date.now().toString(),
              text: "I work as a software developer. It's challenging but I enjoy it because I love solving problems and creating new things.",
              isAI: false,
            };
            
            setMessages(prevMessages => [...prevMessages, newMessage]);
            
            const aiResponseTimeout = setTimeout(() => {
              try {
                const aiResponse: Message = {
                  id: (Date.now() + 1).toString(),
                  text: "That's fantastic! Software development is such a creative and rewarding field. What kind of projects are you working on currently?",
                  isAI: true,
                };
                setMessages(prev => [...prev, aiResponse]);
              } catch (error) {
                console.error('AI response error:', error);
              }
            }, 1500);

            return () => clearTimeout(aiResponseTimeout);
          } catch (error) {
            console.error('Recording stop error:', error);
            setIsRecording(false);
            recordingAnimation.setValue(1);
          }
        }, 3000);

        return () => clearTimeout(recordingTimeout);
      } else {
        setIsRecording(false);
        recordingAnimation.setValue(1);
      }
    } catch (error) {
      console.error('Recording toggle error:', error);
      setIsRecording(false);
      recordingAnimation.setValue(1);
    }
  }, [isRecording, recordingAnimation]);

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
                It's <Text style={styles.blank}>______</Text> but I enjoy it because{' '}
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
                style={[styles.micButton, isRecording && styles.recordingButton]}
                onPress={toggleRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={24} color="white" />
                <Text style={styles.micText}>
                  {isRecording ? '録音中...' : '話してください'}
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  micText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});