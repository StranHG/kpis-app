import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Brand } from '@/constants/theme';

const icon = (src: any) =>
  ({ color }: { color: string }) => (
    <Image source={src} style={{ width: 26, height: 26, tintColor: color }} resizeMode="contain" />
  );

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.accent,
        tabBarInactiveTintColor: Brand.subtext,
        tabBarStyle: { backgroundColor: Brand.card, borderTopColor: Brand.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: icon(require('@/assets/images/dashboard.png')),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="graficas" options={{ href: null }} />
      <Tabs.Screen
        name="reporte"
        options={{
          title: 'Reporte',
          tabBarIcon: icon(require('@/assets/images/pdf.png')),
        }}
      />
    </Tabs>
  );
}
