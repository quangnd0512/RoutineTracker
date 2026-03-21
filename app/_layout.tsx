import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CandyContext } from "@/store/context";
import { useEffect, useRef, useState } from "react";
import { candyStore } from "@/store/candyStore";
import { useMoodStore } from "@/store/moodStore";
import { useSettingsStore } from "@/store/settingsStore";
import { scheduleNotificationsForRoutineTasks, setupNotificationHandler } from "@/services/notification";
import { Platform } from "react-native";
import log from "@/services/logger";
import { getDB } from "@/services/db";
import { migrateFromAsyncStorage } from "@/services/migration";

type CandyProviderProps = React.PropsWithChildren<{}>;

function CandyProvider({ children }: CandyProviderProps) {
  // Zustand store or any other state management logic can be initialized here
  const store = useRef(candyStore).current;

  return (
    <CandyContext.Provider value={store}>
      {children}
    </CandyContext.Provider>
  );
}


export default function RootLayout() {
  // const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Open DB and run migrations
        log.info("Initializing database...");
        await getDB();

        // Step 2: Migrate old AsyncStorage data if needed
        log.info("Running data migration...");
        await migrateFromAsyncStorage();

        // Step 3: Initialize stores
        log.info("Initializing stores...");
        await candyStore.getState().initialize();
        await useMoodStore.getState().initialize();
        await useSettingsStore.getState().loadSettings();

        setIsReady(true);
      } catch (error) {
        log.error("App initialization failed:", error);
        // Don't crash - allow app to continue even if migration fails
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (Platform.OS !== "web") {
      log.info("Setting up notification handler");
      setupNotificationHandler();
      // const unsubscribe = candyStore.subscribe(() => {
      //   scheduleNotificationsForRoutineTasks();
      // });
      
      scheduleNotificationsForRoutineTasks();

      return () => {
        // unsubscribe();
      };
    }
  }, [isReady]);

  if (!loaded || !isReady) {
    // Async font loading only occurs in development.
    // Block rendering until DB is ready and migration is complete.
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <CandyProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </CandyProvider>
    </GluestackUIProvider>
  );
}
