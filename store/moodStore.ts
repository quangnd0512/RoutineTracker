import { create } from 'zustand';
import { getDB } from '@/services/db';

export type MoodType = 'Great' | 'Good' | 'Okay' | 'Not Good' | 'Bad';

export interface MoodLog {
    date: string; // YYYY-MM-DD
    moodIndex: number; // 0 to 4 corresponding to Emojis
}

export interface MoodState {
    moodLogs: MoodLog[];
    initialize: () => Promise<void>;
    addMoodLog: (log: MoodLog) => Promise<void>;
    getMoodLog: (date: string) => MoodLog | undefined;
}

export const useMoodStore = create<MoodState>()((set, get) => ({
    moodLogs: [],

    initialize: async () => {
        const db = await getDB();
        const rows = await db.getAllAsync<{ date: string; mood_index: number }>(
            'SELECT date, mood_index FROM mood_logs ORDER BY date'
        );
        const moodLogs: MoodLog[] = rows.map((row) => ({
            date: row.date,
            moodIndex: row.mood_index,
        }));
        set({ moodLogs });
    },

    addMoodLog: async (log) => {
        const db = await getDB();
        await db.runAsync(
            'INSERT OR REPLACE INTO mood_logs (date, mood_index) VALUES (?, ?)',
            [log.date, log.moodIndex]
        );
        set((state) => {
            const filteredLogs = state.moodLogs.filter((l) => l.date !== log.date);
            return { moodLogs: [...filteredLogs, log] };
        });
    },

    getMoodLog: (date) => {
        const found = get().moodLogs.find((l) => l.date === date);
        if (found) return found;

        // Lazy-load from DB if not in memory
        getDB()
            .then((db) =>
                db.getFirstAsync<{ date: string; mood_index: number }>(
                    'SELECT date, mood_index FROM mood_logs WHERE date = ?',
                    [date]
                )
            )
            .then((row) => {
                if (row) {
                    const log: MoodLog = { date: row.date, moodIndex: row.mood_index };
                    set((state) => {
                        if (state.moodLogs.some((l) => l.date === date)) return state;
                        return { moodLogs: [...state.moodLogs, log] };
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to load mood log from DB:', err);
            });

        return undefined;
    },
}));
