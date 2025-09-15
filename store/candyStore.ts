import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RoutineTask {
    id: string;
    label: string;
    isFavorite: boolean;
    color?: string;
    icon?: string;
    doItAt?: 'morning' | 'afternoon' | 'evening'; // Time in HH:mm format
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

    return create<CandyProps & CandyState>()(
        persist(
            (set, get) => ({
                ...defaultProps,
                ...initProps,
                increment: () => set((prev) => ({ ...prev, count: prev.count + 1 })),
                addRoutineTask: (task: RoutineTask) =>
                    set((state) => ({
                        routineTasks: [...state.routineTasks, {...task, createdAt: new Date(), updatedAt: new Date(), deletedAt: null}],
                    })),
                deleteRoutineTask: (taskId: string) =>
                    set((state) => ({
                        routineTasks: state.routineTasks.map((task) =>
                            task.id === taskId
                                ? { ...task, deletedAt: new Date() }
                                : task
                        ),
                    })),
                updateRoutineTask: (taskId: string, updatedTask: Partial<RoutineTask>) =>
                    set((state) => ({
                        routineTasks: state.routineTasks.map((task) =>
                            task.id === taskId ? { ...task, ...updatedTask } : task
                        ),
                    })),
                getRoutineTask: (taskId: string) =>
                    get().routineTasks.find((task) => task.id === taskId),                
            }),
            {
                name: 'candy-storage',
                storage: createJSONStorage(() => AsyncStorage),
                partialize: (state) => ({
                    count: state.count,
                    routineTasks: state.routineTasks.map((task) => ({
                        id: task.id,
                        label: task.label,
                        isFavorite: task.isFavorite,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                        deletedAt: task.deletedAt,
                        color: task.color,
                        icon: task.icon,
                        doItAt: task.doItAt,
                        repeat: task.repeat,
                        repeatValues: task.repeatValues,
                        endDate: task.endDate,
                    })),
                }),
            }
        )
    );
}

export const candyStore = CreateCandyAppStore();
