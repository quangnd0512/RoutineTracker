import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Icon } from '@/components/ui/icon';
import { HouseIcon, ListChecksIcon, SmilePlusIcon } from 'lucide-react-native';
import { Header } from '@/components/Header';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const colorStyle = (focused: boolean) => {
    return focused ? "text-[#8882e7]" : "text-[#8E8E8F]";
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#8882e7",
        headerShown: true,
        header: ({ options }) => <Header title={options.title ?? ''} />,
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
          tabBarIcon: ({ focused }) => <Icon as={HouseIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'Routine Tasks',
          tabBarIcon: ({ focused }) => <Icon as={ListChecksIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Moods',
          tabBarIcon: ({ focused }) => <Icon as={SmilePlusIcon} className={colorStyle(focused)} />,
        }}
      />
    </Tabs>
  );
}
