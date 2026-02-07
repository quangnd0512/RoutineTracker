import { RoutineTask } from "@/store/candyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import log from "./logger";

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

  private static genFinishedRoutineTaskOnDateKey(onDate: Date | null): string {
    if (!onDate) {
      return "";
    }
    return `RoutineTask:Finished:${onDate.toISOString().split("T")[0]}`;
  }

  private static genFinishedRoutineTaskRateKey(onDate: Date | null): string {
    if (!onDate) {
      return "";
    }
    return `RoutineTask:FinishedRate:${onDate.toISOString().split("T")[0]}`;
  }

  public static async markFinishedRoutineTask(
    onDate: Date,
    taskId: string,
    totalTasksCount?: number,
  ): Promise<void> {
    log.info(
      `[RoutineTaskService] Marking finished routine task: ${taskId} - ${onDate}`,
    );
    const key = this.genFinishedRoutineTaskOnDateKey(onDate);
    const rateKey = this.genFinishedRoutineTaskRateKey(onDate);

    try {
      const existingTasks = await AsyncStorage.getItem(key);
      const updatedTasks = existingTasks
        ? [...JSON.parse(existingTasks), taskId]
        : [taskId];
      await AsyncStorage.setItem(
        key,
        JSON.stringify(Array.from(new Set(updatedTasks))),
      );
      if (totalTasksCount && totalTasksCount > 0) {
        const finishedCount = Array.from(new Set(updatedTasks)).length;
        const rate = finishedCount / totalTasksCount;
        await AsyncStorage.setItem(rateKey, rate.toString());
      }
    } catch (error) {
      log.error("[RoutineTaskService] Error setting finished routine task", {
        error,
      });
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
    const key = this.genFinishedRoutineTaskOnDateKey(onDate);

    try {
      const existingTasks = await AsyncStorage.getItem(key);
      if (existingTasks) {
        const updatedTasks = JSON.parse(existingTasks).filter(
          (id: string) => id !== taskId,
        );
        await AsyncStorage.setItem(key, JSON.stringify(updatedTasks));
      }
      if (totalTasksCount && totalTasksCount > 0) {
        const finishedCount = existingTasks
          ? JSON.parse(existingTasks).filter((id: string) => id !== taskId)
              .length
          : 0;
        const rate = finishedCount / totalTasksCount;
        const rateKey = this.genFinishedRoutineTaskRateKey(onDate);
        await AsyncStorage.setItem(rateKey, rate.toString());
      }
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
    const key = this.genFinishedRoutineTaskOnDateKey(onDate);

    try {
      const result = await AsyncStorage.getItem(key);
      return result ? JSON.parse(result) : [];
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
    const keys = dates.map((date) =>
      this.genFinishedRoutineTaskOnDateKey(date),
    );

    try {
      const results = await AsyncStorage.multiGet(keys);
      // results is [ [key, value], [key, value] ]
      return results.map(([_, value]) => (value ? JSON.parse(value) : []));
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
    log.info("[RoutineTaskService] Getting finished routine task rates for dates", {
      count: onDates.length,
    });
    const keys = onDates.map((date) =>
      this.genFinishedRoutineTaskRateKey(date),
    );

    try {
      const results = await AsyncStorage.multiGet(keys);
      // results is [ [key, value], [key, value] ]
      
      return results.map(([_, value]) => (value ? parseFloat(value) : 0));
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
}
