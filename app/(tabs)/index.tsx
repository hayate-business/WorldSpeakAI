import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTranslation } from '@/src/services/translation.service';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const handleStartConversation = () => {
    try {
      if (!user) {
        router.push('/auth');
        return;
      }
      router.push('/settings');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleProfilePress = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    router.push('/profile');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.backgroundGradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View style={styles.welcomeSection}>
                {user ? (
                  <Text style={styles.welcomeText}>
                    おかえりなさい
                  </Text>
                ) : (
                  <Text style={styles.welcomeText}>ようこそ</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
                <Ionicons name={user ? "person-circle" : "log-in"} size={32} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
              <BlurView intensity={20} style={styles.logoBlur}>
                <View style={styles.logo}>
                  <Ionicons name="chatbubbles-outline" size={60} color="white" />
                </View>
              </BlurView>
            </View>
            <Text style={styles.appTitle}>WorldSpeak AI</Text>
            <Text style={styles.appSubtitle}>{t('app.subtitle', 'AIと英会話の練習ができる')}</Text>
            <Text style={styles.appDescription}>{t('app.description', '今までにないAI特化型英会話アプリ')}</Text>
          </View>

          <BlurView intensity={15} style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                  <Ionicons name="layers-outline" size={28} color="#4CAF50" />
                </View>
                <Text style={styles.featureText}>レベル別学習</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
                  <Ionicons name="checkmark-circle-outline" size={28} color="#FF9800" />
                </View>
                <Text style={styles.featureText}>即時フィードバック</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                  <Ionicons name="mic-outline" size={28} color="#2196F3" />
                </View>
                <Text style={styles.featureText}>AIネイティブ発音</Text>
              </View>
            </View>
          </BlurView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartConversation}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="arrow-forward" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.startButtonText}>
                  {user ? t('button.start_conversation', 'AIと英会話を始める') : 'ログイン / 新規登録'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  profileButton: {
    padding: 4,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBlur: {
    borderRadius: 60,
    overflow: 'hidden',
  },
  logo: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  appDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
  featuresContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    fontSize: 13,
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    flex: 1,
    justifyContent: 'flex-end',
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
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
