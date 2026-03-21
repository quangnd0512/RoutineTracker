import { RoutineTask } from "@/store/candyStore";
import log from "./logger";
import { useSettingsStore } from "@/store/settingsStore";
import { getDB } from "@/services/db";

export interface UserRoutineTask extends RoutineTask {
  isDone: boolean;
}

export class RoutineTaskService {
  public static async getFilteredRoutineTasks(
    routineTasks: RoutineTask[],
    onDate: Date | null = null,
  ): Promise<UserRoutineTask[]> {
    log.info("[RoutineTaskService] Filtering routine tasks", {
      routineTasks,
      onDate,
    });
    const finishedRoutineTaskIds = await this.getFinishedRoutineTasks(onDate);

    let filteredRoutineTasks = routineTasks
      .filter((task) => {
        if (task.deletedAt === null || task.deletedAt === undefined) {
          return true;
        }
        if (onDate !== null && new Date(task.deletedAt) >= new Date(onDate)) {
          return true;
        }

        return false;
      })
      .map((task) => ({
        ...task,
        isDone: finishedRoutineTaskIds.includes(task.id),
      }));

    return filteredRoutineTasks;
  }

  public static async markFinishedRoutineTask(
    onDate: Date,
    taskId: string,
    _totalTasksCount?: number,
  ): Promise<void> {
    log.info(
      `[RoutineTaskService] Marking finished routine task: ${taskId} - ${onDate}`,
    );
    const db = await getDB();
    const dateStr = onDate.toISOString().split("T")[0];
    const completedAt = new Date().toISOString();

    try {
      await db.runAsync(
        "INSERT OR IGNORE INTO task_completions (task_id, date, completed_at) VALUES (?, ?, ?)",
        [taskId, dateStr, completedAt],
      );
    } catch (error) {
      log.error("[RoutineTaskService] Error setting finished routine task", {
        error,
      });
    }
  }

  public static async deleteFinishedRoutineTask(
    onDate: Date,
    taskId: string,
    _totalTasksCount?: number,
  ): Promise<void> {
    log.info(
      `[RoutineTaskService] Deleting finished routine task: ${taskId} - ${onDate}`,
    );
    const db = await getDB();
    const dateStr = onDate.toISOString().split("T")[0];

    try {
      await db.runAsync(
        "DELETE FROM task_completions WHERE task_id = ? AND date = ?",
        [taskId, dateStr],
      );
    } catch (error) {
      log.error("[RoutineTaskService] Error deleting finished routine task", {
        error,
      });
    }
  }

  public static async getFinishedRoutineTasks(
    onDate: Date | null = new Date(),
  ): Promise<string[]> {
    log.info("[RoutineTaskService] Getting finished routine tasks", { onDate });

    if (!onDate) {
      return [];
    }

    const db = await getDB();
    const dateStr = onDate.toISOString().split("T")[0];

    try {
      const results = await db.getAllAsync<{ task_id: string }>(
        "SELECT task_id FROM task_completions WHERE date = ?",
        [dateStr],
      );
      return results.map((row) => row.task_id);
    } catch (error) {
      log.error("[RoutineTaskService] Error getting finished routine tasks", {
        error,
      });
      return [];
    }
  }

  public static async getFinishedRoutineTasksForDates(
    dates: Date[],
  ): Promise<string[][]> {
    log.info("[RoutineTaskService] Getting finished routine tasks for dates", {
      count: dates.length,
    });

    if (dates.length === 0) {
      return [];
    }

    const db = await getDB();
    const dateStrings = dates.map((d) => d.toISOString().split("T")[0]);
    const placeholders = dateStrings.map(() => "?").join(", ");

    try {
      const results = await db.getAllAsync<{ date: string; task_id: string }>(
        `SELECT date, task_id FROM task_completions WHERE date IN (${placeholders})`,
        dateStrings,
      );

      // Group task_ids by date
      const tasksByDate = new Map<string, string[]>();
      for (const dateStr of dateStrings) {
        tasksByDate.set(dateStr, []);
      }
      for (const row of results) {
        const existing = tasksByDate.get(row.date) || [];
        existing.push(row.task_id);
        tasksByDate.set(row.date, existing);
      }

      // Return in same order as input dates
      return dateStrings.map((dateStr) => tasksByDate.get(dateStr) || []);
    } catch (error) {
      log.error(
        "[RoutineTaskService] Error getting batch finished routine tasks",
        { error },
      );
      // Return empty arrays for all requested dates in case of error
      return dates.map(() => []);
    }
  }

  public static async getFinishedRoutineTaskRatesForDates(
    onDates: Date[],
  ): Promise<number[]> {
    log.info(
      "[RoutineTaskService] Getting finished routine task rates for dates",
      {
        count: onDates.length,
      },
    );

    if (onDates.length === 0) {
      return [];
    }

    const db = await getDB();
    const dateStrings = onDates.map((d) => d.toISOString().split("T")[0]);

    try {
      const results: number[] = [];

      for (const dateStr of dateStrings) {
        const result = await db.getFirstAsync<{
          completion_rate: number | null;
        }>(
          `SELECT
            COUNT(tc.id) * 1.0 / COUNT(rt.id) AS completion_rate
          FROM routine_tasks rt
          LEFT JOIN task_completions tc
            ON tc.task_id = rt.id AND tc.date = ?
          WHERE rt.deleted_at IS NULL`,
          [dateStr],
        );
        results.push(result?.completion_rate ?? 0);
      }

      return results;
    } catch (error) {
      log.error(
        "[RoutineTaskService] Error getting batch finished routine task rates",
        { error },
      );
      // Return zero rates for all requested dates in case of error
      return onDates.map(() => 0);
    }
  }

  public static async finishRoutineTask(taskId: string): Promise<void> {
    log.info(`[RoutineTaskService] Finishing routine task: ${taskId}`);
    const onDate = new Date();
    await this.markFinishedRoutineTask(onDate, taskId);
  }

  public static getDailyReminderTime(): Date | null {
    try {
      const reminderTime = useSettingsStore.getState().reminderTime;
      if (reminderTime) {
        const parsedDate = new Date(reminderTime);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }

        const hours = parsedDate.getHours();
        const minutes = parsedDate.getMinutes();

        if (!isNaN(hours) && !isNaN(minutes)) {
          log.info("[RoutineTaskService] Daily reminder time parsed", {
            hours,
            minutes,
          });
          
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date;
        }
        
        log.warn("[RoutineTaskService] Daily reminder time invalid", {
          reminderTime,
        });
        return null;
      }
      return null;
    } catch (error) {
      log.error("[RoutineTaskService] Error getting daily reminder time", {
        error,
      });
      return null;
    }
  }
}
