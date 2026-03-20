import * as SQLite from 'expo-sqlite';
import { RoutineTask } from '@/store/candyStore';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!_db) {
        _db = await SQLite.openDatabaseAsync('routine_tracker.db');
    }
    return _db;
}

export async function initDB(): Promise<void> {
    const db = await getDB();
    await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS routine_tasks (
            id            TEXT PRIMARY KEY,
            label         TEXT NOT NULL,
            is_favorite   INTEGER NOT NULL DEFAULT 0,
            color         TEXT,
            icon          TEXT,
            do_it_at      TEXT,
            repeat        TEXT,
            repeat_values TEXT,
            end_date      TEXT,
            created_at    TEXT,
            updated_at    TEXT,
            deleted_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS task_completions (
            task_id  TEXT NOT NULL,
            date     TEXT NOT NULL,
            PRIMARY KEY (task_id, date)
        );
    `);
}

function rowToRoutineTask(row: any): RoutineTask {
    return {
        id: row.id,
        label: row.label,
        isFavorite: row.is_favorite === 1,
        color: row.color ?? undefined,
        icon: row.icon ?? undefined,
        doItAt: row.do_it_at ?? undefined,
        repeat: row.repeat ?? undefined,
        repeatValues: row.repeat_values ? JSON.parse(row.repeat_values) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : null,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
}

// ─── routine_tasks CRUD ───────────────────────────────────────────────────────

export async function dbGetAllRoutineTasks(): Promise<RoutineTask[]> {
    const db = await getDB();
    const rows = await db.getAllAsync('SELECT * FROM routine_tasks');
    return rows.map(rowToRoutineTask);
}

export async function dbAddRoutineTask(task: RoutineTask): Promise<void> {
    const db = await getDB();
    await db.runAsync(
        `INSERT INTO routine_tasks
         (id, label, is_favorite, color, icon, do_it_at, repeat, repeat_values, end_date, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            task.id,
            task.label,
            task.isFavorite ? 1 : 0,
            task.color ?? null,
            task.icon ?? null,
            task.doItAt ?? null,
            task.repeat ?? null,
            task.repeatValues ? JSON.stringify(task.repeatValues) : null,
            task.endDate ? (task.endDate instanceof Date ? task.endDate.toISOString() : task.endDate) : null,
            task.createdAt ? (task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt) : new Date().toISOString(),
            task.updatedAt ? (task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt) : new Date().toISOString(),
            task.deletedAt ? (task.deletedAt instanceof Date ? task.deletedAt.toISOString() : task.deletedAt) : null,
        ]
    );
}

export async function dbUpdateRoutineTask(taskId: string, patch: Partial<RoutineTask>): Promise<void> {
    const db = await getDB();

    const fieldMap: Record<string, string> = {
        label: 'label',
        isFavorite: 'is_favorite',
        color: 'color',
        icon: 'icon',
        doItAt: 'do_it_at',
        repeat: 'repeat',
        repeatValues: 'repeat_values',
        endDate: 'end_date',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    };

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, col] of Object.entries(fieldMap)) {
        if (!(key in patch)) continue;

        setClauses.push(`${col} = ?`);
        let val = (patch as any)[key];

        if (key === 'isFavorite') {
            val = val ? 1 : 0;
        } else if (key === 'repeatValues') {
            val = val ? JSON.stringify(val) : null;
        } else if (val instanceof Date) {
            val = val.toISOString();
        }

        values.push(val ?? null);
    }

    if (setClauses.length === 0) return;
    values.push(taskId);

    await db.runAsync(
        `UPDATE routine_tasks SET ${setClauses.join(', ')} WHERE id = ?`,
        values
    );
}

export async function dbSoftDeleteRoutineTask(taskId: string): Promise<void> {
    const db = await getDB();
    await db.runAsync(
        'UPDATE routine_tasks SET deleted_at = ? WHERE id = ?',
        [new Date().toISOString(), taskId]
    );
}

// ─── task_completions helpers ─────────────────────────────────────────────────

export async function dbMarkTaskDone(taskId: string, date: Date): Promise<void> {
    const db = await getDB();
    const dateStr = date.toISOString().split('T')[0];
    await db.runAsync(
        'INSERT OR IGNORE INTO task_completions (task_id, date) VALUES (?, ?)',
        [taskId, dateStr]
    );
}

export async function dbUnmarkTaskDone(taskId: string, date: Date): Promise<void> {
    const db = await getDB();
    const dateStr = date.toISOString().split('T')[0];
    await db.runAsync(
        'DELETE FROM task_completions WHERE task_id = ? AND date = ?',
        [taskId, dateStr]
    );
}

export async function dbGetDoneTaskIds(date: Date): Promise<string[]> {
    const db = await getDB();
    const dateStr = date.toISOString().split('T')[0];
    const rows = await db.getAllAsync<{ task_id: string }>(
        'SELECT task_id FROM task_completions WHERE date = ?',
        [dateStr]
    );
    return rows.map(r => r.task_id);
}

export async function dbGetDoneTaskIdsForDates(dates: Date[]): Promise<string[][]> {
    if (dates.length === 0) return [];
    const db = await getDB();
    const dateStrs = dates.map(d => d.toISOString().split('T')[0]);
    const placeholders = dateStrs.map(() => '?').join(', ');
    const rows = await db.getAllAsync<{ task_id: string; date: string }>(
        `SELECT task_id, date FROM task_completions WHERE date IN (${placeholders})`,
        dateStrs
    );
    return dateStrs.map(dateStr =>
        rows.filter(r => r.date === dateStr).map(r => r.task_id)
    );
}

export async function dbGetCompletionRatesForDates(
    dates: Date[],
    totalTasks: number
): Promise<number[]> {
    if (dates.length === 0 || totalTasks === 0) return dates.map(() => 0);
    const db = await getDB();
    const dateStrs = dates.map(d => d.toISOString().split('T')[0]);
    const placeholders = dateStrs.map(() => '?').join(', ');
    const rows = await db.getAllAsync<{ date: string; done_count: number }>(
        `SELECT date, COUNT(*) as done_count FROM task_completions WHERE date IN (${placeholders}) GROUP BY date`,
        dateStrs
    );
    const countMap = new Map(rows.map(r => [r.date, r.done_count]));
    return dateStrs.map(dateStr => {
        const count = countMap.get(dateStr) ?? 0;
        return count / totalTasks;
    });
}
