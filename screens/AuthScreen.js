import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        console.log('Attempting to sign in...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log('Sign in successful:', data.user?.email);
        // Navigation will be handled by auth state listener in _layout.tsx
      } else {
        // Sign Up
        console.log('Attempting to sign up...');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Create user profile
        if (data.user) {
          console.log('Creating user profile...');
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              display_name: null,
              primary_language_code: 'en',
              learning_language_code: 'ja',
              current_plan: 'free',
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
          }
        }

        console.log('Sign up successful:', data.user?.email);
        Alert.alert('Success', 'Account created successfully!');
        // Navigation will be handled by auth state listener in _layout.tsx
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authContainer}>
          <Text style={styles.title}>{isLogin ? 'ログイン' : '新規登録'}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="パスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'ログイン' : '登録'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.toggleText}>
              {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  authContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
});

export default AuthScreen;