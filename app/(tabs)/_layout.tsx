import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Icon } from '@/components/ui/icon';
import { HouseIcon, ListChecksIcon, SendHorizonalIcon } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const colorStyle = (focused: boolean) => {
    return focused ? "text-[#0a7ea4]" : "text-[#8E8E8F]";
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          tabBarIcon: ({ focused }) => <Icon as={HouseIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'Routine Tasks',
          headerShown: true,
          tabBarIcon: ({ focused }) => <Icon as={ListChecksIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: true,
          tabBarIcon: ({ focused }) => <Icon as={SendHorizonalIcon} className={colorStyle(focused)} />,
        }}
      />
    </Tabs>
  );
}
