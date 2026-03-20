import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CandyContext } from "@/store/context";
import { useEffect, useRef, useState } from "react";
import { candyStore } from "@/store/candyStore";
import { scheduleNotificationsForRoutineTasks, setupNotificationHandler } from "@/services/notification";
import { Platform } from "react-native";
import log from "@/services/logger";
import { initDB, dbGetAllRoutineTasks } from "@/db/database";
import { runMigrationIfNeeded } from "@/db/migration";

type CandyProviderProps = React.PropsWithChildren<{}>;

function CandyProvider({ children }: CandyProviderProps) {
    const store = useRef(candyStore).current;

    return (
        <CandyContext.Provider value={store}>
            {children}
        </CandyContext.Provider>
    );
}


export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        initDB()
            .then(() => runMigrationIfNeeded())
            .then(() => dbGetAllRoutineTasks())
            .then((tasks) => {
                candyStore.getState().loadRoutineTasks(tasks);
                setDbReady(true);
            })
            .catch((err) => {
                log.error('[RootLayout] DB init failed', err);
                setDbReady(true); // still render, just with empty tasks
            });
    }, []);

    useEffect(() => {
        if (Platform.OS !== "web") {
            log.info("Setting up notification handler");
            setupNotificationHandler();
            scheduleNotificationsForRoutineTasks();
        }
    }, []);

    if (!loaded || !dbReady) return null;

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
