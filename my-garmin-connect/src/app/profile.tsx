import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useTheme, useThemeMode } from '@/hooks/use-theme';
import type { ThemeMode } from '@/hooks/use-theme';
import { formatPace } from '@/lib/format';

export default function ProfileScreen() {
  const { isAuthenticated, isLoading: authLoading, email, logout } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile();
  const colors = useTheme();
  const { mode, setMode } = useThemeMode();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (authLoading) {
    return (
      <ThemedView type="background" style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (profileLoading && !profile) {
    return (
      <ThemedView type="background" style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const initials = profile?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <ThemedView type="background" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Close button */}
        <View style={styles.closeRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}>
            <SymbolView name="xmark" size={16} tintColor={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              {profile?.profileImageUrl ? (
                <Image
                  source={{ uri: profile.profileImageUrl }}
                  style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                  <ThemedText style={[styles.initials, { color: colors.accent }]}>
                    {initials}
                  </ThemedText>
                </View>
              )}
              {profile?.fullName && (
                <ThemedText type="subtitle">{profile.fullName}</ThemedText>
              )}
              {profile?.displayName && (
                <ThemedText type="small" themeColor="textSecondary">
                  @{profile.displayName}
                </ThemedText>
              )}
              {profile?.location && (
                <ThemedText type="small" themeColor="textSecondary">
                  {profile.location}
                </ThemedText>
              )}
            </View>

            {/* Level Badge */}
            {profile?.userLevel != null && (
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                  <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
                    Niveau {profile.userLevel}
                    {profile.userPoint != null ? ` · ${profile.userPoint} pts` : ''}
                  </ThemedText>
                </View>
                {profile.userPro && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <ThemedText style={[styles.badgeText, { color: '#fff' }]}>
                      PRO
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Runner Stats */}
            {(profile?.vo2MaxRunning != null || profile?.weight != null || profile?.height != null || profile?.runningTrainingSpeed != null) && (
              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                  STATS RUNNER
                </ThemedText>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.statsGrid}>
                    <StatItem
                      label="VO2 Max"
                      value={profile?.vo2MaxRunning != null ? `${profile.vo2MaxRunning}` : '--'}
                    />
                    <StatItem
                      label="Poids"
                      value={profile?.weight != null ? `${profile.weight}` : '--'}
                      unit="kg"
                    />
                    <StatItem
                      label="Taille"
                      value={profile?.height != null ? `${profile.height}` : '--'}
                      unit="cm"
                    />
                    <StatItem
                      label="Allure"
                      value={profile?.runningTrainingSpeed != null ? formatPace(profile.runningTrainingSpeed) : '--'}
                    />
                  </View>
                </ThemedView>
              </View>
            )}

            {/* Appearance */}
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                APPARENCE
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.themeRow}>
                  {([
                    { key: 'system' as ThemeMode, label: 'Système' },
                    { key: 'light' as ThemeMode, label: 'Clair' },
                    { key: 'dark' as ThemeMode, label: 'Sombre' },
                  ]).map((option) => {
                    const isActive = mode === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => setMode(option.key)}
                        style={({ pressed }) => [
                          styles.themeButton,
                          {
                            backgroundColor: isActive ? colors.accent : colors.backgroundSelected,
                          },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <ThemedText
                          style={[
                            styles.themeButtonText,
                            { color: isActive ? '#fff' : colors.text },
                          ]}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </ThemedView>
            </View>

            {/* Account */}
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                COMPTE
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.infoRow}>
                  <ThemedText type="small" themeColor="textSecondary">Email</ThemedText>
                  <ThemedText>{email ?? '—'}</ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.background }]} />
                <View style={styles.infoRow}>
                  <ThemedText type="small" themeColor="textSecondary">Version</ThemedText>
                  <ThemedText>{appVersion}</ThemedText>
                </View>
              </ThemedView>
            </View>

            {/* Logout */}
            <View style={styles.logoutContainer}>
              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  { backgroundColor: colors.backgroundElement },
                  pressed && { opacity: 0.6 },
                ]}>
                <ThemedText style={styles.logoutText}>Se déconnecter</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatItem({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statItem}>
      <ThemedText style={styles.statValue}>
        {value}
        {unit ? <ThemedText style={styles.statUnit}> {unit}</ThemedText> : null}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  initials: {
    fontSize: 32,
    fontFamily: Fonts.bold,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
    overflow: 'visible',
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.mono,
  },
  statUnit: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  themeButton: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    borderRadius: 10,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  infoRow: {
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  logoutContainer: {
    paddingTop: Spacing.three,
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  logoutText: {
    color: '#E74C3C',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
});
