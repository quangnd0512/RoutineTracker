import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MoodType = 'Great' | 'Good' | 'Okay' | 'Not Good' | 'Bad';

export interface MoodLog {
    date: string; // YYYY-MM-DD
    moodIndex: number; // 0 to 4 corresponding to Emojis
}

export interface MoodState {
    moodLogs: MoodLog[];
    addMoodLog: (log: MoodLog) => void;
    getMoodLog: (date: string) => MoodLog | undefined;
}

export const useMoodStore = create<MoodState>()(
    persist(
        (set, get) => ({
            moodLogs: [],
            addMoodLog: (log) =>
                set((state) => {
                    // Remove existing log for same date if any
                    const filteredLogs = state.moodLogs.filter((l) => l.date !== log.date);
                    return { moodLogs: [...filteredLogs, log] };
                }),
            getMoodLog: (date) => get().moodLogs.find((l) => l.date === date),
        }),
        {
            name: 'mood-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
