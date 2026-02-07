import React from 'react';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsIcon } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

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
          
          <Link href="/settings" asChild>
            <Pressable>
              <Box className="h-10 w-10 bg-white rounded-full items-center justify-center border border-gray-200">
                <Icon as={SettingsIcon} className="text-gray-400 w-5 h-5" />
              </Box>
            </Pressable>
          </Link>
        </Box>
      </SafeAreaView>
    </Box>
  );
};
