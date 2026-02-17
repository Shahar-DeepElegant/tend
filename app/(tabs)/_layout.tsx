import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Up Next',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'list-alt' : 'list'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'yard' : 'grass'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaf-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="watering"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
