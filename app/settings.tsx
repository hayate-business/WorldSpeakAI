import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
  const [selectedGenre, setSelectedGenre] = useState('daily');
  const [selectedLength, setSelectedLength] = useState('standard');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');

  const handleStartConversation = () => {
    try {
      router.push('/conversation');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('エラー', '画面遷移でエラーが発生しました。もう一度お試しください。');
    }
  };

  const handleBack = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={10} style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>会話の設定</Text>
            <View style={{ width: 40 }} />
          </BlurView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.settingGroup}>
          <Text style={styles.settingTitle}>ジャンルを選択</Text>
          <View style={styles.optionGrid}>
            <TouchableOpacity
              style={[styles.optionButton, selectedGenre === 'daily' && styles.selectedOption]}
              onPress={() => setSelectedGenre('daily')}
            >
              <Ionicons 
                name="home" 
                size={32} 
                color={selectedGenre === 'daily' ? '#2196F3' : '#757575'} 
              />
              <Text style={[styles.optionText, selectedGenre === 'daily' && styles.selectedText]}>
                日常会話
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, selectedGenre === 'business' && styles.selectedOption]}
              onPress={() => setSelectedGenre('business')}
            >
              <Ionicons 
                name="briefcase" 
                size={32} 
                color={selectedGenre === 'business' ? '#2196F3' : '#757575'} 
              />
              <Text style={[styles.optionText, selectedGenre === 'business' && styles.selectedText]}>
                ビジネス
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, selectedGenre === 'tech' && styles.selectedOption]}
              onPress={() => setSelectedGenre('tech')}
            >
              <Ionicons 
                name="code-slash" 
                size={32} 
                color={selectedGenre === 'tech' ? '#2196F3' : '#757575'} 
              />
              <Text style={[styles.optionText, selectedGenre === 'tech' && styles.selectedText]}>
                システム開発
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.settingTitle}>会話の長さ</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              style={[styles.horizontalOption, selectedLength === 'standard' && styles.selectedOption]}
              onPress={() => setSelectedLength('standard')}
            >
              <View>
                <Text style={[styles.optionMainText, selectedLength === 'standard' && styles.selectedText]}>
                  スタンダード
                </Text>
                <Text style={styles.optionSubText}>10文章ずつの会話</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.horizontalOption, selectedLength === 'long' && styles.selectedOption]}
              onPress={() => setSelectedLength('long')}
            >
              <View>
                <Text style={[styles.optionMainText, selectedLength === 'long' && styles.selectedText]}>
                  長め
                </Text>
                <Text style={styles.optionSubText}>15〜20文章ずつの会話</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.settingTitle}>難易度</Text>
          <View style={styles.difficultyButtons}>
            <TouchableOpacity
              style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.selectedOption]}
              onPress={() => setSelectedDifficulty('easy')}
            >
              <Text style={styles.difficultyEmoji}>😊</Text>
              <Text style={[styles.difficultyText, selectedDifficulty === 'easy' && styles.selectedText]}>
                簡単
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.difficultyButton, selectedDifficulty === 'normal' && styles.selectedOption]}
              onPress={() => setSelectedDifficulty('normal')}
            >
              <Text style={styles.difficultyEmoji}>😎</Text>
              <Text style={[styles.difficultyText, selectedDifficulty === 'normal' && styles.selectedText]}>
                普通
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.selectedOption]}
              onPress={() => setSelectedDifficulty('hard')}
            >
              <Text style={styles.difficultyEmoji}>🔥</Text>
              <Text style={[styles.difficultyText, selectedDifficulty === 'hard' && styles.selectedText]}>
                難しい
              </Text>
            </TouchableOpacity>
          </View>
        </View>

          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartConversation}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="play" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.startButtonText}>会話を開始する</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  settingGroup: {
    marginBottom: 32,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  selectedOption: {
    borderColor: '#f093fb',
    backgroundColor: 'rgba(240, 147, 251, 0.2)',
  },
  optionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedText: {
    color: '#f093fb',
    fontWeight: '700',
  },
  optionList: {
    gap: 16,
  },
  horizontalOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
  },
  optionMainText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  optionSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  difficultyEmoji: {
    fontSize: 36,
  },
  difficultyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});