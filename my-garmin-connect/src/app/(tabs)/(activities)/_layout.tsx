import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/hooks/use-theme';

export default function ActivitiesLayout() {
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
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: 'Activity',
        }}
      />
    </Stack>
  );
}
