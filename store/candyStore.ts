import { create } from 'zustand';
import {
    dbAddRoutineTask,
    dbUpdateRoutineTask,
    dbSoftDeleteRoutineTask,
} from '@/db/database';

export interface RoutineTask {
    id: string;
    label: string;
    isFavorite: boolean;
    color?: string;
    icon?: string;
    doItAt?: 'morning' | 'afternoon' | 'evening';
    repeat?: 'daily' | 'weekly' | 'monthly';
    repeatValues?: string[]; // e.g., ['Mon', 'Wed', 'Fri'] for weekly
    endDate?: Date | null;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export interface CandyProps {
    count: number;
    routineTasks: RoutineTask[];
}

export interface CandyState extends CandyProps {
    loadRoutineTasks: (tasks: RoutineTask[]) => void;
    increment: () => void;
    addRoutineTask: (task: RoutineTask) => void;
    deleteRoutineTask: (taskId: string) => void;
    updateRoutineTask: (taskId: string, updatedTask: Partial<RoutineTask>) => void;
    getRoutineTask: (taskId: string) => RoutineTask | undefined;
}

export type CandyStore = ReturnType<typeof CreateCandyAppStore>

const CreateCandyAppStore = (initProps?: Partial<CandyProps>) => {
    const defaultProps: CandyProps = {
        count: 0,
        routineTasks: [],
    };

    return create<CandyProps & CandyState>()((set, get) => ({
        ...defaultProps,
        ...initProps,

        // Hydrate in-memory state from SQLite on app startup
        loadRoutineTasks: (tasks) => set({ routineTasks: tasks }),

        increment: () => set((prev) => ({ ...prev, count: prev.count + 1 })),

        addRoutineTask: async (task: RoutineTask) => {
            const fullTask: RoutineTask = {
                ...task,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };
            await dbAddRoutineTask(fullTask);
            set((state) => ({
                routineTasks: [...state.routineTasks, fullTask],
            }));
        },

        deleteRoutineTask: async (taskId: string) => {
            await dbSoftDeleteRoutineTask(taskId);
            set((state) => ({
                routineTasks: state.routineTasks.map((task) =>
                    task.id === taskId
                        ? { ...task, deletedAt: new Date() }
                        : task
                ),
            }));
        },

        updateRoutineTask: async (taskId: string, updatedTask: Partial<RoutineTask>) => {
            await dbUpdateRoutineTask(taskId, updatedTask);
            set((state) => ({
                routineTasks: state.routineTasks.map((task) =>
                    task.id === taskId ? { ...task, ...updatedTask } : task
                ),
            }));
        },

        getRoutineTask: (taskId: string) =>
            get().routineTasks.find((task) => task.id === taskId),
    }));
}

export const candyStore = CreateCandyAppStore();
