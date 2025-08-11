import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CandyContext } from "@/store/context";
import { useRef } from "react";
import { candyStore } from "@/store/candyStore";

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

  if (!loaded) {
    // Async font loading only occurs in development.
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
