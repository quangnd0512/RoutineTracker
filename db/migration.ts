import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbAddRoutineTask, dbMarkTaskDone } from './database';

const MIGRATION_FLAG = 'db_migration_v1_done';

export async function runMigrationIfNeeded(): Promise<void> {
    try {
        const done = await AsyncStorage.getItem(MIGRATION_FLAG);
        if (done === 'true') return;

        // 1. Migrate routine task definitions from Zustand persist blob
        const raw = await AsyncStorage.getItem('candy-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const tasks: any[] = parsed?.state?.routineTasks ?? [];
            for (const task of tasks) {
                try {
                    await dbAddRoutineTask({
                        ...task,
                        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                        updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
                        deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
                    });
                } catch {
                    // Skip duplicates — task may have already been inserted
                }
            }
        }

        // 2. Migrate task completion logs from date-keyed KV entries
        const allKeys = await AsyncStorage.getAllKeys();
        const finishedKeys = allKeys.filter(k => k.startsWith('RoutineTask:Finished:'));
        if (finishedKeys.length > 0) {
            const pairs = await AsyncStorage.multiGet(finishedKeys);
            for (const [key, value] of pairs) {
                if (!value) continue;
                // key format: RoutineTask:Finished:YYYY-MM-DD
                const dateStr = key.split(':').pop()!;
                const date = new Date(dateStr);
                const taskIds: string[] = JSON.parse(value);
                for (const taskId of taskIds) {
                    try {
                        await dbMarkTaskDone(taskId, date);
                    } catch {
                        // Skip if already inserted
                    }
                }
            }
        }

        // 3. Mark migration complete
        await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    } catch (err) {
        // Non-fatal: old data is lost but app remains functional
        console.error('[Migration] Migration failed:', err);
    }
}
