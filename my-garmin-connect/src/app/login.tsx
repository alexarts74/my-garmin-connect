import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { Redirect, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const scale = useSharedValue(1);
  const passwordRef = useRef<TextInput>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
      router.replace('/');
    } catch {
      // error is handled via useAuth error state
    }
  };

  const canSubmit = email.length > 0 && password.length > 0 && !isLoading;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.form}>
          {/* Brand */}
          <View style={styles.brandBlock}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
              <SymbolView
                name={{ ios: 'figure.run', android: 'directions_run', web: 'directions_run' }}
                size={32}
                tintColor={colors.accent}
              />
            </View>
            <ThemedText style={styles.brandTitle}>My Garmin</ThemedText>
            <ThemedText
              style={styles.brandSubtitle}
              themeColor="textSecondary">
              Ton running, ton style.
            </ThemedText>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel} themeColor="textSecondary">
                Email
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundElement,
                    borderColor: emailFocused ? colors.accent : 'transparent',
                  },
                ]}
                placeholder="ton@email.com"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel} themeColor="textSecondary">
                Mot de passe
              </ThemedText>
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundElement,
                    borderColor: passwordFocused ? colors.accent : 'transparent',
                  },
                ]}
                placeholder="********"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>
          </View>

          {/* Button */}
          <AnimatedPressable
            onPress={handleLogin}
            disabled={!canSubmit}
            onPressIn={() => {
              scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            style={[
              animatedStyle,
              styles.button,
              { backgroundColor: colors.accent },
              !canSubmit && styles.buttonDisabled,
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Se connecter
              </ThemedText>
            )}
          </AnimatedPressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  form: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.five,
  },
  brandBlock: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    letterSpacing: -1,
    lineHeight: 36,
  },
  brandSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  inputGroup: {
    gap: Spacing.three,
  },
  inputWrapper: {
    gap: Spacing.one + 2,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: Spacing.one,
  },
  input: {
    borderRadius: 14,
    paddingVertical: Spacing.three + 2,
    paddingHorizontal: Spacing.three + 4,
    fontSize: 16,
    fontFamily: Fonts.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    paddingVertical: Spacing.three + 4,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  errorCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: 12,
    padding: Spacing.three,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
