import { RoutineTask } from "@/store/candyStore";

export class RoutineTaskService {
    public static getFilteredRoutineTasks(routineTasks: RoutineTask[], onDate: Date | null = null): RoutineTask[] {
        console.log("[RoutineTaskService] Filtering routine tasks", { routineTasks, onDate });
        let filteredRoutineTasks = routineTasks.filter(task => {
            if (task.deletedAt === null || task.deletedAt === undefined) {
                return true
            }
            if (onDate !== null && new Date(task.deletedAt) >= new Date(onDate)) {
                return true
            }

            return false
        });

        return filteredRoutineTasks;
    }
}