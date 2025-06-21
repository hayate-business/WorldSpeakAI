import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { profileService, UserStatistics } from '@/src/services/profile.service';
import { subscriptionService } from '@/src/services/subscription.service';

export default function ProfileScreen() {
  const { user, signOut, userProfile } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load statistics
      const { data: stats } = await profileService.getUserStatistics(user.id);
      if (stats) {
        setStatistics(stats);
        
        // Load plan details
        const { data: plan } = await subscriptionService.getPlanDetails(stats.current_plan);
        if (plan) {
          setPlanDetails(plan);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const getUsagePercentage = (): number => {
    if (!statistics || !planDetails) return 0;
    return Math.min(100, (statistics.current_month_seconds / planDetails.monthly_seconds_limit) * 100);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>プロフィール</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </BlurView>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* User Info */}
            <BlurView intensity={15} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="white" />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {userProfile?.display_name || user?.email}
                  </Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planText}>
                      {statistics?.current_plan === 'free' ? '無料プラン' :
                       statistics?.current_plan === 'premium' ? 'プレミアムプラン' :
                       statistics?.current_plan === 'pro' ? 'プロプラン' : 'プラン'}
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>

            {/* Usage Stats */}
            <BlurView intensity={15} style={styles.statsCard}>
              <Text style={styles.cardTitle}>今月の使用状況</Text>
              
              <View style={styles.usageBar}>
                <View style={styles.usageBackground}>
                  <View 
                    style={[
                      styles.usageProgress, 
                      { width: `${getUsagePercentage()}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.usageText}>
                  {formatTime(statistics?.current_month_seconds || 0)} / {formatTime(planDetails?.monthly_seconds_limit || 0)}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{statistics?.total_conversations || 0}</Text>
                  <Text style={styles.statLabel}>総会話数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{statistics?.total_messages || 0}</Text>
                  <Text style={styles.statLabel}>総メッセージ</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{statistics?.favorite_messages_count || 0}</Text>
                  <Text style={styles.statLabel}>お気に入り</Text>
                </View>
              </View>
            </BlurView>

            {/* Quick Actions */}
            <BlurView intensity={15} style={styles.actionsCard}>
              <Text style={styles.cardTitle}>設定</Text>
              
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => router.push('/subscription')}
              >
                <View style={styles.actionContent}>
                  <Ionicons name="diamond-outline" size={24} color="#f093fb" />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>サブスクリプション</Text>
                    <Text style={styles.actionSubtitle}>プランの管理</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionContent}>
                  <Ionicons name="language-outline" size={24} color="#4facfe" />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>言語設定</Text>
                    <Text style={styles.actionSubtitle}>第一言語・学習言語</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionContent}>
                  <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>通知設定</Text>
                    <Text style={styles.actionSubtitle}>プッシュ通知の管理</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionContent}>
                  <Ionicons name="help-circle-outline" size={24} color="#FF9800" />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>ヘルプ・サポート</Text>
                    <Text style={styles.actionSubtitle}>よくある質問・お問い合わせ</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </BlurView>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut}>
              <Text style={styles.signOutText}>ログアウト</Text>
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
  signOutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  userCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: 'rgba(240, 147, 251, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  planText: {
    color: '#f093fb',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  usageBar: {
    marginBottom: 20,
  },
  usageBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  usageProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  usageText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signOutCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  signOutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});