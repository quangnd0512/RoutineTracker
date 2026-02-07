import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Icon } from '@/components/ui/icon';
import { HouseIcon, ListChecksIcon, SmilePlusIcon } from 'lucide-react-native';
import { Header } from '@/components/Header';
import i18n from '@/i18n';

export default function TabLayout() {
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
          title: i18n.t('home'),
          tabBarIcon: ({ focused }) => <Icon as={HouseIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: i18n.t('routine_tasks'),
          tabBarIcon: ({ focused }) => <Icon as={ListChecksIcon} className={colorStyle(focused)} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: i18n.t('moods'),
          tabBarIcon: ({ focused }) => <Icon as={SmilePlusIcon} className={colorStyle(focused)} />,
        }}
      />
    </Tabs>
  );
}
