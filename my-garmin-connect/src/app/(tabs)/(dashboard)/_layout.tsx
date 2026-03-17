import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardLayout() {
  const colors = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: '',
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="training-load"
        options={{
          headerShown: true,
          headerTitle: 'Training Load',
        }}
      />
      <Stack.Screen
        name="sleep"
        options={{
          headerShown: true,
          headerTitle: 'Sommeil',
        }}
      />
    </Stack>
  );
}
