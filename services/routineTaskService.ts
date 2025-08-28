import { RoutineTask } from "@/store/candyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import log from "./logger";

export interface UserRoutineTask extends RoutineTask {
    isDone: boolean;
}

export class RoutineTaskService {
    public static async getFilteredRoutineTasks(routineTasks: RoutineTask[], onDate: Date | null = null): Promise<UserRoutineTask[]> {
        log.info("[RoutineTaskService] Filtering routine tasks", { routineTasks, onDate });
        const finishedRoutineTaskIds = await this.getFinishedRoutineTasks(onDate);
        
        let filteredRoutineTasks = routineTasks.filter(task => {
            if (task.deletedAt === null || task.deletedAt === undefined) {
                return true
            }
            if (onDate !== null && new Date(task.deletedAt) >= new Date(onDate)) {
                return true
            }

            return false
        }).map(task => ({
            ...task,
            isDone: finishedRoutineTaskIds.includes(task.id)
        }));

        return filteredRoutineTasks;
    }

    private static genFinishedRoutineTaskOnDateKey(onDate: Date | null): string {
        if (!onDate) {
            return "";
        }
        return `RoutineTask:Finished:${onDate.toISOString().split("T")[0]}`;
    }

    public static async markFinishedRoutineTask(onDate: Date, taskId: string): Promise<void> {
        log.info(`[RoutineTaskService] Marking finished routine task: ${taskId} - ${onDate}`);
        const key = this.genFinishedRoutineTaskOnDateKey(onDate);

        try {
            const existingTasks = await AsyncStorage.getItem(key);
            const updatedTasks = existingTasks ? [...JSON.parse(existingTasks), taskId] : [taskId];
            await AsyncStorage.setItem(key, JSON.stringify(Array.from(new Set(updatedTasks))));
        } catch (error) {
            log.error("[RoutineTaskService] Error setting finished routine task", { error });
        }
    }

    public static async deleteFinishedRoutineTask(onDate: Date, taskId: string): Promise<void> {
        log.info(`[RoutineTaskService] Deleting finished routine task: ${taskId} - ${onDate}`);
        const key = this.genFinishedRoutineTaskOnDateKey(onDate);

        try {
            const existingTasks = await AsyncStorage.getItem(key);
            if (existingTasks) {
                const updatedTasks = JSON.parse(existingTasks).filter((id: string) => id !== taskId);
                await AsyncStorage.setItem(key, JSON.stringify(updatedTasks));
            }
        } catch (error) {
            log.error("[RoutineTaskService] Error deleting finished routine task", { error });
        }
    }

    public static async getFinishedRoutineTasks(onDate: Date | null = new Date()): Promise<string[]> {
        log.info("[RoutineTaskService] Getting finished routine tasks", { onDate });
        const key = this.genFinishedRoutineTaskOnDateKey(onDate);

        try {
            const result = await AsyncStorage.getItem(key);
            return result ? JSON.parse(result) : [];
        } catch (error) {
            log.error("[RoutineTaskService] Error getting finished routine tasks", { error });
            return [];
        }
    }

    public static async finishRoutineTask(taskId: string): Promise<void> {
        log.info(`[RoutineTaskService] Finishing routine task: ${taskId}`);
        const onDate = new Date();
        await this.markFinishedRoutineTask(onDate, taskId);
    }
}