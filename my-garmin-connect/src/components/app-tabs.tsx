import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accent}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="(dashboard)">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md="home"
          selectedColor={colors.accent}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trends">
        <NativeTabs.Trigger.Label>Tendances</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }}
          md="trending_up"
          selectedColor={colors.accent}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(activities)">
        <NativeTabs.Trigger.Label>Activités</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="figure.run"
          md="directions_run"
          selectedColor={colors.accent}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nutrition">
        <NativeTabs.Trigger.Label>Nutrition</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'fork.knife', selected: 'fork.knife' }}
          md="restaurant"
          selectedColor={colors.accent}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
