import { RoutineTask } from "@/store/candyStore";
import {
    dbMarkTaskDone,
    dbUnmarkTaskDone,
    dbGetDoneTaskIds,
    dbGetDoneTaskIdsForDates,
    dbGetCompletionRatesForDates,
} from "@/db/database";
import log from "./logger";
import { useSettingsStore } from "@/store/settingsStore";
import { candyStore } from "@/store/candyStore";

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
        const date = onDate ?? new Date();
        const finishedIds = await dbGetDoneTaskIds(date);

        const filteredRoutineTasks = routineTasks
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
                isDone: finishedIds.includes(task.id),
            }));

        return filteredRoutineTasks;
    }

    public static async markFinishedRoutineTask(
        onDate: Date,
        taskId: string,
        totalTasksCount?: number,
    ): Promise<void> {
        log.info(
            `[RoutineTaskService] Marking finished routine task: ${taskId} - ${onDate}`,
        );
        try {
            await dbMarkTaskDone(taskId, onDate);
        } catch (error) {
            log.error("[RoutineTaskService] Error marking finished routine task", { error });
        }
    }

    public static async deleteFinishedRoutineTask(
        onDate: Date,
        taskId: string,
        totalTasksCount?: number,
    ): Promise<void> {
        log.info(
            `[RoutineTaskService] Deleting finished routine task: ${taskId} - ${onDate}`,
        );
        try {
            await dbUnmarkTaskDone(taskId, onDate);
        } catch (error) {
            log.error("[RoutineTaskService] Error deleting finished routine task", { error });
        }
    }

    public static async getFinishedRoutineTasks(
        onDate: Date | null = new Date(),
    ): Promise<string[]> {
        log.info("[RoutineTaskService] Getting finished routine tasks", { onDate });
        if (!onDate) return [];
        try {
            return await dbGetDoneTaskIds(onDate);
        } catch (error) {
            log.error("[RoutineTaskService] Error getting finished routine tasks", { error });
            return [];
        }
    }

    public static async getFinishedRoutineTasksForDates(
        dates: Date[],
    ): Promise<string[][]> {
        log.info("[RoutineTaskService] Getting finished routine tasks for dates", {
            count: dates.length,
        });
        try {
            return await dbGetDoneTaskIdsForDates(dates);
        } catch (error) {
            log.error(
                "[RoutineTaskService] Error getting batch finished routine tasks",
                { error },
            );
            return dates.map(() => []);
        }
    }

    public static async getFinishedRoutineTaskRatesForDates(
        onDates: Date[],
    ): Promise<number[]> {
        log.info("[RoutineTaskService] Getting finished routine task rates for dates", {
            count: onDates.length,
        });
        try {
            const totalTasks = candyStore.getState().routineTasks
                .filter(t => !t.deletedAt).length;
            return await dbGetCompletionRatesForDates(onDates, totalTasks);
        } catch (error) {
            log.error(
                "[RoutineTaskService] Error getting batch finished routine task rates",
                { error },
            );
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

                const [hours, minutes] = reminderTime.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                }
            }
            return null;
        } catch (error) {
            log.error("[RoutineTaskService] Error getting daily reminder time", { error });
            return null;
        }
    }
}
