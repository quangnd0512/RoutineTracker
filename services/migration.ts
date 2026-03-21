import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDB } from './db';
import log from './logger';

interface AsyncStorageRoutineTask {
    id: string;
    label: string;
    isFavorite: boolean;
    color?: string;
    icon?: string;
    doItAt?: 'morning' | 'afternoon' | 'evening';
    repeat?: 'daily' | 'weekly' | 'monthly';
    repeatValues?: string[];
    endDate?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

interface AsyncStorageMoodLog {
    date: string;
    moodIndex: number;
}

export async function migrateFromAsyncStorage(): Promise<void> {
    const db = await getDB();

    // Check if already migrated
    const migrated = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['migrated_from_async']
    );

    if (migrated) {
        log.info('Migration already completed, skipping');
        return;
    }

    log.info('Starting migration from AsyncStorage to SQLite');

    await db.withTransactionAsync(async () => {
        // Migrate routine tasks from candy-storage
        log.info('Migrating routine tasks...');
        const candyData = await AsyncStorage.getItem('candy-storage');
        if (candyData) {
            try {
                const parsed = JSON.parse(candyData);
                const routineTasks: AsyncStorageRoutineTask[] = parsed.state?.routineTasks || [];

                for (const task of routineTasks) {
                    await db.runAsync(
                        `INSERT INTO routine_tasks (
                            id, label, is_favorite, color, icon, do_it_at,
                            repeat, repeat_values, end_date,
                            created_at, updated_at, deleted_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            task.id,
                            task.label,
                            task.isFavorite ? 1 : 0,
                            task.color || null,
                            task.icon || null,
                            task.doItAt || null,
                            task.repeat || null,
                            task.repeatValues ? JSON.stringify(task.repeatValues) : null,
                            task.endDate || null,
                            task.createdAt || new Date().toISOString(),
                            task.updatedAt || new Date().toISOString(),
                            task.deletedAt || null,
                        ]
                    );
                }
                log.info(`Migrated ${routineTasks.length} routine tasks`);
            } catch (error) {
                log.error('Failed to migrate routine tasks', error);
            }
        }

        // Migrate task completions from RoutineTask:Finished:{date} keys
        log.info('Migrating task completions...');
        const keys = await AsyncStorage.getAllKeys();
        const finishedTaskKeys = keys.filter((key) =>
            key.startsWith('RoutineTask:Finished:')
        );

        for (const key of finishedTaskKeys) {
            try {
                const date = key.replace('RoutineTask:Finished:', '');
                const data = await AsyncStorage.getItem(key);
                if (data) {
                    const taskIds: string[] = JSON.parse(data);
                    for (const taskId of taskIds) {
                        await db.runAsync(
                            `INSERT OR IGNORE INTO task_completions (task_id, date, completed_at) VALUES (?, ?, ?)`,
                            [taskId, date, `${date}T00:00:00.000Z`]
                        );
                    }
                    log.info(`Migrated completions for date ${date}: ${taskIds.length} tasks`);
                }
            } catch (error) {
                log.error(`Failed to migrate completions for key ${key}`, error);
            }
        }

        // Migrate mood logs from mood-storage
        log.info('Migrating mood logs...');
        const moodData = await AsyncStorage.getItem('mood-storage');
        if (moodData) {
            try {
                const parsed = JSON.parse(moodData);
                const moodLogs: AsyncStorageMoodLog[] = parsed.state?.moodLogs || [];

                for (const logEntry of moodLogs) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO mood_logs (date, mood_index) VALUES (?, ?)`,
                        [logEntry.date, logEntry.moodIndex]
                    );
                }
                log.info(`Migrated ${moodLogs.length} mood logs`);
            } catch (error) {
                log.error('Failed to migrate mood logs', error);
            }
        }

        // Migrate settings from settings-storage
        log.info('Migrating settings...');
        const settingsData = await AsyncStorage.getItem('settings-storage');
        if (settingsData) {
            try {
                const parsed = JSON.parse(settingsData);
                const settings = parsed.state || {};

                for (const [key, value] of Object.entries(settings)) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
                        [key, JSON.stringify(value)]
                    );
                }
                log.info(`Migrated settings`);
            } catch (error) {
                log.error('Failed to migrate settings', error);
            }
        }

        // Mark migration as complete
        await db.runAsync(
            `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
            ['migrated_from_async', 'true']
        );
        log.info('Migration completed successfully');
    });
}
