import { create } from 'zustand';
import i18n from '@/i18n/index';
import { getDB } from '@/services/db';

export type Language = 'en' | 'vi';

export interface SettingsState {
    language: Language;
    reminderTime: string; // Stored as ISO string or "HH:mm"
    isLoaded: boolean;
    setLanguage: (lang: Language) => void;
    setReminderTime: (time: Date) => void;
    loadSettings: () => Promise<void>;
}

const DEFAULT_LANGUAGE: Language = 'en';
const DEFAULT_REMINDER_TIME = new Date(new Date().setHours(8, 0, 0, 0)).toISOString();

export const useSettingsStore = create<SettingsState>()((set, get) => ({
    language: DEFAULT_LANGUAGE,
    reminderTime: DEFAULT_REMINDER_TIME,
    isLoaded: false,

    setLanguage: async (lang) => {
        const db = await getDB();
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['language', lang]);
        i18n.locale = lang;
        set({ language: lang });
    },

    setReminderTime: async (time) => {
        const db = await getDB();
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['reminderTime', time.toISOString()]);
        set({ reminderTime: time.toISOString() });
    },

    loadSettings: async () => {
        const db = await getDB();

        const languageRow = await db.getFirstAsync<{ value: string }>(
            'SELECT value FROM settings WHERE key = ?',
            ['language']
        );

        const reminderTimeRow = await db.getFirstAsync<{ value: string }>(
            'SELECT value FROM settings WHERE key = ?',
            ['reminderTime']
        );

        const language = (languageRow?.value as Language) || DEFAULT_LANGUAGE;
        const reminderTime = reminderTimeRow?.value || DEFAULT_REMINDER_TIME;

        i18n.locale = language;
        set({
            language,
            reminderTime,
            isLoaded: true,
        });
    },
}));
