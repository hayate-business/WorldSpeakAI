<<<<<<< HEAD
import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { profileService } from '@/src/services/profile.service';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    primaryLanguage: 'ja',
    learningLanguage: 'en',
  });
  const [languages, setLanguages] = useState<any[]>([]);
  const [showLanguagePicker, setShowLanguagePicker] = useState<'primary' | 'learning' | null>(null);

  React.useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    const { data } = await profileService.getLanguages();
    if (data) {
      setLanguages(data);
    }
  };

  const handleAuth = async () => {
    if (loading) return;

    if (!formData.email || !formData.password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('エラー', 'パスワードが一致しません。');
        return;
      }

      if (!formData.displayName) {
        Alert.alert('エラー', '表示名を入力してください。');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          primaryLanguageCode: formData.primaryLanguage,
          learningLanguageCode: formData.learningLanguage,
        });

        if (error) {
          Alert.alert('エラー', error);
        } else {
          Alert.alert('成功', 'アカウントが作成されました。確認メールをチェックしてください。');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          Alert.alert('エラー', error);
        } else {
          router.replace('/');
        }
      }
    } catch (error) {
      Alert.alert('エラー', '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? `${lang.flag_emoji} ${lang.name}` : code;
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
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? 'アカウント作成' : 'ログイン'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'WorldSpeak AIへようこそ' : 'おかえりなさい'}
              </Text>
            </View>

            <BlurView intensity={15} style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="パスワード"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />

              {isSignUp && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="パスワード確認"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="表示名"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={formData.displayName}
                    onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                  />

                  <TouchableOpacity
                    style={styles.languageSelector}
                    onPress={() => setShowLanguagePicker('primary')}
                  >
                    <Text style={styles.languageLabel}>第一言語</Text>
                    <View style={styles.languageValue}>
                      <Text style={styles.languageText}>
                        {getLanguageName(formData.primaryLanguage)}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="white" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.languageSelector}
                    onPress={() => setShowLanguagePicker('learning')}
                  >
                    <Text style={styles.languageLabel}>学習言語</Text>
                    <View style={styles.languageValue}>
                      <Text style={styles.languageText}>
                        {getLanguageName(formData.learningLanguage)}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="white" />
                    </View>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.authButton, loading && styles.authButtonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.authButtonText}>
                    {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchButtonText}>
                  {isSignUp
                    ? 'すでにアカウントをお持ちですか？ ログイン'
                    : 'アカウントをお持ちでない方は こちら'
                  }
                </Text>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>

          {/* Language Picker Modal */}
          {showLanguagePicker && (
            <View style={styles.modalOverlay}>
              <BlurView intensity={20} style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {showLanguagePicker === 'primary' ? '第一言語を選択' : '学習言語を選択'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowLanguagePicker(null)}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.languageList}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={styles.languageOption}
                      onPress={() => {
                        if (showLanguagePicker === 'primary') {
                          setFormData({ ...formData, primaryLanguage: lang.code });
                        } else {
                          setFormData({ ...formData, learningLanguage: lang.code });
                        }
                        setShowLanguagePicker(null);
                      }}
                    >
                      <Text style={styles.languageOptionText}>
                        {lang.flag_emoji} {lang.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    borderRadius: 20,
    padding: 30,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  languageValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageText: {
    color: 'white',
    fontSize: 16,
  },
  authButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageOptionText: {
    color: 'white',
    fontSize: 16,
  },
});
=======
import AuthScreen from '../screens/AuthScreen';

export default AuthScreen;
>>>>>>> feature/login-functionality
