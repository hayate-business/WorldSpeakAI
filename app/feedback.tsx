import React from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

export default function FeedbackScreen() {
  const handleBackToHome = () => {
    router.replace('/');
  };

  const handleViewHistory = () => {
    Alert.alert(
      '会話履歴機能',
      'この機能は現在開発中です。\n\n過去の会話を確認し、学習の進捗を追跡できるようになります。',
      [{ text: 'OK' }]
    );
  };

  const scorePercentage = 75;
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>フィードバック</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>総合評価</Text>
          <View style={styles.scoreDisplay}>
            <Svg width={120} height={120} style={styles.scoreSvg}>
              <Circle
                cx={60}
                cy={60}
                r={radius}
                stroke="#E0E0E0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={60}
                cy={60}
                r={radius}
                stroke="#4CAF50"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 60 60)`}
              />
            </Svg>
            <Text style={styles.scoreText}>{scorePercentage}%</Text>
          </View>
        </View>

        <View style={styles.feedbackCategories}>
          <View style={styles.feedbackItem}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>発音</Text>
              <View style={[styles.feedbackBadge, styles.goodBadge]}>
                <Text style={styles.goodBadgeText}>Good</Text>
              </View>
            </View>
            <Text style={styles.feedbackText}>
              "work"と"productive"の発音が素晴らしかったです。"R"の音がより自然になるよう練習を続けましょう。
            </Text>
          </View>

          <View style={styles.feedbackItem}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>文法</Text>
              <View style={[styles.feedbackBadge, styles.excellentBadge]}>
                <Text style={styles.excellentBadgeText}>Excellent</Text>
              </View>
            </View>
            <Text style={styles.feedbackText}>
              時制の使い分けが正確で、文構造もしっかりしています。特に現在完了形の使い方が適切でした。
            </Text>
          </View>

          <View style={styles.feedbackItem}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>ネイティブ表現</Text>
              <View style={[styles.feedbackBadge, styles.needsPracticeBadge]}>
                <Text style={styles.needsPracticeBadgeText}>Needs Practice</Text>
              </View>
            </View>
            <Text style={styles.feedbackText}>
              より自然な表現として、"I'm doing great"の代わりに"I'm doing well"や"Pretty good"なども使ってみましょう。
            </Text>
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionTitle}>おすすめフレーズ:</Text>
              <View style={styles.suggestionList}>
                <Text style={styles.suggestionItem}>→ "I've been swamped with work"</Text>
                <Text style={styles.suggestionItem}>→ "Just unwinding after a long day"</Text>
                <Text style={styles.suggestionItem}>→ "Taking it easy"</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>会話履歴を見る</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>トップに戻る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#212121',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 16,
  },
  scoreDisplay: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSvg: {
    position: 'relative',
  },
  scoreText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  feedbackCategories: {
    marginBottom: 32,
  },
  feedbackItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
  },
  feedbackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  excellentBadge: {
    backgroundColor: '#E8F5E9',
  },
  excellentBadgeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  goodBadge: {
    backgroundColor: '#E3F2FD',
  },
  goodBadgeText: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '500',
  },
  needsPracticeBadge: {
    backgroundColor: '#FFF3E0',
  },
  needsPracticeBadgeText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 16,
    color: '#757575',
    lineHeight: 24,
  },
  suggestionBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  suggestionList: {
    gap: 4,
  },
  suggestionItem: {
    fontSize: 15,
    color: '#757575',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});