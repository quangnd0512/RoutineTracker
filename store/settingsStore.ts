import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import i18n from '@/i18n/index';

export type Language = 'en' | 'vi';

export interface SettingsState {
    language: Language;
    reminderTime: string; // Stored as ISO string or "HH:mm"
    setLanguage: (lang: Language) => void;
    setReminderTime: (time: Date) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'en',
            reminderTime: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            setLanguage: (lang) => {
                i18n.locale = lang;
                set({ language: lang });
            },
            setReminderTime: (time) => set({ reminderTime: time.toISOString() }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    i18n.locale = state.language;
                }
            },
        }
    )
);
