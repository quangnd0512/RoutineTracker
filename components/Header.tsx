import React from 'react';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settingsStore';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  vi: 'vi-VN',
};

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const language = useSettingsStore((state) => state.language);
  const locale = LOCALE_MAP[language] ?? 'en-US';
  const date = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <Box className="bg-white">
      <SafeAreaView edges={['top']} className="bg-white">
        <Box className="px-6 pb-4 pt-2 flex-row items-center justify-between">
          <VStack>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              {date}
            </Text>
            <Text size="3xl" className="font-black text-gray-900 tracking-tight leading-none">
              {title}
            </Text>
          </VStack>
        </Box>
      </SafeAreaView>
    </Box>
  );
};
